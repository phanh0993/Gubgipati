// Test login API trực tiếp
const fetch = require('node-fetch');

async function testLogin() {
  console.log('\n🧪 Testing login API...\n');
  
  try {
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Login thành công!');
      console.log('   Token:', data.token);
      console.log('   User:', data.user);
    } else {
      console.log('\n❌ Login thất bại!');
      console.log('   Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

testLogin();

