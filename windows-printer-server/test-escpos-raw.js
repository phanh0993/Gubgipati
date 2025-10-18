// Test ESC/POS RAW printing - Direct TCP 9100 connection
const net = require('net');
const fs = require('fs');

// Test ESC/POS commands
const ESCPOS_COMMANDS = {
  // Initialize printer
  INIT: Buffer.from([0x1B, 0x40]), // ESC @
  
  // Set left margin to 0
  SET_LEFT_MARGIN: Buffer.from([0x1B, 0x6C, 0x00, 0x00]), // ESC l 0 0
  
  // Text commands
  LINE_FEED: Buffer.from([0x0A]), // LF
  CUT_PAPER: Buffer.from([0x1D, 0x56, 0x00]), // GS V 0
  
  // Bit image commands
  BIT_IMAGE_MODE: Buffer.from([0x1B, 0x2A]), // ESC *
  RASTER_IMAGE: Buffer.from([0x1D, 0x76, 0x30, 0x00]), // GS v 0
};

// Create simple test image (576x100 pixels, black bars)
function createTestImage() {
  const width = 576; // 80mm width
  const height = 100;
  const bytesPerLine = Math.ceil(width / 8);
  const imageData = [];
  
  for (let y = 0; y < height; y++) {
    const line = [];
    for (let x = 0; x < bytesPerLine; x++) {
      // Create black bars pattern
      if (y % 20 < 10) {
        line.push(0xFF); // Full black line
      } else {
        line.push(0x00); // White line
      }
    }
    imageData.push(...line);
  }
  
  return Buffer.from(imageData);
}

// Test ESC/POS text printing
function testEscPosText(printerIp, port = 9100) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing ESC/POS Text to ${printerIp}:${port}`);
    
    const client = new net.Socket();
    const timeout = 5000;
    
    client.setTimeout(timeout);
    
    client.connect(port, printerIp, () => {
      console.log('✅ Connected to printer');
      
      try {
        // Build ESC/POS command sequence
        let command = Buffer.concat([
          ESCPOS_COMMANDS.INIT,           // Initialize
          ESCPOS_COMMANDS.SET_LEFT_MARGIN, // Set left margin to 0
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
          ESCPOS_COMMANDS.CUT_PAPER       // Cut paper
        ]);
        
        console.log('📤 Sending ESC/POS text command...');
        console.log('📋 Command length:', command.length, 'bytes');
        console.log('📋 First 20 bytes:', command.slice(0, 20).toString('hex'));
        
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
    
    client.on('close', () => {
      console.log('🔌 Connection closed');
    });
  });
}

// Test ESC/POS raster image printing
function testEscPosRaster(printerIp, port = 9100) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing ESC/POS Raster to ${printerIp}:${port}`);
    
    const client = new net.Socket();
    const timeout = 10000;
    
    client.setTimeout(timeout);
    
    client.connect(port, printerIp, () => {
      console.log('✅ Connected to printer for raster test');
      
      try {
        const testImage = createTestImage();
        
        // Build raster command
        const width = 576;
        const height = 100;
        const bytesPerLine = Math.ceil(width / 8);
        
        let command = Buffer.concat([
          ESCPOS_COMMANDS.INIT,           // Initialize
          ESCPOS_COMMANDS.SET_LEFT_MARGIN, // Set left margin to 0
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
          ESCPOS_COMMANDS.CUT_PAPER       // Cut paper
        ]);
        
        console.log('📤 Sending ESC/POS raster command...');
        console.log('📋 Command length:', command.length, 'bytes');
        console.log('📋 Image size:', testImage.length, 'bytes');
        console.log('📋 Image dimensions:', width, 'x', height);
        
        client.write(command);
        client.end();
        
        resolve({
          success: true,
          message: 'ESC/POS raster command sent successfully',
          commandLength: command.length,
          imageSize: testImage.length,
          dimensions: `${width}x${height}`
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
    
    client.on('close', () => {
      console.log('🔌 Connection closed');
    });
  });
}

// Main test function
async function runTests() {
  const printerIp = process.argv[2] || '192.168.1.100';
  const port = parseInt(process.argv[3]) || 9100;
  
  console.log('🧪 ESC/POS RAW Test Suite');
  console.log('========================');
  console.log(`📡 Target: ${printerIp}:${port}`);
  console.log('📋 Tests: Text + Raster image');
  console.log('');
  
  try {
    // Test 1: ESC/POS Text
    console.log('🔸 Test 1: ESC/POS Text (No Margins)');
    console.log('------------------------------------');
    const textResult = await testEscPosText(printerIp, port);
    console.log('✅ Text test result:', textResult);
    console.log('');
    
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: ESC/POS Raster
    console.log('🔸 Test 2: ESC/POS Raster (576px width)');
    console.log('----------------------------------------');
    const rasterResult = await testEscPosRaster(printerIp, port);
    console.log('✅ Raster test result:', rasterResult);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📝 Check your printer:');
    console.log('   - Test 1 should print text without left/right margins');
    console.log('   - Test 2 should print black/white bars (576px width)');
    console.log('');
    console.log('💡 If margins are still present, the printer may not support');
    console.log('   ESC/POS margin commands or is using a different protocol.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check printer IP address and port 9100');
    console.log('   2. Ensure printer supports ESC/POS');
    console.log('   3. Check firewall/network connectivity');
    console.log('   4. Try: Test-NetConnection PRINTER_IP -Port 9100');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testEscPosText,
  testEscPosRaster,
  createTestImage,
  ESCPOS_COMMANDS
};
