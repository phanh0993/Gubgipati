/**
 * Script cập nhật danh sách bàn mới vào Supabase
 * Chạy: node update-tables-list.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  console.error('Vui lòng tạo file .env với các biến này');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Danh sách bàn mới
// Lưu ý: table_number phải unique, nên dùng format "A1", "B1" thay vì chỉ "1"
const newTables = [
  // Khu A: 9 bàn từ A-1 đến A-9
  { table_name: 'A-1', area: 'A', table_number: 'A1', capacity: 4 },
  { table_name: 'A-2', area: 'A', table_number: 'A2', capacity: 4 },
  { table_name: 'A-3', area: 'A', table_number: 'A3', capacity: 4 },
  { table_name: 'A-4', area: 'A', table_number: 'A4', capacity: 4 },
  { table_name: 'A-5', area: 'A', table_number: 'A5', capacity: 4 },
  { table_name: 'A-6', area: 'A', table_number: 'A6', capacity: 4 },
  { table_name: 'A-7', area: 'A', table_number: 'A7', capacity: 4 },
  { table_name: 'A-8', area: 'A', table_number: 'A8', capacity: 4 },
  { table_name: 'A-9', area: 'A', table_number: 'A9', capacity: 4 },
  
  // Khu B: 9 bàn từ B-1 đến B-9
  { table_name: 'B-1', area: 'B', table_number: 'B1', capacity: 4 },
  { table_name: 'B-2', area: 'B', table_number: 'B2', capacity: 4 },
  { table_name: 'B-3', area: 'B', table_number: 'B3', capacity: 4 },
  { table_name: 'B-4', area: 'B', table_number: 'B4', capacity: 4 },
  { table_name: 'B-5', area: 'B', table_number: 'B5', capacity: 4 },
  { table_name: 'B-6', area: 'B', table_number: 'B6', capacity: 4 },
  { table_name: 'B-7', area: 'B', table_number: 'B7', capacity: 4 },
  { table_name: 'B-8', area: 'B', table_number: 'B8', capacity: 4 },
  { table_name: 'B-9', area: 'B', table_number: 'B9', capacity: 4 },
  
  // Khu C: 4 bàn từ C-1 đến C-4
  { table_name: 'C-1', area: 'C', table_number: 'C1', capacity: 4 },
  { table_name: 'C-2', area: 'C', table_number: 'C2', capacity: 4 },
  { table_name: 'C-3', area: 'C', table_number: 'C3', capacity: 4 },
  { table_name: 'C-4', area: 'C', table_number: 'C4', capacity: 4 },
  
  // Khu D: 9 bàn từ D-1 đến D-9
  { table_name: 'D-1', area: 'D', table_number: 'D1', capacity: 4 },
  { table_name: 'D-2', area: 'D', table_number: 'D2', capacity: 4 },
  { table_name: 'D-3', area: 'D', table_number: 'D3', capacity: 4 },
  { table_name: 'D-4', area: 'D', table_number: 'D4', capacity: 4 },
  { table_name: 'D-5', area: 'D', table_number: 'D5', capacity: 4 },
  { table_name: 'D-6', area: 'D', table_number: 'D6', capacity: 4 },
  { table_name: 'D-7', area: 'D', table_number: 'D7', capacity: 4 },
  { table_name: 'D-8', area: 'D', table_number: 'D8', capacity: 4 },
  { table_name: 'D-9', area: 'D', table_number: 'D9', capacity: 4 },
];

async function updateTables() {
  try {
    console.log('🔄 Bắt đầu cập nhật danh sách bàn...');
    
    // Kiểm tra xem có bàn nào đang có order pending không
    const { data: activeOrders, error: checkError } = await supabase
      .from('orders')
      .select('table_id')
      .in('status', ['pending', 'open']);
    
    if (checkError) {
      console.warn('⚠️ Không thể kiểm tra orders:', checkError.message);
    } else if (activeOrders && activeOrders.length > 0) {
      console.warn('⚠️ Có ' + activeOrders.length + ' order đang active. Cần xử lý trước khi xóa bàn.');
      console.log('⚠️ Nếu vẫn muốn tiếp tục, script sẽ xóa tất cả bàn và tạo lại.');
    }
    
    // Xóa tất cả bàn cũ
    console.log('🗑️  Xóa tất cả bàn cũ...');
    const { error: deleteError } = await supabase
      .from('tables')
      .delete()
      .neq('id', 0); // Xóa tất cả
    
    if (deleteError) {
      console.error('❌ Lỗi khi xóa bàn cũ:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ Đã xóa bàn cũ');
    
    // Kiểm tra xem có bàn nào còn lại không
    const { data: remainingTables, error: remainingCheckError } = await supabase
      .from('tables')
      .select('*');
    
    if (remainingCheckError) {
      console.warn('⚠️ Không thể kiểm tra bàn còn lại:', remainingCheckError.message);
    } else if (remainingTables && remainingTables.length > 0) {
      console.warn('⚠️ Vẫn còn ' + remainingTables.length + ' bàn trong database');
      console.log('⚠️ Thử xóa lại...');
      // Thử xóa lại bằng cách khác
      for (const table of remainingTables) {
        await supabase.from('tables').delete().eq('id', table.id);
      }
    }
    
    // Insert bàn mới từng bàn một để tránh lỗi
    console.log('➕ Thêm ' + newTables.length + ' bàn mới...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const table of newTables) {
      const { data, error } = await supabase
        .from('tables')
        .insert([table])
        .select();
      
      if (error) {
        console.error(`❌ Lỗi khi thêm bàn ${table.table_name}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    }
    
    if (errorCount > 0) {
      throw new Error(`Có ${errorCount} bàn không thể thêm vào database`);
    }
    
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('area', { ascending: true })
      .order('table_number', { ascending: true });
    
    if (error) {
      console.error('❌ Lỗi khi lấy danh sách bàn:', error);
      throw error;
    }
    
    console.log('✅ Đã thêm thành công ' + successCount + ' bàn');
    
    // Hiển thị kết quả theo khu
    console.log('\n📊 Danh sách bàn theo khu:');
    const areas = ['A', 'B', 'C', 'D'];
    for (const area of areas) {
      const tablesInArea = newTables.filter(t => t.area === area);
      const tableNames = tablesInArea.map(t => t.table_name).join(', ');
      console.log(`   Khu ${area}: ${tablesInArea.length} bàn - ${tableNames}`);
    }
    
    console.log('\n✅ Hoàn thành! Tổng cộng: ' + newTables.length + ' bàn');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
updateTables();

