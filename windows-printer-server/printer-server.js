const express = require('express');
const bodyParser = require('body-parser');
const net = require('net');
const { PNG } = require('pngjs');
const fs = require('fs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const SERVER_PORT = 9000;

// Supabase client để lấy danh sách máy in - Sử dụng cấu hình từ .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Lỗi: Thiếu cấu hình Supabase trong file .env');
  console.error('   Cần có: REACT_APP_SUPABASE_URL và REACT_APP_SUPABASE_ANON_KEY');
  console.error('   Lưu ý: File .env phải ở thư mục gốc của project (../.env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Printer Server - Supabase client đã được khởi tạo');
console.log(`   URL: ${supabaseUrl}`);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Cache danh sách máy in
let printersCache = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60000; // 1 phút

// Lấy danh sách máy in từ database
async function getPrinters() {
  const now = Date.now();
  if (printersCache.length > 0 && (now - lastCacheUpdate) < CACHE_DURATION) {
    return printersCache;
  }

  try {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('status', 'active')
      .order('id');

    if (error) {
      console.error('❌ Lỗi lấy danh sách máy in:', error);
      return printersCache.length > 0 ? printersCache : [];
    }

    printersCache = data || [];
    lastCacheUpdate = now;
    console.log(`✅ Đã cập nhật danh sách máy in: ${printersCache.length} máy`);
    return printersCache;
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err);
    return printersCache.length > 0 ? printersCache : [];
  }
}

// Tìm máy in theo tên hoặc location
async function findPrinter(printerName) {
  const printers = await getPrinters();
  
  // Tìm theo tên chính xác
  let printer = printers.find(p => 
    p.name.toLowerCase() === printerName.toLowerCase() ||
    p.location?.toLowerCase() === printerName.toLowerCase()
  );

  // Nếu không tìm thấy, tìm theo tên chứa
  if (!printer) {
    printer = printers.find(p => 
      p.name.toLowerCase().includes(printerName.toLowerCase()) ||
      p.location?.toLowerCase().includes(printerName.toLowerCase())
    );
  }

  return printer;
}

// Chuyển base64 PNG thành buffer
const base64ToBuffer = (base64Str) => {
  const cleaned = base64Str.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(cleaned, 'base64');
};

// Convert PNG buffer sang ESC/POS bitmap raster (GS v 0)
const convertPNGToESCPOS = (pngBuffer) => {
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png.parse(pngBuffer, (err, data) => {
      if (err) return reject(err);
      
      const width = data.width;
      const height = data.height;
      const pixels = data.data;
      
      // Tính số byte mỗi dòng (width / 8, làm tròn lên)
      const bytesPerLine = Math.ceil(width / 8);
      const bitmapData = Buffer.alloc(bytesPerLine * height);
      
      // Chuyển pixel sang đen/trắng, đóng gói thành bitmap
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const brightness = (r + g + b) / 3;
          
          // Nếu tối (< 128) thì đánh dấu bit = 1 (in đen)
          if (brightness < 128) {
            const byteIndex = y * bytesPerLine + Math.floor(x / 8);
            const bitIndex = 7 - (x % 8);
            bitmapData[byteIndex] |= (1 << bitIndex);
          }
        }
      }
      
      // ESC/POS command: GS v 0 (in ảnh raster)
      // Format: 1D 76 30 00 [xL xH yL yH] [bitmap data]
      const header = Buffer.from([
        0x1D, 0x76, 0x30, 0x00,
        bytesPerLine & 0xFF, (bytesPerLine >> 8) & 0xFF,
        height & 0xFF, (height >> 8) & 0xFF
      ]);
      
      // ESC @ (khởi tạo máy in)
      const init = Buffer.from([0x1B, 0x40]);
      
      // Lệnh cắt giấy (GS V)
      const cut = Buffer.from([0x0A, 0x1D, 0x56, 0x00]);
      
      // Ghép lại thành buffer hoàn chỉnh
      const fullCommand = Buffer.concat([init, header, bitmapData, cut]);
      resolve(fullCommand);
    });
  });
};

// In qua IP (TCP)
function printViaIP(escposCommand, ip, port) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(15000);
    
    client.connect(port, ip, () => {
      console.log(`✅ Đã kết nối tới máy in ${ip}:${port}`);
      console.log(`📤 Đang gửi ${escposCommand.length} bytes...`);
      client.write(escposCommand);
      client.end();
    });
    
    client.on('close', () => {
      resolve();
    });
    
    client.on('error', (err) => {
      reject(new Error(`Lỗi kết nối ${ip}:${port}: ${err.message}`));
    });
    
    client.on('timeout', () => {
      client.destroy();
      reject(new Error(`Timeout kết nối ${ip}:${port} (15s)`));
    });
  });
}

