#!/usr/bin/env node
const Jimp = require('jimp');
const net = require('net');
const readline = require('readline-sync');
const fs = require('fs');

console.log('==== ESC/POS PNG IMAGE PRINTER ====' );
const imgPath = readline.question('Nhập đường dẫn file PNG: ');
const printerIp = readline.question('Nhập IP máy in (default 192.168.0.3): ') || '192.168.0.3';
const port = 9100;

if (!fs.existsSync(imgPath)) {
  console.error('❌ File không tồn tại:', imgPath);
  process.exit(1);
}

Jimp.read(imgPath)
  .then(img => {
    // scale về đúng khổ giấy nếu cần: 576 px cho 80mm
    if (img.bitmap.width > 576) img.resize(576, Jimp.AUTO);
    const w = img.bitmap.width,
      h = img.bitmap.height,
      bytesPerLine = Math.ceil(w / 8);
    // Ảnh đen/trắng threshold
    img.grayscale();
    img.contrast(1);
    img.dither565();
    // Convert bitmap theo tốc độ máy in nhiệt
    const imageData = img.bitmap.data;
    const buffer = Buffer.alloc(bytesPerLine * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const val = imageData[idx];
        if (val < 128) buffer[y * bytesPerLine + (x >> 3)] |= 0x80 >> (x % 8);
      }
    }
    const header = Buffer.from([0x1d, 0x76, 0x30, 0x00, bytesPerLine % 256, bytesPerLine >> 8, h % 256, h >> 8]);
    const cmd = Buffer.concat([
      Buffer.from([0x1b, 0x40]),
      header,
      buffer,
      Buffer.from([0x0a, 0x0a, 0x1d, 0x56, 0x00]),
    ]);
    // Lưu lại for debug:
    fs.writeFileSync('last_bill_printed.bin', cmd);
    // In qua TCP
    const socket = new net.Socket();
    console.log('⏳ Đang kết nối máy in', printerIp, 'port', port, '...');
    socket.connect(port, printerIp, () => {
      console.log('✅ Đã kết nối máy in. Gửi lệnh in...');
      socket.write(cmd);
      socket.end();
    });
    socket.on('error', (e) => {
      console.log('❌ Lỗi gửi in:', e.message);
    });
    socket.on('close', () => {
      console.log('🖨️ Đã gửi lệnh in, kiểm tra máy in!');
    });
  })
  .catch((e) => {
    console.error('❌ Lỗi đọc file ảnh:', e.message);
  });
