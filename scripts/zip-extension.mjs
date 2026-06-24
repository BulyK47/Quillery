// Dependency-free ZIP writer — packages dist-extension/ into a Chrome Web Store
// upload zip (release/quillery-extension-v<version>.zip). Uses raw DEFLATE via
// node:zlib; no external deps.
import zlib from "node:zlib";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "dist-extension");
const outDir = join(root, "release");

if (!existsSync(join(srcDir, "manifest.json"))) {
  console.error("dist-extension/ not found — run `npm run build:extension` first.");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const outPath = join(outDir, `quillery-extension-v${version}.zip`);

// ---- crc32 ----------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// Fixed DOS timestamp (deterministic zips; avoids Date in the build output).
const DOS_TIME = 0;
const DOS_DATE = 0x21; // 1980-01-01

const files = walk(srcDir);
const local = [];
const central = [];
let offset = 0;

for (const file of files) {
  const name = relative(srcDir, file).split(sep).join("/");
  const data = readFileSync(file);
  const crc = crc32(data);
  const compressed = zlib.deflateRawSync(data, { level: 9 });
  const nameBuf = Buffer.from(name, "utf8");

  const lfh = Buffer.alloc(30);
  lfh.writeUInt32LE(0x04034b50, 0);
  lfh.writeUInt16LE(20, 4); // version needed
  lfh.writeUInt16LE(0, 6); // flags
  lfh.writeUInt16LE(8, 8); // method: deflate
  lfh.writeUInt16LE(DOS_TIME, 10);
  lfh.writeUInt16LE(DOS_DATE, 12);
  lfh.writeUInt32LE(crc, 14);
  lfh.writeUInt32LE(compressed.length, 18);
  lfh.writeUInt32LE(data.length, 22);
  lfh.writeUInt16LE(nameBuf.length, 26);
  lfh.writeUInt16LE(0, 28); // extra len
  local.push(lfh, nameBuf, compressed);

  const cdh = Buffer.alloc(46);
  cdh.writeUInt32LE(0x02014b50, 0);
  cdh.writeUInt16LE(20, 4); // version made by
  cdh.writeUInt16LE(20, 6); // version needed
  cdh.writeUInt16LE(0, 8); // flags
  cdh.writeUInt16LE(8, 10); // method
  cdh.writeUInt16LE(DOS_TIME, 12);
  cdh.writeUInt16LE(DOS_DATE, 14);
  cdh.writeUInt32LE(crc, 16);
  cdh.writeUInt32LE(compressed.length, 20);
  cdh.writeUInt32LE(data.length, 24);
  cdh.writeUInt16LE(nameBuf.length, 28);
  cdh.writeUInt32LE(offset, 42); // local header offset
  central.push(cdh, nameBuf);

  offset += lfh.length + nameBuf.length + compressed.length;
}

const localBuf = Buffer.concat(local);
const centralBuf = Buffer.concat(central);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(files.length, 8); // entries on disk
eocd.writeUInt16LE(files.length, 10); // total entries
eocd.writeUInt32LE(centralBuf.length, 12);
eocd.writeUInt32LE(localBuf.length, 16); // central dir offset

writeFileSync(outPath, Buffer.concat([localBuf, centralBuf, eocd]));
console.log(`Packed ${files.length} files → ${relative(root, outPath)}`);
