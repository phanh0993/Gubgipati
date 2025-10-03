const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const app = express();
const PORT = 9977;

// Middleware
app.use(cors());
app.use(express.json());

// Utility functions
const sendJSON = (res, status, data) => {
  res.status(status).json(data);
};

// Quét máy in từ Windows
app.post('/printers/scan', async (req, res) => {
  try {
    console.log('🔍 Scanning Windows printers...');
    
    // Sử dụng PowerShell để lấy danh sách máy in
    const { stdout } = await execAsync('powershell "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json"');
    
    const printerList = JSON.parse(stdout);
    
    const printers = printerList.map((printer, index) => ({
      id: `printer_${index}`,
      name: printer.Name,
      driver: printer.DriverName,
      port: printer.PortName,
      status: printer.PrinterStatus === 'Normal' ? 'ready' : 'error'
    }));
    
    console.log(`✅ Found ${printers.length} Windows printers`);
    sendJSON(res, 200, { printers });
    
  } catch (scanError) {
    console.error('❌ Error scanning Windows printers:', scanError);
    sendJSON(res, 500, { 
      error: 'Failed to scan printers', 
      details: scanError.message 
    });
  }
});

// Test in máy in
app.post('/printers/test', async (req, res) => {
  try {
    const { printer_name, content } = req.body;
    
    console.log('Test print request:', { printer_name, content });
    
    if (!printer_name || !content) {
      return sendJSON(res, 400, { error: 'Missing printer_name or content' });
    }
    
    console.log(`🖨️ Testing print to: ${printer_name}`);
    
    // Kiểm tra máy in có tồn tại không
    try {
      const checkCommand = `powershell "Get-Printer -Name '${printer_name}' -ErrorAction Stop"`;
      await execAsync(checkCommand);
      console.log(`✅ Printer ${printer_name} exists`);
    } catch (checkError) {
      console.error(`❌ Printer ${printer_name} not found:`, checkError.message);
      return sendJSON(res, 404, { 
        error: `Printer '${printer_name}' not found`,
        details: checkError.message
      });
    }
    
    // Tạo file tạm trong thư mục temp của Windows với UTF-8 BOM
    const tempDir = require('os').tmpdir();
    const tempFile = path.join(tempDir, `test_print_${Date.now()}.txt`);
    
    // Ghi file với UTF-8 BOM để đảm bảo encoding đúng
    const BOM = '\uFEFF';
    fs.writeFileSync(tempFile, BOM + content, 'utf8');
    
    console.log(`📄 Created temp file: ${tempFile}`);
    
    // In file tạm với settings tối ưu cho POS-80C
    const printCommand = `powershell "Get-Content '${tempFile}' -Encoding UTF8 -Width 32 | Out-Printer -Name '${printer_name}'"`;
    
    await execAsync(printCommand);
    
    // Xóa file tạm
    fs.unlinkSync(tempFile);
    console.log(`🗑️ Deleted temp file: ${tempFile}`);
    
    console.log(`✅ Test print successful to ${printer_name}`);
    sendJSON(res, 200, { 
      message: `Printed to ${printer_name}`, 
      success: true 
    });
    
  } catch (printError) {
    console.error(`❌ Test print failed: ${printError.message}`);
    sendJSON(res, 500, { 
      error: `Print failed: ${printError.message}`,
      details: printError.message
    });
  }
});

