const axios = require('axios');

async function testAPIDirect() {
  try {
    console.log('🔍 Testing API directly...');
    
    // Test customers API
    const customersResponse = await axios.get('http://localhost:5000/api/customers', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MTc1NjM3MzkyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4'
      }
    });
    
    console.log('📊 Customers API Response:');
    console.log('Status:', customersResponse.status);
    console.log('Data structure:', Object.keys(customersResponse.data));
    console.log('Total customers:', customersResponse.data.total);
    console.log('First 3 customers:');
    
    customersResponse.data.customers.slice(0, 3).forEach((customer, index) => {
      console.log(`${index + 1}. ID: ${customer.id}`);
      console.log(`   Name: ${customer.name || 'NULL'}`);
      console.log(`   Fullname: ${customer.fullname || 'NULL'}`);
      console.log(`   Phone: ${customer.phone || 'NULL'}`);
      console.log(`   Gender: ${customer.gender || 'NULL'}`);
      console.log('');
    });
    
    // Test employees API
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MTc1NjM3MzkyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4'
      }
    });
    
    console.log('👥 Employees API Response:');
    console.log('Status:', employeesResponse.status);
    console.log('Data structure:', Object.keys(employeesResponse.data));
    console.log('Total employees:', employeesResponse.data.total);
    console.log('Employees:', employeesResponse.data.employees);
    
  } catch (error) {
    console.error('❌ API Test Error:', error.response?.data || error.message);
  }
}

// Run the test
testAPIDirect().catch(console.error);
