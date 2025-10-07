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
    const printCommand = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Out-String -Width 80 | Out-Printer -Name '${printer_name}'"`;
    
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
    
    // Sử dụng Out-String -Width để fix width cho POS-80C
    try {
      // Method 1: Out-String với Width 80 (đúng syntax PowerShell)
      console.log('🖨️ Method 1: Out-String Width 80...');
      const printCommand1 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Out-String -Width 80 | Out-Printer -Name '${printer_name}'"`;
      await execAsync(printCommand1);
      console.log('✅ Method 1 successful (Out-String Width 80)');
    } catch (error) {
      console.log('❌ Method 1 failed:', error.message);
      try {
        // Method 2: Out-String với Width 64  
        console.log('🖨️ Method 2: Out-String Width 64...');
        const printCommand2 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Out-String -Width 64 | Out-Printer -Name '${printer_name}'"`;
        await execAsync(printCommand2);
        console.log('✅ Method 2 successful (Out-String Width 64)');
      } catch (error2) {
        console.log('❌ Method 2 failed:', error2.message);
        try {
          // Method 3: Format-Wide để force width
          console.log('🖨️ Method 3: Format-Wide...');
          const printCommand3 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Format-Wide -Column 4 | Out-Printer -Name '${printer_name}'"`;
          await execAsync(printCommand3);
          console.log('✅ Method 3 successful (Format-Wide)');
        } catch (error3) {
          console.log('❌ Method 3 failed:', error3.message);
          try {
            // Method 4: Set máy in default width bằng registry
            console.log('🖨️ Method 4: Set printer default width...');
            await execAsync(`powershell "reg add 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows' /v DeviceWidth /t REG_DWORD /d 80 /f"`);
            const printCommand4 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Out-Printer -Name '${printer_name}'"`;
            await execAsync(printCommand4);
            console.log('✅ Method 4 successful (Registry width set)');
          } catch (error4) {
            console.log('❌ Method 4 failed:', error4.message);
            try {
              // Method 5: Thay đổi console buffer width
              console.log('🖨️ Method 5: Console buffer width...');
              await execAsync(`powershell "$Host.UI.RawUI.BufferSize = New-Object System.Management.Automation.Host.Size(120, 50)"`);
              const printCommand5 = `powershell "Get-Content '${tempFile}' -Encoding UTF8 | Out-Printer -Name '${printer_name}'"`;
              await execAsync(printCommand5);
              console.log('✅ Method 5 successful (Console buffer)');
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

// In ảnh (PNG/JPG) để tránh bị can thiệp định dạng
app.post('/print/image', async (req, res) => {
  try {
    const { printer_name, image_base64, filename } = req.body || {};
    if (!printer_name || !image_base64) {
      return sendJSON(res, 400, { error: 'Missing printer_name or image_base64' });
    }

    // Lưu ảnh tạm
    const tempDir = require('os').tmpdir();
    const safeName = (filename && String(filename).replace(/[^\w\.-]/g, '')) || `image_${Date.now()}.png`;
    const tempFile = path.join(tempDir, safeName.endsWith('.png') || safeName.endsWith('.jpg') || safeName.endsWith('.jpeg') ? safeName : `${safeName}.png`);

    // image_base64 có thể ở dạng data URL, tách header nếu có
    const base64Data = String(image_base64).includes(',') ? image_base64.split(',')[1] : image_base64;
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(tempFile, buffer);

    console.log(`🖼️ Saved image for printing: ${tempFile}`);

    // In bằng MSPaint (ổn định, hỗ trợ PNG/JPG). Tham số /pt: print to printer
    // Lưu ý: nếu hệ thống không có mspaint trong PATH, gọi full path: %WINDIR%\System32\mspaint.exe
    const mspaint = process.env.WINDIR ? path.join(process.env.WINDIR, 'System32', 'mspaint.exe') : 'mspaint';

    // Cách 1: mspaint /pt "file" "printer"
    try {
      console.log('🖨️ Printing image via mspaint /pt ...');
      await execAsync(`"${mspaint}" /pt "${tempFile}" "${printer_name}"`);
      console.log('✅ Image printed via mspaint');
    } catch (e1) {
      console.log('❌ mspaint method failed, trying PowerShell PrintTo...', e1.message);
      // Cách 2: PowerShell Start-Process -Verb PrintTo
      const psCmd = `powershell "Start-Process -FilePath '${tempFile.replace(/'/g, "''")}' -Verb PrintTo -ArgumentList '${printer_name.replace(/'/g, "''")}' -PassThru | Wait-Process -Timeout 20"`;
      await execAsync(psCmd);
      console.log('✅ Image printed via PowerShell PrintTo');
    }

    // Xóa file tạm
    try { fs.unlinkSync(tempFile); } catch {}
    return sendJSON(res, 200, { success: true, message: 'Image sent to printer' });
  } catch (error) {
    console.error('❌ Print image failed:', error.message);
    return sendJSON(res, 500, { error: 'Print image failed', details: error.message });
  }
});

// In PDF để tránh bị can thiệp định dạng
app.post('/print/pdf', async (req, res) => {
  try {
    const { printer_name, pdf_base64, filename } = req.body || {};
    if (!printer_name || !pdf_base64) {
      return sendJSON(res, 400, { error: 'Missing printer_name or pdf_base64' });
    }

    // Lưu PDF tạm
    const tempDir = require('os').tmpdir();
    const safeName = (filename && String(filename).replace(/[^\w\.-]/g, '')) || `doc_${Date.now()}.pdf`;
    const tempFile = path.join(tempDir, safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);

    const base64Data = String(pdf_base64).includes(',') ? pdf_base64.split(',')[1] : pdf_base64;
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(tempFile, buffer);
    console.log(`📄 Saved PDF for printing: ${tempFile}`);

    // In PDF:
    // Ưu tiên: PowerShell Start-Process -Verb PrintTo (dùng app mặc định của hệ thống cho PDF)
    try {
      console.log('🖨️ Printing PDF via PowerShell PrintTo ...');
      const psCmd = `powershell "Start-Process -FilePath '${tempFile.replace(/'/g, "''")}' -Verb PrintTo -ArgumentList '${printer_name.replace(/'/g, "''")}' -PassThru | Wait-Process -Timeout 30"`;
      await execAsync(psCmd);
      console.log('✅ PDF printed via PowerShell PrintTo');
    } catch (e1) {
      console.log('❌ PowerShell PrintTo failed, trying rundll32...', e1.message);
      // Fallback: sử dụng PrintTo verb qua rundll32 (ít ổn định hơn)
      // Lưu ý: rundll32 cần app liên kết .pdf (Acrobat/Edge) hỗ trợ implicit PrintTo
      const rundll = `rundll32.exe SHELL32.DLL,ShellExec_RunDLL "${tempFile}" /p /h`;
      await execAsync(rundll);
      console.log('✅ PDF printed via rundll32');
    }

    try { fs.unlinkSync(tempFile); } catch {}
    return sendJSON(res, 200, { success: true, message: 'PDF sent to printer' });
  } catch (error) {
    console.error('❌ Print PDF failed:', error.message);
    return sendJSON(res, 500, { error: 'Print PDF failed', details: error.message });
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