// In order cho bếp
app.post('/print/kitchen', async (req, res) => {
  try {
    const { order, items, printer_name, template_content } = req.body;
    
    if (!printer_name || !order || !items) {
      return sendJSON(res, 400, { error: 'Missing required fields' });
    }
    
    console.log(`🍳 Printing kitchen order to: ${printer_name}`);
    
    // Check máy in settings trước khi in
    try {
      console.log('🔍 Checking printer settings...');
      const printerSettings = await execAsync(`powershell "Get-Printer -Name '${printer_name}' | Select-Object Name, DriverName, PrinterStatus | ConvertTo-Json"`);
      console.log('📋 Current printer settings:', printerSettings.stdout);
      
      // Check paper settings
      const paperSettings = await execAsync(`powershell "Get-WmiObject -Class Win32_Printer -Filter \"Name='${printer_name}'\" | Select-Object DefaultPaperSize"`);
      console.log('📋 Current paper settings:', paperSettings.stdout);
    } catch (checkError) {
      console.log('⚠️ Could not check printer settings:', checkError.message);
    }
    
    // Sử dụng template nếu có, nếu không thì dùng template mặc định
    let content;
    if (template_content) {
      content = template_content;
    } else {
      // Template mặc định cho POS-80C (32 ký tự/đường)
      content = `BEP - DON HANG
================================
So the: ${order.card_number || order.id}
${new Date().toLocaleString('vi-VN')} - Bep

(Ban) ${order.table_name || order.table_id}
Nhan vien: ${order.staff_name || 'Nhan vien'}
* Ghi chu: ${order.notes || ''}

================================
Mat hang          D.vi SL
================================
`;
      
      items.forEach(item => {
        const itemName = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name;
        const quantity = `x${item.quantity}`.padStart(4);
        const price = item.price && item.price > 0 ? `${item.price.toLocaleString('vi-VN')}d` : '0d';
        const priceFormatted = price.padStart(8);
        
        content += `${itemName.padEnd(20)} ${quantity} ${priceFormatted}\n`;
        
        if (item.special_instructions) {
          content += `  Ghi chu: ${item.special_instructions}\n`;
        }
        content += `\n`;
      });
      
      content += `================================\n`;
    }
    
    // Thêm dòng trống để sát lên trên
    content = `\n\n${content}\n\n\n`;
    
    // Log nội dung để debug
    console.log('📄 Kitchen print content:');
    console.log(content);
    
    // Tạo file tạm và in với encoding UTF-8 và settings cho POS-80C
    const tempDir = require('os').tmpdir();
    const tempFile = path.join(tempDir, `kitchen_order_${Date.now()}.txt`);
    
    // Thử các cách khác nhau để fix width và font size
    try {
      // Tăng font size bằng cách sử dụng text formatting
      // Thêm ANSI escape codes để in đậm và tăng kích thước
      const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '\x1b[1m$1\x1b[0m')  // Bold
        .replace(/##(.*?)##/g, '\x1b[1m\x1b[3m$1\x1b[0m')  // Bold + Large
        .replace(/\*(.*?)\*/g, '\x1b[3m$1\x1b[0m');   // Italic
      
      // UTF-8 BOM với formatted content
      const BOM = '\uFEFF';
      fs.writeFileSync(tempFile, BOM + formattedContent, 'utf8');
      console.log('📄 Written with UTF-8 BOM + Formatting');
    } catch (error) {
      // Fallback: UTF-8 BOM thuần
      const BOM = '\uFEFF';
      fs.writeFileSync(tempFile, BOM + content, 'utf8');
      console.log('📄 Written with UTF-8 BOM only');
    }
    
    // Thử nhiều cách để fix width cho POS-80C (từ 11 ký tự → 32 ký tự)
    try {
      // Cách 1: PowerShell với Width 80 (cho 80mm máy in)
      console.log('🖨️ Method 1: Width 80 (80mm)...');
      const printCommand = `powershell "Get-Content '${tempFile}' -Encoding UTF8 -Width 80 | Out-Printer -Name '${printer_name}'"`;
      await execAsync(printCommand);
      console.log('✅ Method 1 successful (Width 80)');
    } catch (error) {
      console.log('❌ Method 1 failed:', error.message);
      try {
        // Cách 2: PowerShell với Width 64 (kích thước lớn hơn)
        console.log('🖨️ Method 2: Width 64 (larger)...');
        const printCommand2 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 -Width 64 | Out-Printer -Name '${printer_name}'"`;
        await execAsync(printCommand2);
        console.log('✅ Method 2 successful (Width 64)');
      } catch (error2) {
        console.log('❌ Method 2 failed:', error2.message);
        try {
          // Cách 3: PowerShell không có Width (let printer decide)
          console.log('🖨️ Method 3: No width limit...');
          const printCommand3 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Out-Printer -Name '${printer_name}'"`;
          await execAsync(printCommand3);
          console.log('✅ Method 3 successful (No width)');
        } catch (error3) {
          console.log('❌ Method 3 failed:', error3.message);
          try {
            // Cách 4: Set paper size trước khi in
            console.log('🖨️ Method 4: Set printer paper size...');
            // Set máy in về paper size 80mm trước
            await execAsync(`powershell "Get-Printer -Name '${printer_name}' | Set-Printer -PrinterSettings 'PaperSize=Custom,Width=3200,Height=1000'"`);
            const printCommand4 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Out-Printer -Name '${printer_name}'"`;
            await execAsync(printCommand4);
            console.log('✅ Method 4 successful (Paper size set)');
          } catch (error4) {
            console.log('❌ Method 4 failed:', error4.message);
            try {
              // Cách 5: Raw text printing - bypass tất cả formatting
              console.log('🖨️ Method 5: Raw text printing...');
              // Xóa tất cả formatting characters
              const rawContent = content.replace(/[\x1b\[\]0-9;]+m/g, '');
              
              // Ghi lại file với raw content
              const rawTempFile = path.join(tempDir, `raw_${Date.now()}.txt`);
              fs.writeFileSync(rawTempFile, rawContent, 'utf8');
              
              // In với method đơn giản nhất
              const printCommand5 = `powershell "type '${rawTempFile}' | Out-Printer -Name '${printer_name}'"`;
              await execAsync(printCommand5);
              
              // Cleanup
              fs.unlinkSync(rawTempFile);
              console.log('✅ Method 5 successful (Raw text)');
            } catch (error5) {
              console.log('❌ Method 5 failed:', error5.message);
              throw error5;
            }
          }
        }
      }
    }
    
    // Xóa file tạm
    fs.unlinkSync(tempFile);
    
    console.log(`✅ Kitchen order printed to ${printer_name}`);
    sendJSON(res, 200, { 
      message: `Kitchen order printed to ${printer_name}`, 
      success: true 
    });
    
  } catch (error) {
    console.error(`❌ Kitchen print failed: ${error.message}`);
    sendJSON(res, 500, { 
      error: `Kitchen print failed: ${error.message}` 
    });
  }
});

