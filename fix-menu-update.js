// Script sửa lỗi để cập nhật menu với tên cột đúng
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMenuUpdate() {
  console.log('🔄 Bắt đầu cập nhật menu với tên cột đúng...\n');

  try {
    // 1. Kiểm tra file Excel
    console.log('1️⃣ Kiểm tra file Excel...');
    const excelPath = path.join(__dirname, 'menu cn1.xls');
    
    if (!fs.existsSync(excelPath)) {
      console.log('❌ Không tìm thấy file "menu cn1.xls"');
      return;
    }

    console.log('✅ Tìm thấy file Excel');

    // 2. Đọc file Excel
    console.log('\n2️⃣ Đọc file Excel...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Đã đọc file Excel: ${data.length} dòng dữ liệu`);

    // 3. Xử lý dữ liệu với tên cột đúng
    console.log('\n3️⃣ Xử lý dữ liệu với tên cột đúng...');
    
    const foodItems = data.map((row, index) => {
      // Sử dụng tên cột đúng từ Excel
      const name = row['Tên mặt hàng (*)'] || '';
      const price = parseFloat(row['Giá bán tại nhà hàng'] || 0) || 0;
      
      return {
        name: name.trim(),
        price: price,
        description: '',
        category_name: 'Khác',
        is_available: true,
        printer_id: null
      };
    }).filter(item => item.name); // Lọc bỏ dòng trống

    console.log(`✅ Đã xử lý ${foodItems.length} món ăn`);

    // 4. Hiển thị danh sách món
    console.log('\n4️⃣ Danh sách món đã xử lý:');
    console.log('='.repeat(60));
    
    foodItems.forEach((item, index) => {
      const type = item.price === 0 ? '🍽️  BUFFET' : '💰 DỊCH VỤ';
      const price = item.price === 0 ? '0₫' : `${item.price.toLocaleString('vi-VN')}₫`;
      console.log(`${index + 1}. ${type} - ${item.name} - ${price}`);
    });

    console.log('='.repeat(60));

    // 5. Phân loại món
    const buffetItems = foodItems.filter(item => item.price === 0);
    const serviceItems = foodItems.filter(item => item.price > 0);

    console.log('\n5️⃣ Phân loại món:');
    console.log(`📊 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📊 Món dịch vụ (có giá): ${serviceItems.length} món`);

    // 6. Thử kết nối Supabase
    console.log('\n6️⃣ Kiểm tra kết nối Supabase...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('food_categories')
        .select('id')
        .limit(1);

      if (testError) {
        console.log('❌ Lỗi kết nối Supabase:', testError.message);
        console.log('📝 Có thể cần kiểm tra lại URL và key');
        return;
      }

      console.log('✅ Kết nối Supabase thành công');
    } catch (error) {
      console.log('❌ Lỗi kết nối:', error.message);
      return;
    }

    // 7. Tạo danh mục "Khác"
    console.log('\n7️⃣ Tạo danh mục "Khác"...');
    
    let categoryId;
    const { data: existingCategory } = await supabase
      .from('food_categories')
      .select('id')
      .eq('name', 'Khác')
      .single();

    if (existingCategory) {
      categoryId = existingCategory.id;
      console.log('✅ Sử dụng danh mục "Khác" có sẵn');
    } else {
      const { data: newCategory, error: createError } = await supabase
        .from('food_categories')
        .insert([{
          name: 'Khác',
          description: 'Danh mục khác',
          is_active: true
        }])
        .select()
        .single();

      if (createError) {
        console.log('❌ Lỗi khi tạo danh mục:', createError.message);
        return;
      }

      categoryId = newCategory.id;
      console.log('✅ Đã tạo danh mục "Khác"');
    }

    // 8. Xóa dữ liệu cũ
    console.log('\n8️⃣ Xóa dữ liệu cũ...');
    
    // Xóa buffet_package_items trước
    const { error: deleteBuffetItems } = await supabase
      .from('buffet_package_items')
      .delete()
      .neq('id', 0);

    if (deleteBuffetItems) {
      console.log('⚠️  Lỗi khi xóa buffet_package_items:', deleteBuffetItems.message);
    } else {
      console.log('✅ Đã xóa buffet_package_items');
    }

    // Xóa food_items
    const { error: deleteFoodItems } = await supabase
      .from('food_items')
      .delete()
      .neq('id', 0);

    if (deleteFoodItems) {
      console.log('⚠️  Lỗi khi xóa food_items:', deleteFoodItems.message);
    } else {
      console.log('✅ Đã xóa food_items');
    }

    // 9. Import food_items
    console.log('\n9️⃣ Import food_items...');
    
    const foodItemsWithCategory = foodItems.map(item => ({
      ...item,
      category_id: categoryId
    }));

    const { data: insertedItems, error: insertError } = await supabase
      .from('food_items')
      .insert(foodItemsWithCategory)
      .select();

    if (insertError) {
      console.log('❌ Lỗi khi import food_items:', insertError.message);
      return;
    }

    console.log(`✅ Đã import ${insertedItems.length} món ăn`);

    // 10. Báo cáo kết quả
    console.log('\n🔟 Báo cáo kết quả:');
    console.log('='.repeat(50));
    console.log(`✅ Đã xóa dữ liệu cũ`);
    console.log(`✅ Đã import ${insertedItems.length} món ăn`);
    console.log(`📋 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📋 Món dịch vụ (có giá): ${serviceItems.length} món`);
    console.log('='.repeat(50));

    console.log('\n🎉 Cập nhật dữ liệu menu hoàn thành!');
    console.log('\n📝 Các bước tiếp theo:');
    console.log('1. Setup món buffet cho từng gói vé trong buffet_package_items');
    console.log('2. Test tính năng order món buffet và dịch vụ');
    console.log('3. Cập nhật giao diện mobile để thêm mode "Dịch vụ"');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình cập nhật:', error);
  }
}

// Chạy script
fixMenuUpdate();
