const { Pool } = require('pg');

// Test với mật khẩu hiện tại
const pool1 = new Pool({
  connectionString: 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

// Test với mật khẩu không encode
const pool2 = new Pool({
  connectionString: 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function testConnections() {
  console.log('🔍 Testing database connections...\n');
  
  // Test 1: Với %40 (encoded @)
  try {
    console.log('Test 1: Với mật khẩu encode %40');
    const result1 = await pool1.query('SELECT NOW()');
    console.log('✅ SUCCESS - Encoded password works!');
    console.log('Time:', result1.rows[0].now);
  } catch (error) {
    console.log('❌ FAILED - Encoded password error:');
    console.log('Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Với @ (không encode)
  try {
    console.log('Test 2: Với mật khẩu không encode @');
    const result2 = await pool2.query('SELECT NOW()');
    console.log('✅ SUCCESS - Non-encoded password works!');
    console.log('Time:', result2.rows[0].now);
  } catch (error) {
    console.log('❌ FAILED - Non-encoded password error:');
    console.log('Error:', error.message);
  }
  
  // Test 3: Check users table
  try {
    console.log('\n--- Testing users table ---');
    const result3 = await pool1.query('SELECT username, created_at FROM users LIMIT 5');
    console.log('✅ Users found:', result3.rows.length);
    console.log('Users:', result3.rows);
  } catch (error) {
    console.log('❌ Users table error:', error.message);
  }
  
  await pool1.end();
  await pool2.end();
}

testConnections().catch(console.error);
