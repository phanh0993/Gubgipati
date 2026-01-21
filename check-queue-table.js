const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkQueueTable() {
  console.log('\n🔍 Kiểm tra bảng mobile_print_queue...\n');
  
  // Thử các field khác nhau để tìm schema
  const testFields = [
    {order_id: 1, printer_name: 'Test', image_data: 'test', status: 'pending'},
    {order_id: 1, printer_name: 'Test', image_base64: 'test', status: 'pending'},
    {order_id: 1, printer_name: 'Test', content: 'test', status: 'pending'},
    {order_id: 1, printer_name: 'Test', template_content: 'test', status: 'pending'},
  ];
  
  for (const fields of testFields) {
    const { data, error } = await supabase
      .from('mobile_print_queue')
      .insert([fields])
      .select();
    
    if (!error) {
      console.log('✅ Schema phù hợp:');
      console.log('   Fields:', Object.keys(fields).join(', '));
      console.log('   Data:', data[0]);
      
      // Xóa test data
      await supabase.from('mobile_print_queue').delete().eq('id', data[0].id);
      
      return;
    } else {
      console.log(`❌ Thử với fields [${Object.keys(fields).join(', ')}]: ${error.message}`);
    }
  }
  
  console.log('\n📋 Thử query để xem data có sẵn:');
  const { data: existing } = await supabase
    .from('mobile_print_queue')
    .select('*')
    .limit(1);
  
  if (existing && existing.length > 0) {
    console.log('✅ Có data, schema:');
    console.log(JSON.stringify(existing[0], null, 2));
  } else {
    console.log('⚠️ Bảng rỗng, không biết schema');
  }
}

checkQueueTable();

