const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addItemsColumn() {
  try {
    console.log('🔄 Adding items column to orders table...');
    
    // Thêm cột items kiểu JSONB để lưu chi tiết món ăn
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
      `
    });

    if (error) {
      console.error('❌ Error adding items column:', error);
      return;
    }

    console.log('✅ Successfully added items column to orders table');
    
    // Cập nhật dữ liệu hiện tại từ order_items sang cột items
    console.log('🔄 Migrating existing order_items to items column...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id');

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    for (const order of orders) {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          food_item_id,
          service_name,
          quantity,
          unit_price,
          total_price
        `)
        .eq('order_id', order.id);

      if (itemsError) {
        console.error(`❌ Error fetching items for order ${order.id}:`, itemsError);
        continue;
      }

      if (orderItems && orderItems.length > 0) {
        const items = orderItems.map(item => ({
          food_item_id: item.food_item_id,
          name: item.service_name,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total_price
        }));

        const { error: updateError } = await supabase
          .from('orders')
          .update({ items: items })
          .eq('id', order.id);

        if (updateError) {
          console.error(`❌ Error updating items for order ${order.id}:`, updateError);
        } else {
          console.log(`✅ Migrated ${items.length} items for order ${order.id}`);
        }
      }
    }

    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addItemsColumn();
