// Test script để kiểm tra tính năng note trực tiếp với database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNoteFeature() {
  console.log('🧪 Test tính năng note trực tiếp với database...\n');

  try {
    // 1. Kiểm tra cột note có tồn tại không bằng cách thử insert
    console.log('1️⃣ Kiểm tra cột note trong bảng order_items...');
    
    // Lấy một order_id có sẵn để test
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (!existingOrders || existingOrders.length === 0) {
      console.log('❌ Không có order nào để test');
      return;
    }

    const testOrderId = existingOrders[0].id;
    console.log(`✅ Sử dụng order ID: ${testOrderId}`);

    // 2. Thử insert một order_item với note
    console.log('\n2️⃣ Thử insert order_item với note...');
    const testItemData = {
      order_id: testOrderId,
      food_item_id: 1,
      quantity: 1,
      unit_price: 50000,
      total_price: 50000,
      note: 'Test note: Ghi chú test từ script'
    };

    console.log('📝 Dữ liệu test:', JSON.stringify(testItemData, null, 2));

    const { data: insertResult, error: insertError } = await supabase
      .from('order_items')
      .insert([testItemData])
      .select();

    if (insertError) {
      console.log('❌ Lỗi khi insert:', insertError.message);
      
      // Kiểm tra xem có phải lỗi cột note không tồn tại
      if (insertError.message.includes('note') || insertError.message.includes('column')) {
        console.log('⚠️  Có thể cột note chưa được tạo. Vui lòng chạy file ADD_NOTE_COLUMN_TO_ORDER_ITEMS.sql');
      }
      return;
    }

    console.log('✅ Insert thành công!');
    console.log('📊 Kết quả insert:', insertResult);

    // 3. Kiểm tra dữ liệu đã được lưu
    console.log('\n3️⃣ Kiểm tra dữ liệu đã được lưu...');
    const { data: checkData, error: checkError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', insertResult[0].id);

    if (checkError) {
      console.log('❌ Lỗi khi kiểm tra dữ liệu:', checkError);
      return;
    }

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

    // 5. Dọn dẹp test data
    console.log('\n5️⃣ Dọn dẹp test data...');
    await supabase.from('order_items').delete().eq('id', insertResult[0].id);
    console.log('✅ Đã xóa test data');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
testNoteFeature();
