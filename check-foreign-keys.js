const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkForeignKeys() {
  console.log('🔍 Checking foreign key constraints...');
  
  try {
    // Kiểm tra cấu trúc bảng invoice_items
    console.log('📋 Testing different service_id values...');
    
    // Test 1: service_id = null
    console.log('\n🧪 Test 1: service_id = null');
    const test1 = {
      invoice_id: 61,
      service_id: null,
      employee_id: 14,
      quantity: 1,
      unit_price: 100000
    };
    
    const { data: result1, error: error1 } = await supabase
      .from('invoice_items')
      .insert(test1)
      .select('*');
      
    if (error1) {
      console.error('❌ Test 1 failed:', error1.message);
    } else {
      console.log('✅ Test 1 passed:', result1);
      // Xóa test record
      await supabase.from('invoice_items').delete().eq('id', result1[0].id);
    }
    
    // Test 2: service_id = 1 (existing service)
    console.log('\n🧪 Test 2: service_id = 1');
    const test2 = {
      invoice_id: 61,
      service_id: 1,
      employee_id: 14,
      quantity: 1,
      unit_price: 100000
    };
    
    const { data: result2, error: error2 } = await supabase
      .from('invoice_items')
      .insert(test2)
      .select('*');
      
    if (error2) {
      console.error('❌ Test 2 failed:', error2.message);
    } else {
      console.log('✅ Test 2 passed:', result2);
      // Xóa test record
      await supabase.from('invoice_items').delete().eq('id', result2[0].id);
    }
    
    // Test 3: service_id = 34 (buffet package id)
    console.log('\n🧪 Test 3: service_id = 34 (buffet package)');
    const test3 = {
      invoice_id: 61,
      service_id: 34,
      employee_id: 14,
      quantity: 1,
      unit_price: 199000
    };
    
    const { data: result3, error: error3 } = await supabase
      .from('invoice_items')
      .insert(test3)
      .select('*');
      
    if (error3) {
      console.error('❌ Test 3 failed:', error3.message);
    } else {
      console.log('✅ Test 3 passed:', result3);
      // Xóa test record
      await supabase.from('invoice_items').delete().eq('id', result3[0].id);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkForeignKeys();
