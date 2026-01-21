// Script để xóa các món duplicate trong type COMBO
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicateComboItems() {
  console.log('🔄 Bắt đầu xóa các món duplicate trong type COMBO...\n');
  
  try {
    // 1. Lấy tất cả món có type = 'COMBO'
    const { data: comboItems, error: fetchError } = await supabase
      .from('food_items')
      .select('id, name, price, type, created_at')
      .eq('type', 'COMBO')
      .order('created_at', { ascending: true }); // Sắp xếp theo thời gian tạo (cũ nhất trước)
    
    if (fetchError) {
      console.error('❌ Lỗi lấy danh sách món COMBO:', fetchError);
      return;
    }
    
    if (!comboItems || comboItems.length === 0) {
      console.log('⚠️  Không tìm thấy món nào có type COMBO');
      return;
    }
    
    console.log(`📋 Tìm thấy ${comboItems.length} món có type COMBO\n`);
    
    // 2. Nhóm theo name và tìm duplicate
    const itemsByName = {};
    comboItems.forEach(item => {
      if (!itemsByName[item.name]) {
        itemsByName[item.name] = [];
      }
      itemsByName[item.name].push(item);
    });
    
    // 3. Tìm các món duplicate (có nhiều hơn 1 bản)
    const duplicatesToDelete = [];
    const itemsToKeep = [];
    
    Object.keys(itemsByName).forEach(name => {
      const items = itemsByName[name];
      if (items.length > 1) {
        console.log(`⚠️  Tìm thấy ${items.length} bản của món "${name}":`);
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ID: ${item.id}, Giá: ${item.price.toLocaleString('vi-VN')}₫, Tạo: ${item.created_at}`);
        });
        
        // Giữ lại món đầu tiên (cũ nhất), xóa các món còn lại
        itemsToKeep.push(items[0]);
        duplicatesToDelete.push(...items.slice(1));
        console.log(`   ✅ Giữ lại ID: ${items[0].id}, Xóa ${items.length - 1} bản duplicate\n`);
      } else {
        itemsToKeep.push(items[0]);
      }
    });
    
    if (duplicatesToDelete.length === 0) {
      console.log('✅ Không có món duplicate nào cần xóa!');
      return;
    }
    
    console.log(`\n🗑️  Sẽ xóa ${duplicatesToDelete.length} món duplicate:\n`);
    duplicatesToDelete.forEach(item => {
      console.log(`   - ID: ${item.id}, Tên: "${item.name}", Giá: ${item.price.toLocaleString('vi-VN')}₫`);
    });
    
    // 4. Kiểm tra xem các món duplicate có đang được sử dụng trong order_items không
    console.log('\n🔍 Kiểm tra các món duplicate có đang được sử dụng...');
    const duplicateIds = duplicatesToDelete.map(item => item.id);
    
    const { data: orderItemsUsingDuplicates, error: checkError } = await supabase
      .from('order_items')
      .select('id, food_item_id, order_id')
      .in('food_item_id', duplicateIds);
    
    if (checkError) {
      console.error('❌ Lỗi kiểm tra order_items:', checkError);
      return;
    }
    
    if (orderItemsUsingDuplicates && orderItemsUsingDuplicates.length > 0) {
      console.log(`⚠️  Cảnh báo: Có ${orderItemsUsingDuplicates.length} order_items đang sử dụng các món duplicate này!`);
      console.log('   Không thể xóa các món đang được sử dụng. Chỉ xóa các món không được sử dụng.\n');
      
      // Chỉ xóa các món không được sử dụng
      const usedIds = new Set(orderItemsUsingDuplicates.map(oi => oi.food_item_id));
      const safeToDelete = duplicatesToDelete.filter(item => !usedIds.has(item.id));
      
      if (safeToDelete.length === 0) {
        console.log('❌ Tất cả món duplicate đều đang được sử dụng, không thể xóa!');
        return;
      }
      
      console.log(`✅ Có ${safeToDelete.length} món duplicate an toàn để xóa:\n`);
      safeToDelete.forEach(item => {
        console.log(`   - ID: ${item.id}, Tên: "${item.name}"`);
      });
      
      // Xóa các món an toàn
      const safeToDeleteIds = safeToDelete.map(item => item.id);
      const { error: deleteError } = await supabase
        .from('food_items')
        .delete()
        .in('id', safeToDeleteIds);
      
      if (deleteError) {
        console.error('❌ Lỗi xóa món duplicate:', deleteError);
        return;
      }
      
      console.log(`\n✅ Đã xóa ${safeToDelete.length} món duplicate an toàn!`);
      console.log(`⚠️  Còn ${duplicatesToDelete.length - safeToDelete.length} món duplicate đang được sử dụng, không thể xóa.`);
    } else {
      // Không có order_items nào sử dụng, xóa tất cả duplicate
      console.log('✅ Không có order_items nào sử dụng các món duplicate, an toàn để xóa.\n');
      
      const duplicateIdsToDelete = duplicatesToDelete.map(item => item.id);
      const { error: deleteError } = await supabase
        .from('food_items')
        .delete()
        .in('id', duplicateIdsToDelete);
      
      if (deleteError) {
        console.error('❌ Lỗi xóa món duplicate:', deleteError);
        return;
      }
      
      console.log(`✅ Đã xóa ${duplicatesToDelete.length} món duplicate!`);
    }
    
    // 5. Hiển thị danh sách món COMBO còn lại
    console.log('\n📋 Danh sách món COMBO còn lại sau khi xóa duplicate:');
    const { data: remainingItems, error: remainingError } = await supabase
      .from('food_items')
      .select('id, name, price')
      .eq('type', 'COMBO')
      .order('name', { ascending: true });
    
    if (!remainingError && remainingItems) {
      remainingItems.forEach(item => {
        console.log(`   - ${item.name}: ${item.price.toLocaleString('vi-VN')}₫ (ID: ${item.id})`);
      });
    }
    
    console.log('\n✅ Hoàn tất xóa món duplicate!');
  } catch (error) {
    console.error('❌ Lỗi không mong đợi:', error);
  }
}

removeDuplicateComboItems().catch(console.error);









