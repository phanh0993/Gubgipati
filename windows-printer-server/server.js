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
    
    if (!printer_name || !content) {
      return sendJSON(res, 400, { error: 'Missing printer_name or content' });
    }
    
    console.log(`🖨️ Testing print to: ${printer_name}`);
    
    // Tạo file tạm
    const tempFile = path.join(__dirname, `test_print_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content, 'utf8');
    
    // In file tạm
    const printCommand = `powershell "Get-Content '${tempFile}' | Out-Printer -Name '${printer_name}'"`;
    
    await execAsync(printCommand);
    
    // Xóa file tạm
    fs.unlinkSync(tempFile);
    
    console.log(`✅ Test print successful to ${printer_name}`);
    sendJSON(res, 200, { 
      message: `Printed to ${printer_name}`, 
      success: true 
    });
    
  } catch (printError) {
    console.error(`❌ Test print failed: ${printError.message}`);
    sendJSON(res, 500, { 
      error: `Print failed: ${printError.message}` 
    });
  }
});

// In order cho bếp
app.post('/print/kitchen', async (req, res) => {
  try {
    const { order, items, printer_name } = req.body;
    
    if (!printer_name || !order || !items) {
      return sendJSON(res, 400, { error: 'Missing required fields' });
    }
    
    console.log(`🍳 Printing kitchen order to: ${printer_name}`);
    
    // Tạo nội dung in cho bếp
    let content = `\n`;
    content += `================================\n`;
    content += `    BẾP - ĐƠN HÀNG\n`;
    content += `================================\n`;
    content += `Đơn: ${order.order_number || order.id}\n`;
    content += `Bàn: ${order.table_name || order.table_id}\n`;
    content += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;
    content += `--------------------------------\n`;
    
    items.forEach(item => {
      content += `${item.name} x${item.quantity}\n`;
      if (item.special_instructions) {
        content += `  Ghi chú: ${item.special_instructions}\n`;
      }
      content += `\n`;
    });
    
    content += `================================\n`;
    content += `\n\n\n`; // Tách trang cho máy in nhiệt
    
    // Tạo file tạm và in
    const tempFile = path.join(__dirname, `kitchen_order_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content, 'utf8');
    
    const printCommand = `powershell "Get-Content '${tempFile}' | Out-Printer -Name '${printer_name}'"`;
    await execAsync(printCommand);
    
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
    
    // Tạo file tạm và in
    const tempFile = path.join(__dirname, `invoice_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content, 'utf8');
    
    const printCommand = `powershell "Get-Content '${tempFile}' | Out-Printer -Name '${printer_name}'"`;
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
