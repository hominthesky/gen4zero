const canvas = document.querySelector("#art-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const patterns = {
  flow: { name: "Vector Field", code: "VF–01", index: 1 },
  orbit: { name: "Orbital Bloom", code: "OB–02", index: 2 },
  cell: { name: "Cellular Veil", code: "CV–03", index: 3 },
  grid: { name: "Recursive Grid", code: "RG–04", index: 4 },
  moire: { name: "Moiré Signal", code: "MS–05", index: 5 },
  loom: { name: "Particle Loom", code: "PL–06", index: 6 },
};

const palettes = {
  signal: { name: "Signal", colors: ["#11110f", "#e9ff5a", "#ff5a46", "#f4f2ea"] },
  cobalt: { name: "Cobalt", colors: ["#091429", "#5de0ff", "#846bff", "#dff8ff"] },
  paper: { name: "Paper", colors: ["#e9e3d6", "#272422", "#e84b32", "#7d756a"] },
  infrared: { name: "Infrared", colors: ["#190d10", "#ff3158", "#ffb650", "#ffe9d0"] },
  mineral: { name: "Mineral", colors: ["#071a18", "#77efcf", "#dbc9a1", "#eef8e9"] },
  mono: { name: "Monochrome", colors: ["#111111", "#f3f0e7", "#76766f", "#d1d0ca"] },
};

const presets = {
  hero: { width: 1600, height: 900, label: "Web hero", note: "Responsive landscape · 16:9" },
  fullhd: { width: 1920, height: 1080, label: "Full HD", note: "Presentation / display · 16:9" },
  tiktok: { width: 1080, height: 1920, label: "TikTok / Reel", note: "Full-screen vertical · 9:16" },
  portrait: { width: 1080, height: 1350, label: "Feed portrait", note: "Extended feed frame · 4:5" },
  square: { width: 1080, height: 1080, label: "Square post", note: "Universal social frame · 1:1" },
  og: { width: 1200, height: 630, label: "Social card", note: "Open Graph preview · 1.91:1" },
  poster: { width: 2480, height: 3508, label: "A-series poster", note: "Print-ready proportion · √2" },
};

const defaults = {
  version: 1,
  pattern: "flow",
  seed: 284731,
  density: 64,
  complexity: 0.58,
  motion: 0.42,
  continuity: 0.76,
  scale: 0.62,
  weight: 1.1,
  grain: 0.16,
  palette: "signal",
  layerEnabled: false,
  layerPattern: "orbit",
  layerOpacity: 0.38,
  blendMode: "screen",
  preset: "hero",
  time: 0,
};

const state = { ...defaults, playing: true };
const STORAGE_KEY = "gen4zero-works-v1";
const LEGACY_STORAGE_KEY = "z4zero-generative-works";
let rafId;
let currentView = "studio";
let frameCounter = 0;
let fpsStart = performance.now();
let toastTimer;

const curatedWorks = [
  { title: "Soft Collision", pattern: "flow", seed: 882014, palette: "signal", complexity: 0.74, continuity: 0.9, scale: 0.52, time: 1.2, preset: "hero" },
  { title: "Night Organism", pattern: "cell", seed: 504199, palette: "mineral", density: 52, complexity: 0.82, scale: 0.76, time: 0.7, preset: "portrait" },
  { title: "Twenty-One Petals", pattern: "orbit", seed: 192117, palette: "paper", density: 78, complexity: 0.66, weight: 0.75, time: 0.2, preset: "square" },
  { title: "False Horizon", pattern: "moire", seed: 731285, palette: "cobalt", density: 88, complexity: 0.41, continuity: 0.88, time: 1.5, preset: "hero" },
  { title: "Modular Weather", pattern: "grid", seed: 438005, palette: "infrared", density: 46, complexity: 0.92, grain: 0.1, time: 0.5, preset: "portrait" },
  { title: "Thread Memory", pattern: "loom", seed: 965212, palette: "mono", density: 72, complexity: 0.7, continuity: 0.96, weight: 0.7, time: 2.1, preset: "hero" },
  { title: "Double Exposure", pattern: "orbit", seed: 320548, palette: "cobalt", layerEnabled: true, layerPattern: "flow", layerOpacity: 0.46, blendMode: "screen", complexity: 0.78, time: 1.8, preset: "square" },
  { title: "Signal Architecture", pattern: "grid", seed: 117406, palette: "signal", layerEnabled: true, layerPattern: "moire", layerOpacity: 0.33, blendMode: "difference", density: 58, complexity: 0.55, time: 0.9, preset: "hero" },
].map((work) => ({ ...defaults, ...work }));

