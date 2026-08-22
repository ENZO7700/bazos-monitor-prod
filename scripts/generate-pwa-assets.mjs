import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { deflateSync } from "zlib";

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function isInLetter(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 192;
  const lx = (x - cx) / scale;
  const ly = (y - cy) / scale;

  const inStem = lx >= -28 && lx <= -8 && ly >= -48 && ly <= 48;
  const inTop = lx >= -28 && lx <= 36 && ly >= 28 && ly <= 48;
  const inMid = lx >= -28 && lx <= 28 && ly >= -8 && ly <= 8;
  const inBot = lx >= -28 && lx <= 36 && ly >= -48 && ly <= -28;
  const inTopBump = lx >= 8 && lx <= 36 && ly >= 8 && ly <= 48;
  const inBotBump = lx >= 8 && lx <= 36 && ly >= -48 && ly <= -8;

  return inStem || inTop || inMid || inBot || inTopBump || inBotBump;
}

function createPng(size, { maskable = false } = {}) {
  const raw = [];
  const bg = [10, 10, 10, 255];
  const fg = [249, 115, 22, 255];
  const safe = maskable ? Math.floor(size * 0.1) : Math.floor(size * 0.12);

  for (let y = 0; y < size; y++) {
    raw.push(0);
    for (let x = 0; x < size; x++) {
      const inSafe =
        x >= safe && x < size - safe && y >= safe && y < size - safe;
      if (inSafe && (isInLetter(x, y, size) || (!maskable && x === y))) {
        raw.push(...fg);
      } else if (inSafe && !maskable) {
        raw.push(20, 20, 20, 255);
      } else {
        raw.push(...bg);
      }
    }
  }

  const compressed = deflateSync(Buffer.from(raw));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function createScreenshot(width, height) {
  const raw = [];
  const header = [20, 20, 20, 255];
  const card = [30, 30, 30, 255];
  const accent = [249, 115, 22, 255];
  const muted = [60, 60, 60, 255];

  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      const inHeader = y < Math.floor(height * 0.1);
      const inCard =
        x > width * 0.08 &&
        x < width * 0.92 &&
        y > height * 0.18 &&
        y < height * 0.35;
      const inCard2 =
        x > width * 0.08 &&
        x < width * 0.92 &&
        y > height * 0.4 &&
        y < height * 0.57;
      const inAccent =
        x > width * 0.08 &&
        x < width * 0.22 &&
        y > height * 0.12 &&
        y < height * 0.16;

      if (inAccent) raw.push(...accent);
      else if (inCard || inCard2) raw.push(...card);
      else if (inHeader) raw.push(...muted);
      else raw.push(...header);
    }
  }

  const compressed = deflateSync(Buffer.from(raw));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const iconsDir = join(process.cwd(), "public", "icons");
const screenshotsDir = join(process.cwd(), "public", "screenshots");
const publicDir = join(process.cwd(), "public");
mkdirSync(iconsDir, { recursive: true });
mkdirSync(screenshotsDir, { recursive: true });

writeFileSync(join(iconsDir, "icon-192.png"), createPng(192));
writeFileSync(join(iconsDir, "icon-512.png"), createPng(512));
writeFileSync(join(iconsDir, "icon-192-maskable.png"), createPng(192, { maskable: true }));
writeFileSync(join(iconsDir, "icon-512-maskable.png"), createPng(512, { maskable: true }));
writeFileSync(join(publicDir, "favicon.ico"), createPng(32));
writeFileSync(join(screenshotsDir, "desktop.png"), createScreenshot(1280, 720));
writeFileSync(join(screenshotsDir, "mobile.png"), createScreenshot(750, 1334));
console.log("PWA icons and screenshots generated");
