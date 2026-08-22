import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { deflateSync } from "zlib";

function createPng(size, r, g, b) {
  const width = size;
  const height = size;
  const raw = [];

  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) {
      const margin = Math.floor(size * 0.15);
      const inRect =
        x >= margin && x < width - margin && y >= margin && y < height - margin;
      if (inRect) {
        raw.push(r, g, b, 255);
      } else {
        raw.push(10, 10, 10, 255);
      }
    }
  }

  const compressed = deflateSync(Buffer.from(raw));

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

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dir = join(process.cwd(), "public", "icons");
mkdirSync(dir, { recursive: true });

writeFileSync(join(dir, "icon-192.png"), createPng(192, 249, 115, 22));
writeFileSync(join(dir, "icon-512.png"), createPng(512, 249, 115, 22));

const publicDir = join(process.cwd(), "public");
writeFileSync(join(publicDir, "favicon.ico"), createPng(32, 249, 115, 22));
console.log("Icons and favicon generated");