function seededRandom(seed) {
  let value = Math.abs(Math.trunc(Number(seed) || 1)) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothNoise(x, y, seed) {
  const a = Math.sin(x * 1.31 + seed * 0.00013) * Math.cos(y * 1.17 - seed * 0.00009);
  const b = Math.sin((x + y) * 0.73 + seed * 0.00021);
  const c = Math.cos(x * 0.37 - y * 1.91 + seed * 0.00007);
  return (a + b * 0.62 + c * 0.38) / 2;
}

function drawFlow(target, width, height, config, time, layer = false) {
  const colors = palettes[config.palette].colors;
  const random = seededRandom(config.seed + (layer ? 901 : 0));
  const measure = Math.min(width, height);
  const count = Math.round(config.density * (layer ? 1.25 : 2.15));
  const steps = Math.round(18 + config.continuity * 66);
  target.save();
  target.globalCompositeOperation = config.palette === "paper" ? "multiply" : "screen";
  target.lineCap = "round";
  for (let i = 0; i < count; i += 1) {
    let x = random() * width;
    let y = random() * height;
    const phase = random() * Math.PI * 2;
    target.beginPath();
    target.moveTo(x, y);
    target.strokeStyle = colors[1 + (i % (colors.length - 1))];
    target.globalAlpha = 0.1 + random() * 0.48;
    target.lineWidth = (0.45 + random() * 1.25) * config.weight * Math.max(0.8, measure / 1100);
    for (let step = 0; step < steps; step += 1) {
      const nx = x / measure;
      const ny = y / measure;
      const n = smoothNoise(nx * (2 + config.complexity * 5.5), ny * (2 + config.complexity * 5.5), config.seed);
      const angle = n * Math.PI * (1.6 + config.complexity * 3.8) + phase * 0.055 + time * 0.22;
      const pace = measure * (0.0017 + config.scale * 0.0038);
      x += Math.cos(angle) * pace;
      y += Math.sin(angle) * pace;
      target.lineTo(x, y);
      if (x < -20 || y < -20 || x > width + 20 || y > height + 20) break;
    }
    target.stroke();
  }
  target.restore();
}

function drawOrbit(target, width, height, config, time, layer = false) {
  const colors = palettes[config.palette].colors;
  const random = seededRandom(config.seed + (layer ? 113 : 0));
  const measure = Math.min(width, height);
  const loops = Math.max(4, Math.round(config.density / 7));
  const petals = 3 + Math.floor(config.complexity * 9);
  target.save();
  target.translate(width / 2, height / 2);
  target.rotate((random() - 0.5) * 0.7 + time * 0.025);
  target.globalCompositeOperation = config.palette === "paper" ? "multiply" : "screen";
  for (let ring = 0; ring < loops; ring += 1) {
    const ringScale = (0.16 + (ring / loops) * 0.64) * config.scale;
    const drift = (random() - 0.5) * measure * 0.04;
    target.beginPath();
    for (let i = 0; i <= 420; i += 1) {
      const theta = (i / 420) * Math.PI * 2;
      const pulse = Math.cos(petals * theta + time * (0.35 + config.motion)) * (0.14 + config.complexity * 0.2);
      const radius = measure * ringScale * (0.84 + pulse);
      const x = Math.cos(theta + ring * 0.035) * radius + Math.cos(theta * 3 + time) * drift;
      const y = Math.sin(theta) * radius * (0.58 + config.continuity * 0.34) + Math.sin(theta * 2 - time) * drift;
      if (i === 0) target.moveTo(x, y);
      else target.lineTo(x, y);
    }
    target.closePath();
    target.strokeStyle = colors[1 + (ring % (colors.length - 1))];
    target.globalAlpha = 0.1 + (ring / loops) * 0.55;
    target.lineWidth = config.weight * (0.7 + ring * 0.06) * Math.max(0.8, measure / 1000);
    target.stroke();
  }
  target.restore();
}

function drawCell(target, width, height, config, time, layer = false) {
  const colors = palettes[config.palette].colors;
  const random = seededRandom(config.seed + (layer ? 227 : 0));
  const measure = Math.min(width, height);
  const columns = Math.max(5, Math.round(5 + config.density / 11));
  const rows = Math.max(4, Math.round(columns * height / width));
  const cellW = width / columns;
  const cellH = height / rows;
  const nodes = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= columns; col += 1) {
      const wobble = 0.18 + config.complexity * 0.22;
      nodes.push({
        x: col * cellW + (random() - 0.5) * cellW * wobble + Math.sin(time + row) * cellW * 0.025,
        y: row * cellH + (random() - 0.5) * cellH * wobble + Math.cos(time + col) * cellH * 0.025,
        phase: random() * Math.PI * 2,
      });
    }
  }
  target.save();
  target.globalCompositeOperation = config.palette === "paper" ? "multiply" : "screen";
  nodes.forEach((node, index) => {
    const row = Math.floor(index / (columns + 1));
    const col = index % (columns + 1);
    const neighbors = [];
    if (col < columns) neighbors.push(index + 1);
    if (row < rows) neighbors.push(index + columns + 1);
    if (col < columns && row < rows && (index + config.seed) % 3 === 0) neighbors.push(index + columns + 2);
    neighbors.forEach((neighborIndex) => {
      const neighbor = nodes[neighborIndex];
      target.beginPath();
      target.moveTo(node.x, node.y);
      target.quadraticCurveTo(
        (node.x + neighbor.x) / 2 + Math.sin(node.phase + time) * cellW * config.complexity * 0.16,
        (node.y + neighbor.y) / 2 + Math.cos(node.phase - time) * cellH * config.complexity * 0.16,
        neighbor.x,
        neighbor.y,
      );
      target.strokeStyle = colors[1 + (index % (colors.length - 1))];
      target.globalAlpha = 0.16 + config.continuity * 0.34;
      target.lineWidth = config.weight * Math.max(0.8, measure / 1200);
      target.stroke();
    });
    if (index % 2 === 0) {
      const radius = measure * (0.004 + config.scale * 0.012) * (0.65 + Math.sin(node.phase + time) * 0.25);
      target.beginPath();
      target.arc(node.x, node.y, Math.max(1, radius), 0, Math.PI * 2);
      target.fillStyle = colors[1 + (index % (colors.length - 1))];
      target.globalAlpha = 0.22;
      target.fill();
    }
  });
  target.restore();
}

