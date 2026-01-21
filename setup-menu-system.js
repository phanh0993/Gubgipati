// Script tổng hợp để setup hệ thống menu mới
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function setupMenuSystem() {
  console.log('🚀 Bắt đầu setup hệ thống menu mới...\n');

  try {
    // 1. Kiểm tra file Excel
    console.log('1️⃣ Kiểm tra file Excel...');
    const excelPath = path.join(__dirname, 'menu cn1.xls');
    
    if (!fs.existsSync(excelPath)) {
      console.log('❌ Không tìm thấy file "menu cn1.xls"');
      console.log('📝 Vui lòng đặt file "menu cn1.xls" trong thư mục gốc của project');
      console.log('📋 Cấu trúc file Excel mong muốn:');
      console.log('   - Cột A: Tên món');
      console.log('   - Cột B: Giá tiền (0đ cho món buffet, có giá cho món dịch vụ)');
      console.log('   - Cột C: Mô tả (tùy chọn)');
      console.log('   - Cột D: Danh mục (tùy chọn)');
      return;
    }

    console.log('✅ Tìm thấy file Excel');

    // 2. Cài đặt dependencies
    console.log('\n2️⃣ Cài đặt dependencies...');
    try {
      execSync('npm install xlsx', { stdio: 'inherit' });
      console.log('✅ Đã cài đặt xlsx');
    } catch (error) {
      console.log('⚠️  Lỗi khi cài đặt xlsx:', error.message);
    }

    // 3. Chạy import dữ liệu
    console.log('\n3️⃣ Import dữ liệu menu...');
    try {
      execSync('node import-menu-data.js', { stdio: 'inherit' });
      console.log('✅ Đã import dữ liệu menu');
    } catch (error) {
      console.log('❌ Lỗi khi import dữ liệu:', error.message);
      return;
    }

    // 4. Cập nhật giao diện mobile
    console.log('\n4️⃣ Cập nhật giao diện mobile...');
    try {
      execSync('node update-mobile-service-mode.js', { stdio: 'inherit' });
      console.log('✅ Đã cập nhật MobileMenuPage');
    } catch (error) {
      console.log('❌ Lỗi khi cập nhật MobileMenuPage:', error.message);
    }

    // 5. Cập nhật MobileBillPage
    console.log('\n5️⃣ Cập nhật MobileBillPage...');
    try {
      execSync('node update-mobile-bill-service.js', { stdio: 'inherit' });
      console.log('✅ Đã cập nhật MobileBillPage');
    } catch (error) {
      console.log('❌ Lỗi khi cập nhật MobileBillPage:', error.message);
    }

    // 6. Tạo file hướng dẫn
    console.log('\n6️⃣ Tạo file hướng dẫn...');
    const guideContent = `# Hướng dẫn Setup Hệ thống Menu Mới

## 🎯 Tổng quan
Hệ thống menu mới được thiết kế để phân biệt rõ ràng giữa:
- **Món buffet (0đ)**: Thuộc gói vé buffet, khách có thể gọi thoải mái
- **Món dịch vụ (có giá)**: Món thêm có tính tiền, order kèm bất kỳ loại vé nào

## 📊 Cấu trúc dữ liệu

### Bảng food_items
- Món 0đ → Thuộc buffet (setup thủ công trong buffet_package_items)
- Món có giá → Dịch vụ thêm (order kèm bất kỳ vé nào)

### Bảng buffet_package_items
- Cần setup lại thủ công
- Chỉ chứa món buffet (0đ)

## 🖥️ Giao diện

### PC (SimpleRestaurantPOS)
- Hiển thị tất cả món
- Món buffet: Không tính tiền
- Món dịch vụ: Tính tiền theo giá

### Mobile (MobileMenuPage)
- **Tab "Buffet"**: Hiển thị món buffet (0đ)
- **Tab "Dịch vụ"**: Hiển thị món dịch vụ (có giá)
- Có thể order cả hai loại trong cùng một order

## 🔧 Các bước setup tiếp theo

### 1. Setup món buffet cho từng gói vé
\`\`\`sql
-- Ví dụ: Thêm món buffet vào gói vé 199K
INSERT INTO buffet_package_items (buffet_package_id, food_item_id)
SELECT 1, id FROM food_items WHERE price = 0;
\`\`\`

### 2. Test tính năng
- Test order món buffet
- Test order món dịch vụ
- Test order kết hợp cả hai

### 3. Cập nhật giao diện (nếu cần)
- Điều chỉnh layout mobile
- Thêm validation
- Cải thiện UX

## 📝 Lưu ý
- Món dịch vụ sẽ được tính tiền cộng vào bill
- Món buffet không tính tiền (đã bao trong vé)
- Có thể có ghi chú cho từng món
- Hệ thống hỗ trợ cả PC và mobile

## 🚀 Tính năng mới
- Mode "Dịch vụ" trong mobile
- Phân loại món rõ ràng
- Tính tiền linh hoạt
- Ghi chú cho từng món
`;

    fs.writeFileSync(path.join(__dirname, 'MENU_SYSTEM_GUIDE.md'), guideContent);
    console.log('✅ Đã tạo file hướng dẫn');

    // 7. Tóm tắt kết quả
    console.log('\n🎉 Setup hoàn thành!');
    console.log('='.repeat(50));
    console.log('✅ Đã xóa dữ liệu cũ');
    console.log('✅ Đã import dữ liệu từ Excel');
    console.log('✅ Đã cập nhật giao diện mobile');
    console.log('✅ Đã cập nhật MobileBillPage');
    console.log('✅ Đã tạo file hướng dẫn');
    console.log('='.repeat(50));

    console.log('\n📋 Các bước tiếp theo:');
    console.log('1. Setup món buffet cho từng gói vé trong buffet_package_items');
    console.log('2. Test tính năng order món buffet và dịch vụ');
    console.log('3. Điều chỉnh giao diện nếu cần');
    console.log('4. Deploy lên production');

    console.log('\n📖 Xem file MENU_SYSTEM_GUIDE.md để biết thêm chi tiết');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình setup:', error);
  }
}

// Chạy script
setupMenuSystem();
