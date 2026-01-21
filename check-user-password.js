const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function checkUserPassword() {
  try {
    // Lấy thông tin user
    const result = await pool.query('SELECT username, password_hash FROM users WHERE username = $1', ['Ly09']);
    
    if (result.rows.length === 0) {
      console.log('❌ User Ly09 not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('👤 User found:', user.username);
    console.log('🔐 Password hash:', user.password_hash);
    console.log('📏 Hash length:', user.password_hash.length);
    console.log('🔍 Hash starts with $2:', user.password_hash.startsWith('$2'));
    
    // Test password comparison
    const testPassword = '0333109514';
    console.log('\n🧪 Testing password:', testPassword);
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log('✅ Password valid:', isValid);
      
      if (!isValid) {
        console.log('\n🔧 Fixing password hash...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [newHash, 'Ly09']);
        console.log('✅ Password hash updated successfully!');
        
        // Test again
        const retest = await bcrypt.compare(testPassword, newHash);
        console.log('✅ New password test:', retest);
      }
    } catch (error) {
      console.log('❌ Password comparison error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserPassword();