function drawGrid(target, width, height, config, time, layer = false) {
  const colors = palettes[config.palette].colors;
  const random = seededRandom(config.seed + (layer ? 353 : 0));
  const depth = 3 + Math.floor(config.complexity * 4);
  const inset = Math.min(width, height) * (0.055 + (1 - config.scale) * 0.06);
  let cells = [{ x: inset, y: inset, width: width - inset * 2, height: height - inset * 2, level: 0 }];
  for (let pass = 0; pass < depth; pass += 1) {
    const next = [];
    cells.forEach((cell) => {
      if (cell.width < 28 || cell.height < 28 || random() > 0.82) {
        next.push(cell);
        return;
      }
      const vertical = cell.width / cell.height > 1.18 ? true : cell.height / cell.width > 1.18 ? false : random() > 0.5;
      const split = 0.34 + random() * 0.32;
      if (vertical) {
        next.push({ ...cell, width: cell.width * split, level: pass + 1 });
        next.push({ x: cell.x + cell.width * split, y: cell.y, width: cell.width * (1 - split), height: cell.height, level: pass + 1 });
      } else {
        next.push({ ...cell, height: cell.height * split, level: pass + 1 });
        next.push({ x: cell.x, y: cell.y + cell.height * split, width: cell.width, height: cell.height * (1 - split), level: pass + 1 });
      }
    });
    cells = next;
  }
  target.save();
  target.translate(width / 2, height / 2);
  target.rotate(Math.sin(time * 0.2) * 0.012 * config.motion);
  target.translate(-width / 2, -height / 2);
  cells.forEach((cell, index) => {
    const gap = Math.max(2, Math.min(width, height) * 0.006 * config.continuity);
    const color = colors[1 + (index % (colors.length - 1))];
    if (random() < 0.34 + config.complexity * 0.22) {
      target.fillStyle = color;
      target.globalAlpha = 0.08 + random() * 0.2;
      target.fillRect(cell.x + gap, cell.y + gap, Math.max(0, cell.width - gap * 2), Math.max(0, cell.height - gap * 2));
    }
    target.strokeStyle = color;
    target.globalAlpha = 0.28 + random() * 0.42;
    target.lineWidth = config.weight * Math.max(0.8, Math.min(width, height) / 1200);
    target.strokeRect(cell.x + gap, cell.y + gap, Math.max(0, cell.width - gap * 2), Math.max(0, cell.height - gap * 2));
  });
  target.restore();
}

