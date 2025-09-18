const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/spa_management.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Bắt đầu dò tìm khách hàng trùng lặp...');

// Tìm và xóa khách hàng trùng lặp (cả tên và số điện thoại giống nhau)
function removeDuplicateCustomers() {
  return new Promise((resolve, reject) => {
    // Tìm các nhóm khách hàng trùng lặp
    const findDuplicatesQuery = `
      SELECT fullname, phone, COUNT(*) as count, 
             GROUP_CONCAT(id) as ids,
             MIN(id) as keep_id,
             MAX(created_at) as latest_created
      FROM customers 
      WHERE fullname IS NOT NULL 
        AND phone IS NOT NULL 
        AND TRIM(fullname) != '' 
        AND TRIM(phone) != ''
      GROUP BY TRIM(LOWER(fullname)), TRIM(phone)
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    db.all(findDuplicatesQuery, [], (err, duplicateGroups) => {
      if (err) {
        console.error('❌ Lỗi khi tìm khách hàng trùng lặp:', err);
        reject(err);
        return;
      }

      if (duplicateGroups.length === 0) {
        console.log('✅ Không tìm thấy khách hàng trùng lặp');
        resolve({ removed: 0, groups: 0 });
        return;
      }

      console.log(`📊 Tìm thấy ${duplicateGroups.length} nhóm khách hàng trùng lặp:`);
      
      let totalRemoved = 0;
      let processedGroups = 0;

      duplicateGroups.forEach((group, index) => {
        console.log(`\n${index + 1}. Tên: "${group.fullname}" - SĐT: "${group.phone}"`);
        console.log(`   Số bản sao: ${group.count}`);
        console.log(`   IDs: ${group.ids}`);
        
        // Lấy danh sách ID để xóa (giữ lại ID nhỏ nhất - khách hàng được tạo sớm nhất)
        const allIds = group.ids.split(',').map(id => parseInt(id));
        const keepId = Math.min(...allIds);
        const removeIds = allIds.filter(id => id !== keepId);
        
        console.log(`   Giữ lại ID: ${keepId}`);
        console.log(`   Xóa IDs: ${removeIds.join(', ')}`);

        // Xóa các bản sao
        if (removeIds.length > 0) {
          const placeholders = removeIds.map(() => '?').join(',');
          const deleteQuery = `DELETE FROM customers WHERE id IN (${placeholders})`;
          
          db.run(deleteQuery, removeIds, function(deleteErr) {
            if (deleteErr) {
              console.error(`   ❌ Lỗi khi xóa nhóm ${index + 1}:`, deleteErr);
            } else {
              console.log(`   ✅ Đã xóa ${this.changes} bản sao`);
              totalRemoved += this.changes;
            }
            
            processedGroups++;
            
            // Kiểm tra xem đã xử lý hết chưa
            if (processedGroups === duplicateGroups.length) {
              console.log(`\n🎉 Hoàn thành! Đã xóa tổng cộng ${totalRemoved} khách hàng trùng lặp từ ${duplicateGroups.length} nhóm`);
              resolve({ removed: totalRemoved, groups: duplicateGroups.length });
            }
          });
        } else {
          processedGroups++;
          if (processedGroups === duplicateGroups.length) {
            console.log(`\n🎉 Hoàn thành! Đã xóa tổng cộng ${totalRemoved} khách hàng trùng lặp từ ${duplicateGroups.length} nhóm`);
            resolve({ removed: totalRemoved, groups: duplicateGroups.length });
          }
        }
      });
    });
  });
}

// Hiển thị thống kê trước khi xóa
function showStatistics() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as total FROM customers', [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`📈 Tổng số khách hàng hiện tại: ${result.total}`);
      
      // Đếm số khách hàng có thể bị trùng lặp
      const duplicateCountQuery = `
        SELECT COUNT(*) as duplicates
        FROM (
          SELECT fullname, phone, COUNT(*) as count
          FROM customers 
          WHERE fullname IS NOT NULL 
            AND phone IS NOT NULL 
            AND TRIM(fullname) != '' 
            AND TRIM(phone) != ''
          GROUP BY TRIM(LOWER(fullname)), TRIM(phone)
          HAVING COUNT(*) > 1
        ) as dup_groups
      `;
      
      db.get(duplicateCountQuery, [], (err2, dupResult) => {
        if (err2) {
          reject(err2);
          return;
        }
        
        console.log(`🔍 Số nhóm khách hàng trùng lặp: ${dupResult.duplicates}`);
        resolve();
      });
    });
  });
}

// Chạy script
async function main() {
  try {
    await showStatistics();
    
    console.log('\n⚠️  CẢNH BÁO: Script này sẽ xóa vĩnh viễn các khách hàng trùng lặp!');
    console.log('Tiêu chí trùng lặp: Cùng tên AND cùng số điện thoại');
    console.log('Sẽ giữ lại khách hàng có ID nhỏ nhất (tạo sớm nhất)\n');
    
    // Trong môi trường thực tế, bạn có thể thêm prompt để xác nhận
    // const readline = require('readline');
    // const rl = readline.createInterface({...});
    // Tạm thời chạy tự động
    
    const result = await removeDuplicateCustomers();
    
    console.log('\n📊 Kết quả:');
    console.log(`- Số nhóm trùng lặp đã xử lý: ${result.groups}`);
    console.log(`- Số khách hàng đã xóa: ${result.removed}`);
    
    // Hiển thị thống kê sau khi xóa
    console.log('\n📈 Thống kê sau khi xóa:');
    await showStatistics();
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Lỗi khi đóng database:', err);
      } else {
        console.log('✅ Đã đóng kết nối database');
      }
    });
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main();
}

module.exports = { removeDuplicateCustomers, showStatistics };
