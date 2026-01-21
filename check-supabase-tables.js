// Kiểm tra các bảng trong Supabase có data không
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('\n🔍 KIỂM TRA CÁC BẢNG TRONG SUPABASE\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const tables = [
    'users',
    'tables',
    'orders',
    'buffet_packages',
    'buffet_package_items',
    'food_items',
    'employees',
    'customers'
  ];
  
  for (const tableName of tables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(3);
      
      if (error) {
        console.log(`❌ Table "${tableName}": LỖI`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        
        if (error.message.includes('permission denied') || error.code === 'PGRST301') {
          console.log(`   ⚠️  RLS (Row Level Security) đang BẬT!`);
          console.log(`   💡 Cần TẮT RLS hoặc tạo policy cho table này\n`);
        }
      } else {
        console.log(`✅ Table "${tableName}": OK`);
        console.log(`   Số dòng: ${count || data?.length || 0}`);
        if (data && data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
        console.log();
      }
    } catch (err) {
      console.log(`❌ Table "${tableName}": EXCEPTION`);
      console.log(`   ${err.message}\n`);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 TÓM TẮT:\n');
  console.log('Nếu thấy lỗi "permission denied" hoặc "PGRST301":');
  console.log('→ Cần vào Supabase Dashboard');
  console.log('→ Table Editor → Chọn table');
  console.log('→ RLS → Disable RLS hoặc Add policy\n');
  console.log('💡 HOẶC chạy SQL này trong SQL Editor:\n');
  console.log(`
-- TẮT RLS cho tất cả các bảng (CHỈ DÙNG CHO DEV/TEST)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE buffet_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE buffet_package_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
  `);
  
  console.log('\n🔐 LƯU Ý: Trên production nên BẬT lại RLS!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

checkTables();

