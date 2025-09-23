const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInvoice61() {
  console.log('🔧 Fixing Invoice 61...');
  
  try {
    // 1. Xóa invoice_items cũ của invoice 61
    console.log('🗑️ Deleting existing invoice_items for invoice 61...');
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', 61);
      
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return;
    }
    console.log('✅ Deleted existing invoice_items');
    
    // 2. Lấy thông tin order 71
    console.log('📋 Fetching order 71 details...');
    const { data: order71, error: orderError } = await supabase
      .from('orders')
      .select('buffet_package_id, buffet_quantity, employee_id')
      .eq('id', 71)
      .single();
      
    if (orderError) {
      console.error('❌ Order 71 error:', orderError);
      return;
    }
    console.log('Order 71:', order71);
    
    // 3. Lấy order_items của order 71
    console.log('🍽️ Fetching order_items for order 71...');
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('food_item_id, quantity, unit_price')
      .eq('order_id', 71);
      
    if (orderItemsError) {
      console.error('❌ Order items error:', orderItemsError);
      return;
    }
    console.log(`Found ${orderItems.length} order items:`, orderItems);
    
    // 4. Tạo items để insert
    let itemsToInsert = [];
    
    // Thêm vé buffet
    if (order71.buffet_package_id) {
      console.log('🎫 Adding buffet package:', order71.buffet_package_id);
      const { data: buffetPackage, error: buffetErr } = await supabase
        .from('buffet_packages')
        .select('id, name, price')
        .eq('id', order71.buffet_package_id)
        .single();
      
      if (!buffetErr && buffetPackage) {
        itemsToInsert.push({
          invoice_id: 61,
          service_id: null, // Vé buffet lưu với service_id = null
          employee_id: order71.employee_id,
          quantity: Number(order71.buffet_quantity || 1),
          unit_price: Number(buffetPackage.price || 0)
        });
        console.log('✅ Added buffet ticket:', buffetPackage.name, buffetPackage.price);
      }
    }
    
    // Thêm món ăn
    if (orderItems && orderItems.length > 0) {
      console.log('🍽️ Adding food items:', orderItems.length);
      const foodItems = orderItems.map((item) => ({
        invoice_id: 61,
        service_id: null, // Món ăn không có service_id
        employee_id: order71.employee_id,
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
      console.log(`${index + 1}. Service ID: ${item.service_id} - Qty: ${item.quantity} - Price: ${item.unit_price}`);
    });
    
    // 6. Verify kết quả
    console.log('\n🔍 Verifying results...');
    const { data: verifyItems, error: verifyError } = await supabase
      .from('invoice_items')
      .select(`
        id,
        service_id,
        quantity,
        unit_price,
        total_price,
        buffet_packages (
          name
        )
      `)
      .eq('invoice_id', 61);
      
    if (!verifyError) {
      console.log('📋 Final invoice_items for invoice 61:');
      verifyItems.forEach((item, index) => {
        const isTicket = item.unit_price >= 100000;
        const itemName = isTicket ? `VÉ ${item.unit_price.toLocaleString()}K` : 'Món ăn';
        console.log(`${index + 1}. ${itemName} - Qty: ${item.quantity} - Price: ${item.unit_price} - Total: ${item.total_price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixInvoice61();
