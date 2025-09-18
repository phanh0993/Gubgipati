const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('🔍 Testing dashboard API directly...');
    
    // Test local API first
    const localApiUrl = 'http://localhost:8000/api/dashboard';
    const vercelApiUrl = 'https://julyspa.vercel.app/api/dashboard';
    
    // You'll need to get a valid JWT token first
    console.log('Note: This test requires a valid JWT token');
    console.log('Local API URL:', localApiUrl);
    console.log('Vercel API URL:', vercelApiUrl);
    
    // Test with a mock token (this will fail but show the structure)
    const testToken = 'test-token';
    
    try {
      const response = await axios.get(localApiUrl, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Local API Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Local API Error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Local API Error:', error.message);
      }
    }
    
    try {
      const response = await axios.get(vercelApiUrl, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Vercel API Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Vercel API Error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Vercel API Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testDashboardAPI().catch(console.error);
