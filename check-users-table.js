const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function checkUsersTable() {
  try {
    // Kiểm tra cấu trúc bảng users
    console.log('🔍 Checking users table structure...\n');
    
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Lấy dữ liệu user
    console.log('\n👤 User data:');
    const userData = await pool.query('SELECT * FROM users WHERE username = $1', ['Ly09']);
    
    if (userData.rows.length > 0) {
      const user = userData.rows[0];
      console.log('User found:', JSON.stringify(user, null, 2));
      
      // Kiểm tra password field
      const passwordField = user.password || user.password_hash || user.pwd || user.pass;
      if (passwordField) {
        console.log('\n🔐 Password field value:', passwordField);
        console.log('🔍 Starts with $2 (bcrypt):', passwordField.startsWith('$2'));
        console.log('📏 Length:', passwordField.length);
      } else {
        console.log('❌ No password field found!');
      }
    } else {
      console.log('❌ User Ly09 not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
