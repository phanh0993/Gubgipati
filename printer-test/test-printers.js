const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Danh sách máy in mới để test
const printers = [
  {
    name: 'BEP NONG',
    connection_type: 'ip',
    ip_address: '192.168.1.235',
    port_number: 9100,
    location: 'Bếp nóng',
    status: 'active'
  },
  {
    name: 'BEP THIT',
    connection_type: 'ip',
    ip_address: '192.168.1.236',
    port_number: 9100,
    location: 'Bếp thịt',
    status: 'active'
  },
  {
    name: 'QUAY BARR',
    connection_type: 'ip',
    ip_address: '192.168.1.234', // Đã đổi từ 192.168.2.234
    port_number: 9100,
    location: 'Quầy Bar',
    status: 'active'
  }
];

// Test kết nối tới máy in
const net = require('net');

async function testPrinterConnection(printer) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(5000); // 5 giây timeout
    
    client.connect(printer.port_number, printer.ip_address, () => {
      console.log(`✅ ${printer.name} (${printer.location}): Kết nối thành công tới ${printer.ip_address}:${printer.port_number}`);
      client.destroy();
      resolve({ success: true, printer: printer.name });
    });
    
    client.on('error', (err) => {
      console.log(`❌ ${printer.name} (${printer.location}): Không thể kết nối tới ${printer.ip_address}:${printer.port_number}`);
      console.log(`   Lỗi: ${err.message}`);
      resolve({ success: false, printer: printer.name, error: err.message });
    });
    
    client.on('timeout', () => {
      console.log(`⏱️  ${printer.name} (${printer.location}): Timeout khi kết nối tới ${printer.ip_address}:${printer.port_number}`);
      client.destroy();
      resolve({ success: false, printer: printer.name, error: 'Timeout' });
    });
  });
}

async function testAllPrinters() {
  console.log('🧪 Bắt đầu test kết nối máy in...\n');
  console.log('═══════════════════════════════════════\n');
  
  const results = [];
  
  for (const printer of printers) {
    const result = await testPrinterConnection(printer);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Đợi 0.5s giữa các test
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 KẾT QUẢ TEST:\n');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Thành công: ${successCount}/${printers.length}`);
  console.log(`❌ Thất bại: ${failCount}/${printers.length}\n`);
  
  if (failCount > 0) {
    console.log('⚠️  Các máy in không kết nối được:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.printer}: ${r.error}`);
    });
    console.log('\n💡 Kiểm tra:');
    console.log('   1. Máy in đã được bật chưa?');
    console.log('   2. IP address đã đúng chưa?');
    console.log('   3. Máy in và PC có cùng mạng không?');
    console.log('   4. Firewall có chặn port 9100 không?');
  }
  
  console.log('\n═══════════════════════════════════════');
}

// Lấy danh sách máy in từ database
async function getPrintersFromDatabase() {
  console.log('📋 Lấy danh sách máy in từ database...\n');
  
  try {
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('status', 'active')
      .order('id');
    
    if (error) {
      console.error('❌ Lỗi lấy danh sách máy in:', error.message);
      return [];
    }
    
    console.log(`✅ Tìm thấy ${data.length} máy in trong database:\n`);
    data.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name}`);
      console.log(`   - Vị trí: ${p.location || 'N/A'}`);
      console.log(`   - Loại: ${p.connection_type.toUpperCase()}`);
      if (p.connection_type === 'ip') {
        console.log(`   - IP: ${p.ip_address}:${p.port_number}`);
      } else {
        console.log(`   - USB Port: ${p.usb_port}`);
      }
      console.log(`   - Trạng thái: ${p.status}`);
      console.log('');
    });
    
    return data || [];
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    return [];
  }
}

// Main function
async function main() {
  console.log('🚀 PRINTER TEST TOOL\n');
  console.log('═══════════════════════════════════════\n');
  
  // Lấy danh sách từ database
  const dbPrinters = await getPrintersFromDatabase();
  
  console.log('\n═══════════════════════════════════════\n');
  
  // Test kết nối với danh sách máy in mới
  await testAllPrinters();
  
  console.log('\n💡 Lưu ý:');
  console.log('   - Máy in phải được bật và kết nối mạng');
  console.log('   - IP address phải đúng và có thể ping được');
  console.log('   - Port 9100 phải mở (raw printing port)');
  console.log('   - PC và máy in phải cùng mạng LAN');
}

// Chạy test
main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

