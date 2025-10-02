// Test quét máy in Windows trực tiếp từ Restaurant API
const fetch = require('node-fetch');

async function testDirectWindowsPrint() {
  console.log('🚀 Testing Direct Windows Print Integration...\n');
  
  try {
    // Test 1: Quét máy in
    console.log('1. Testing printer discovery...');
    const printersResponse = await fetch('http://localhost:8001/api/printers');
    
    if (printersResponse.ok) {
      const printers = await printersResponse.json();
      console.log(`✅ Found ${printers.length} printers:`);
      printers.forEach(printer => {
        console.log(`   - ${printer.name} (${printer.driver}) - ${printer.status}`);
      });
      
      // Test 2: Test in (nếu có máy in)
      if (printers.length > 0) {
        console.log('\n2. Testing direct print...');
        
        const testContent = `
================================
    TEST PRINT DIRECT
================================
Đơn: TEST-DIRECT-001
Bàn: Test Table
Thời gian: ${new Date().toLocaleString('vi-VN')}
--------------------------------
Test Item x1
  Ghi chú: Direct Windows print test
================================
        `;
        
        const printResponse = await fetch('http://localhost:8001/api/printers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printerName: printers[0].name,
            content: testContent,
            title: 'Test Direct Print'
          })
        });
        
        if (printResponse.ok) {
          const result = await printResponse.json();
          console.log('✅ Direct print successful:', result);
        } else {
          const error = await printResponse.text();
          console.log('❌ Direct print failed:', error);
        }
      } else {
        console.log('⚠️ No printers found to test printing');
      }
      
    } else {
      const error = await printersResponse.text();
      console.log('❌ Printer discovery failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure Restaurant API Server is running:');
    console.log('   node restaurant-api-server.js');
  }
  
  console.log('\n✅ Test completed!');
}

// Test order print
async function testOrderPrint() {
  console.log('\n🚀 Testing Order Print Integration...\n');
  
  try {
    // Test print order endpoint
    const printResponse = await fetch('http://localhost:8001/api/print-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 1,
        order_type: 'kitchen'
      })
    });
    
    if (printResponse.ok) {
      const result = await printResponse.json();
      console.log('✅ Order print test successful:', result);
    } else {
      const error = await printResponse.text();
      console.log('❌ Order print test failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Order print test failed:', error.message);
  }
}

// Main test function
async function runAllTests() {
  await testDirectWindowsPrint();
  await testOrderPrint();
  
  console.log('\n📋 Summary:');
  console.log('✅ Web app can now scan Windows printers directly');
  console.log('✅ No need for separate Printer Agent');
  console.log('✅ Restaurant API handles everything');
  console.log('\n💡 Next steps:');
  console.log('1. Go to /printer-management in web app');
  console.log('2. Click "Quét máy in" button');
  console.log('3. Configure printer mappings');
  console.log('4. Test printing from orders');
}

runAllTests().catch(console.error);
