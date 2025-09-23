const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yydxhcvxkmxbohqtbbvw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRidnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0MzA2NzMsImV4cCI6MjA0MjAwNjY3M30.8R8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderItems() {
  console.log('🔍 Testing order items logic...\n');

  // 1. Kiểm tra order ID 63
  console.log('1. Checking order ID 63...');
  const { data: order63, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', 63)
    .single();

  if (orderError) {
    console.error('❌ Error fetching order 63:', orderError);
    return;
  }

  console.log('✅ Order 63 found:', {
    id: order63.id,
    order_number: order63.order_number,
    status: order63.status,
    total_amount: order63.total_amount
  });

  // 2. Kiểm tra order_items cho order 63
  console.log('\n2. Checking order_items for order 63...');
  const { data: items63, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', 63);

  if (itemsError) {
    console.error('❌ Error fetching order_items:', itemsError);
  } else {
    console.log(`✅ Found ${items63.length} items for order 63:`, items63);
  }

  // 3. Tạo test order mới
  console.log('\n3. Creating test order...');
  const testOrderData = {
    order_number: `TEST-${Date.now()}`,
    table_id: 1,
    employee_id: 14,
    order_type: 'buffet',
    status: 'open',
    subtotal: 150000,
    tax_amount: 0,
    total_amount: 150000,
    buffet_package_id: 1,
    buffet_quantity: 2,
    notes: 'Test order for debugging'
  };

  const { data: newOrder, error: createError } = await supabase
    .from('orders')
    .insert(testOrderData)
    .select('*')
    .single();

  if (createError) {
    console.error('❌ Error creating test order:', createError);
    return;
  }

  console.log('✅ Test order created:', {
    id: newOrder.id,
    order_number: newOrder.order_number
  });

  // 4. Thêm test items
  console.log('\n4. Adding test items...');
  const testItems = [
    {
      order_id: newOrder.id,
      food_item_id: 1,
      quantity: 2,
      unit_price: 50000,
      total_price: 100000
    },
    {
      order_id: newOrder.id,
      food_item_id: 2,
      quantity: 1,
      unit_price: 50000,
      total_price: 50000
    }
  ];

  const { data: insertedItems, error: insertError } = await supabase
    .from('order_items')
    .insert(testItems)
    .select('*');

  if (insertError) {
    console.error('❌ Error inserting test items:', insertError);
  } else {
    console.log('✅ Test items inserted:', insertedItems);
  }

  // 5. Kiểm tra lại
  console.log('\n5. Verifying test order items...');
  const { data: verifyItems, error: verifyError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', newOrder.id);

  if (verifyError) {
    console.error('❌ Error verifying items:', verifyError);
  } else {
    console.log(`✅ Verification: Found ${verifyItems.length} items for test order ${newOrder.id}:`, verifyItems);
  }

  // 6. Test food_items table structure
  console.log('\n6. Checking food_items table...');
  const { data: foodItems, error: foodError } = await supabase
    .from('food_items')
    .select('id, name, price')
    .limit(5);

  if (foodError) {
    console.error('❌ Error fetching food_items:', foodError);
  } else {
    console.log('✅ Food items sample:', foodItems);
  }

  console.log('\n🎯 Test completed!');
}

testOrderItems().catch(console.error);
