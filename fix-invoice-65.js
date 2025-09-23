const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInvoice65() {
  console.log('🔧 Fixing Invoice 65 (Order 74) with proper items...');
  
  try {
    // 1. Xóa invoice_items cũ của invoice 65
    console.log('🗑️ Deleting existing invoice_items for invoice 65...');
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', 65);
      
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return;
    }
    console.log('✅ Deleted existing invoice_items');
    
    // 2. Lấy thông tin order 74
    console.log('📋 Fetching order 74 details...');
    const { data: order74, error: orderError } = await supabase
      .from('orders')
      .select('buffet_package_id, buffet_quantity, employee_id')
      .eq('id', 74)
      .single();
      
    if (orderError) {
      console.error('❌ Error fetching order 74:', orderError);
      return;
    }
    
    console.log('Order 74:', order74);
    
    // 3. Lấy order_items của order 74
    console.log('🍽️ Fetching order_items for order 74...');
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('food_item_id, quantity, unit_price')
      .eq('order_id', 74);
      
    if (orderItemsError) {
      console.error('❌ Error fetching order_items:', orderItemsError);
      return;
    }
    
    console.log(`Found ${orderItems.length} order items:`);
    orderItems.forEach((item, index) => {
      console.log(`${index + 1}. ID ${item.food_item_id} - Qty: ${item.quantity} - Price: ${item.unit_price}`);
    });
    
    // 4. Tạo invoice_items mới với vé buffet + món ăn
    let invoiceItems = [];
    
    // Thêm vé buffet
    if (order74.buffet_package_id) {
      console.log('🎫 Adding buffet package:', order74.buffet_package_id);
      const { data: buffetPackage, error: buffetErr } = await supabase
        .from('buffet_packages')
        .select('id, name, price')
        .eq('id', order74.buffet_package_id)
        .single();
      
      if (!buffetErr && buffetPackage) {
        invoiceItems.push({
          invoice_id: 65,
          service_id: buffetPackage.id, // Lưu buffet_package_id vào service_id
          employee_id: order74.employee_id,
          quantity: Number(order74.buffet_quantity || 1),
          unit_price: Number(buffetPackage.price || 0)
        });
        console.log('✅ Added buffet ticket:', buffetPackage.name, buffetPackage.price);
      }
    }
    
    // Thêm món ăn
    if (orderItems && orderItems.length > 0) {
      console.log('🍽️ Adding food items:', orderItems.length);
      const foodItems = orderItems.map((item) => ({
        invoice_id: 65,
        service_id: item.food_item_id, // Lưu food_item_id vào service_id
        employee_id: order74.employee_id,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0)
      }));
      invoiceItems.push(...foodItems);
    }
    
    // 5. Insert tất cả items
    if (invoiceItems.length > 0) {
      console.log('💾 Inserting invoice_items:', invoiceItems.length, 'items');
      const { data: inserted, error: insertError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)
        .select('*');
        
      if (insertError) {
        console.error('❌ Insert error:', insertError);
        return;
      }
      
      console.log('✅ Successfully created invoice_items:', inserted.length);
      
      // 6. Hiển thị kết quả
      console.log('\n📋 Final invoice_items for invoice 65:');
      for (const item of inserted) {
        const isTicket = item.unit_price > 0 && [33, 34, 35].includes(item.service_id);
        if (isTicket) {
          const { data: buffetPackage } = await supabase
            .from('buffet_packages')
            .select('name')
            .eq('id', item.service_id)
            .single();
          console.log(`🎫 ${buffetPackage?.name || `VÉ ${item.unit_price}K`} (ID: ${item.service_id}) - Qty: ${item.quantity} - Price: ${item.unit_price}`);
        } else {
          const { data: foodItem } = await supabase
            .from('food_items')
            .select('name')
            .eq('id', item.service_id)
            .single();
          console.log(`🍽️ ${foodItem?.name || `Food Item ${item.service_id}`} (ID: ${item.service_id}) - Qty: ${item.quantity} - Price: ${item.unit_price}`);
        }
      }
      
      console.log('\n🎉 Invoice 65 fixed successfully!');
    } else {
      console.log('⚠️ No items to insert for invoice 65');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixInvoice65();