function drawMoire(target, width, height, config, time, layer = false) {
  const colors = palettes[config.palette].colors;
  const random = seededRandom(config.seed + (layer ? 479 : 0));
  const measure = Math.min(width, height);
  const lines = Math.round(34 + config.density * 1.2);
  const gap = height / lines;
  const amplitude = measure * (0.025 + config.scale * 0.13);
  const frequency = 1.5 + config.complexity * 6;
  target.save();
  target.globalCompositeOperation = config.palette === "paper" ? "multiply" : "screen";
  for (let group = 0; group < 2; group += 1) {
    for (let line = -8; line < lines + 8; line += 1) {
      target.beginPath();
      const phase = group * Math.PI * 0.72 + random() * 0.06;
      for (let x = -20; x <= width + 20; x += Math.max(5, width / 180)) {
        const normal = x / width;
        const y = line * gap + Math.sin(normal * Math.PI * 2 * frequency + phase + time * (group ? -0.2 : 0.24)) * amplitude * (group ? 0.72 : 1);
        if (x === -20) target.moveTo(x, y);
        else target.lineTo(x, y);
      }
      target.strokeStyle = colors[1 + ((line + group + 1000) % (colors.length - 1))];
      target.globalAlpha = 0.16 + config.continuity * 0.42;
      target.lineWidth = config.weight * (group ? 0.65 : 0.9) * Math.max(0.7, measure / 1200);
      target.stroke();
    }
    target.translate(width * (0.035 + config.complexity * 0.025), 0);
    target.rotate((group ? -1 : 1) * (0.025 + config.complexity * 0.035));
  }
  target.restore();
}

function drawLoom(target, width, height, config, time, layer = false) {
  const colors = palettes[config.palette].colors;
  const random = seededRandom(config.seed + (layer ? 607 : 0));
  const measure = Math.min(width, height);
  const strands = Math.round(14 + config.density * 0.6);
  target.save();
  target.globalCompositeOperation = config.palette === "paper" ? "multiply" : "screen";
  target.lineCap = "round";
  for (let strand = 0; strand < strands; strand += 1) {
    const horizontal = strand % 3 !== 0;
    const start = random();
    const end = random();
    const bend = (random() - 0.5) * (0.2 + config.complexity * 0.65);
    target.beginPath();
    if (horizontal) {
      target.moveTo(-measure * 0.08, start * height);
      target.bezierCurveTo(width * 0.28, (start + bend + Math.sin(time + strand) * 0.02) * height, width * 0.68, (end - bend) * height, width + measure * 0.08, end * height);
    } else {
      target.moveTo(start * width, -measure * 0.08);
      target.bezierCurveTo((start + bend) * width, height * 0.32, (end - bend + Math.cos(time + strand) * 0.02) * width, height * 0.7, end * width, height + measure * 0.08);
    }
    target.strokeStyle = colors[1 + (strand % (colors.length - 1))];
    target.globalAlpha = 0.16 + random() * 0.5;
    target.lineWidth = config.weight * (0.45 + random() * 2.3) * Math.max(0.8, measure / 1100);
    target.stroke();
    if (strand % 5 === 0) {
      target.setLineDash([measure * 0.006, measure * (0.008 + config.continuity * 0.018)]);
      target.globalAlpha *= 0.55;
      target.lineWidth *= 0.6;
      target.stroke();
      target.setLineDash([]);
    }
  }
  target.restore();
}

const drawers = { flow: drawFlow, orbit: drawOrbit, cell: drawCell, grid: drawGrid, moire: drawMoire, loom: drawLoom };

function addGrain(target, width, height, config) {
  if (config.grain <= 0) return;
  const random = seededRandom(config.seed + 7717);
  const measure = Math.min(width, height);
  const count = Math.round(180 + config.grain * Math.min(9000, width * height / 620));
  const colors = palettes[config.palette].colors;
  target.save();
  for (let i = 0; i < count; i += 1) {
    target.globalAlpha = random() * config.grain * 0.22;
    target.fillStyle = colors[1 + (i % (colors.length - 1))];
    const size = Math.max(0.55, random() * measure * 0.0017);
    target.fillRect(random() * width, random() * height, size, size);
  }
  target.restore();
}

