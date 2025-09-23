const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoiceItemsStructure() {
  console.log('🔍 Checking invoice_items structure...');
  
  try {
    // Lấy một record mẫu từ invoice_items
    const { data: existingItems, error: existingError } = await supabase
      .from('invoice_items')
      .select('*')
      .limit(1);
      
    if (existingError) {
      console.error('❌ Error fetching existing invoice_items:', existingError);
    } else if (existingItems && existingItems.length > 0) {
      console.log('📋 Sample invoice_items record:', existingItems[0]);
      console.log('📋 Available columns:', Object.keys(existingItems[0]));
    } else {
      console.log('⚠️ No existing invoice_items found');
    }
    
    // Thử insert với food_item_id thay vì service_id
    console.log('\n🧪 Testing insert with food_item_id...');
    
    const testData = {
      invoice_id: 59,
      food_item_id: 79, // Thử dùng food_item_id thay vì service_id
      quantity: 1,
      unit_price: 100000
    };
    
    console.log('📝 Test data:', testData);
    
    const { data, error } = await supabase
      .from('invoice_items')
      .insert(testData)
      .select('*');
      
    if (error) {
      console.error('❌ Insert with food_item_id error:', error);
    } else {
      console.log('✅ Insert with food_item_id successful:', data);
      
      // Xóa test record
      await supabase
        .from('invoice_items')
        .delete()
        .eq('id', data[0].id);
      console.log('🗑️ Test record deleted');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkInvoiceItemsStructure();
