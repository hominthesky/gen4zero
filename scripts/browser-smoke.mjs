// Optional real-browser acceptance. Install Playwright separately; not a runtime dependency.
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.SITE_URL || "http://127.0.0.1:4173/";
const evidence = await mkdtemp(join(tmpdir(), "gen4zero-smoke-"));
const browser = await chromium.launch({ headless: true, timeout: 30000, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const deadline = setTimeout(() => { console.error("Browser acceptance exceeded its 180-second budget"); void browser.close(); }, 180000);
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  console.log("Page loaded; verifying renderers and output.");
  assert.match(await page.title(), /Gen4Zero/);
  await page.locator("#play-toggle").click();
  for (const pattern of ["flow", "orbit", "cell", "grid", "moire", "loom"]) {
    await page.locator(`[data-pattern="${pattern}"]`).click();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.ok(await page.locator("#art-canvas").evaluate((canvas) => {
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      return data.some((value, i) => i % 4 !== 3 && value !== data[i % 4]);
    }), `${pattern} has visible artwork`);
  }
  await page.locator('[data-pattern="flow"]').click();
  await page.locator("#seed-input").fill("424242");
  await page.locator("#seed-input").press("Tab");
  await page.locator("#layer-toggle").check();
  await page.locator("#output-preset").selectOption("tiktok");
  const pngEvent = page.waitForEvent("download");
  await page.locator("#export-png").click();
  const png = await pngEvent;
  await png.saveAs(join(evidence, png.suggestedFilename()));
  const bytes = await readFile(await png.path());
  assert.equal(bytes.readUInt32BE(16), 1080);
  assert.equal(bytes.readUInt32BE(20), 1920);
  console.log("PNG dimensions verified.");
  const jsonEvent = page.waitForEvent("download");
  await page.locator("#export-recipe").click();
  const recipe = JSON.parse(await readFile(await (await jsonEvent).path(), "utf8"));
  assert.equal(recipe.seed, 424242);
  assert.equal(recipe.preset, "tiktok");
  await page.locator("#save-gallery").click();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-view="gallery"]').click();
  assert.ok(await page.locator("#local-grid .gallery-card").count() > 0, "saved gallery survives reload");
  await page.locator("#local-grid button").first().click();
  console.log("Gallery persisted; verifying recording.");
  assert.equal(await page.locator("#seed-input").inputValue(), "424242");
  await page.screenshot({ path: join(evidence, "desktop.png"), fullPage: true });
  const videoEvent = page.waitForEvent("download", { timeout: 20000 });
  await page.locator("#record-video").click();
  const video = await videoEvent;
  await video.saveAs(join(evidence, video.suggestedFilename()));
  assert.ok((await readFile(await video.path())).length > 1000);
  const videoBytes = await readFile(await video.path());
  const metadata = await page.evaluate(async (bytes) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "video/webm" }));
    try {
      video.src = url;
      await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = () => reject(new Error("WebM decoding failed")); });
      return { width: video.videoWidth, height: video.videoHeight };
    } finally { URL.revokeObjectURL(url); }
  }, [...videoBytes]);
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(evidence, "mobile.png"), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
  const encoded = Buffer.from(JSON.stringify(recipe)).toString("base64url");
  await page.goto(`${base.split("#")[0]}#recipe=${encoded}`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#seed-input").inputValue(), "424242");
  await page.addInitScript(() => { MediaRecorder.isTypeSupported = () => false; });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#record-video").click();
  assert.match(await page.locator("#toast").textContent(), /WebM is not supported/);
  assert.equal(await page.locator("#record-video").isDisabled(), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: "passed", base, evidence, png: "1080 × 1920", gallery: "persisted and reloaded", video: metadata, recipe: "JSON and URL round-trip", pageErrors: errors }, null, 2));
} finally {
  clearTimeout(deadline);
  await browser.close();
}