function renderArt(targetCanvas, config, time = 0) {
  const target = targetCanvas.getContext("2d", { alpha: false });
  const { width, height } = targetCanvas;
  target.save();
  target.globalAlpha = 1;
  target.globalCompositeOperation = "source-over";
  target.fillStyle = palettes[config.palette].colors[0];
  target.fillRect(0, 0, width, height);
  drawers[config.pattern](target, width, height, config, time, false);
  if (config.layerEnabled) {
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerContext = layerCanvas.getContext("2d");
    layerContext.clearRect(0, 0, width, height);
    const layerConfig = { ...config, seed: config.seed + 104729, pattern: config.layerPattern };
    drawers[layerConfig.pattern](layerContext, width, height, layerConfig, time * 0.87 + 0.4, true);
    target.globalAlpha = config.layerOpacity;
    target.globalCompositeOperation = config.blendMode;
    target.drawImage(layerCanvas, 0, 0);
  }
  target.restore();
  addGrain(target, width, height, config);
}

function getPreviewDimensions(preset) {
  const pixels = preset.width * preset.height;
  const maxPixels = 2200000;
  if (pixels <= maxPixels) return { width: preset.width, height: preset.height };
  const factor = Math.sqrt(maxPixels / pixels);
  return { width: Math.round(preset.width * factor), height: Math.round(preset.height * factor) };
}

function fitCanvasFrame() {
  const zone = document.querySelector(".canvas-zone");
  const frame = document.querySelector("#canvas-frame");
  if (!zone || zone.clientWidth === 0) return;
  const preset = presets[state.preset];
  const ratio = preset.width / preset.height;
  const maxWidth = Math.max(100, zone.clientWidth - 32);
  const maxHeight = Math.max(100, zone.clientHeight - 32);
  const displayWidth = Math.min(maxWidth, maxHeight * ratio);
  frame.style.width = `${Math.round(displayWidth)}px`;
  frame.style.height = `${Math.round(displayWidth / ratio)}px`;
  frame.style.aspectRatio = `${preset.width} / ${preset.height}`;
}

function updateCanvasPreset() {
  const preset = presets[state.preset];
  const preview = getPreviewDimensions(preset);
  canvas.width = preview.width;
  canvas.height = preview.height;
  document.querySelector("#canvas-size-label").textContent = `${preset.width} × ${preset.height}`;
  document.querySelector("#export-size").textContent = `${preset.width} × ${preset.height}`;
  document.querySelector(".preset-summary span").textContent = preset.label;
  document.querySelector(".preset-summary strong").textContent = `${preset.width} × ${preset.height}`;
  document.querySelector(".preset-summary small").textContent = preset.note;
  fitCanvasFrame();
}

function renderFrame(now) {
  if (currentView === "studio") {
    renderArt(canvas, state, state.time);
    if (state.playing) state.time += 0.003 + state.motion * 0.013;
    frameCounter += 1;
    if (now - fpsStart > 1000) {
      document.querySelector("#fps-label").textContent = `${Math.min(60, Math.round((frameCounter * 1000) / (now - fpsStart)))} FPS`;
      frameCounter = 0;
      fpsStart = now;
    }
  }
  rafId = requestAnimationFrame(renderFrame);
}

function updateRangeBackground(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  input.style.setProperty("--range-value", `${((value - min) / (max - min)) * 100}%`);
}

function updatePatternUI() {
  const meta = patterns[state.pattern];
  document.querySelector("#artwork-title").innerHTML = `${meta.name} <em>/ ${meta.code}</em>`;
  document.querySelector("#pattern-position").textContent = `${meta.index} of 6`;
  document.querySelector("#edition-index").textContent = String(meta.index).padStart(3, "0");
  document.querySelectorAll("[data-pattern]").forEach((button) => button.classList.toggle("is-active", button.dataset.pattern === state.pattern));
  const layerSelect = document.querySelector("#layer-pattern");
  if (state.layerPattern === state.pattern) {
    state.layerPattern = Object.keys(patterns).find((key) => key !== state.pattern);
    layerSelect.value = state.layerPattern;
  }
}

