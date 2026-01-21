const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình kết nối Supabase
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('🔍 Bắt đầu dò tìm khách hàng trùng lặp trong Supabase...');

// Tìm và xóa khách hàng trùng lặp (cả tên và số điện thoại giống nhau)
async function removeDuplicateCustomers() {
  const client = await pool.connect();
  
  try {
    // Tìm các nhóm khách hàng trùng lặp
    const findDuplicatesQuery = `
      SELECT 
        TRIM(LOWER(COALESCE(fullname, name))) as normalized_name,
        TRIM(phone) as normalized_phone,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY id) as ids,
        MIN(id) as keep_id,
        MAX(created_at) as latest_created,
        (ARRAY_AGG(COALESCE(fullname, name) ORDER BY id))[1] as customer_name,
        (ARRAY_AGG(phone ORDER BY id))[1] as phone
      FROM customers 
      WHERE (fullname IS NOT NULL OR name IS NOT NULL)
        AND phone IS NOT NULL 
        AND TRIM(COALESCE(fullname, name, '')) != '' 
        AND TRIM(phone) != ''
        AND is_active = true
      GROUP BY TRIM(LOWER(COALESCE(fullname, name))), TRIM(phone)
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    const duplicateGroups = await client.query(findDuplicatesQuery);

    if (duplicateGroups.rows.length === 0) {
      console.log('✅ Không tìm thấy khách hàng trùng lặp');
      return { removed: 0, groups: 0 };
    }

    console.log(`📊 Tìm thấy ${duplicateGroups.rows.length} nhóm khách hàng trùng lặp:`);
    
    let totalRemoved = 0;

    // Bắt đầu transaction
    await client.query('BEGIN');

    for (let i = 0; i < duplicateGroups.rows.length; i++) {
      const group = duplicateGroups.rows[i];
      
      console.log(`\n${i + 1}. Tên: "${group.customer_name}" - SĐT: "${group.phone}"`);
      console.log(`   Số bản sao: ${group.count}`);
      console.log(`   IDs: ${group.ids.join(', ')}`);
      
      // Lấy danh sách ID để xóa (giữ lại ID nhỏ nhất - khách hàng được tạo sớm nhất)
      const allIds = group.ids;
      const keepId = group.keep_id;
      const removeIds = allIds.filter(id => id !== keepId);
      
      console.log(`   Giữ lại ID: ${keepId}`);
      console.log(`   Xóa IDs: ${removeIds.join(', ')}`);

      // Xóa các bản sao
      if (removeIds.length > 0) {
        try {
          // Kiểm tra xem các khách hàng này có lịch sử hóa đơn không
          const invoiceCheckQuery = `
            SELECT customer_id, COUNT(*) as invoice_count
            FROM invoices 
            WHERE customer_id = ANY($1)
            GROUP BY customer_id
          `;
          
          const invoiceCheck = await client.query(invoiceCheckQuery, [removeIds]);
          
          if (invoiceCheck.rows.length > 0) {
            console.log(`   ⚠️  Một số khách hàng có lịch sử hóa đơn:`);
            invoiceCheck.rows.forEach(row => {
              console.log(`      ID ${row.customer_id}: ${row.invoice_count} hóa đơn`);
            });
            
            // Cập nhật các hóa đơn để trỏ về khách hàng được giữ lại
            const updateInvoicesQuery = `
              UPDATE invoices 
              SET customer_id = $1, updated_at = NOW()
              WHERE customer_id = ANY($2)
            `;
            
            const updateResult = await client.query(updateInvoicesQuery, [keepId, removeIds]);
            console.log(`   📝 Đã cập nhật ${updateResult.rowCount} hóa đơn trỏ về khách hàng ID ${keepId}`);
          }
          
          // Xóa các khách hàng trùng lặp
          const deleteQuery = `
            DELETE FROM customers 
            WHERE id = ANY($1) AND id != $2
          `;
          
          const deleteResult = await client.query(deleteQuery, [removeIds, keepId]);
          console.log(`   ✅ Đã xóa ${deleteResult.rowCount} bản sao`);
          totalRemoved += deleteResult.rowCount;
          
        } catch (deleteErr) {
          console.error(`   ❌ Lỗi khi xóa nhóm ${i + 1}:`, deleteErr.message);
          throw deleteErr; // Rollback transaction
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`\n🎉 Hoàn thành! Đã xóa tổng cộng ${totalRemoved} khách hàng trùng lặp từ ${duplicateGroups.rows.length} nhóm`);
    return { removed: totalRemoved, groups: duplicateGroups.rows.length };

  } catch (error) {
    // Rollback transaction nếu có lỗi
    await client.query('ROLLBACK');
    console.error('❌ Lỗi trong quá trình xử lý:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Hiển thị thống kê trước khi xóa
async function showStatistics() {
  const client = await pool.connect();
  
  try {
    // Tổng số khách hàng
    const totalQuery = 'SELECT COUNT(*) as total FROM customers WHERE is_active = true';
    const totalResult = await client.query(totalQuery);
    console.log(`📈 Tổng số khách hàng hiện tại: ${totalResult.rows[0].total}`);
    
    // Đếm số nhóm khách hàng có thể bị trùng lặp
    const duplicateCountQuery = `
      SELECT COUNT(*) as duplicates
      FROM (
        SELECT 
          TRIM(LOWER(COALESCE(fullname, name))) as normalized_name,
          TRIM(phone) as normalized_phone,
          COUNT(*) as count
        FROM customers 
        WHERE (fullname IS NOT NULL OR name IS NOT NULL)
          AND phone IS NOT NULL 
          AND TRIM(COALESCE(fullname, name, '')) != '' 
          AND TRIM(phone) != ''
          AND is_active = true
        GROUP BY TRIM(LOWER(COALESCE(fullname, name))), TRIM(phone)
        HAVING COUNT(*) > 1
      ) as dup_groups
    `;
    
    const dupResult = await client.query(duplicateCountQuery);
    console.log(`🔍 Số nhóm khách hàng trùng lặp: ${dupResult.rows[0].duplicates}`);
    
    // Thống kê theo cột name vs fullname
    const columnStatsQuery = `
      SELECT 
        COUNT(CASE WHEN fullname IS NOT NULL AND fullname != '' THEN 1 END) as has_fullname,
        COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as has_name,
        COUNT(CASE WHEN (fullname IS NULL OR fullname = '') AND (name IS NULL OR name = '') THEN 1 END) as no_name
      FROM customers 
      WHERE is_active = true
    `;
    
    const columnStats = await client.query(columnStatsQuery);
    const stats = columnStats.rows[0];
    console.log(`📊 Thống kê cột tên:`);
    console.log(`   - Có fullname: ${stats.has_fullname}`);
    console.log(`   - Có name: ${stats.has_name}`);
    console.log(`   - Không có tên: ${stats.no_name}`);
    
  } catch (error) {
    console.error('❌ Lỗi khi lấy thống kê:', error);
  } finally {
    client.release();
  }
}

// Kiểm tra kết nối database
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Kết nối Supabase thành công');
    return true;
  } catch (error) {
    console.error('❌ Không thể kết nối Supabase:', error.message);
    console.error('💡 Kiểm tra lại SUPABASE_DB_URL hoặc DATABASE_URL trong file .env');
    return false;
  }
}

// Chạy script
async function main() {
  try {
    console.log('🔗 Kiểm tra kết nối database...');
    const connected = await testConnection();
    
    if (!connected) {
      process.exit(1);
    }
    
    console.log('\n📊 Thống kê trước khi xóa:');
    await showStatistics();
    
    console.log('\n⚠️  CẢNH BÁO: Script này sẽ xóa vĩnh viễn các khách hàng trùng lặp!');
    console.log('Tiêu chí trùng lặp: Cùng tên AND cùng số điện thoại');
    console.log('Sẽ giữ lại khách hàng có ID nhỏ nhất (tạo sớm nhất)');
    console.log('Các hóa đơn của khách hàng bị xóa sẽ được chuyển về khách hàng được giữ lại\n');
    
    // Prompt xác nhận (trong môi trường thực tế)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Bạn có chắc chắn muốn tiếp tục? (yes/no): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Đã hủy bỏ thao tác');
      return;
    }
    
    const result = await removeDuplicateCustomers();
    
    console.log('\n📊 Kết quả:');
    console.log(`- Số nhóm trùng lặp đã xử lý: ${result.groups}`);
    console.log(`- Số khách hàng đã xóa: ${result.removed}`);
    
    // Hiển thị thống kê sau khi xóa
    console.log('\n📈 Thống kê sau khi xóa:');
    await showStatistics();
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('✅ Đã đóng kết nối database');
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main();
}

module.exports = { removeDuplicateCustomers, showStatistics, testConnection };
