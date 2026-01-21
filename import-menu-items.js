/**
 * Script import danh sách món ăn mới từ menu vào Supabase
 * Chạy: node import-menu-items.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Danh sách món ăn từ menu
const menuItems = [
  // BÒ (Beef) - type: 'main'
  { name: 'Ba chỉ bò', category: 'Bò', type: 'main', price: 0 },
  { name: 'Thăn lưng bò', category: 'Bò', type: 'main', price: 0 },
  { name: 'Bò Gubgi', category: 'Bò', type: 'main', price: 0 },
  { name: 'Bò cuộn nấm kim châm', category: 'Bò', type: 'main', price: 0 },
  { name: 'Bò vuông', category: 'Bò', type: 'main', price: 0 },
  { name: 'Bắp hoa bò', category: 'Bò', type: 'main', price: 0 },
  { name: 'Lòng bò', category: 'Bò', type: 'main', price: 0 },
  { name: 'Sườn bò', category: 'Bò', type: 'main', price: 0 },
  { name: 'Gù bò', category: 'Bò', type: 'main', price: 0 },
  { name: 'Sườn cừu', category: 'Bò', type: 'main', price: 0 },
  
  // HEO (Pork) - type: 'side'
  { name: 'Da heo', category: 'Heo', type: 'side', price: 0 },
  { name: 'Ba chỉ heo', category: 'Heo', type: 'side', price: 0 },
  { name: 'Vú heo', category: 'Heo', type: 'side', price: 0 },
  { name: 'Ba chỉ heo rừng', category: 'Heo', type: 'side', price: 0 },
  { name: 'Heo Gubgi', category: 'Heo', type: 'side', price: 0 },
  
  // GÀ (Chicken) - type: 'combo'
  { name: 'Cánh gà', category: 'Gà', type: 'combo', price: 0 },
  { name: 'Chân gà rút xương', category: 'Gà', type: 'combo', price: 0 },
  
  // HẢI SẢN (Seafood) - type: 'topping'
  { name: 'Tôm', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Lườn cá hồi', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Cá basa nướng giấy bạc', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Bạch tuộc', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Sò điệp phô mai', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Sò điệp mỡ hành', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Mực một nắng', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Cá hồi nướng giấy bạc', category: 'Hải sản', type: 'topping', price: 0 },
  { name: 'Tôm bơ tỏi nướng giấy bạc', category: 'Hải sản', type: 'topping', price: 0 },
  
  // MÓN NÓNG (Hot Dishes) - type: 'drink'
  { name: 'Soup rong biển', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Soup kim chi', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Cơm trộn', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Tokbokki Gubgi', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Khoai tây chiên', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Miến trộn', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Bánh bao chiên chấm sữa', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Mì trộn cay sốt phô mai', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Soup Bulgubgi', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Mandu chiên', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Cơm kim chi bò', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Popcorn sốt hành/cay', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Phô mai que', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Mì lạnh', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Mì cay Samjang', category: 'Món nóng', type: 'drink', price: 0 },
  { name: 'Mì tương đen', category: 'Món nóng', type: 'drink', price: 0 },
  
  // LẨU (Hot Pot) - type: 'lau'
  { name: 'Lẩu cay 3 cấp độ - Cay ít', category: 'Lẩu', type: 'lau', price: 0 },
  { name: 'Lẩu cay 3 cấp độ - Cay vừa', category: 'Lẩu', type: 'lau', price: 0 },
  { name: 'Lẩu cay 3 cấp độ - Cay nhiều', category: 'Lẩu', type: 'lau', price: 0 },
  { name: 'Dĩa thả lẩu tổng hợp 199', category: 'Lẩu', type: 'lau', price: 0 },
  { name: 'Nấm lẩu', category: 'Lẩu', type: 'lau', price: 0 },
  
  // TRÁNG MIỆNG (Dessert) - type: 'dessert'
  { name: 'Mini Bingsu', category: 'Tráng miệng', type: 'dessert', price: 0 }
];

async function importMenuItems() {
  try {
    console.log('🔄 Bắt đầu import danh sách món ăn...');
    console.log(`📋 Tổng số món: ${menuItems.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const item of menuItems) {
      try {
        // Kiểm tra xem món đã tồn tại chưa
        const { data: existing } = await supabase
          .from('food_items')
          .select('id')
          .eq('name', item.name)
          .single();
        
        if (existing) {
          // Cập nhật món đã tồn tại
          const { error: updateError } = await supabase
            .from('food_items')
            .update({
              type: item.type,
              is_available: true
            })
            .eq('id', existing.id);
          
          if (updateError) {
            console.error(`❌ Lỗi cập nhật ${item.name}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`✅ Đã cập nhật: ${item.name} (${item.category})`);
            successCount++;
          }
        } else {
          // Thêm món mới
          const { error: insertError } = await supabase
            .from('food_items')
            .insert({
              name: item.name,
              description: '',
              type: item.type,
              price: item.price,
              cost: 0,
              preparation_time: 15,
              is_available: true
            });
          
          if (insertError) {
            console.error(`❌ Lỗi thêm ${item.name}:`, insertError.message);
            errorCount++;
          } else {
            console.log(`✅ Đã thêm: ${item.name} (${item.category})`);
            successCount++;
          }
        }
      } catch (err) {
        if (err.code === 'PGRST116') {
          // Không tìm thấy - tiếp tục thêm mới
          const { error: insertError } = await supabase
            .from('food_items')
            .insert({
              name: item.name,
              description: '',
              type: item.type,
              price: item.price,
              cost: 0,
              preparation_time: 15,
              is_available: true
            });
          
          if (insertError) {
            console.error(`❌ Lỗi thêm ${item.name}:`, insertError.message);
            errorCount++;
          } else {
            console.log(`✅ Đã thêm: ${item.name} (${item.category})`);
            successCount++;
          }
        } else {
          console.error(`❌ Lỗi xử lý ${item.name}:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n📊 Kết quả:');
    console.log(`   ✅ Thành công: ${successCount}`);
    console.log(`   ❌ Lỗi: ${errorCount}`);
    console.log(`   ⏭️  Bỏ qua: ${skippedCount}`);
    
    // Hiển thị thống kê theo category
    console.log('\n📋 Thống kê theo category:');
    const categoryStats = {};
    menuItems.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} món`);
    });
    
    console.log('\n✅ Hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

importMenuItems();

