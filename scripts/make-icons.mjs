// Dependency-free PNG/ICO icon generator for Quillery.
// Renders a quill (feather pen) on a gradient rounded tile, at 4x supersampling
// for anti-aliasing. No native deps — fully self-contained.
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const SIZES = [16, 32, 48, 128, 256];

// ---- PNG encoding ---------------------------------------------------------
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

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- geometry helpers -----------------------------------------------------
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function roundedRectSdf(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0],
      yi = pts[i][1],
      xj = pts[j][0],
      yj = pts[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ---- quill geometry (normalised 0..1, computed once) ----------------------
const FEATHER_TIP = [0.69, 0.23]; // top (plume end)
const NIB_TIP = [0.29, 0.76]; // bottom (writing point)

function buildQuill() {
  const [ax, ay] = FEATHER_TIP;
  const [bx, by] = NIB_TIP;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  const px = -dy / len; // unit perpendicular
  const py = dx / len;

  // Feather body: a leaf around the axis, widest just above centre.
  const N = 28;
  const upper = [];
  const lower = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const cx = ax + dx * t;
    const cy = ay + dy * t;
    const w = 0.094 * Math.pow(Math.sin(Math.PI * t), 0.72);
    upper.push([cx + px * w, cy + py * w]);
    lower.push([cx - px * w, cy - py * w]);
  }
  const body = upper.concat(lower.reverse());

  // Central vein (drawn in the tile colour to split the white plume).
  const vein = [ax, ay, bx, by];

  // Barbs branching off the vein toward the plume tip.
  const barbs = [];
  const towardTipX = -dx / len;
  const towardTipY = -dy / len;
  for (const t of [0.34, 0.48, 0.62, 0.76]) {
    const cx = ax + dx * t;
    const cy = ay + dy * t;
    const reach = 0.072 * Math.sin(Math.PI * t);
    const angX = (px + towardTipX) * 0.5;
    const angY = (py + towardTipY) * 0.5;
    const angX2 = (-px + towardTipX) * 0.5;
    const angY2 = (-py + towardTipY) * 0.5;
    barbs.push([cx, cy, cx + angX * reach * 2, cy + angY * reach * 2]);
    barbs.push([cx, cy, cx + angX2 * reach * 2, cy + angY2 * reach * 2]);
  }

  return { body, vein, barbs };
}

const QUILL = buildQuill();

// Small twinkle to hint the "polish/optimize" feature.
const SPARK = { x: 0.70, y: 0.66, r: 0.055 };

function renderIcon(size) {
  const S = 4; // supersample
  const big = size * S;
  const acc = new Float32Array(size * size * 4);

  const top = [99, 102, 241]; // indigo
  const bottom = [124, 58, 237]; // violet

  for (let by = 0; by < big; by++) {
    for (let bx = 0; bx < big; bx++) {
      const u = (bx + 0.5) / big;
      const v = (by + 0.5) / big;

      const sdf = roundedRectSdf(u, v, 0.5, 0.5, 0.5 - 0.02, 0.5 - 0.02, 0.235);
      let r = 0,
        g = 0,
        b = 0,
        a = 0;

      if (sdf <= 0) {
        // diagonal gradient
        const f = (u + v) / 2;
        r = top[0] + (bottom[0] - top[0]) * f;
        g = top[1] + (bottom[1] - top[1]) * f;
        b = top[2] + (bottom[2] - top[2]) * f;
        a = 255;

        const gradient = [r, g, b];

        if (pointInPolygon(u, v, QUILL.body)) {
          r = 255;
          g = 255;
          b = 255;
          // vein + barbs cut the gradient back through the white plume
          const onVein =
            distToSegment(u, v, QUILL.vein[0], QUILL.vein[1], QUILL.vein[2], QUILL.vein[3]) <=
            0.009;
          let onBarb = false;
          if (!onVein) {
            for (const bb of QUILL.barbs) {
              if (distToSegment(u, v, bb[0], bb[1], bb[2], bb[3]) <= 0.0055) {
                onBarb = true;
                break;
              }
            }
          }
          if (onVein || onBarb) {
            r = gradient[0];
            g = gradient[1];
            b = gradient[2];
          }
        }

        // 4-point sparkle (astroid star) on the tile, beside the plume —
        // hints at the "polish / optimize" feature.
        const sdx = Math.abs(u - SPARK.x) / SPARK.r;
        const sdy = Math.abs(v - SPARK.y) / SPARK.r;
        if (Math.sqrt(sdx) + Math.sqrt(sdy) <= 1) {
          r = 255;
          g = 255;
          b = 255;
        }
      }

      const ti = ((by >> 2) * size + (bx >> 2)) * 4;
      acc[ti] += r;
      acc[ti + 1] += g;
      acc[ti + 2] += b;
      acc[ti + 3] += a;
    }
  }

  const rgba = Buffer.alloc(size * size * 4);
  const inv = 1 / (S * S);
  for (let i = 0; i < size * size * 4; i++) rgba[i] = Math.round(acc[i] * inv);
  return rgba;
}

// ---- ICO assembly (PNG-compressed entries, Vista+) ------------------------
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const images = [];
  entries.forEach((e, i) => {
    const o = 16 * i;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 0);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.png.length;
    images.push(e.png);
  });
  return Buffer.concat([header, dir, ...images]);
}

const entries = [];
for (const size of SIZES) {
  const png = encodePNG(size, renderIcon(size));
  writeFileSync(join(outDir, `icon${size}.png`), png);
  entries.push({ size, png });
}
writeFileSync(join(outDir, "icon.ico"), buildIco(entries));
console.log(
  `Generated Quillery icons: ${SIZES.map((s) => `icon${s}.png`).join(", ")}, icon.ico`,
);