function updateSeedUI() {
  document.querySelector("#seed-input").value = state.seed;
  document.querySelector("#seed-stamp").textContent = `SEED ${state.seed}`;
}

function syncUIFromState() {
  updatePatternUI();
  updateSeedUI();
  ["density", "complexity", "motion", "continuity", "scale", "weight", "grain", "layerOpacity"].forEach((key) => {
    const input = document.querySelector(`#${key}`);
    if (!input) return;
    input.value = state[key];
    const output = document.querySelector(`output[for="${key}"]`);
    if (output) output.value = key === "density" ? Math.round(state[key]) : Number(state[key]).toFixed(2);
    updateRangeBackground(input);
  });
  document.querySelectorAll(".palette-button").forEach((button) => {
    const active = button.dataset.palette === state.palette;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-checked", String(active));
  });
  document.querySelector("#palette-name").textContent = palettes[state.palette].name;
  document.querySelector("#layer-toggle").checked = state.layerEnabled;
  document.querySelector("#layer-pattern").value = state.layerPattern;
  document.querySelector("#blend-mode").value = state.blendMode;
  [document.querySelector("#layer-pattern"), document.querySelector("#blend-mode"), document.querySelector("#layerOpacity")].forEach((control) => { control.disabled = !state.layerEnabled; });
  document.querySelector("#output-preset").value = state.preset;
  updateCanvasPreset();
}

function recipeFromState() {
  const recipe = {};
  Object.keys(defaults).forEach((key) => { recipe[key] = state[key]; });
  recipe.time = Number(state.time.toFixed(4));
  return recipe;
}

function normalizeRecipe(value) {
  const recipe = { ...defaults };
  if (!value || typeof value !== "object") return recipe;
  if (patterns[value.pattern]) recipe.pattern = value.pattern;
  if (palettes[value.palette]) recipe.palette = value.palette;
  if (presets[value.preset]) recipe.preset = value.preset;
  if (patterns[value.layerPattern]) recipe.layerPattern = value.layerPattern;
  if (["screen", "source-over", "multiply", "difference", "overlay"].includes(value.blendMode)) recipe.blendMode = value.blendMode;
  recipe.layerEnabled = Boolean(value.layerEnabled);
  const numericRules = {
    seed: [1, 999999999], density: [20, 120], complexity: [0, 1], motion: [0, 1], continuity: [0.12, 1],
    scale: [0.2, 1], weight: [0.4, 3], grain: [0, 0.55], layerOpacity: [0.05, 0.9], time: [0, 10000],
  };
  Object.entries(numericRules).forEach(([key, [min, max]]) => {
    if (Number.isFinite(Number(value[key]))) recipe[key] = Math.min(max, Math.max(min, Number(value[key])));
  });
  recipe.seed = Math.round(recipe.seed);
  recipe.density = Math.round(recipe.density);
  return recipe;
}

