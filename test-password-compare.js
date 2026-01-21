const bcrypt = require('bcryptjs');

async function testPasswordCompare() {
  const storedHash = '$2a$10$.94H7XZqLgwCGtys80Hl2eNgRM1NQnnHzO9U7Iap3lT4VLMXOWd4.';
  const testPassword = '0333109514';
  
  console.log('🧪 Testing password comparison...');
  console.log('Password:', testPassword);
  console.log('Hash:', storedHash);
  console.log('');
  
  // Test synchronous
  try {
    const syncResult = bcrypt.compareSync(testPassword, storedHash);
    console.log('✅ Sync compare result:', syncResult);
  } catch (error) {
    console.log('❌ Sync compare error:', error.message);
  }
  
  // Test asynchronous
  try {
    const asyncResult = await bcrypt.compare(testPassword, storedHash);
    console.log('✅ Async compare result:', asyncResult);
  } catch (error) {
    console.log('❌ Async compare error:', error.message);
  }
  
  // Test với các password khác
  const wrongPasswords = ['Ly09', 'admin', '123456', '0333109515'];
  
  console.log('\n🔍 Testing wrong passwords:');
  for (const wrongPwd of wrongPasswords) {
    try {
      const result = bcrypt.compareSync(wrongPwd, storedHash);
      console.log(`  ${wrongPwd}: ${result}`);
    } catch (error) {
      console.log(`  ${wrongPwd}: ERROR - ${error.message}`);
    }
  }
}

testPasswordCompare();
