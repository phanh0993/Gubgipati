const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBuffetOrders() {
  console.log('🎫 Testing buffet orders with order_buffet table...\n');

  try {
    // 1. Kiểm tra buffet packages
    console.log('1. Checking buffet packages...');
    const { data: packages, error: pkgError } = await supabase
      .from('buffet_packages')
      .select('id, name, price')
      .limit(3);

    if (pkgError) {
      console.error('❌ Error fetching buffet packages:', pkgError);
      return;
    }

    console.log('✅ Available buffet packages:', packages);
    const testPackage = packages[0];
    if (!testPackage) {
      console.error('❌ No buffet packages found');
      return;
    }

    // 2. Kiểm tra food items
    console.log('\n2. Checking food items...');
    const { data: foodItems, error: foodError } = await supabase
      .from('food_items')
      .select('id, name, price')
      .limit(5);

    if (foodError) {
      console.error('❌ Error fetching food items:', foodError);
      return;
    }

    console.log('✅ Available food items:', foodItems);
    const testFoodItems = foodItems.slice(0, 3);

    // 3. Tạo order lần 1: x vé + 3 món ăn
    console.log('\n3. Creating first order (x tickets + 3 food items)...');
    const order1Data = {
      order_number: `TEST-BUFFET-1-${Date.now()}`,
      table_id: 1,
      employee_id: 14,
      order_type: 'buffet',
      status: 'open',
      subtotal: 0, // Sẽ tính sau
      tax_amount: 0,
      total_amount: 0, // Sẽ tính sau
      buffet_package_id: testPackage.id,
      buffet_quantity: 0, // Không dùng nữa, dùng order_buffet
      notes: 'Test buffet order - first batch'
    };

    const { data: order1, error: order1Error } = await supabase
      .from('orders')
      .insert(order1Data)
      .select('*')
      .single();

    if (order1Error) {
      console.error('❌ Error creating first order:', order1Error);
      return;
    }

    console.log('✅ First order created:', {
      id: order1.id,
      order_number: order1.order_number
    });

    // 4. Thêm x vé vào order_buffet (giả sử x = 2)
    const xTickets = 2;
    console.log(`\n4. Adding ${xTickets} tickets to order_buffet...`);
    const ticketData = Array(xTickets).fill(null).map(() => ({
      order_id: order1.id,
      buffet_package_id: testPackage.id
    }));

    const { data: tickets1, error: tickets1Error } = await supabase
      .from('order_buffet')
      .insert(ticketData)
      .select('*');

    if (tickets1Error) {
      console.error('❌ Error adding tickets:', tickets1Error);
      return;
    }

    console.log(`✅ Added ${tickets1.length} tickets to order_buffet`);

    // 5. Thêm 3 món ăn vào order_items
    console.log('\n5. Adding 3 food items to order_items...');
    const foodItemsData = testFoodItems.map(item => ({
      order_id: order1.id,
      food_item_id: item.id,
      quantity: 1,
      unit_price: item.price,
      total_price: item.price
    }));

    const { data: items1, error: items1Error } = await supabase
      .from('order_items')
      .insert(foodItemsData)
      .select('*');

    if (items1Error) {
      console.error('❌ Error adding food items:', items1Error);
      return;
    }

    console.log(`✅ Added ${items1.length} food items to order_items`);

    // 6. Cập nhật tổng tiền order 1
    const foodTotal1 = items1.reduce((sum, item) => sum + item.total_price, 0);
    const ticketTotal1 = xTickets * testPackage.price;
    const total1 = foodTotal1 + ticketTotal1;

    console.log(`\n6. Updating order 1 totals: Food=${foodTotal1}, Tickets=${ticketTotal1}, Total=${total1}`);
    const { error: update1Error } = await supabase
      .from('orders')
      .update({
        subtotal: total1,
        total_amount: total1
      })
      .eq('id', order1.id);

    if (update1Error) {
      console.error('❌ Error updating order 1 totals:', update1Error);
    } else {
      console.log('✅ Order 1 totals updated');
    }

    // 7. Tạo order lần 2: y vé (cùng bàn)
    console.log('\n7. Creating second order (y tickets, same table)...');
    const yTickets = 3;
    const order2Data = {
      order_number: `TEST-BUFFET-2-${Date.now()}`,
      table_id: 1, // Cùng bàn
      employee_id: 14,
      order_type: 'buffet',
      status: 'open',
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
      buffet_package_id: testPackage.id,
      buffet_quantity: 0,
      notes: 'Test buffet order - second batch'
    };

    const { data: order2, error: order2Error } = await supabase
      .from('orders')
      .insert(order2Data)
      .select('*')
      .single();

    if (order2Error) {
      console.error('❌ Error creating second order:', order2Error);
      return;
    }

    console.log('✅ Second order created:', {
      id: order2.id,
      order_number: order2.order_number
    });

    // 8. Thêm y vé vào order_buffet
    console.log(`\n8. Adding ${yTickets} tickets to order_buffet for order 2...`);
    const ticketData2 = Array(yTickets).fill(null).map(() => ({
      order_id: order2.id,
      buffet_package_id: testPackage.id
    }));

    const { data: tickets2, error: tickets2Error } = await supabase
      .from('order_buffet')
      .insert(ticketData2)
      .select('*');

    if (tickets2Error) {
      console.error('❌ Error adding tickets for order 2:', tickets2Error);
      return;
    }

    console.log(`✅ Added ${tickets2.length} tickets to order_buffet for order 2`);

    // 9. Cập nhật tổng tiền order 2
    const ticketTotal2 = yTickets * testPackage.price;
    console.log(`\n9. Updating order 2 totals: Tickets=${ticketTotal2}`);
    const { error: update2Error } = await supabase
      .from('orders')
      .update({
        subtotal: ticketTotal2,
        total_amount: ticketTotal2
      })
      .eq('id', order2.id);

    if (update2Error) {
      console.error('❌ Error updating order 2 totals:', update2Error);
    } else {
      console.log('✅ Order 2 totals updated');
    }

    // 10. Kiểm tra kết quả
    console.log('\n10. Verifying results...');
    
    // Kiểm tra order_buffet cho cả 2 orders
    const { data: allTickets, error: allTicketsError } = await supabase
      .from('order_buffet')
      .select('*')
      .in('order_id', [order1.id, order2.id])
      .order('order_id');

    if (allTicketsError) {
      console.error('❌ Error fetching all tickets:', allTicketsError);
    } else {
      console.log(`✅ Total tickets in order_buffet: ${allTickets.length}`);
      console.log(`   - Order 1 (${order1.id}): ${allTickets.filter(t => t.order_id === order1.id).length} tickets`);
      console.log(`   - Order 2 (${order2.id}): ${allTickets.filter(t => t.order_id === order2.id).length} tickets`);
    }

    // Kiểm tra order_items
    const { data: allItems, error: allItemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', [order1.id, order2.id])
      .order('order_id');

    if (allItemsError) {
      console.error('❌ Error fetching all items:', allItemsError);
    } else {
      console.log(`✅ Total food items: ${allItems.length}`);
      console.log(`   - Order 1 (${order1.id}): ${allItems.filter(i => i.order_id === order1.id).length} items`);
      console.log(`   - Order 2 (${order2.id}): ${allItems.filter(i => i.order_id === order2.id).length} items`);
    }

    // 11. Test tạo invoice để kiểm tra logic
    console.log('\n11. Testing invoice creation logic...');
    
    // Giả lập tạo invoice cho order 1
    const { data: order1Final, error: order1FinalError } = await supabase
      .from('orders')
      .select(`
        *,
        order_buffet(count),
        order_items(*)
      `)
      .eq('id', order1.id)
      .single();

    if (order1FinalError) {
      console.error('❌ Error fetching final order 1:', order1FinalError);
    } else {
      const ticketCount = order1Final.order_buffet?.[0]?.count || 0;
      const foodItemsCount = order1Final.order_items?.length || 0;
      const expectedTotal = (ticketCount * testPackage.price) + 
                           (order1Final.order_items?.reduce((sum, item) => sum + item.total_price, 0) || 0);
      
      console.log('✅ Order 1 final verification:');
      console.log(`   - Tickets: ${ticketCount} × ${testPackage.price} = ${ticketCount * testPackage.price}`);
      console.log(`   - Food items: ${foodItemsCount} items = ${order1Final.order_items?.reduce((sum, item) => sum + item.total_price, 0) || 0}`);
      console.log(`   - Expected total: ${expectedTotal}`);
      console.log(`   - Actual total: ${order1Final.total_amount}`);
      console.log(`   - Match: ${expectedTotal === order1Final.total_amount ? '✅' : '❌'}`);
    }

    console.log('\n🎯 Test completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Order 1: ${xTickets} tickets + 3 food items = ${total1}`);
    console.log(`   - Order 2: ${yTickets} tickets = ${ticketTotal2}`);
    console.log(`   - Total tickets across both orders: ${xTickets + yTickets}`);
    console.log(`   - Ticket price: ${testPackage.price}`);
    console.log(`   - Formula check: Total bill ÷ ticket price = ${(total1 + ticketTotal2) / testPackage.price} tickets`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBuffetOrders().catch(console.error);
