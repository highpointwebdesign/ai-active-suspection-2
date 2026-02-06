import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');

// Create proper PNG with teal color
function createPNG(width, height) {
  const chunks = [];
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  chunks.push(signature);
  
  // IHDR chunk (image header)
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);      // bit depth
  ihdr.writeUInt8(2, 9);      // color type RGB
  ihdr.writeUInt8(0, 10);     // compression
  ihdr.writeUInt8(0, 11);     // filter
  ihdr.writeUInt8(0, 12);     // interlace
  chunks.push(createChunk('IHDR', ihdr));
  
  // IDAT chunk (image data) - teal color
  const scanlineSize = width * 3 + 1;
  const imageData = Buffer.allocUnsafe(scanlineSize * height);
  let pos = 0;
  
  // Fill with teal color #16c79a (22, 199, 154)
  for (let y = 0; y < height; y++) {
    imageData[pos++] = 0; // filter type none
    for (let x = 0; x < width; x++) {
      imageData[pos++] = 22;   // R
      imageData[pos++] = 199;  // G
      imageData[pos++] = 154;  // B
    }
  }
  
  const compressed = zlib.deflateSync(imageData);
  chunks.push(createChunk('IDAT', compressed));
  
  // IEND chunk
  chunks.push(createChunk('IEND', Buffer.alloc(0)));
  
  return Buffer.concat(chunks);
}

function createChunk(type, data) {
  const length = Buffer.allocUnsafe(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.allocUnsafe(4);
  
  const crcData = Buffer.concat([typeBuffer, data]);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Create icons
[192, 512].forEach(size => {
  const buffer = createPNG(size, size);
  const filepath = path.join(publicDir, `icon-${size}.png`);
  fs.writeFileSync(filepath, buffer);
  console.log(`Created ${filepath} (${size}x${size})`);
});

console.log('Icons created successfully!');
