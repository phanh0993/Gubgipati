const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInvoiceItemsWithFoodItemId() {
  console.log('🔧 Fixing invoice_items to use food_item_id...');
  
  try {
    // 1. Kiểm tra xem cột food_item_id đã tồn tại chưa
    console.log('🔍 Checking if food_item_id column exists...');
    const { data: testData, error: testError } = await supabase
      .from('invoice_items')
      .select('food_item_id')
      .limit(1);
      
    if (testError && testError.message.includes('food_item_id')) {
      console.error('❌ food_item_id column does not exist!');
      console.log('⚠️ Please run the SQL script first: add-food-item-id-column.sql');
      console.log('📝 Go to Supabase Dashboard > SQL Editor and run:');
      console.log('   ALTER TABLE invoice_items ADD COLUMN food_item_id INTEGER;');
      console.log('   ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_food_item_id_fkey FOREIGN KEY (food_item_id) REFERENCES food_items(id);');
      return;
    }
    
    console.log('✅ food_item_id column exists');
    
    // 2. Fix Invoice 63 (order 73)
    console.log('\n🔧 Fixing Invoice 63 (Order 73)...');
    
    // Xóa invoice_items cũ của invoice 63
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', 63);
      
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return;
    }
    console.log('✅ Deleted existing invoice_items for invoice 63');
    
    // Lấy thông tin order 73
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
    
    // Lấy order_items của order 73
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('food_item_id, quantity, unit_price')
      .eq('order_id', 73);
      
    if (orderItemsError) {
      console.error('❌ Order items error:', orderItemsError);
      return;
    }
    console.log(`Found ${orderItems.length} order items:`, orderItems);
    
    // Tạo items để insert
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
          food_item_id: buffetPackage.id, // Lưu buffet_package_id vào food_item_id
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
        food_item_id: item.food_item_id, // Lưu food_item_id từ order_items
        employee_id: order73.employee_id,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0)
      }));
      itemsToInsert.push(...foodItems);
    }
    
    // Insert tất cả items
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
      console.log(`${index + 1}. Food Item ID: ${item.food_item_id} - Qty: ${item.quantity} - Price: ${item.unit_price}`);
    });
    
    // Verify kết quả
    console.log('\n🔍 Verifying results...');
    const { data: verifyItems, error: verifyError } = await supabase
      .from('invoice_items')
      .select(`
        id,
        food_item_id,
        quantity,
        unit_price,
        total_price,
        food_items (
          name
        ),
        buffet_packages (
          name
        )
      `)
      .eq('invoice_id', 63);
      
    if (!verifyError) {
      console.log('📋 Final invoice_items for invoice 63:');
      verifyItems.forEach((item, index) => {
        const itemName = item.food_items?.name || item.buffet_packages?.name || `Item ${item.food_item_id}`;
        console.log(`${index + 1}. ${itemName} (ID: ${item.food_item_id}) - Qty: ${item.quantity} - Price: ${item.unit_price} - Total: ${item.total_price}`);
      });
    }
    
    console.log('\n🎉 Invoice 63 fixed successfully!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixInvoiceItemsWithFoodItemId();
