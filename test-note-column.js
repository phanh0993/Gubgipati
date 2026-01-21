// Test script để kiểm tra cột note có tồn tại không
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNoteColumn() {
  console.log('🧪 Test cột note trong bảng order_items...\n');

  try {
    // 1. Thử select cột note để kiểm tra có tồn tại không
    console.log('1️⃣ Kiểm tra cột note có tồn tại...');
    
    const { data, error } = await supabase
      .from('order_items')
      .select('id, note')
      .limit(1);

    if (error) {
      console.log('❌ Lỗi khi select cột note:', error.message);
      
      if (error.message.includes('note') || error.message.includes('column')) {
        console.log('⚠️  Cột note chưa tồn tại!');
        console.log('📝 Vui lòng chạy file SQL: ADD_NOTE_COLUMN_TO_ORDER_ITEMS.sql');
        return;
      }
    } else {
      console.log('✅ Cột note đã tồn tại!');
      console.log('📊 Kết quả select:', data);
    }

    // 2. Thử insert một record test với note
    console.log('\n2️⃣ Thử insert record test với note...');
    
    // Tạo một order test trước
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        table_id: 1,
        employee_id: 1,
        order_type: 'dine_in',
        subtotal: 100000,
        tax_amount: 0,
        total_amount: 100000,
        notes: 'Test order',
        status: 'pending'
      }])
      .select();

    if (orderError) {
      console.log('❌ Lỗi khi tạo order test:', orderError.message);
      return;
    }

    const testOrderId = orderData[0].id;
    console.log(`✅ Tạo order test thành công, ID: ${testOrderId}`);

    // Thử insert order_item với note
    const { data: itemData, error: itemError } = await supabase
      .from('order_items')
      .insert([{
        order_id: testOrderId,
        food_item_id: 1,
        quantity: 1,
        unit_price: 50000,
        total_price: 50000,
        note: 'Test note: Ghi chú test từ script'
      }])
      .select();

    if (itemError) {
      console.log('❌ Lỗi khi insert order_item:', itemError.message);
      
      // Dọn dẹp order test
      await supabase.from('orders').delete().eq('id', testOrderId);
      return;
    }

    console.log('✅ Insert order_item với note thành công!');
    console.log('📊 Kết quả insert:', itemData);

    // 3. Kiểm tra dữ liệu đã được lưu
    console.log('\n3️⃣ Kiểm tra dữ liệu đã được lưu...');
    const { data: checkData, error: checkError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemData[0].id);

    if (checkError) {
      console.log('❌ Lỗi khi kiểm tra dữ liệu:', checkError);
    } else {
      console.log('📋 Dữ liệu đã lưu:');
      console.log('   - ID:', checkData[0].id);
      console.log('   - order_id:', checkData[0].order_id);
      console.log('   - food_item_id:', checkData[0].food_item_id);
      console.log('   - quantity:', checkData[0].quantity);
      console.log('   - unit_price:', checkData[0].unit_price);
      console.log('   - total_price:', checkData[0].total_price);
      console.log('   - note:', `"${checkData[0].note}"`);
      console.log('   - special_instructions:', `"${checkData[0].special_instructions || 'null'}"`);

      // 4. Kiểm tra kết quả
      console.log('\n4️⃣ Kết quả test:');
      const hasNote = checkData[0].note === 'Test note: Ghi chú test từ script';
      
      if (hasNote) {
        console.log('🎉 Test thành công! Cột note hoạt động đúng.');
        console.log('✅ Note được lưu và đọc thành công từ database.');
      } else {
        console.log('⚠️  Test có vấn đề. Note không khớp với dữ liệu đã gửi.');
      }
    }

    // 5. Dọn dẹp test data
    console.log('\n5️⃣ Dọn dẹp test data...');
    await supabase.from('order_items').delete().eq('id', itemData[0].id);
    await supabase.from('orders').delete().eq('id', testOrderId);
    console.log('✅ Đã xóa test data');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
testNoteColumn();
