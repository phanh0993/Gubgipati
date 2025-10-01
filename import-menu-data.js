// Script để import dữ liệu menu từ file Excel
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function importMenuData() {
  console.log('🔄 Bắt đầu import dữ liệu menu...\n');

  try {
    // 1. Xóa dữ liệu cũ
    console.log('1️⃣ Xóa dữ liệu cũ...');
    
    // Xóa buffet_package_items trước (foreign key constraint)
    const { error: deleteBuffetItems } = await supabase
      .from('buffet_package_items')
      .delete()
      .neq('id', 0); // Xóa tất cả

    if (deleteBuffetItems) {
      console.log('❌ Lỗi khi xóa buffet_package_items:', deleteBuffetItems.message);
    } else {
      console.log('✅ Đã xóa buffet_package_items');
    }

    // Xóa food_items
    const { error: deleteFoodItems } = await supabase
      .from('food_items')
      .delete()
      .neq('id', 0); // Xóa tất cả

    if (deleteFoodItems) {
      console.log('❌ Lỗi khi xóa food_items:', deleteFoodItems.message);
    } else {
      console.log('✅ Đã xóa food_items');
    }

    // 2. Đọc file Excel
    console.log('\n2️⃣ Đọc file Excel...');
    
    // Kiểm tra file có tồn tại không
    const fs = require('fs');
    const path = require('path');
    const excelPath = path.join(__dirname, 'menu cn1.xls');
    
    if (!fs.existsSync(excelPath)) {
      console.log('❌ Không tìm thấy file "menu cn1.xls"');
      console.log('📝 Vui lòng đặt file "menu cn1.xls" trong thư mục gốc của project');
      return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Đã đọc file Excel: ${data.length} dòng dữ liệu`);

    // 3. Xử lý dữ liệu
    console.log('\n3️⃣ Xử lý dữ liệu...');
    
    const foodItems = data.map((row, index) => {
      // Giả sử cấu trúc Excel: Tên món, Giá, Mô tả, Danh mục
      const name = row['Tên món'] || row['Name'] || row['Tên'] || '';
      const price = parseFloat(row['Giá'] || row['Price'] || row['Giá tiền'] || 0) || 0;
      const description = row['Mô tả'] || row['Description'] || row['Ghi chú'] || '';
      const category = row['Danh mục'] || row['Category'] || row['Loại'] || 'Khác';

      return {
        name: name.trim(),
        price: price,
        description: description.trim(),
        category_name: category.trim(),
        is_available: true,
        printer_id: null,
        created_at: new Date().toISOString()
      };
    }).filter(item => item.name); // Lọc bỏ dòng trống

    console.log(`✅ Đã xử lý ${foodItems.length} món ăn`);

    // 4. Tạo danh mục
    console.log('\n4️⃣ Tạo danh mục...');
    
    const categories = [...new Set(foodItems.map(item => item.category_name))];
    const categoryMap = {};

    for (const categoryName of categories) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('food_categories')
        .select('id')
        .eq('name', categoryName)
        .single();

      if (categoryError && categoryError.code === 'PGRST116') {
        // Tạo danh mục mới
        const { data: newCategory, error: createError } = await supabase
          .from('food_categories')
          .insert([{
            name: categoryName,
            description: `Danh mục ${categoryName}`,
            is_active: true
          }])
          .select()
          .single();

        if (createError) {
          console.log(`❌ Lỗi khi tạo danh mục ${categoryName}:`, createError.message);
        } else {
          categoryMap[categoryName] = newCategory.id;
          console.log(`✅ Đã tạo danh mục: ${categoryName}`);
        }
      } else if (categoryData) {
        categoryMap[categoryName] = categoryData.id;
        console.log(`✅ Sử dụng danh mục có sẵn: ${categoryName}`);
      }
    }

    // 5. Import food_items
    console.log('\n5️⃣ Import food_items...');
    
    const foodItemsWithCategory = foodItems.map(item => ({
      ...item,
      category_id: categoryMap[item.category_name]
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

    // 6. Phân loại món
    console.log('\n6️⃣ Phân loại món...');
    
    const buffetItems = insertedItems.filter(item => item.price === 0);
    const serviceItems = insertedItems.filter(item => item.price > 0);

    console.log(`📊 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📊 Món dịch vụ (có giá): ${serviceItems.length} món`);

    // 7. Tạo báo cáo
    console.log('\n7️⃣ Báo cáo kết quả:');
    console.log('='.repeat(50));
    console.log(`✅ Đã xóa dữ liệu cũ`);
    console.log(`✅ Đã import ${insertedItems.length} món ăn`);
    console.log(`✅ Đã tạo ${categories.length} danh mục`);
    console.log(`📋 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📋 Món dịch vụ (có giá): ${serviceItems.length} món`);
    console.log('='.repeat(50));
    
    console.log('\n📝 Các bước tiếp theo:');
    console.log('1. Setup món buffet cho từng gói vé trong buffet_package_items');
    console.log('2. Cập nhật giao diện mobile để thêm mode "Dịch vụ"');
    console.log('3. Test tính năng order món dịch vụ');

    console.log('\n🎉 Import dữ liệu menu hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình import:', error);
  }
}

// Chạy script
importMenuData();