// In qua USB (Windows printer port)
function printViaUSB(escposCommand, usbPort) {
  return new Promise((resolve, reject) => {
    // Trên Windows, USB002 thường là Windows printer port
    // Dùng raw printer port để gửi dữ liệu trực tiếp
    const { exec } = require('child_process');
    const path = require('path');
    
    // Tạo file tạm với đường dẫn tuyệt đối
    const tempDir = __dirname;
    const tempFile = path.join(tempDir, `temp_print_${Date.now()}.bin`);
    
    try {
      // Ghi dữ liệu vào file tạm
      fs.writeFileSync(tempFile, escposCommand);
      
      // Copy file tới printer port (Windows)
      // /B = Binary mode để copy dữ liệu nhị phân
      const command = `copy /B "${tempFile}" "${usbPort}"`;
      
      exec(command, { cwd: tempDir }, (error, stdout, stderr) => {
        // Xóa file tạm
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch (e) {
          console.warn('⚠️  Không thể xóa file tạm:', e.message);
        }
        
        if (error) {
          // Kiểm tra nếu lỗi là do máy in không kết nối
          if (error.message.includes('The system cannot find the file specified') || 
              error.message.includes('Access is denied')) {
            reject(new Error(`Không thể kết nối tới máy in USB ${usbPort}. Đảm bảo máy in đã được cài đặt và kết nối.`));
          } else {
            reject(new Error(`Lỗi in qua USB ${usbPort}: ${error.message}`));
          }
        } else {
          console.log(`✅ Đã gửi dữ liệu tới USB port ${usbPort}`);
          resolve();
        }
      });
    } catch (err) {
      // Xóa file tạm nếu có lỗi
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (e) {}
      
      reject(new Error(`Lỗi tạo file tạm: ${err.message}`));
    }
  });
}

// Endpoint chính: nhận ảnh base64, convert, gửi tới máy in
app.post('/print/image', async (req, res) => {
  const startTime = Date.now();
  console.log('\n=== [PRINTER SERVER] Nhận request in bill ===');
  
  try {
    const { image_base64, printer_name, filename, meta } = req.body;
    
    if (!image_base64) {
      console.error('❌ Thiếu image_base64');
      return res.status(400).json({ success: false, message: 'Thiếu image_base64' });
    }
    
    console.log('📄 Thông tin bill:', { printer_name, filename, meta });
    
    // Tìm máy in
    let printer = null;
    if (printer_name) {
      printer = await findPrinter(printer_name);
      if (!printer) {
        console.warn(`⚠️  Không tìm thấy máy in "${printer_name}", dùng máy in mặc định`);
      }
    }
    
    // Nếu không tìm thấy, dùng máy in đầu tiên
    if (!printer) {
      const printers = await getPrinters();
      printer = printers[0];
    }
    
    if (!printer) {
      console.error('❌ Không có máy in nào được cấu hình');
      return res.status(500).json({ 
        success: false, 
        message: 'Không có máy in nào được cấu hình. Vui lòng cập nhật danh sách máy in trong database.' 
      });
    }
    
    console.log(`🖨️  Máy in được chọn: ${printer.name} (${printer.location || 'N/A'})`);
    console.log(`   Loại: ${printer.connection_type}`);
    if (printer.connection_type === 'ip') {
      console.log(`   IP: ${printer.ip_address}:${printer.port_number}`);
    } else if (printer.connection_type === 'usb') {
      console.log(`   USB Port: ${printer.usb_port}`);
    }
    
    // Chuyển base64 về buffer PNG
    const pngBuffer = base64ToBuffer(image_base64);
    console.log(`✅ Đã decode PNG buffer: ${pngBuffer.length} bytes`);
    
    // Lưu file để debug (optional)
    const debugFilename = filename || `${printer.name}_${Date.now()}.png`;
    fs.writeFileSync(debugFilename, pngBuffer);
    console.log(`💾 Đã lưu file debug: ${debugFilename}`);
    
    // Convert PNG sang ESC/POS bitmap
    console.log('🔄 Đang convert PNG sang ESC/POS bitmap...');
    const escposCommand = await convertPNGToESCPOS(pngBuffer);
    console.log(`✅ Convert xong: ${escposCommand.length} bytes ESC/POS command`);
    
    // In theo loại kết nối
    if (printer.connection_type === 'ip') {
      console.log(`🖨️  Kết nối tới máy in IP ${printer.ip_address}:${printer.port_number}...`);
      await printViaIP(escposCommand, printer.ip_address, printer.port_number || 9100);
    } else if (printer.connection_type === 'usb') {
      console.log(`🖨️  Kết nối tới máy in USB ${printer.usb_port}...`);
      await printViaUSB(escposCommand, printer.usb_port);
    } else {
      throw new Error(`Loại kết nối không hỗ trợ: ${printer.connection_type}`);
    }
    
      const elapsed = Date.now() - startTime;
      console.log(`✅ Hoàn tất in bill (${elapsed}ms)`);
    
      res.json({ 
        success: true, 
      message: `Đã in thành công tới ${printer.name} (${printer.location || 'N/A'})`,
      printer: {
        name: printer.name,
        location: printer.location,
        connection_type: printer.connection_type
      },
        elapsed_ms: elapsed
    });
    
  } catch (err) {
    console.error('❌ Lỗi xử lý:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Lỗi không xác định' 
    });
  }
});

// Lấy danh sách máy in
app.get('/printers', async (req, res) => {
  try {
    const printers = await getPrinters();
    res.json({ success: true, printers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'ESC/POS Printer Server',
    endpoints: {
      print: 'POST /print/image',
      printers: 'GET /printers'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Khởi động server
app.listen(SERVER_PORT, async () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   ESC/POS PRINTER SERVER - ĐANG CHẠY     ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`🌐 Server: http://localhost:${SERVER_PORT}`);
  console.log(`📡 Endpoint: POST /print/image`);
  console.log(`📋 Endpoint: GET /printers`);
  console.log(`⏰ Khởi động: ${new Date().toLocaleString('vi-VN')}`);
  
  // Load danh sách máy in khi khởi động
  const printers = await getPrinters();
  console.log(`\n🖨️  Đã tải ${printers.length} máy in:`);
  printers.forEach(p => {
    console.log(`   - ${p.name} (${p.location || 'N/A'}) - ${p.connection_type === 'ip' ? `${p.ip_address}:${p.port_number}` : p.usb_port}`);
  });
  
  console.log('\n✅ Sẵn sàng nhận lệnh in!\n');
});