function applyRecipe(value) {
  Object.assign(state, normalizeRecipe(value));
  syncUIFromState();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function switchView(view) {
  currentView = view;
  const isStudio = view === "studio";
  document.querySelector("#studio-view").hidden = !isStudio;
  document.querySelector("#gallery-view").hidden = isStudio;
  document.body.classList.toggle("gallery-mode", !isStudio);
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  history.replaceState(null, "", isStudio ? `${location.pathname}#studio` : `${location.pathname}#gallery`);
  if (isStudio) requestAnimationFrame(fitCanvasFrame);
  else renderLocalGallery();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function createGalleryCard(work, index, local = false) {
  const card = document.createElement("article");
  card.className = "gallery-card";
  const art = document.createElement("canvas");
  art.className = "gallery-art";
  const preset = presets[work.preset] || presets.hero;
  const ratio = preset.width / preset.height;
  art.width = Math.round(620 * Math.min(1.5, ratio));
  art.height = Math.round(art.width / ratio);
  art.style.setProperty("--card-ratio", `${preset.width} / ${preset.height}`);
  renderArt(art, work, work.time || 0);
  art.setAttribute("aria-label", `${work.title || "Saved study"} artwork`);
  const meta = document.createElement("div");
  meta.className = "gallery-card-meta";
  const title = work.title || `Study ${String(index + 1).padStart(2, "0")}`;
  meta.innerHTML = `<strong>${title}</strong><span>${String(index + 1).padStart(2, "0")}</span><small>${patterns[work.pattern].name} · Seed ${work.seed}</small>`;
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.textContent = "Open recipe";
  openButton.addEventListener("click", () => {
    applyRecipe(work);
    switchView("studio");
    showToast("Recipe loaded");
  });
  art.addEventListener("click", () => openButton.click());
  meta.append(openButton);
  if (local) card.dataset.local = "true";
  card.append(art, meta);
  return card;
}

function getLocalWorks() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = current === null ? localStorage.getItem(LEGACY_STORAGE_KEY) : null;
    const saved = JSON.parse(current ?? legacy ?? "[]");
    if (!Array.isArray(saved)) return [];
    const normalized = saved.map(normalizeRecipe).slice(0, 24);
    if (current === null && legacy !== null) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
}

function updateGalleryCount(localCount = getLocalWorks().length) {
  document.querySelector("#gallery-count").textContent = String(curatedWorks.length + localCount).padStart(2, "0");
}

function renderCuratedGallery() {
  const grid = document.querySelector("#curated-grid");
  const fragment = document.createDocumentFragment();
  curatedWorks.forEach((work, index) => fragment.append(createGalleryCard(work, index)));
  grid.replaceChildren(fragment);
}

function renderLocalGallery() {
  const grid = document.querySelector("#local-grid");
  const works = getLocalWorks();
  document.querySelector("#local-count").textContent = `${works.length} saved`;
  updateGalleryCount(works.length);
  if (!works.length) {
    grid.innerHTML = '<div class="empty-gallery"><span>Nothing held yet.</span><p>Return to Create and save a frame you want to revisit.</p></div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  works.forEach((work, index) => fragment.append(createGalleryCard({ ...work, title: `Saved study ${String(index + 1).padStart(2, "0")}` }, index, true)));
  grid.replaceChildren(fragment);
}

document.querySelectorAll('input[type="range"]').forEach((input) => {
  updateRangeBackground(input);
  input.addEventListener("input", () => {
    state[input.id] = Number(input.value);
    const output = document.querySelector(`output[for="${input.id}"]`);
    if (output) output.value = input.id === "density" ? input.value : Number(input.value).toFixed(2);
    updateRangeBackground(input);
  });
});

document.querySelectorAll("[data-pattern]").forEach((button) => {
  button.addEventListener("click", () => { state.pattern = button.dataset.pattern; state.time = 0; updatePatternUI(); });
});

document.querySelectorAll(".palette-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.palette = button.dataset.palette;
    document.querySelector("#palette-name").textContent = palettes[state.palette].name;
    document.querySelectorAll(".palette-button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-checked", String(active));
    });
  });
});

document.querySelector("#seed-input").addEventListener("change", (event) => {
  state.seed = Math.min(999999999, Math.max(1, Math.round(Number(event.target.value) || defaults.seed)));
  state.time = 0;
  updateSeedUI();
});

document.querySelector("#randomize-seed").addEventListener("click", () => {
  state.seed = Math.floor(100000 + Math.random() * 999899999);
  state.time = 0;
  updateSeedUI();
});

document.querySelector("#play-toggle").addEventListener("click", () => {
  state.playing = !state.playing;
  const button = document.querySelector("#play-toggle");
  button.setAttribute("aria-label", state.playing ? "Pause animation" : "Play animation");
  button.querySelector("path").setAttribute("d", state.playing ? "M8 6v12M16 6v12" : "m8 5 11 7-11 7Z");
});

document.querySelector("#reset-controls").addEventListener("click", () => {
  Object.assign(state, { density: defaults.density, complexity: defaults.complexity, motion: defaults.motion, continuity: defaults.continuity, scale: defaults.scale, weight: defaults.weight, grain: defaults.grain, time: 0 });
  syncUIFromState();
  showToast("Character reset");
});

document.querySelector("#layer-toggle").addEventListener("change", (event) => {
  state.layerEnabled = event.target.checked;
  [document.querySelector("#layer-pattern"), document.querySelector("#blend-mode"), document.querySelector("#layerOpacity")].forEach((control) => { control.disabled = !state.layerEnabled; });
});
document.querySelector("#layer-pattern").addEventListener("change", (event) => { state.layerPattern = event.target.value; });
document.querySelector("#blend-mode").addEventListener("change", (event) => { state.blendMode = event.target.value; });

