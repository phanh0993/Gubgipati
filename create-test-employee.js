// Tạo nhân viên test để login mobile
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestEmployees() {
  console.log('\n🔧 Tạo nhân viên test cho mobile login...\n');
  
  const testEmployees = [
    {
      username: 'ly',
      fullname: 'Khánh Ly',
      email: 'ly@gubgipati.com',
      phone: '0123456789',
      position: 'Nhân viên',
      employee_code: 'NV001',
      is_active: true
    },
    {
      username: 'nhan',
      fullname: 'Nhân Viên 1',
      email: 'nhan@gubgipati.com',
      phone: '0987654321',
      position: 'Nhân viên',
      employee_code: 'NV002',
      is_active: true
    }
  ];
  
  for (const emp of testEmployees) {
    try {
      // Check exists
      const { data: existing } = await supabase
        .from('employees')
        .select('*')
        .eq('username', emp.username)
        .limit(1);
      
      if (existing && existing.length > 0) {
        console.log(`✅ Employee "${emp.username}" đã tồn tại (ID: ${existing[0].id})`);
        
        // Update để đảm bảo is_active = true
        const { error } = await supabase
          .from('employees')
          .update({ is_active: true, fullname: emp.fullname })
          .eq('username', emp.username);
        
        if (!error) {
          console.log(`   ↳ Đã cập nhật is_active = true`);
        }
        continue;
      }
      
      // Insert new
      const { data, error } = await supabase
        .from('employees')
        .insert([emp])
        .select();
      
      if (error) {
        console.error(`❌ Lỗi tạo "${emp.username}":`, error.message);
      } else {
        console.log(`✅ Đã tạo employee "${emp.username}" (ID: ${data[0].id})`);
      }
    } catch (err) {
      console.error(`❌ Exception:`, err);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ HOÀN TẤT!');
  console.log('\n📱 Thông tin đăng nhập Mobile:');
  console.log('   Username: ly     (Password: để trống)');
  console.log('   Username: nhan   (Password: để trống)');
  console.log('\n🌐 URL Mobile Login:');
  console.log('   http://192.168.0.2:3000/mobile-login');
  console.log('═══════════════════════════════════════════════\n');
}

createTestEmployees();

