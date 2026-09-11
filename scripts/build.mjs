import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "dist");
const releaseFiles = ["index.html", "styles.css", "app.js", "og.png", "CNAME", ".nojekyll", "LICENSE"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of releaseFiles) {
  await copyFile(join(root, file), join(output, file));
}

console.log(`Built ${releaseFiles.length} allowlisted files in dist/.`);