document.querySelector("#output-preset").addEventListener("change", (event) => { state.preset = event.target.value; updateCanvasPreset(); });
document.querySelector("#safe-toggle").addEventListener("change", (event) => { document.querySelector("#safe-zone").hidden = !event.target.checked; });

document.querySelector("#export-png").addEventListener("click", () => {
  const preset = presets[state.preset];
  const output = document.createElement("canvas");
  output.width = preset.width;
  output.height = preset.height;
  renderArt(output, state, state.time);
  output.toBlob((blob) => {
    if (!blob) return showToast("Export failed in this browser");
    downloadBlob(blob, `gen4zero-${state.pattern}-${state.seed}-${preset.width}x${preset.height}.png`);
    showToast("PNG exported");
  }, "image/png");
});

document.querySelector("#record-video").addEventListener("click", () => {
  if (!canvas.captureStream || !window.MediaRecorder) return showToast("Video recording is not supported here");
  const button = document.querySelector("#record-video");
  const badge = document.querySelector("#recording-badge");
  const mimeCandidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = mimeCandidates.find((type) => !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type)) || "";
  const stream = canvas.captureStream(30);
  const chunks = [];
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 9000000 } : undefined);
  const wasPlaying = state.playing;
  state.playing = true;
  button.disabled = true;
  badge.hidden = false;
  let remaining = 5;
  badge.querySelector("span").textContent = `REC 00:0${remaining}`;
  const countdown = setInterval(() => { remaining -= 1; badge.querySelector("span").textContent = `REC 00:0${Math.max(0, remaining)}`; }, 1000);
  recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
  recorder.addEventListener("stop", () => {
    clearInterval(countdown);
    badge.hidden = true;
    button.disabled = false;
    state.playing = wasPlaying;
    stream.getTracks().forEach((track) => track.stop());
    downloadBlob(new Blob(chunks, { type: recorder.mimeType || "video/webm" }), `gen4zero-${state.pattern}-${state.seed}-5s.webm`);
    showToast("5-second clip exported");
  });
  recorder.start();
  setTimeout(() => recorder.stop(), 5000);
});

document.querySelector("#save-gallery").addEventListener("click", () => {
  const works = getLocalWorks();
  works.unshift(recipeFromState());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works.slice(0, 24)));
  updateGalleryCount(Math.min(24, works.length));
  showToast("Saved on this device");
});

document.querySelector("#copy-link").addEventListener("click", async () => {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(recipeFromState())))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const url = `${location.origin}${location.pathname}#recipe=${encoded}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Recipe link copied");
  } catch {
    const field = document.createElement("textarea");
    field.value = url;
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
    showToast("Recipe link copied");
  }
});

document.querySelector("#export-recipe").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(recipeFromState(), null, 2)], { type: "application/json" });
  downloadBlob(blob, `gen4zero-${state.pattern}-${state.seed}.g4z.json`);
  showToast("Recipe exported");
});

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelector("#about-open").addEventListener("click", () => document.querySelector("#about-dialog").showModal());
document.querySelector("#about-close").addEventListener("click", () => document.querySelector("#about-dialog").close());
document.querySelector("#about-dialog").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });

window.addEventListener("keydown", (event) => {
  if (event.target.matches("input, button, select")) return;
  if (event.code === "Space") { event.preventDefault(); document.querySelector("#play-toggle").click(); }
  if (event.key.toLowerCase() === "r") document.querySelector("#randomize-seed").click();
});

window.addEventListener("resize", fitCanvasFrame);
window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));

function loadInitialState() {
  if (location.hash.startsWith("#recipe=")) {
    try {
      let encoded = location.hash.slice(8).replaceAll("-", "+").replaceAll("_", "/");
      encoded += "=".repeat((4 - (encoded.length % 4)) % 4);
      const decoded = decodeURIComponent(escape(atob(encoded)));
      applyRecipe(JSON.parse(decoded));
      showToast("Shared recipe loaded");
    } catch {
      syncUIFromState();
      showToast("This recipe link is not valid");
    }
  } else {
    syncUIFromState();
    if (location.hash === "#gallery") currentView = "gallery";
  }
  renderCuratedGallery();
  renderLocalGallery();
  if (currentView === "gallery") switchView("gallery");
  requestAnimationFrame(fitCanvasFrame);
  rafId = requestAnimationFrame(renderFrame);
}

loadInitialState();
