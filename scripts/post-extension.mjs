// Copies the Vite build into dist-extension/ — the folder you load as an
// unpacked extension (chrome://extensions -> Load unpacked). manifest.json,
// background.js and icons/ are already in dist (copied verbatim from public/).
import { cpSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const out = join(root, "dist-extension");

if (!existsSync(join(dist, "manifest.json"))) {
  console.error("dist/manifest.json missing — run the build first.");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
cpSync(dist, out, { recursive: true });
console.log("Extension ready in dist-extension/ — Load unpacked there.");
