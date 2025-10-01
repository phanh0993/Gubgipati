// Script đơn giản để cập nhật menu
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleMenuUpdate() {
  console.log('🔄 Bắt đầu cập nhật menu đơn giản...\n');

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

    // 3. Hiển thị cấu trúc dữ liệu
    console.log('\n3️⃣ Cấu trúc dữ liệu Excel:');
    if (data.length > 0) {
      console.log('📋 Các cột có sẵn:', Object.keys(data[0]));
      console.log('\n📋 5 dòng đầu tiên:');
      data.slice(0, 5).forEach((row, index) => {
        console.log(`   ${index + 1}.`, row);
      });
    }

    // 4. Xử lý dữ liệu
    console.log('\n4️⃣ Xử lý dữ liệu...');
    
    const foodItems = data.map((row, index) => {
      // Thử các tên cột khác nhau
      const name = row['Tên món'] || row['Name'] || row['Tên'] || row['Món'] || row['Tên món ăn'] || row['Món ăn'] || '';
      const price = parseFloat(row['Giá'] || row['Price'] || row['Giá tiền'] || row['Giá tiền (₫)'] || row['Giá (₫)'] || 0) || 0;
      const description = row['Mô tả'] || row['Description'] || row['Ghi chú'] || row['Mô tả món'] || '';
      const category = row['Danh mục'] || row['Category'] || row['Loại'] || row['Nhóm'] || 'Khác';

      return {
        name: name.trim(),
        price: price,
        description: description.trim(),
        category_name: category.trim(),
        is_available: true,
        printer_id: null
      };
    }).filter(item => item.name); // Lọc bỏ dòng trống

    console.log(`✅ Đã xử lý ${foodItems.length} món ăn`);

    // 5. Hiển thị danh sách món
    console.log('\n5️⃣ Danh sách món đã xử lý:');
    console.log('='.repeat(60));
    
    foodItems.forEach((item, index) => {
      const type = item.price === 0 ? '🍽️  BUFFET' : '💰 DỊCH VỤ';
      const price = item.price === 0 ? '0₫' : `${item.price.toLocaleString('vi-VN')}₫`;
      console.log(`${index + 1}. ${type} - ${item.name} - ${price}`);
    });

    console.log('='.repeat(60));

    // 6. Phân loại món
    const buffetItems = foodItems.filter(item => item.price === 0);
    const serviceItems = foodItems.filter(item => item.price > 0);

    console.log('\n6️⃣ Phân loại món:');
    console.log(`📊 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📊 Món dịch vụ (có giá): ${serviceItems.length} món`);

    // 7. Tạo báo cáo
    console.log('\n7️⃣ Báo cáo kết quả:');
    console.log('='.repeat(50));
    console.log(`✅ Đã đọc ${data.length} dòng từ Excel`);
    console.log(`✅ Đã xử lý ${foodItems.length} món ăn`);
    console.log(`📋 Món buffet (0đ): ${buffetItems.length} món`);
    console.log(`📋 Món dịch vụ (có giá): ${serviceItems.length} món`);
    console.log('='.repeat(50));

    console.log('\n📝 Dữ liệu đã sẵn sàng để import vào database!');
    console.log('🔧 Để import vào database, cần:');
    console.log('1. Kiểm tra kết nối Supabase');
    console.log('2. Đảm bảo bảng food_items tồn tại');
    console.log('3. Chạy script import với quyền phù hợp');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình xử lý:', error);
  }
}

// Chạy script
simpleMenuUpdate();
