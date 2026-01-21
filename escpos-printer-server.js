// Simple ESC/POS RAW Test - Standalone executable
const express = require('express');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { createCanvas, loadImage } = require('canvas');

// ESC/POS commands
const ESCPOS_COMMANDS = {
  INIT: Buffer.from([0x1B, 0x40]), // ESC @
  SET_LEFT_MARGIN: Buffer.from([0x1B, 0x6C, 0x00, 0x00]), // ESC l 0 0
  LINE_FEED: Buffer.from([0x0A]), // LF
  CUT_PAPER: Buffer.from([0x1D, 0x56, 0x00]), // GS V 0
};

// Create test image (576x100 pixels)
function createTestImage() {
  const width = 576;
  const height = 100;
  const bytesPerLine = Math.ceil(width / 8);
  const imageData = [];
  
  for (let y = 0; y < height; y++) {
    const line = [];
    for (let x = 0; x < bytesPerLine; x++) {
      if (y % 20 < 10) {
        line.push(0xFF); // Black line
      } else {
        line.push(0x00); // White line
      }
    }
    imageData.push(...line);
  }
  
  return Buffer.from(imageData);
}

// Test ESC/POS text
function testEscPosText(printerIp, port = 9100) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing ESC/POS Text to ${printerIp}:${port}`);
    
    const client = new net.Socket();
    client.setTimeout(5000);
    
    client.connect(port, printerIp, () => {
      console.log('✅ Connected to printer');
      
      try {
        let command = Buffer.concat([
          ESCPOS_COMMANDS.INIT,
          ESCPOS_COMMANDS.SET_LEFT_MARGIN,
          Buffer.from('TEST ESC/POS - NO MARGINS\n', 'ascii'),
          Buffer.from('========================\n', 'ascii'),
          ESCPOS_COMMANDS.LINE_FEED,
          Buffer.from(`Time: ${new Date().toLocaleString('vi-VN')}\n`, 'ascii'),
          Buffer.from('Printer: POS-80C\n', 'ascii'),
          Buffer.from('Method: ESC/POS RAW\n', 'ascii'),
          ESCPOS_COMMANDS.LINE_FEED,
          Buffer.from('If you see this text without\n', 'ascii'),
          Buffer.from('left/right margins, ESC/POS\n', 'ascii'),
          Buffer.from('RAW printing is working!\n', 'ascii'),
          Buffer.from('========================\n', 'ascii'),
          ESCPOS_COMMANDS.LINE_FEED,
          ESCPOS_COMMANDS.CUT_PAPER
        ]);
        
        console.log('📤 Sending ESC/POS text command...');
        console.log('📋 Command length:', command.length, 'bytes');
        
        client.write(command);
        client.end();
        
        resolve({
          success: true,
          message: 'ESC/POS text command sent successfully',
          commandLength: command.length
        });
        
      } catch (error) {
        reject(error);
      }
    });
    
    client.on('error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });
    
    client.on('timeout', () => {
      console.error('❌ Connection timeout');
      client.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

// Test ESC/POS raster
function testEscPosRaster(printerIp, port = 9100) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing ESC/POS Raster to ${printerIp}:${port}`);
    
    const client = new net.Socket();
    client.setTimeout(10000);
    
    client.connect(port, printerIp, () => {
      console.log('✅ Connected to printer for raster test');
      
      try {
        const testImage = createTestImage();
        const width = 576;
        const height = 100;
        const bytesPerLine = Math.ceil(width / 8);
        
        let command = Buffer.concat([
          ESCPOS_COMMANDS.INIT,
          ESCPOS_COMMANDS.SET_LEFT_MARGIN,
          Buffer.from('RASTER TEST - 576px width\n', 'ascii'),
          Buffer.from('========================\n', 'ascii'),
          ESCPOS_COMMANDS.LINE_FEED,
          
          // GS v 0 command for raster image
          Buffer.from([0x1D, 0x76, 0x30, 0x00]), // GS v 0
          Buffer.from([(bytesPerLine % 256), Math.floor(bytesPerLine / 256)]), // Width LSB, MSB
          Buffer.from([(height % 256), Math.floor(height / 256)]), // Height LSB, MSB
          testImage, // Image data
          
          ESCPOS_COMMANDS.LINE_FEED,
          Buffer.from('If you see black/white bars\n', 'ascii'),
          Buffer.from('without margins, raster works!\n', 'ascii'),
          Buffer.from('========================\n', 'ascii'),
          ESCPOS_COMMANDS.LINE_FEED,
          ESCPOS_COMMANDS.CUT_PAPER
        ]);
        
        console.log('📤 Sending ESC/POS raster command...');
        console.log('📋 Command length:', command.length, 'bytes');
        console.log('📋 Image size:', testImage.length, 'bytes');
        
        client.write(command);
        client.end();
        
        resolve({
          success: true,
          message: 'ESC/POS raster command sent successfully',
          commandLength: command.length,
          imageSize: testImage.length
        });
        
      } catch (error) {
        reject(error);
      }
    });
    
    client.on('error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });
    
    client.on('timeout', () => {
      console.error('❌ Connection timeout');
      client.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

// Tối giản, chỉ giữ API in ảnh tự động và upload ảnh
const app = express();
app.use(express.json({limit: '8mb'}));

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// 1. Upload image, lưu base64 thành file png để kiểm tra
app.post('/upload-image', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    if (!image_base64) return res.status(400).json({ success: false, error: 'image_base64 is required'});
    const buf = Buffer.from(image_base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64');
    const filename = `invoice_${Date.now()}.png`;
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, buf);
    res.json({ success: true, file: filename, url: `/output/${filename}` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 2. In ảnh bằng ESC/POS RAW raster, nhận base64 hoặc đường dẫn file
app.post('/print-raster', async (req, res) => {
  try {
    const { printer_ip, port=9100, image_base64, file } = req.body;
    if (!printer_ip || !(image_base64 || file)) return res.status(400).json({success:false,error:'Missing printer_ip or image data'});
    let buf;
    let filename;
    if (image_base64) {
      buf = Buffer.from(image_base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64');
      filename = `raster_${Date.now()}.png`;
      fs.writeFileSync(path.join(OUTPUT_DIR, filename), buf);
    } else if (file) {
      filename = file;
      buf = fs.readFileSync(path.join(OUTPUT_DIR, filename));
    }
    // Đọc ảnh
    const img = await loadImage(buf);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    // Convert to monochrome ESC/POS bitmap
    const width = img.width;
    const height = img.height;
    const bytesPerLine = Math.ceil(width/8);
    const bitmap = Buffer.alloc(bytesPerLine*height);
    const imageData = ctx.getImageData(0,0,width,height).data;
    for (let y=0;y<height;y++) {
      for (let x=0;x<width;x++) {
        const idx = (y*width + x)*4;
        const r = imageData[idx];
        const g = imageData[idx+1];
        const b = imageData[idx+2];
        const avg = (r+g+b)/3;
        if (avg<144) bitmap[y*bytesPerLine + (x>>3)] |= (0x80>>(x%8));
      }
    }
    // Tạo ESC/POS command
    const GSv0 = Buffer.from([0x1D,0x76,0x30,0x00]);
    const widthL = bytesPerLine%256; const widthH = bytesPerLine>>8;
    const heightL = height%256; const heightH = height>>8;
    const header = Buffer.concat([GSv0, Buffer.from([widthL,widthH,heightL,heightH])]);
    // In
    const client = new net.Socket();
    client.connect(port, printer_ip, ()=>{
      const cmd = Buffer.concat([Buffer.from([0x1B,0x40]), header, bitmap, Buffer.from([0x0A,0x0A,0x1D,0x56,0x00])]);
      client.write(cmd);
      client.end();
    });
    client.on('close', ()=>{
      res.json({ success:true, file: filename, width, height });
    });
    client.on('error', (e)=>{
      res.status(500).json({success:false, error:e.message});
    });
  } catch(e) {
    res.status(500).json({success:false,error:e.message});
  }
});

// Xuất file output/static qua HTTP
app.use('/output', express.static(OUTPUT_DIR));

const PORT = 9978;
app.listen(PORT, ()=>{
  console.log(`ESC/POS printer server (RAW only) running at http://localhost:${PORT}`);
  console.log('/upload-image: upload PNG base64, /print-raster: in ESC/POS trực tiếp, /output: thư mục ảnh');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  // The express server is not directly managed by this process,
  // so we only close the net.Socket connections if they were created here.
  // For the express server, it will exit when the process is killed.
  process.exit(0);
});
