import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (name) => readFile(join(root, name), "utf8");

test("the static entrypoint exposes the complete creation flow", async () => {
  const html = await read("index.html");
  for (const id of ["art-canvas", "seed-input", "layer-toggle", "output-preset", "export-png", "record-video", "save-gallery", "curated-grid", "local-grid"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.equal((html.match(/data-pattern=/g) || []).length, 6);
  assert.match(html, /meta property="og:image" content="https:\/\/gen4zero\.zzao\.im\/og\.png"/);
  assert.match(html, /Begin at zero\. Shape what emerges\./);
  assert.match(html, /github\.com\/hominthesky\/gen4zero\/issues\/new\/choose/);
});

test("all systems and output presets have implementation entries", async () => {
  const source = await read("app.js");
  for (const pattern of ["flow", "orbit", "cell", "grid", "moire", "loom"]) {
    assert.match(source, new RegExp(`${pattern}:\\s*draw`, "m"));
  }
  for (const preset of ["hero", "fullhd", "tiktok", "portrait", "square", "og", "poster"]) {
    assert.match(source, new RegExp(`\\n\\s*${preset}:\\s*\\{`));
  }
  assert.match(source, /canvas\.captureStream\(30\)/);
  assert.match(source, /const STORAGE_KEY = "gen4zero-works-v1"/);
  assert.match(source, /const LEGACY_STORAGE_KEY = "z4zero-generative-works"/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
});

test("social preview is the expected 1200 × 630 PNG", async () => {
  const image = await readFile(join(root, "og.png"));
  assert.deepEqual([...image.subarray(1, 4)], [0x50, 0x4e, 0x47]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  assert.ok((await stat(join(root, "og.png"))).size > 10000);
});

test("the site contains no machine-specific absolute paths", async () => {
  const contents = await Promise.all([read("index.html"), read("styles.css"), read("app.js"), read("README.md")]);
  assert.equal(contents.some((value) => value.includes("/Users/")), false);
});

test("the public identity and custom origin match the brand baseline", async () => {
  const [html, readme, cname] = await Promise.all([read("index.html"), read("README.md"), read("CNAME")]);
  assert.match(html, /<span class="brand-name">GEN4ZERO<\/span>/);
  assert.doesNotMatch(html, /Generative Studio|studio\.zzao\.im/);
  assert.doesNotMatch(readme, /z4zero-generative-studio|studio\.zzao\.im/);
  assert.equal(cname.trim(), "gen4zero.zzao.im");
});
