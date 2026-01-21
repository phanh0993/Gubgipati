// Script cập nhật menu thông qua API server
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function updateMenuViaAPI() {
  console.log('🔄 Cập nhật menu thông qua API server...\n');

  try {
    // 1. Đọc file Excel
    console.log('1️⃣ Đọc file Excel...');
    const excelPath = path.join(__dirname, 'menu cn1.xls');
    
    if (!fs.existsSync(excelPath)) {
      console.log('❌ Không tìm thấy file "menu cn1.xls"');
      return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Đã đọc ${data.length} dòng từ Excel`);

    // 2. Xử lý dữ liệu
    console.log('\n2️⃣ Xử lý dữ liệu...');
    
    const foodItems = data.map((row, index) => {
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
    }).filter(item => item.name);

    console.log(`✅ Đã xử lý ${foodItems.length} món ăn`);

    // 3. Phân loại món
    const buffetItems = foodItems.filter(item => item.price === 0);
    const serviceItems = foodItems.filter(item => item.price > 0);

    console.log(`📊 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📊 Món dịch vụ (có giá): ${serviceItems.length} món`);

    // 4. Tạo SQL script để cập nhật database
    console.log('\n3️⃣ Tạo SQL script...');
    
    const sqlScript = `-- Script cập nhật menu từ Excel
-- File: menu cn1.xls
-- Ngày tạo: ${new Date().toLocaleString('vi-VN')}

-- Xóa dữ liệu cũ
DELETE FROM buffet_package_items;
DELETE FROM food_items;

-- Tạo danh mục "Khác" nếu chưa có
INSERT INTO food_categories (name, description, is_active)
SELECT 'Khác', 'Danh mục khác', true
WHERE NOT EXISTS (SELECT 1 FROM food_categories WHERE name = 'Khác');

-- Lấy ID danh mục "Khác"
-- (Sẽ được thay thế bằng ID thực tế khi chạy)

-- Thêm món ăn mới
INSERT INTO food_items (name, price, description, category_id, is_available, printer_id, created_at) VALUES
${foodItems.map(item => `('${item.name.replace(/'/g, "''")}', ${item.price}, '${item.description}', (SELECT id FROM food_categories WHERE name = 'Khác'), true, null, NOW())`).join(',\n')};

-- Báo cáo kết quả
SELECT 
  'Tổng món ăn' as loai,
  COUNT(*) as so_luong
FROM food_items
UNION ALL
SELECT 
  'Món buffet (0đ)' as loai,
  COUNT(*) as so_luong
FROM food_items 
WHERE price = 0
UNION ALL
SELECT 
  'Món dịch vụ (có giá)' as loai,
  COUNT(*) as so_luong
FROM food_items 
WHERE price > 0;
`;

    // Lưu SQL script
    const sqlPath = path.join(__dirname, 'update-menu.sql');
    fs.writeFileSync(sqlPath, sqlScript);
    console.log(`✅ Đã tạo SQL script: ${sqlPath}`);

    // 5. Hiển thị danh sách món
    console.log('\n4️⃣ Danh sách món đã xử lý:');
    console.log('='.repeat(60));
    
    foodItems.forEach((item, index) => {
      const type = item.price === 0 ? '🍽️  BUFFET' : '💰 DỊCH VỤ';
      const price = item.price === 0 ? '0₫' : `${item.price.toLocaleString('vi-VN')}₫`;
      console.log(`${index + 1}. ${type} - ${item.name} - ${price}`);
    });

    console.log('='.repeat(60));

    // 6. Tạo báo cáo
    console.log('\n5️⃣ Báo cáo kết quả:');
    console.log('='.repeat(50));
    console.log(`✅ Đã xử lý ${foodItems.length} món ăn từ Excel`);
    console.log(`📋 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📋 Món dịch vụ (có giá): ${serviceItems.length} món`);
    console.log(`📄 SQL script: ${sqlPath}`);
    console.log('='.repeat(50));

    console.log('\n📝 Các bước tiếp theo:');
    console.log('1. Chạy SQL script trong Supabase SQL Editor');
    console.log('2. Setup món buffet cho từng gói vé');
    console.log('3. Test tính năng order');

    console.log('\n🎉 Xử lý dữ liệu hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình xử lý:', error);
  }
}

// Chạy script
updateMenuViaAPI();
