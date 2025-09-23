const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInvoice63() {
  console.log('🔧 Fixing Invoice 63 (Order 73) with proper food_item_id in service_id...');
  
  try {
    // 1. Xóa invoice_items cũ của invoice 63
    console.log('🗑️ Deleting existing invoice_items for invoice 63...');
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', 63);
      
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return;
    }
    console.log('✅ Deleted existing invoice_items');
    
    // 2. Lấy thông tin order 73
    console.log('📋 Fetching order 73 details...');
    const { data: order73, error: orderError } = await supabase
      .from('orders')
      .select('buffet_package_id, buffet_quantity, employee_id')
      .eq('id', 73)
      .single();
      
    if (orderError) {
      console.error('❌ Order 73 error:', orderError);
      return;
    }
    console.log('Order 73:', order73);
    
    // 3. Lấy order_items của order 73
    console.log('🍽️ Fetching order_items for order 73...');
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('food_item_id, quantity, unit_price')
      .eq('order_id', 73);
      
    if (orderItemsError) {
      console.error('❌ Order items error:', orderItemsError);
      return;
    }
    console.log(`Found ${orderItems.length} order items:`, orderItems);
    
    // 4. Tạo items để insert
    let itemsToInsert = [];
    
    // Thêm vé buffet
    if (order73.buffet_package_id) {
      console.log('🎫 Adding buffet package:', order73.buffet_package_id);
      const { data: buffetPackage, error: buffetErr } = await supabase
        .from('buffet_packages')
        .select('id, name, price')
        .eq('id', order73.buffet_package_id)
        .single();
      
      if (!buffetErr && buffetPackage) {
        itemsToInsert.push({
          invoice_id: 63,
          service_id: buffetPackage.id, // Lưu buffet_package_id vào service_id
          employee_id: order73.employee_id,
          quantity: Number(order73.buffet_quantity || 1),
          unit_price: Number(buffetPackage.price || 0)
        });
        console.log('✅ Added buffet ticket:', buffetPackage.name, buffetPackage.price);
      }
    }
    
    // Thêm món ăn
    if (orderItems && orderItems.length > 0) {
      console.log('🍽️ Adding food items:', orderItems.length);
      const foodItems = orderItems.map((item) => ({
        invoice_id: 63,
        service_id: item.food_item_id, // Lưu food_item_id vào service_id
        employee_id: order73.employee_id,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0)
      }));
      itemsToInsert.push(...foodItems);
    }
    
    // 5. Insert tất cả items
    console.log('💾 Inserting invoice_items:', itemsToInsert.length, 'items');
    const { data: inserted, error: insertError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select('*');
      
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return;
    }
    
    console.log('✅ Successfully created invoice_items:', inserted.length);
    inserted.forEach((item, index) => {
      console.log(`${index + 1}. Service ID (food_item_id): ${item.service_id} - Qty: ${item.quantity} - Price: ${item.unit_price}`);
    });
    
    // 6. Verify kết quả với tên món ăn
    console.log('\n🔍 Verifying results with item names...');
    const { data: verifyItems, error: verifyError } = await supabase
      .from('invoice_items')
      .select(`
        id,
        service_id,
        quantity,
        unit_price,
        total_price
      `)
      .eq('invoice_id', 63);
      
    if (!verifyError && verifyItems) {
      console.log('📋 Final invoice_items for invoice 63:');
      
      for (const item of verifyItems) {
        const foodItemId = item.service_id;
        const isTicket = item.unit_price > 0 && [33, 34, 35].includes(foodItemId);
        
        if (isTicket) {
          // Lấy tên vé
          const { data: buffetPackage } = await supabase
            .from('buffet_packages')
            .select('name')
            .eq('id', foodItemId)
            .single();
          
          const itemName = buffetPackage?.name || `VÉ ${item.unit_price.toLocaleString()}K`;
          console.log(`🎫 ${itemName} (ID: ${foodItemId}) - Qty: ${item.quantity} - Price: ${item.unit_price} - Total: ${item.total_price}`);
        } else {
          // Lấy tên món ăn
          const { data: foodItem } = await supabase
            .from('food_items')
            .select('name')
            .eq('id', foodItemId)
            .single();
          
          const itemName = foodItem?.name || `Food Item ${foodItemId}`;
          console.log(`🍽️ ${itemName} (ID: ${foodItemId}) - Qty: ${item.quantity} - Price: ${item.unit_price} - Total: ${item.total_price}`);
        }
      }
    }
    
    console.log('\n🎉 Invoice 63 fixed successfully!');
    console.log('📝 Now invoice_items uses service_id column to store food_item_id and buffet_package_id');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixInvoice63();
