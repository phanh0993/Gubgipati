const axios = require('axios');

async function testVercelAPI() {
  console.log('🚀 Testing Vercel API endpoints...\n');
  
  // Test 1: Health check
  try {
    console.log('1. Testing /api/debug...');
    const debugResponse = await axios.get('https://julyspa-jfob.vercel.app/api/debug');
    console.log('✅ Debug response:', debugResponse.data);
  } catch (error) {
    console.log('❌ Debug error:', error.response?.data || error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Login API
  try {
    console.log('2. Testing /api/auth/login...');
    const loginResponse = await axios.post('https://julyspa-jfob.vercel.app/api/auth/login', {
      username: 'Ly09',
      password: '0333109514'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Login success:', loginResponse.data);
  } catch (error) {
    console.log('❌ Login error status:', error.response?.status);
    console.log('❌ Login error data:', error.response?.data);
    console.log('❌ Login error message:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Wrong password
  try {
    console.log('3. Testing wrong password...');
    const wrongResponse = await axios.post('https://julyspa-jfob.vercel.app/api/auth/login', {
      username: 'Ly09',
      password: 'wrongpassword'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ This should not succeed:', wrongResponse.data);
  } catch (error) {
    console.log('✅ Wrong password correctly rejected:', error.response?.status, error.response?.data);
  }
}

testVercelAPI();
