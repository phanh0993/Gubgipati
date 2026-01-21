const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Danh sách máy in mới
const printers = [
  {
    name: 'BEP NONG',
    connection_type: 'ip',
    usb_port: null,
    ip_address: '192.168.1.235',
    port_number: 9100,
    driver_name: 'XP-80C',
    status: 'active',
    location: 'Bếp nóng',
    notes: 'Máy in tại Bếp nóng'
  },
  {
    name: 'BEP THIT',
    connection_type: 'ip',
    usb_port: null,
    ip_address: '192.168.1.236',
    port_number: 9100,
    driver_name: 'XP-80C',
    status: 'active',
    location: 'Bếp thịt',
    notes: 'Máy in tại Bếp thịt'
  },
  {
    name: 'QUAY BARR',
    connection_type: 'ip',
    usb_port: null,
    ip_address: '192.168.2.234',
    port_number: 9100,
    driver_name: 'XP-80C',
    status: 'active',
    location: 'Quầy Bar',
    notes: 'Máy in tại Quầy Bar'
  }
];

async function updatePrinters() {
  console.log('🚀 Bắt đầu cập nhật danh sách máy in...\n');
  
  try {
    // Bước 1: Xóa tất cả máy in cũ
    console.log('🗑️  Đang xóa danh sách máy in cũ...');
    const { data: oldPrinters, error: fetchOldError } = await supabase
      .from('printers')
      .select('id, name');
    
    if (fetchOldError) {
      console.error('❌ Lỗi lấy danh sách máy in cũ:', fetchOldError.message);
    } else {
      console.log(`   Tìm thấy ${oldPrinters.length} máy in cũ`);
      if (oldPrinters.length > 0) {
        for (const oldPrinter of oldPrinters) {
          const { error: deleteError } = await supabase
            .from('printers')
            .delete()
            .eq('id', oldPrinter.id);
          
          if (deleteError) {
            console.error(`   ❌ Lỗi xóa máy in ${oldPrinter.name}:`, deleteError.message);
          } else {
            console.log(`   ✅ Đã xóa: ${oldPrinter.name}`);
          }
        }
      }
    }
    
    console.log('\n📝 Đang thêm máy in mới...\n');
    
    // Bước 2: Thêm máy in mới
    let successCount = 0;
    let errorCount = 0;
    
    for (const printer of printers) {
      console.log(`📝 Đang thêm máy in: ${printer.name}...`);
      
      const { data, error } = await supabase
        .from('printers')
        .insert(printer)
        .select();
      
      if (error) {
        console.error(`   ❌ Lỗi thêm máy in ${printer.name}:`, error.message);
        errorCount++;
      } else {
        console.log(`   ✅ Đã thêm thành công: ${printer.name} (ID: ${data[0].id})`);
        console.log(`      - Vị trí: ${printer.location}`);
        console.log(`      - IP: ${printer.ip_address}:${printer.port_number}`);
        console.log(`      - Trạng thái: ${printer.status}`);
        successCount++;
      }
      console.log('');
    }
    
    // Bước 3: Hiển thị danh sách máy in sau khi cập nhật
    console.log('📋 Danh sách máy in hiện tại:\n');
    const { data: allPrinters, error: fetchError } = await supabase
      .from('printers')
      .select('*')
      .eq('status', 'active')
      .order('id');
    
    if (fetchError) {
      console.error('❌ Lỗi lấy danh sách máy in:', fetchError.message);
    } else {
      console.log(`✅ Tổng cộng: ${allPrinters.length} máy in\n`);
      allPrinters.forEach((p, index) => {
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
    }
    
    console.log('═══════════════════════════════════════');
    console.log(`✅ Thành công: ${successCount} máy in`);
    if (errorCount > 0) {
      console.log(`❌ Lỗi: ${errorCount} máy in`);
    }
    console.log('🎉 Hoàn tất cập nhật danh sách máy in!');
    
  } catch (err) {
    console.error('❌ Lỗi tổng quát:', err);
    process.exit(1);
  }
}

// Chạy script
updatePrinters();















