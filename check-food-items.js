const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFoodItems() {
  console.log('🔍 Checking food_items and order_items...');
  
  try {
    // Lấy order_items với food_item_id 79, 80, 81
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('food_item_id, quantity, unit_price')
      .in('food_item_id', [79, 80, 81])
      .limit(10);
      
    if (orderItemsError) {
      throw new Error(`Error fetching order_items: ${orderItemsError.message}`);
    }
    
    console.log('📦 Order items with food_item_id 79-81:', orderItems);
    
    // Lấy tất cả food_items
    const { data: foodItems, error: foodItemsError } = await supabase
      .from('food_items')
      .select('id, name')
      .order('id');
      
    if (foodItemsError) {
      throw new Error(`Error fetching food_items: ${foodItemsError.message}`);
    }
    
    console.log('🍽️ Available food_items:');
    foodItems.forEach(item => {
      console.log(`  ID ${item.id}: ${item.name}`);
    });
    
    // Kiểm tra food_item_id nào không tồn tại
    const existingIds = new Set(foodItems.map(item => item.id));
    const missingIds = orderItems
      .map(item => item.food_item_id)
      .filter(id => !existingIds.has(id));
      
    if (missingIds.length > 0) {
      console.log('❌ Missing food_item_ids:', missingIds);
    } else {
      console.log('✅ All food_item_ids exist');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkFoodItems();
