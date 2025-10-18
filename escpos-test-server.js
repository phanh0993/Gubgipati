// Simple ESC/POS RAW Test - Standalone executable
const net = require('net');
const http = require('http');
const url = require('url');

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

// Simple HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'ESC/POS RAW Test Server is running',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /health',
        'POST /test/text',
        'POST /test/raster'
      ]
    }));
    return;
  }
  
  if (path === '/test/text' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { printer_ip, port = 9100 } = data;
        
        if (!printer_ip) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'printer_ip is required' }));
          return;
        }
        
        console.log(`🖨️ Testing ESC/POS text to ${printer_ip}:${port}`);
        const result = await testEscPosText(printer_ip, port);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'ESC/POS text test completed',
          result,
          timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        console.error('❌ ESC/POS text test error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    });
    return;
  }
  
  if (path === '/test/raster' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { printer_ip, port = 9100 } = data;
        
        if (!printer_ip) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'printer_ip is required' }));
          return;
        }
        
        console.log(`🖨️ Testing ESC/POS raster to ${printer_ip}:${port}`);
        const result = await testEscPosRaster(printer_ip, port);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'ESC/POS raster test completed',
          result,
          timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        console.error('❌ ESC/POS raster test error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    });
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

const PORT = 9978;

server.listen(PORT, () => {
  console.log('🚀 ESC/POS RAW Test Server running on port', PORT);
  console.log('📡 Health check: http://localhost:' + PORT + '/health');
  console.log('🧪 Test endpoints:');
  console.log('   POST http://localhost:' + PORT + '/test/text');
  console.log('   POST http://localhost:' + PORT + '/test/raster');
  console.log('');
  console.log('💡 Usage:');
  console.log('   Test text: curl -X POST http://localhost:' + PORT + '/test/text -H "Content-Type: application/json" -d \'{"printer_ip":"192.168.123.100"}\'');
  console.log('   Test raster: curl -X POST http://localhost:' + PORT + '/test/raster -H "Content-Type: application/json" -d \'{"printer_ip":"192.168.123.100"}\'');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
