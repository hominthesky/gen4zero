import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import { createHash } from "node:crypto";

// Execute the real renderer and recipe functions, stopping before DOM event wiring.
// Command traces prove deterministic geometry, not browser pixel equivalence.
const source = await readFile(new URL("../app.js", import.meta.url), "utf8");
const boundary = source.indexOf("document.querySelectorAll('input[type=\"range\"]')");
assert.ok(boundary > 0);

function instrument(storage = new Map(), failWrites = false) {
  let commands = [];
  let nextCanvas = 0;
  const makeCanvas = () => {
    const id = nextCanvas++;
    const target = new Proxy({}, {
      get(object, key) {
        if (key in object) return object[key];
        return (...args) => {
          for (const arg of args.flat()) if (typeof arg === "number") assert.ok(Number.isFinite(arg));
          commands.push([id, key, ...args.map((arg) => arg?.canvasId === undefined ? arg : { canvasId: arg.canvasId })]);
        };
      },
      set(object, key, value) {
        if (typeof value === "number") assert.ok(Number.isFinite(value));
        commands.push([id, key, value]);
        object[key] = value;
        return true;
      },
    });
    return { canvasId: id, width: 640, height: 360, getContext: () => target };
  };
  const context = createContext({
    document: { querySelector: () => makeCanvas(), createElement: makeCanvas },
    performance: { now: () => 0 },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => { if (failWrites) throw new Error("quota"); storage.set(key, value); },
    },
  });
  runInContext(source.slice(0, boundary), context);
  const api = runInContext("({ normalizeRecipe, getLocalWorks, renderArt, getPreviewDimensions, defaults, presets, patterns, seededRandom })", context);
  return { ...api, trace(recipe) {
    commands = [];
    nextCanvas = 0;
    api.renderArt(makeCanvas(), recipe, recipe.time);
    assert.ok(commands.length > 20, "renderer must draw nonempty geometry");
    return createHash("sha256").update(JSON.stringify(commands)).digest("hex");
  } };
}

test("all six renderers reproduce geometry at a fixed seed, canvas, and time", () => {
  const api = instrument();
  for (const pattern of Object.keys(api.patterns)) {
    const recipe = api.normalizeRecipe({ pattern, seed: 424242, time: 0.75, layerEnabled: true, layerPattern: "orbit" });
    const before = api.trace(recipe);
    assert.equal(api.trace(recipe), before, pattern);
    assert.notEqual(api.trace({ ...recipe, seed: 424243 }), before, `${pattern} must respond to its seed`);
  }
});

test("untrusted recipe enums and coercion stay within the supported contract", () => {
  const api = instrument();
  const recipe = api.normalizeRecipe({ pattern: "constructor", palette: "__proto__", preset: "toString", layerPattern: "constructor", layerEnabled: "false", seed: Infinity, density: null, motion: "", weight: 999, grain: -1 });
  assert.equal(recipe.pattern, api.defaults.pattern);
  assert.equal(recipe.palette, api.defaults.palette);
  assert.equal(recipe.preset, api.defaults.preset);
  assert.equal(recipe.layerEnabled, false);
  assert.equal(recipe.seed, api.defaults.seed);
  assert.equal(recipe.density, api.defaults.density);
  assert.equal(recipe.motion, api.defaults.motion);
  assert.equal(recipe.weight, 3);
  assert.equal(recipe.grain, 0);
  assert.doesNotThrow(() => api.trace(recipe));
});

test("normalization is idempotent and portable through JSON", () => {
  const api = instrument();
  const recipe = api.normalizeRecipe({ seed: "654321", density: 75.4, layerEnabled: true, time: 3.25 });
  assert.equal(JSON.stringify(api.normalizeRecipe(JSON.parse(JSON.stringify(recipe)))), JSON.stringify(recipe));
});

test("local gallery migration preserves the original and does not overwrite current work", () => {
  const legacy = JSON.stringify([{ seed: 123 }]);
  const storage = new Map([["z4zero-generative-works", legacy]]);
  const api = instrument(storage);
  assert.equal(api.getLocalWorks()[0].seed, 123);
  assert.equal(storage.get("z4zero-generative-works"), legacy);
  storage.set("gen4zero-works-v1", JSON.stringify([{ seed: 456 }]));
  assert.equal(api.getLocalWorks()[0].seed, 456);
});

test("full storage keeps legacy works readable and malformed storage fails safely", () => {
  const api = instrument(new Map([["z4zero-generative-works", '[{"seed":123}]']]), true);
  assert.equal(api.getLocalWorks()[0].seed, 123);
  assert.equal(instrument(new Map([["gen4zero-works-v1", "invalid"]])).getLocalWorks().length, 0);
  const many = Array.from({ length: 30 }, (_, i) => ({ seed: i + 1 }));
  assert.equal(instrument(new Map([["gen4zero-works-v1", JSON.stringify(many)]])).getLocalWorks().length, 24);
});

test("large presets stay bounded in preview without modifying export dimensions", () => {
  const api = instrument();
  for (const preset of Object.values(api.presets)) {
    const original = JSON.stringify(preset);
    const preview = api.getPreviewDimensions(preset);
    assert.ok(preview.width * preview.height < 2_205_000);
    assert.ok(Math.abs(preview.width / preview.height - preset.width / preset.height) < 0.002);
    assert.equal(JSON.stringify(preset), original);
  }
});
