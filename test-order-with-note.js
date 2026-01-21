// Test script để kiểm tra tính năng note trong order
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderWithNote() {
  console.log('🧪 Bắt đầu test tính năng note trong order...\n');

  try {
    // 1. Kiểm tra cột note đã tồn tại chưa
    console.log('1️⃣ Kiểm tra cấu trúc bảng order_items...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'order_items')
      .eq('table_schema', 'public');

    if (columnError) {
      console.error('❌ Lỗi khi kiểm tra cấu trúc bảng:', columnError);
      return;
    }

    const hasNoteColumn = columns.some(col => col.column_name === 'note');
    console.log(hasNoteColumn ? '✅ Cột note đã tồn tại' : '❌ Cột note chưa tồn tại');
    
    if (!hasNoteColumn) {
      console.log('⚠️  Vui lòng chạy file ADD_NOTE_COLUMN_TO_ORDER_ITEMS.sql trước');
      return;
    }

    // 2. Lấy một bàn và nhân viên để test
    console.log('\n2️⃣ Lấy thông tin bàn và nhân viên...');
    const { data: tables } = await supabase
      .from('tables')
      .select('id, table_name')
      .eq('status', 'available')
      .limit(1);

    const { data: employees } = await supabase
      .from('employees')
      .select('id, fullname')
      .limit(1);

    if (!tables || tables.length === 0) {
      console.log('❌ Không tìm thấy bàn trống');
      return;
    }

    if (!employees || employees.length === 0) {
      console.log('❌ Không tìm thấy nhân viên');
      return;
    }

    console.log(`✅ Sử dụng bàn: ${tables[0].table_name}`);
    console.log(`✅ Sử dụng nhân viên: ${employees[0].fullname}`);

    // 3. Lấy một món ăn để test
    console.log('\n3️⃣ Lấy thông tin món ăn...');
    const { data: foodItems } = await supabase
      .from('food_items')
      .select('id, name, price')
      .eq('is_available', true)
      .limit(1);

    if (!foodItems || foodItems.length === 0) {
      console.log('❌ Không tìm thấy món ăn');
      return;
    }

    console.log(`✅ Sử dụng món: ${foodItems[0].name} - ${foodItems[0].price}đ`);

    // 4. Tạo order test với note
    console.log('\n4️⃣ Tạo order test với note...');
    const testOrderData = {
      table_id: tables[0].id,
      employee_id: employees[0].id,
      order_type: 'dine_in',
      subtotal: foodItems[0].price * 2,
      tax_amount: 0,
      total_amount: foodItems[0].price * 2,
      notes: 'Test order với note',
      items: [
        {
          food_item_id: foodItems[0].id,
          name: foodItems[0].name,
          price: foodItems[0].price,
          quantity: 2,
          total: foodItems[0].price * 2,
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
    console.log('✅ Tạo order thành công:', orderResult.id);

    // 5. Kiểm tra dữ liệu trong database
    console.log('\n5️⃣ Kiểm tra dữ liệu trong bảng order_items...');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderResult.id);

    if (itemsError) {
      console.error('❌ Lỗi khi lấy order_items:', itemsError);
      return;
    }

    console.log('📊 Dữ liệu order_items:');
    orderItems.forEach((item, index) => {
      console.log(`   Item ${index + 1}:`);
      console.log(`   - food_item_id: ${item.food_item_id}`);
      console.log(`   - quantity: ${item.quantity}`);
      console.log(`   - unit_price: ${item.unit_price}`);
      console.log(`   - total_price: ${item.total_price}`);
      console.log(`   - note: "${item.note}"`);
      console.log(`   - special_instructions: "${item.special_instructions}"`);
    });

    // 6. Kiểm tra API trả về
    console.log('\n6️⃣ Kiểm tra API trả về order details...');
    const orderResponse = await fetch(`http://localhost:8000/api/orders/${orderResult.id}`);
    
    if (orderResponse.ok) {
      const orderDetails = await orderResponse.json();
      console.log('📋 Chi tiết order từ API:');
      console.log('   - Order ID:', orderDetails.id);
      console.log('   - Items:');
      orderDetails.items.forEach((item, index) => {
        console.log(`     Item ${index + 1}:`);
        console.log(`     - name: ${item.name}`);
        console.log(`     - quantity: ${item.quantity}`);
        console.log(`     - note: "${item.note}"`);
        console.log(`     - special_instructions: "${item.special_instructions}"`);
      });
    }

    // 7. Test kết quả
    console.log('\n7️⃣ Kết quả test:');
    const hasNoteInDB = orderItems.some(item => item.note === 'Ghi chú test: Ít cay, thêm rau');
    const hasNoteInAPI = orderResponse.ok && (await orderResponse.json()).items.some(item => item.note === 'Ghi chú test: Ít cay, thêm rau');

    console.log(hasNoteInDB ? '✅ Note được lưu vào database' : '❌ Note không được lưu vào database');
    console.log(hasNoteInAPI ? '✅ Note được trả về từ API' : '❌ Note không được trả về từ API');

    if (hasNoteInDB && hasNoteInAPI) {
      console.log('\n🎉 Test thành công! Tính năng note hoạt động đúng.');
    } else {
      console.log('\n⚠️  Test có vấn đề. Vui lòng kiểm tra lại.');
    }

    // 8. Dọn dẹp test data
    console.log('\n8️⃣ Dọn dẹp test data...');
    await supabase.from('order_items').delete().eq('order_id', orderResult.id);
    await supabase.from('orders').delete().eq('id', orderResult.id);
    console.log('✅ Đã xóa test data');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
testOrderWithNote();
