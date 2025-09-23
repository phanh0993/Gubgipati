const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoiceItemsSchema() {
  console.log('🔍 Checking invoice_items schema and constraints...');
  
  try {
    // Thử insert một record đơn giản để xem lỗi chi tiết
    console.log('🧪 Testing simple insert...');
    
    const testData = {
      invoice_id: 59, // Invoice ID 59 như bạn đề cập
      service_id: 79, // Food item ID 79
      quantity: 1,
      unit_price: 100000
    };
    
    console.log('📝 Test data:', testData);
    
    const { data, error } = await supabase
      .from('invoice_items')
      .insert(testData)
      .select('*');
      
    if (error) {
      console.error('❌ Insert error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
    } else {
      console.log('✅ Insert successful:', data);
      
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

checkInvoiceItemsSchema();
