// Test script để kiểm tra file SQL note
const fs = require('fs');
const path = require('path');

function testSQLFile() {
  console.log('🧪 Test file SQL để thêm cột note...\n');

  try {
    // 1. Kiểm tra file SQL có tồn tại không
    const sqlFilePath = path.join(__dirname, 'ADD_NOTE_COLUMN_TO_ORDER_ITEMS.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.log('❌ File SQL không tồn tại:', sqlFilePath);
      return;
    }

    console.log('✅ File SQL tồn tại:', sqlFilePath);

    // 2. Đọc nội dung file SQL
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('\n📝 Nội dung file SQL:');
    console.log('─'.repeat(50));
    console.log(sqlContent);
    console.log('─'.repeat(50));

    // 3. Kiểm tra các thành phần quan trọng
    console.log('\n3️⃣ Kiểm tra các thành phần quan trọng:');
    
    const hasAddColumn = sqlContent.includes('ADD COLUMN note TEXT');
    const hasComment = sqlContent.includes('COMMENT ON COLUMN');
    const hasCheck = sqlContent.includes('information_schema.columns');
    
    console.log(hasAddColumn ? '✅ Có lệnh ADD COLUMN note' : '❌ Thiếu lệnh ADD COLUMN note');
    console.log(hasComment ? '✅ Có comment cho cột' : '❌ Thiếu comment cho cột');
    console.log(hasCheck ? '✅ Có kiểm tra cấu trúc bảng' : '❌ Thiếu kiểm tra cấu trúc bảng');

    // 4. Hướng dẫn chạy
    console.log('\n4️⃣ Hướng dẫn chạy SQL:');
    console.log('📋 Để chạy file SQL này, bạn có thể:');
    console.log('   1. Mở Supabase Dashboard');
    console.log('   2. Vào SQL Editor');
    console.log('   3. Copy nội dung file và paste vào editor');
    console.log('   4. Nhấn Run để thực thi');
    console.log('\n📋 Hoặc sử dụng psql:');
    console.log('   psql -h [host] -U [user] -d [database] -f ADD_NOTE_COLUMN_TO_ORDER_ITEMS.sql');

    if (hasAddColumn && hasComment && hasCheck) {
      console.log('\n🎉 File SQL có đầy đủ các thành phần cần thiết!');
      console.log('✅ Có thể chạy file này để thêm cột note vào bảng order_items.');
    } else {
      console.log('\n⚠️  File SQL có thể thiếu một số thành phần quan trọng.');
    }

  } catch (error) {
    console.error('❌ Lỗi khi test file SQL:', error);
  }
}

// Chạy test
testSQLFile();
