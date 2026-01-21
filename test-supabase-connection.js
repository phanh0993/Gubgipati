// Script test kết nối Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔄 Test kết nối Supabase...\n');

  try {
    // Test 1: Kiểm tra bảng food_categories
    console.log('1️⃣ Kiểm tra bảng food_categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('food_categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      console.log('❌ Lỗi food_categories:', categoriesError.message);
    } else {
      console.log('✅ Bảng food_categories OK:', categories.length, 'danh mục');
    }

    // Test 2: Kiểm tra bảng food_items
    console.log('\n2️⃣ Kiểm tra bảng food_items...');
    const { data: items, error: itemsError } = await supabase
      .from('food_items')
      .select('*')
      .limit(5);

    if (itemsError) {
      console.log('❌ Lỗi food_items:', itemsError.message);
    } else {
      console.log('✅ Bảng food_items OK:', items.length, 'món ăn');
    }

    // Test 3: Kiểm tra bảng buffet_package_items
    console.log('\n3️⃣ Kiểm tra bảng buffet_package_items...');
    const { data: buffetItems, error: buffetError } = await supabase
      .from('buffet_package_items')
      .select('*')
      .limit(5);

    if (buffetError) {
      console.log('❌ Lỗi buffet_package_items:', buffetError.message);
    } else {
      console.log('✅ Bảng buffet_package_items OK:', buffetItems.length, 'items');
    }

    // Test 4: Kiểm tra bảng buffet_packages
    console.log('\n4️⃣ Kiểm tra bảng buffet_packages...');
    const { data: packages, error: packagesError } = await supabase
      .from('buffet_packages')
      .select('*')
      .limit(5);

    if (packagesError) {
      console.log('❌ Lỗi buffet_packages:', packagesError.message);
    } else {
      console.log('✅ Bảng buffet_packages OK:', packages.length, 'gói vé');
    }

    console.log('\n🎉 Test kết nối hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi test kết nối:', error);
  }
}

// Chạy test
testSupabaseConnection();
