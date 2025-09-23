const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFoodItemIdColumn() {
  console.log('🔍 Checking invoice_items table structure...');
  
  try {
    // Test 1: Kiểm tra cột food_item_id
    console.log('🧪 Test 1: Checking food_item_id column...');
    const { data: test1, error: error1 } = await supabase
      .from('invoice_items')
      .select('food_item_id')
      .limit(1);
      
    if (error1) {
      console.log('❌ food_item_id column does not exist:', error1.message);
    } else {
      console.log('✅ food_item_id column exists');
    }
    
    // Test 2: Kiểm tra cột service_id
    console.log('\n🧪 Test 2: Checking service_id column...');
    const { data: test2, error: error2 } = await supabase
      .from('invoice_items')
      .select('service_id')
      .limit(1);
      
    if (error2) {
      console.log('❌ service_id column does not exist:', error2.message);
    } else {
      console.log('✅ service_id column exists');
    }
    
    // Test 3: Lấy cấu trúc bảng
    console.log('\n📋 Getting full table structure...');
    const { data: sample, error: sampleError } = await supabase
      .from('invoice_items')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('❌ Error getting table structure:', sampleError);
    } else if (sample && sample.length > 0) {
      console.log('📋 Available columns:', Object.keys(sample[0]));
    } else {
      console.log('⚠️ No data in invoice_items table');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkFoodItemIdColumn();
