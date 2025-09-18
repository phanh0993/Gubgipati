const axios = require('axios');

async function testPayrollEndpoint() {
  console.log('🔍 Testing Payroll Endpoint on Vercel...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3MzUzNTM5NzZ9.KBVWyXbGUdCKDPpfOFc0QyuEiAY3Vp6eRfUCYgLz-zs';
  
  try {
    console.log('📡 Making request to: https://julyspa.vercel.app/api/payroll-test?employee_id=1&month=2025-01');
    
    const response = await axios.get('https://julyspa.vercel.app/api/payroll-test?employee_id=1&month=2025-01', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if data structure is valid
    const data = response.data;
    if (data && data.employee && typeof data.baseSalary === 'number') {
      console.log('✅ Data structure is VALID!');
    } else {
      console.log('❌ Data structure is INVALID!');
      console.log('Missing fields:', {
        hasEmployee: !!data?.employee,
        hasBaseSalary: typeof data?.baseSalary === 'number',
        hasTotalCommission: typeof data?.totalCommission === 'number',
        hasTotalSalary: typeof data?.totalSalary === 'number',
        hasInvoices: Array.isArray(data?.invoices)
      });
    }
    
  } catch (error) {
    console.error('❌ Request failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testPayrollEndpoint().catch(console.error);
