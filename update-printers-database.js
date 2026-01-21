const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Danh sách máy in cần cập nhật
const printers = [
  {
    name: 'QUAY BARR',
    connection_type: 'usb',
    usb_port: 'USB002',
    ip_address: null,
    port_number: null,
    driver_name: 'XP-80C',
    status: 'active',
    location: 'Quầy Bar',
    notes: 'Máy in chính có vị trí là Quầy Bar'
  },
  {
    name: 'BEP THIT',
    connection_type: 'ip',
    usb_port: null,
    ip_address: '192.168.1.236',
    port_number: 9100,
    driver_name: 'XP-80C',
    status: 'active',
    location: 'Bếp 1',
    notes: 'Máy in có vị trí là Bếp 1'
  },
  {
    name: 'BEP NONG',
    connection_type: 'ip',
    usb_port: null,
    ip_address: '192.168.1.235',
    port_number: 9100,
    driver_name: 'XP-80C',
    status: 'active',
    location: 'Quầy Bar',
    notes: 'Máy in có vị trí là Quầy Bar'
  }
];

async function updatePrinters() {
  console.log('🚀 Bắt đầu cập nhật danh sách máy in lên database...\n');
  
  try {
    // Xóa tất cả máy in cũ (tùy chọn - có thể comment nếu muốn giữ lại)
    // const { error: deleteError } = await supabase.from('printers').delete().neq('id', 0);
    // if (deleteError) {
    //   console.warn('⚠️  Không thể xóa máy in cũ:', deleteError.message);
    // }
    
    // Cập nhật hoặc thêm mới từng máy in
    for (const printer of printers) {
      console.log(`📝 Đang cập nhật máy in: ${printer.name}...`);
      
      // Kiểm tra xem máy in đã tồn tại chưa
      const { data: existing } = await supabase
        .from('printers')
        .select('id')
        .eq('name', printer.name)
        .single();
      
      if (existing) {
        // Cập nhật máy in đã tồn tại
        const { data, error } = await supabase
          .from('printers')
          .update({
            ...printer,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select();
        
        if (error) {
          console.error(`❌ Lỗi cập nhật máy in ${printer.name}:`, error.message);
        } else {
          console.log(`✅ Đã cập nhật máy in: ${printer.name} (ID: ${existing.id})`);
          console.log(`   - Vị trí: ${printer.location}`);
          console.log(`   - Loại: ${printer.connection_type}`);
          if (printer.connection_type === 'ip') {
            console.log(`   - IP: ${printer.ip_address}:${printer.port_number}`);
          } else {
            console.log(`   - USB Port: ${printer.usb_port}`);
          }
        }
      } else {
        // Thêm máy in mới
        const { data, error } = await supabase
          .from('printers')
          .insert(printer)
          .select();
        
        if (error) {
          console.error(`❌ Lỗi thêm máy in ${printer.name}:`, error.message);
        } else {
          console.log(`✅ Đã thêm máy in mới: ${printer.name} (ID: ${data[0].id})`);
          console.log(`   - Vị trí: ${printer.location}`);
          console.log(`   - Loại: ${printer.connection_type}`);
          if (printer.connection_type === 'ip') {
            console.log(`   - IP: ${printer.ip_address}:${printer.port_number}`);
          } else {
            console.log(`   - USB Port: ${printer.usb_port}`);
          }
        }
      }
      console.log('');
    }
    
    // Lấy danh sách máy in sau khi cập nhật
    console.log('📋 Danh sách máy in hiện tại:');
    const { data: allPrinters, error: fetchError } = await supabase
      .from('printers')
      .select('*')
      .eq('status', 'active')
      .order('id');
    
    if (fetchError) {
      console.error('❌ Lỗi lấy danh sách máy in:', fetchError.message);
    } else {
      console.log(`\n✅ Tổng cộng: ${allPrinters.length} máy in\n`);
      allPrinters.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} (${p.location || 'N/A'})`);
        console.log(`   - Loại: ${p.connection_type}`);
        if (p.connection_type === 'ip') {
          console.log(`   - IP: ${p.ip_address}:${p.port_number}`);
        } else {
          console.log(`   - USB Port: ${p.usb_port}`);
        }
        console.log(`   - Trạng thái: ${p.status}`);
        console.log('');
      });
    }
    
    console.log('🎉 Hoàn tất cập nhật danh sách máy in!');
    
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

// Chạy script
updatePrinters();

