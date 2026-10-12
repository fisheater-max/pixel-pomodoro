// 生成像素番茄图标 (16x16 PNG)
// 运行: node generate-icon.js
const fs = require('fs');
const path = require('path');

// 16x16 像素番茄 (RGBA)
const tomato = [
  '................',
  '.......@@.......',
  '......@@@@......',
  '.....@@@@@@.....',
  '....@@@@@@@@....',
  '...@@@@@@@@@@...',
  '..@@@@@@@@@@@@..',
  '..@@@@@@@@@@@@..',
  '..@@@@@@@@@@@@..',
  '..@@@@@@@@@@@@..',
  '..@@@@@@@@@@@@..',
  '...@@@@@@@@@@...',
  '....@@@@@@@@....',
  '.....@@@@@@.....',
  '......@@@@......',
  '................',
];

// 放大到 64x64 用于应用图标
const scale = 4;
const size = 16 * scale;

// 创建简单的 BMP 文件（Windows 原生支持）
// 实际上我们生成一个简单的 32x32 PNG 用 Buffer

// 更简单的方法：创建一个有效的最小 PNG
// PNG signature
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// 手工构建一个简单的 32x32 RGBA PNG
const pngSize = 32;

// 使用 zlib 压缩
const zlib = require('zlib');

// 创建原始图像数据
const rawData = Buffer.alloc(pngSize * pngSize * 4 + pngSize); // +pngSize for filter bytes
for (let y = 0; y < pngSize; y++) {
  rawData[y * (pngSize * 4 + 1)] = 0; // filter: none
  for (let x = 0; x < pngSize; x++) {
    const offset = y * (pngSize * 4 + 1) + 1 + x * 4;
    const srcX = Math.floor(x / scale);
    const srcY = Math.floor(y / scale);
    const pixel = tomato[Math.min(srcY, 15)][Math.min(srcX, 15)];

    if (pixel === '@') {
      rawData[offset] = 255;     // R
      rawData[offset + 1] = 60;  // G
      rawData[offset + 2] = 60;  // B
      rawData[offset + 3] = 255; // A
    } else if (pixel === 'G') {
      rawData[offset] = 0;
      rawData[offset + 1] = 200;
      rawData[offset + 2] = 50;
      rawData[offset + 3] = 255;
    } else {
      rawData[offset + 3] = 0; // transparent
    }
  }
}

const compressed = zlib.deflateSync(rawData);

// Build PNG chunks
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// IHDR chunk
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(pngSize, 0);  // width
ihdr.writeUInt32BE(pngSize, 4);  // height
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type: RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  signature,
  createChunk('IHDR', ihdr),
  createChunk('IDAT', compressed),
  createChunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), png);
console.log('Icon generated: assets/icon.png');