// In hóa đơn
app.post('/print/invoice', async (req, res) => {
  try {
    const { order, items, printer_name } = req.body;
    
    if (!printer_name || !order || !items) {
      return sendJSON(res, 400, { error: 'Missing required fields' });
    }
    
    console.log(`🧾 Printing invoice to: ${printer_name}`);
    
    // Tạo nội dung in hóa đơn
    let content = `\n`;
    content += `        HÓA ĐƠN THANH TOÁN\n`;
    content += `================================\n`;
    content += `Đơn: ${order.order_number || order.id}\n`;
    content += `Bàn: ${order.table_name || order.table_id}\n`;
    content += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;
    content += `--------------------------------\n`;
    
    let total = 0;
    items.forEach(item => {
      const itemTotal = parseFloat(item.total_price) || (item.price * item.quantity);
      content += `${item.name} x${item.quantity}\n`;
      if (item.special_instructions) {
        content += `  Ghi chú: ${item.special_instructions}\n`;
      }
      content += `${itemTotal.toLocaleString('vi-VN')}đ\n\n`;
      total += itemTotal;
    });
    
    content += `--------------------------------\n`;
    content += `TỔNG CỘNG: ${total.toLocaleString('vi-VN')}đ\n`;
    content += `================================\n`;
    content += `    Cảm ơn quý khách!\n`;
    content += `\n\n\n`;
    
    // Tạo file tạm và in với encoding UTF-8 và settings cho POS-80C
    const tempDir = require('os').tmpdir();
    const tempFile = path.join(tempDir, `invoice_${Date.now()}.txt`);
    
    // Ghi file với UTF-8 BOM để đảm bảo encoding đúng
    const BOM = '\uFEFF';
    fs.writeFileSync(tempFile, BOM + content, 'utf8');
    
    // Sử dụng PowerShell với settings tối ưu cho POS-80C
    const printCommand = `powershell "Get-Content '${tempFile}' -Encoding UTF8 -Width 32 | Out-Printer -Name '${printer_name}'"`;
    await execAsync(printCommand);
    
    // Xóa file tạm
    fs.unlinkSync(tempFile);
    
    console.log(`✅ Invoice printed to ${printer_name}`);
    sendJSON(res, 200, { 
      message: `Invoice printed to ${printer_name}`, 
      success: true 
    });
    
  } catch (error) {
    console.error(`❌ Invoice print failed: ${error.message}`);
    sendJSON(res, 500, { 
      error: `Invoice print failed: ${error.message}` 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  sendJSON(res, 200, { 
    status: 'OK', 
    message: 'Windows Printer Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  sendJSON(res, 200, {
    message: 'Windows Printer Server',
    version: '1.0.0',
    endpoints: {
      'POST /printers/scan': 'Quét máy in Windows',
      'POST /printers/test': 'Test in máy in',
      'POST /print/kitchen': 'In order cho bếp',
      'POST /print/invoice': 'In hóa đơn',
      'GET /health': 'Health check'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  sendJSON(res, 500, { 
    error: 'Internal server error',
    details: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Windows Printer Server started');
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log('🖨️ Ready to handle printer requests');
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /printers/scan - Quét máy in Windows');
  console.log('  POST /printers/test - Test in máy in');
  console.log('  POST /print/kitchen - In order cho bếp');
  console.log('  POST /print/invoice - In hóa đơn');
  console.log('  GET /health - Health check');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Windows Printer Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Windows Printer Server...');
  process.exit(0);
});
