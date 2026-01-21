/**
 * Script tạo/cập nhật 3 gói buffet: 229K, 199K, 169K
 * Chạy: node setup-buffet-packages.js
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

// Danh sách món theo gói
const packages = [
  {
    name: 'Gói 229K',
    price: 229000,
    description: 'Gói đầy đủ tất cả món',
    items: [
      // BÒ - tất cả 10 món
      'Ba chỉ bò', 'Thăn lưng bò', 'Bò Gubgi', 'Bò cuộn nấm kim châm', 'Bò vuông',
      'Bắp hoa bò', 'Lòng bò', 'Sườn bò', 'Gù bò', 'Sườn cừu',
      // HEO - tất cả 5 món
      'Da heo', 'Ba chỉ heo', 'Vú heo', 'Ba chỉ heo rừng', 'Heo Gubgi',
      // GÀ - tất cả 2 món
      'Cánh gà', 'Chân gà rút xương',
      // HẢI SẢN - tất cả 9 món
      'Tôm', 'Lườn cá hồi', 'Cá basa nướng giấy bạc', 'Bạch tuộc',
      'Sò điệp phô mai', 'Sò điệp mỡ hành', 'Mực một nắng',
      'Cá hồi nướng giấy bạc', 'Tôm bơ tỏi nướng giấy bạc',
      // MÓN NÓNG - tất cả 16 món
      'Soup rong biển', 'Soup kim chi', 'Cơm trộn', 'Tokbokki Gubgi',
      'Khoai tây chiên', 'Miến trộn', 'Bánh bao chiên chấm sữa',
      'Mì trộn cay sốt phô mai', 'Soup Bulgubgi', 'Mandu chiên',
      'Cơm kim chi bò', 'Popcorn sốt hành/cay', 'Phô mai que',
      'Mì lạnh', 'Mì cay Samjang', 'Mì tương đen',
      // LẨU - tất cả 5 món
      'Lẩu cay 3 cấp độ - Cay ít', 'Lẩu cay 3 cấp độ - Cay vừa',
      'Lẩu cay 3 cấp độ - Cay nhiều', 'Dĩa thả lẩu tổng hợp 199', 'Nấm lẩu',
      // TRÁNG MIỆNG - 1 món
      'Mini Bingsu'
    ]
  },
  {
    name: 'Gói 199K',
    price: 199000,
    description: 'Gói 199K theo menu',
    items: [
      // BÒ - 7 món
      'Ba chỉ bò', 'Thăn lưng bò', 'Bò Gubgi', 'Bò cuộn nấm kim châm',
      'Bò vuông', 'Bắp hoa bò', 'Lòng bò',
      // HEO - 4 món
      'Da heo', 'Ba chỉ heo', 'Vú heo', 'Ba chỉ heo rừng',
      // GÀ - 2 món
      'Cánh gà', 'Chân gà rút xương',
      // HẢI SẢN - 6 món
      'Tôm', 'Lườn cá hồi', 'Cá basa nướng giấy bạc', 'Bạch tuộc',
      'Sò điệp phô mai', 'Sò điệp mỡ hành',
      // MÓN NÓNG - 13 món
      'Soup rong biển', 'Soup kim chi', 'Cơm trộn', 'Tokbokki Gubgi',
      'Khoai tây chiên', 'Miến trộn', 'Bánh bao chiên chấm sữa',
      'Mì trộn cay sốt phô mai', 'Soup Bulgubgi', 'Mandu chiên',
      'Cơm kim chi bò', 'Popcorn sốt hành/cay', 'Phô mai que',
      // LẨU - 5 món
      'Lẩu cay 3 cấp độ - Cay ít', 'Lẩu cay 3 cấp độ - Cay vừa',
      'Lẩu cay 3 cấp độ - Cay nhiều', 'Dĩa thả lẩu tổng hợp 199', 'Nấm lẩu'
    ]
  },
  {
    name: 'Gói 169K',
    price: 169000,
    description: 'Gói 169K theo menu',
    items: [
      // BÒ - 4 món
      'Ba chỉ bò', 'Thăn lưng bò', 'Bò Gubgi', 'Bò cuộn nấm kim châm',
      // HEO - 2 món
      'Da heo', 'Ba chỉ heo',
      // GÀ - 2 món
      'Cánh gà', 'Chân gà rút xương',
      // HẢI SẢN - 3 món
      'Tôm', 'Lườn cá hồi', 'Cá basa nướng giấy bạc',
      // MÓN NÓNG - 7 món
      'Soup rong biển', 'Soup kim chi', 'Cơm trộn', 'Tokbokki Gubgi',
      'Khoai tây chiên', 'Miến trộn', 'Bánh bao chiên chấm sữa'
    ]
  }
];

async function setupBuffetPackages() {
  try {
    console.log('🔄 Bắt đầu setup buffet packages...\n');
    
    // Lấy tất cả food items để map tên -> id
    const { data: allFoodItems, error: foodError } = await supabase
      .from('food_items')
      .select('id, name');
    
    if (foodError) {
      console.error('❌ Lỗi lấy danh sách món ăn:', foodError);
      throw foodError;
    }
    
    const foodNameToId = {};
    allFoodItems.forEach(item => {
      foodNameToId[item.name] = item.id;
    });
    
    console.log(`📋 Đã load ${allFoodItems.length} món ăn từ database\n`);
    
    for (const pkg of packages) {
      console.log(`📦 Xử lý ${pkg.name} (${pkg.items.length} món)...`);
      
      // Tìm hoặc tạo package
      let { data: existingPackage, error: findError } = await supabase
        .from('buffet_packages')
        .select('id')
        .eq('name', pkg.name)
        .single();
      
      let packageId;
      
      if (findError && findError.code === 'PGRST116') {
        // Package chưa tồn tại - tạo mới
        const { data: newPackage, error: createError } = await supabase
          .from('buffet_packages')
          .insert({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            duration_minutes: 120
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error(`❌ Lỗi tạo package ${pkg.name}:`, createError);
          continue;
        }
        
        packageId = newPackage.id;
        console.log(`   ✅ Đã tạo package mới: ${pkg.name} (ID: ${packageId})`);
      } else if (findError) {
        console.error(`❌ Lỗi tìm package ${pkg.name}:`, findError);
        continue;
      } else {
        // Package đã tồn tại - cập nhật
        packageId = existingPackage.id;
        const { error: updateError } = await supabase
          .from('buffet_packages')
          .update({
            description: pkg.description,
            price: pkg.price
          })
          .eq('id', packageId);
        
        if (updateError) {
          console.error(`❌ Lỗi cập nhật package ${pkg.name}:`, updateError);
          continue;
        }
        
        console.log(`   ✅ Đã cập nhật package: ${pkg.name} (ID: ${packageId})`);
      }
      
      // Xóa tất cả items cũ của package
      const { error: deleteError } = await supabase
        .from('buffet_package_items')
        .delete()
        .eq('package_id', packageId);
      
      if (deleteError) {
        console.warn(`   ⚠️  Lỗi xóa items cũ:`, deleteError.message);
      } else {
        console.log(`   🗑️  Đã xóa items cũ`);
      }
      
      // Thêm items mới
      const packageItems = [];
      let foundCount = 0;
      let notFoundItems = [];
      
      for (const itemName of pkg.items) {
        const foodId = foodNameToId[itemName];
        if (foodId) {
          packageItems.push({
            package_id: packageId,
            food_item_id: foodId,
            is_unlimited: true
          });
          foundCount++;
        } else {
          notFoundItems.push(itemName);
        }
      }
      
      if (packageItems.length > 0) {
        const { error: insertError } = await supabase
          .from('buffet_package_items')
          .insert(packageItems);
        
        if (insertError) {
          console.error(`   ❌ Lỗi thêm items:`, insertError);
        } else {
          console.log(`   ✅ Đã thêm ${foundCount} món vào package`);
        }
      }
      
      if (notFoundItems.length > 0) {
        console.warn(`   ⚠️  Không tìm thấy ${notFoundItems.length} món:`, notFoundItems.join(', '));
      }
      
      console.log('');
    }
    
    console.log('✅ Hoàn thành setup buffet packages!');
    
    // Hiển thị tổng kết
    console.log('\n📊 Tổng kết:');
    for (const pkg of packages) {
      console.log(`   ${pkg.name}: ${pkg.items.length} món - ${pkg.price.toLocaleString('vi-VN')}₫`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

setupBuffetPackages();

