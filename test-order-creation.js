const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderCreation() {
  try {
    console.log('🧪 Testing order creation and retrieval...');
    
    // 1. Kiểm tra bảng orders
    console.log('\n1. Checking orders table...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false })
      .limit(3);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
    } else {
      console.log('✅ Orders found:', orders.length);
      orders.forEach(order => {
        console.log(`  - Order ${order.id}: ${order.order_number} (${order.status})`);
      });
    }
    
    // 2. Kiểm tra bảng order_items
    console.log('\n2. Checking order_items table...');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);
    
    if (itemsError) {
      console.error('❌ Error fetching order_items:', itemsError);
    } else {
      console.log('✅ Order items found:', orderItems.length);
      orderItems.forEach(item => {
        console.log(`  - Item ${item.id}: ${item.service_name} (qty: ${item.quantity})`);
      });
    }
    
    // 3. Kiểm tra join orders + order_items
    console.log('\n3. Checking orders with items...');
    const { data: ordersWithItems, error: joinError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          food_item_id,
          service_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('id', { ascending: false })
      .limit(2);
    
    if (joinError) {
      console.error('❌ Error fetching orders with items:', joinError);
    } else {
      console.log('✅ Orders with items found:', ordersWithItems.length);
      ordersWithItems.forEach(order => {
        console.log(`  - Order ${order.id}: ${order.order_number}`);
        console.log(`    Items: ${order.order_items?.length || 0}`);
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach(item => {
            console.log(`      - ${item.service_name} (${item.quantity}x) - ${item.total_price}đ`);
          });
        }
      });
    }
    
    // 4. Kiểm tra food_items để test
    console.log('\n4. Checking food_items for testing...');
    const { data: foodItems, error: foodError } = await supabase
      .from('food_items')
      .select('id, name, price')
      .limit(3);
    
    if (foodError) {
      console.error('❌ Error fetching food_items:', foodError);
    } else {
      console.log('✅ Food items found:', foodItems.length);
      foodItems.forEach(item => {
        console.log(`  - ${item.name}: ${item.price}đ`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testOrderCreation();
