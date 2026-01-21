const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  console.log('\n🔧 Đang tạo/kiểm tra user admin...\n');
  
  try {
    // 1. Kiểm tra xem user admin đã tồn tại chưa
    console.log('1️⃣ Kiểm tra user admin...');
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    if (checkError) {
      console.error('❌ Lỗi kiểm tra user:', checkError);
      
      // Nếu table không tồn tại, tạo table
      console.log('\n2️⃣ Table users có thể chưa tồn tại, đang tạo...');
      const { error: createTableError } = await supabase.rpc('create_users_table_if_not_exists');
      
      if (createTableError) {
        console.log('⚠️  Không thể tạo table tự động, tạo thủ công...');
      }
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ User admin đã tồn tại:');
      console.log('   - ID:', existingUsers[0].id);
      console.log('   - Username:', existingUsers[0].username);
      console.log('   - Role:', existingUsers[0].role);
      console.log('\n💡 Cập nhật password thành "admin123"...');
      
      // Cập nhật password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: 'admin123', updated_at: new Date().toISOString() })
        .eq('username', 'admin');
      
      if (updateError) {
        console.error('❌ Lỗi cập nhật password:', updateError);
      } else {
        console.log('✅ Đã cập nhật password thành công!');
      }
      
      return;
    }
    
    // 2. Tạo user admin mới
    console.log('\n2️⃣ Tạo user admin mới...');
    const adminUser = {
      username: 'admin',
      password: 'admin123', // Plain text (trong production nên hash)
      email: 'admin@gubgipati.com',
      role: 'admin',
      full_name: 'Administrator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([adminUser])
      .select();
    
    if (insertError) {
      console.error('❌ Lỗi tạo user:', insertError);
      console.log('\n⚠️  Có thể table "users" chưa tồn tại.');
      console.log('📝 Hãy tạo table bằng SQL sau trong Supabase Dashboard:\n');
      console.log(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role VARCHAR(20) DEFAULT 'user',
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin user
INSERT INTO users (username, password, email, role, full_name)
VALUES ('admin', 'admin123', 'admin@gubgipati.com', 'admin', 'Administrator')
ON CONFLICT (username) DO NOTHING;
      `);
      
      return;
    }
    
    console.log('✅ Đã tạo user admin thành công!');
    console.log('   - ID:', newUser[0].id);
    console.log('   - Username:', newUser[0].username);
    console.log('   - Password: admin123');
    console.log('   - Role:', newUser[0].role);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ HOÀN TẤT!');
  console.log('\n🔐 Thông tin đăng nhập:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('\n🌐 Vào: http://localhost:3000');
  console.log('═══════════════════════════════════════════════\n');
}

createAdminUser();

