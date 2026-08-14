// Generate the home-screen icons as PNGs, by hand, so the repo keeps zero dependencies.
// A descending stair of blocks on a dark ground: a weight trend coming down.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [0x13, 0x1A, 0x1D];
const ACCENT = [0x4F, 0xC9, 0xD4];
const MUTED = [0x26, 0x32, 0x37];

function icon(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, c, a) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = a === undefined ? 255 : a;
  };
  const rect = (x0, y0, w, h, c) => {
    for (let y = Math.round(y0); y < Math.round(y0 + h); y++)
      for (let x = Math.round(x0); x < Math.round(x0 + w); x++) set(x, y, c);
  };

  rect(0, 0, size, size, BG);

  const u = size / 16;              // layout unit
  rect(u * 2, u * 12.6, u * 12, u * 0.35, MUTED);   // baseline

  // five bars stepping down left to right
  const tops = [3.2, 4.6, 6.2, 7.4, 9.2];
  tops.forEach((t, i) => {
    const x = u * (2.4 + i * 2.35);
    rect(x, u * t, u * 1.5, u * 12.6 - u * t, ACCENT);
  });

  // the trend line: a thicker cap sitting on each bar, tying them together
  for (let i = 0; i < tops.length - 1; i++) {
    const x0 = u * (2.4 + i * 2.35) + u * 0.75;
    const x1 = u * (2.4 + (i + 1) * 2.35) + u * 0.75;
    const y0 = u * tops[i], y1 = u * tops[i + 1];
    const steps = Math.ceil(x1 - x0);
    for (let s = 0; s <= steps; s++) {
      const x = x0 + s, y = y0 + (y1 - y0) * (s / steps);
      for (let d = -Math.round(u * 0.3); d <= Math.round(u * 0.3); d++) set(Math.round(x), Math.round(y) + d, [255, 255, 255]);
    }
  }

  // raw scanlines, filter byte 0 per row
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level: 9})),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = path.join(__dirname, '..');
fs.mkdirSync(out, {recursive: true});
[180, 192, 512].forEach(s => {
  const buf = icon(s);
  fs.writeFileSync(path.join(out, 'icon-' + s + '.png'), buf);
  console.log('icon-' + s + '.png', buf.length, 'bytes');
});
