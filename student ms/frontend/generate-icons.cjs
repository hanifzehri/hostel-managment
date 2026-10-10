const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table & calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateIconPNG(size, outPath) {
  const width = size;
  const height = size;

  // Raw RGBA buffer: (width * 4 + 1) * height bytes (with filter byte 0 at start of each scanline)
  const scanlineSize = width * 4 + 1;
  const raw = Buffer.alloc(scanlineSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    raw[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Distance from center
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const d = Math.sqrt(dx * dx + dy * dy);

      // Squircle distance: (|dx|^4 + |dy|^4)^(1/4)
      const sq = Math.pow(Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dy), 4), 0.25);

      let r = 7, g = 14, b = 23, a = 255; // #070e17 base navy

      if (sq > 0.96) {
        // Transparent outside rounded squircle
        a = 0;
      } else if (sq > 0.88) {
        // Teal border ring
        r = 13; g = 148; b = 136; // #0d9488
      } else if (sq > 0.84) {
        // Inner navy gap
        r = 11; g = 25; b = 44; // #0b192c
      } else {
        // Inner Shield / Crest representation
        const shieldY = (y - cy * 0.3) / (height * 0.7);
        const shieldX = Math.abs(x - cx) / (width * 0.36);

        if (shieldX < 0.9 && shieldY >= 0 && shieldY <= 0.85) {
          // Inside shield
          const isBorder = shieldX > 0.78 || shieldY > 0.78 || (shieldY < 0.08 && shieldX < 0.8);
          if (isBorder) {
            // Bright teal border
            r = 45; g = 212; b = 191; // #2dd4bf
          } else {
            // Navy shield body with gradient
            r = 15; g = 34; b = 56;
          }
        }

        // Draw "RH" Monogram representation in center
        // Left pillar of 'R'
        const inLeftR = (x >= cx - width * 0.22 && x <= cx - width * 0.16) && (y >= cy - height * 0.12 && y <= cy + height * 0.18);
        // Top loop of 'R'
        const inLoopR = (x >= cx - width * 0.16 && x <= cx - width * 0.06) &&
                        ((y >= cy - height * 0.12 && y <= cy - height * 0.08) ||
                         (y >= cy + height * 0.01 && y <= cy + height * 0.05) ||
                         (x >= cx - width * 0.09 && y >= cy - height * 0.12 && y <= cy + height * 0.05));
        // Leg of 'R'
        const inLegR = (x >= cx - width * 0.14 && x <= cx - width * 0.04) &&
                       (y >= cy + height * 0.04 && y <= cy + height * 0.18) &&
                       ((x - (cx - width * 0.14)) > (y - (cy + height * 0.04)) * 0.6 - width * 0.03);

        // 'H' Left pillar
        const inLeftH = (x >= cx + width * 0.06 && x <= cx + width * 0.12) && (y >= cy - height * 0.12 && y <= cy + height * 0.18);
        // 'H' Right pillar
        const inRightH = (x >= cx + width * 0.18 && x <= cx + width * 0.24) && (y >= cy - height * 0.12 && y <= cy + height * 0.18);
        // 'H' Crossbar
        const inBarH = (x >= cx + width * 0.12 && x <= cx + width * 0.18) && (y >= cy + height * 0.01 && y <= cy + height * 0.06);

        if (inLeftR || inLoopR || inLegR || inLeftH || inRightH || inBarH) {
          // Pure white letters
          r = 255; g = 255; b = 255;
        }

        // Crown roof accent above
        const inCrown = (y >= cy - height * 0.26 && y <= cy - height * 0.18) &&
                        (Math.abs(x - cx) <= (cy - height * 0.18 - y) * 1.5 + width * 0.06);
        if (inCrown) {
          // Amber gold crown
          r = 245; g = 158; b = 11;
        }
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  // Header chunk IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0 (deflate)
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  const idatData = zlib.deflateSync(raw, { level: 9 });
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const png = Buffer.concat([
    pngSig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outPath, png);
  console.log(`Generated PNG icon: ${outPath} (${width}x${height}, ${png.length} bytes)`);
}

const pubDir = path.join(__dirname, 'public');
generateIconPNG(192, path.join(pubDir, 'pwa-192x192.png'));
generateIconPNG(512, path.join(pubDir, 'pwa-512x512.png'));
generateIconPNG(180, path.join(pubDir, 'apple-touch-icon.png'));
console.log('All PWA icons generated successfully!');
