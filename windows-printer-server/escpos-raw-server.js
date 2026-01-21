// ESC/POS RAW Server - HTTP endpoints for testing ESC/POS commands
const express = require('express');
const cors = require('cors');
const net = require('net');
const { testEscPosText, testEscPosRaster } = require('./test-escpos-raw');

const app = express();
const PORT = 9978; // Different port from main server

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ESC/POS RAW Server is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health',
      'POST /test/text',
      'POST /test/raster',
      'GET /test/network/:ip/:port'
    ]
  });
});

// Test network connectivity
app.get('/test/network/:ip/:port', async (req, res) => {
  const { ip, port } = req.params;
  const portNum = parseInt(port) || 9100;
  
  try {
    console.log(`🔍 Testing network connectivity to ${ip}:${portNum}`);
    
    const client = new net.Socket();
    const timeout = 3000;
    
    client.setTimeout(timeout);
    
    client.connect(portNum, ip, () => {
      console.log(`✅ Successfully connected to ${ip}:${portNum}`);
      client.destroy();
      res.json({
        success: true,
        message: `Successfully connected to ${ip}:${portNum}`,
        ip,
        port: portNum,
        timestamp: new Date().toISOString()
      });
    });
    
    client.on('error', (error) => {
      console.error(`❌ Connection error to ${ip}:${portNum}:`, error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        ip,
        port: portNum,
        timestamp: new Date().toISOString()
      });
    });
    
    client.on('timeout', () => {
      console.error(`❌ Connection timeout to ${ip}:${portNum}`);
      client.destroy();
      res.status(500).json({
        success: false,
        error: 'Connection timeout',
        ip,
        port: portNum,
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('❌ Network test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test ESC/POS text printing
app.post('/test/text', async (req, res) => {
  try {
    const { printer_ip, port = 9100 } = req.body;
    
    if (!printer_ip) {
      return res.status(400).json({
        success: false,
        error: 'printer_ip is required'
      });
    }
    
    console.log(`🖨️ Testing ESC/POS text to ${printer_ip}:${port}`);
    
    const result = await testEscPosText(printer_ip, port);
    
    res.json({
      success: true,
      message: 'ESC/POS text test completed',
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ESC/POS text test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test ESC/POS raster printing
app.post('/test/raster', async (req, res) => {
  try {
    const { printer_ip, port = 9100 } = req.body;
    
    if (!printer_ip) {
      return res.status(400).json({
        success: false,
        error: 'printer_ip is required'
      });
    }
    
    console.log(`🖨️ Testing ESC/POS raster to ${printer_ip}:${port}`);
    
    const result = await testEscPosRaster(printer_ip, port);
    
    res.json({
      success: true,
      message: 'ESC/POS raster test completed',
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ESC/POS raster test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ESC/POS RAW Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoints:`);
  console.log(`   POST http://localhost:${PORT}/test/text`);
  console.log(`   POST http://localhost:${PORT}/test/raster`);
  console.log(`   GET  http://localhost:${PORT}/test/network/:ip/:port`);
  console.log('');
  console.log('💡 Usage:');
  console.log('   Test text: curl -X POST http://localhost:9978/test/text -H "Content-Type: application/json" -d \'{"printer_ip":"192.168.1.100"}\'');
  console.log('   Test raster: curl -X POST http://localhost:9978/test/raster -H "Content-Type: application/json" -d \'{"printer_ip":"192.168.1.100"}\'');
});

module.exports = app;
