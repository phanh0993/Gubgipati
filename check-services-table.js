const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServicesTable() {
  console.log('🔍 Checking services table...');
  
  try {
    // Lấy tất cả services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .order('id');
      
    if (servicesError) {
      throw new Error(`Error fetching services: ${servicesError.message}`);
    }
    
    console.log('🛠️ Available services:');
    services.forEach(service => {
      console.log(`  ID ${service.id}: ${service.name}`);
    });
    
    // Kiểm tra xem có service nào tương ứng với food_item_id 79-81 không
    console.log('\n🔍 Looking for services that match food_items 79-81...');
    
    const { data: foodItems, error: foodItemsError } = await supabase
      .from('food_items')
      .select('id, name')
      .in('id', [79, 80, 81]);
      
    if (foodItemsError) {
      throw new Error(`Error fetching food_items: ${foodItemsError.message}`);
    }
    
    console.log('🍽️ Food items 79-81:');
    foodItems.forEach(item => {
      console.log(`  ID ${item.id}: ${item.name}`);
    });
    
    // Tìm service có tên tương tự
    console.log('\n🔍 Looking for matching services...');
    foodItems.forEach(foodItem => {
      const matchingService = services.find(service => 
        service.name.toLowerCase().includes(foodItem.name.toLowerCase()) ||
        foodItem.name.toLowerCase().includes(service.name.toLowerCase())
      );
      
      if (matchingService) {
        console.log(`✅ Food item ${foodItem.id} (${foodItem.name}) matches service ${matchingService.id} (${matchingService.name})`);
      } else {
        console.log(`❌ No matching service for food item ${foodItem.id} (${foodItem.name})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkServicesTable();
