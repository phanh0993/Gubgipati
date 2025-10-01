// Test script đơn giản để kiểm tra tính năng note

async function testOrderWithNote() {
  console.log('🧪 Test tính năng note trong order...\n');

  try {
    // 1. Tạo order test với note
    console.log('1️⃣ Tạo order test với note...');
    const testOrderData = {
      table_id: 1,
      employee_id: 1,
      order_type: 'dine_in',
      subtotal: 100000,
      tax_amount: 0,
      total_amount: 100000,
      notes: 'Test order với note',
      items: [
        {
          food_item_id: 1,
          name: 'Món test',
          price: 50000,
          quantity: 2,
          total: 100000,
          note: 'Ghi chú test: Ít cay, thêm rau'
        }
      ]
    };

    console.log('📝 Dữ liệu order test:', JSON.stringify(testOrderData, null, 2));

    // Gọi API tạo order
    const response = await fetch('http://localhost:8000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Lỗi khi tạo order:', response.status, errorText);
      return;
    }

    const orderResult = await response.json();
    console.log('✅ Tạo order thành công, ID:', orderResult.id);

    // 2. Kiểm tra API trả về order details
    console.log('\n2️⃣ Kiểm tra API trả về order details...');
    const orderResponse = await fetch(`http://localhost:8000/api/orders/${orderResult.id}`);
    
    if (orderResponse.ok) {
      const orderDetails = await orderResponse.json();
      console.log('📋 Chi tiết order từ API:');
      console.log('   - Order ID:', orderDetails.id);
      console.log('   - Items:');
      if (orderDetails.items && orderDetails.items.length > 0) {
        orderDetails.items.forEach((item, index) => {
          console.log(`     Item ${index + 1}:`);
          console.log(`     - name: ${item.name}`);
          console.log(`     - quantity: ${item.quantity}`);
          console.log(`     - note: "${item.note || 'null'}"`);
          console.log(`     - special_instructions: "${item.special_instructions || 'null'}"`);
        });

        // 3. Kiểm tra kết quả
        console.log('\n3️⃣ Kết quả test:');
        const hasNoteInAPI = orderDetails.items.some(item => item.note === 'Ghi chú test: Ít cay, thêm rau');
        
        console.log(hasNoteInAPI ? '✅ Note được trả về từ API' : '❌ Note không được trả về từ API');

        if (hasNoteInAPI) {
          console.log('\n🎉 Test thành công! Tính năng note hoạt động đúng.');
        } else {
          console.log('\n⚠️  Test có vấn đề. Note không được lưu hoặc trả về.');
        }
      } else {
        console.log('❌ Không có items trong order');
      }
    } else {
      console.log('❌ Không thể lấy chi tiết order:', orderResponse.status);
    }

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
testOrderWithNote();
