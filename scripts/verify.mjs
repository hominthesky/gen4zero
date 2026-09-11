import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const release = process.argv.includes("--release");
const releaseFiles = [".nojekyll", "CNAME", "LICENSE", "app.js", "index.html", "og.png", "styles.css"].sort();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: options.capture ? "pipe" : "inherit" });
  if (result.status !== 0) {
    if (options.capture) process.stderr.write(result.stderr || result.stdout || "");
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
  return options.capture ? result.stdout : "";
}

function gitPaths(args) {
  return run("git", args, { capture: true }).split("\0").filter(Boolean);
}

async function verifyStaticContract() {
  const [html, source, cname, image] = await Promise.all([
    readFile(join(root, "index.html"), "utf8"),
    readFile(join(root, "app.js"), "utf8"),
    readFile(join(root, "CNAME"), "utf8"),
    readFile(join(root, "og.png")),
  ]);

  assert.equal(cname.trim(), "gen4zero.zzao.im", "CNAME must match the canonical product origin");
  assert.match(html, /<title>Gen4Zero — A generative instrument by Z4Zero<\/title>/);
  assert.match(html, /https:\/\/gen4zero\.zzao\.im\/og\.png/);
  assert.doesNotMatch(html, /Generative Studio|studio\.zzao\.im/);
  assert.match(source, /const STORAGE_KEY = "gen4zero-works-v1"/);
  assert.match(source, /const LEGACY_STORAGE_KEY = "z4zero-generative-works"/);

  assert.deepEqual([...image.subarray(1, 4)], [0x50, 0x4e, 0x47], "og.png must be a PNG");
  assert.equal(image.readUInt32BE(16), 1200, "og.png must be 1200px wide");
  assert.equal(image.readUInt32BE(20), 630, "og.png must be 630px high");
  assert.ok((await stat(join(root, "og.png"))).size > 10_000, "og.png must not be an empty placeholder");

  for (const match of html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)) {
    await access(join(root, match[1]));
  }
}

async function verifyDocs() {
  const files = gitPaths(["ls-files", "-co", "--exclude-standard", "-z"]).filter((file) => file.endsWith(".md"));
  for (const file of files) {
    const text = await readFile(join(root, file), "utf8");
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, "").split("#", 1)[0];
      if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue;
      const absolute = resolve(dirname(join(root, file)), decodeURIComponent(target));
      await access(absolute).catch(() => { throw new Error(`${file} contains a broken link to ${target}`); });
    }
    assert.equal(text.split("\n").some((line) => /[ \t]+$/.test(line)), false, `${file} contains trailing whitespace`);
  }
}

async function verifySecrets() {
  const files = gitPaths(["ls-files", "-co", "--exclude-standard", "-z"]);
  const secretName = /(?:^|\/)(?:\.env(?:\..+)?|id_rsa|id_ed25519)$|\.(?:pem|key|p12|pfx)$/i;
  const tokenPattern = /(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----)/;

  for (const file of files) {
    assert.equal(secretName.test(file), false, `secret-prone file must not be committed: ${file}`);
    const buffer = await readFile(join(root, file));
    if (buffer.includes(0)) continue;
    assert.equal(tokenPattern.test(buffer.toString("utf8")), false, `possible credential detected in ${file}`);
  }
}

function changedFiles() {
  const candidates = new Set(gitPaths(["diff", "--name-only", "-z", "HEAD"]));
  gitPaths(["ls-files", "--others", "--exclude-standard", "-z"]).forEach((file) => candidates.add(file));

  const configuredBase = process.env.VERIFY_BASE_SHA;
  const baseIsUsable = configuredBase && !/^0+$/.test(configuredBase) && spawnSync("git", ["cat-file", "-e", `${configuredBase}^{commit}`], { cwd: root }).status === 0;
  const base = baseIsUsable ? configuredBase : (spawnSync("git", ["cat-file", "-e", "HEAD^"], { cwd: root }).status === 0 ? "HEAD^" : null);
  if (base) gitPaths(["diff", "--name-only", "-z", `${base}...HEAD`]).forEach((file) => candidates.add(file));
  return [...candidates];
}

function verifyChangePolicy() {
  const changed = changedFiles();
  const meaningful = changed.filter((file) => !["docs/OPERATIONS.md"].includes(file));
  if (!meaningful.length) return;

  assert.ok(changed.includes("docs/OPERATIONS.md"), "meaningful changes must update docs/OPERATIONS.md");
  const governed = meaningful.some((file) => /^(?:app\.js|CNAME|\.github\/workflows\/|scripts\/build\.mjs|styles\.css|index\.html)$/.test(file));
  if (governed) {
    assert.ok(changed.some((file) => /^docs\/change-records\/[^/]+\.md$/.test(file)), "governed product or release changes require a Change Record");
  }
}

async function verifyReleaseArtifact() {
  run(process.execPath, ["scripts/build.mjs"]);
  const actual = (await readdir(join(root, "dist"))).sort();
  assert.deepEqual(actual, releaseFiles, "dist/ must contain only the release allowlist");
  for (const file of releaseFiles) {
    const [source, built] = await Promise.all([readFile(join(root, file)), readFile(join(root, "dist", file))]);
    assert.deepEqual(built, source, `dist/${file} must match its reviewed source`);
  }
}

run(process.execPath, ["--check", "app.js"]);
run(process.execPath, ["--test", "tests/site.test.mjs"]);
await verifyStaticContract();
await verifyDocs();
await verifySecrets();
verifyChangePolicy();
if (release) await verifyReleaseArtifact();

console.log(`Gen4Zero verification (${release ? "release" : "fast"}): passed.`);
