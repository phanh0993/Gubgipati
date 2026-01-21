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

// IP mới cho QUAY BARR (cùng subnet với PC và 2 máy in kia)
const NEW_IP = '192.168.1.234'; // Cùng subnet 192.168.1.x
const PRINTER_NAME = 'QUAY BARR';

async function updatePrinterIP() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔧 CẬP NHẬT IP MÁY IN QUAY BARR');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 Thông tin:');
  console.log(`   Máy in: ${PRINTER_NAME}`);
  console.log(`   IP cũ: 192.168.2.234 (subnet 192.168.2.x)`);
  console.log(`   IP mới: ${NEW_IP} (subnet 192.168.1.x)`);
  console.log(`   Lý do: Để cùng subnet với PC và 2 máy in kia\n`);
  
  try {
    // Tìm máy in QUAY BARR
    console.log('🔍 Đang tìm máy in QUAY BARR trong database...');
    const { data: printer, error: findError } = await supabase
      .from('printers')
      .select('*')
      .eq('name', PRINTER_NAME)
      .single();
    
    if (findError || !printer) {
      console.error('❌ Không tìm thấy máy in QUAY BARR trong database!');
      console.error('   Lỗi:', findError?.message);
      process.exit(1);
    }
    
    console.log(`✅ Tìm thấy máy in: ${printer.name}`);
    console.log(`   IP hiện tại: ${printer.ip_address}`);
    console.log(`   Vị trí: ${printer.location}\n`);
    
    // Cập nhật IP
    console.log(`📝 Đang cập nhật IP thành ${NEW_IP}...`);
    const { data: updated, error: updateError } = await supabase
      .from('printers')
      .update({
        ip_address: NEW_IP,
        updated_at: new Date().toISOString()
      })
      .eq('id', printer.id)
      .select();
    
    if (updateError) {
      console.error('❌ Lỗi cập nhật IP:', updateError.message);
      process.exit(1);
    }
    
    console.log('✅ Đã cập nhật IP trong database thành công!\n');
    
    // Hiển thị thông tin sau khi cập nhật
    console.log('📋 Thông tin máy in sau khi cập nhật:');
    console.log(`   Tên: ${updated[0].name}`);
    console.log(`   IP: ${updated[0].ip_address}`);
    console.log(`   Port: ${updated[0].port_number}`);
    console.log(`   Vị trí: ${updated[0].location}`);
    console.log(`   Trạng thái: ${updated[0].status}\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  BƯỚC TIẾP THEO:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('1. Đổi IP trên máy in QUAY BARR:');
    console.log(`   - Vào menu máy in → Network Settings`);
    console.log(`   - Đổi IP từ 192.168.2.234 → ${NEW_IP}`);
    console.log(`   - Subnet Mask: 255.255.255.0`);
    console.log(`   - Gateway: 192.168.1.1 (hoặc gateway của mạng bạn)`);
    console.log(`   - DHCP: Disable (giữ IP tĩnh)\n`);
    console.log('2. Sau khi đổi IP trên máy in, test kết nối:');
    console.log(`   ping ${NEW_IP}\n`);
    console.log('3. Test kết nối máy in:');
    console.log('   cd printer-test');
    console.log('   node check-printer-connection.js\n');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

// Chạy script
updatePrinterIP();















