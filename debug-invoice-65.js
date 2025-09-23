const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInvoice65() {
  console.log('🔍 Debugging Invoice 65 and Order 74...');
  
  try {
    // 1. Kiểm tra invoice 65
    console.log('\n🧾 Invoice 65 details:');
    const { data: invoice65, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', 65)
      .single();
      
    if (invoiceError) {
      console.error('❌ Invoice 65 error:', invoiceError);
    } else {
      console.log('Invoice 65:', invoice65);
    }
    
    // 2. Kiểm tra invoice_items của invoice 65
    console.log('\n📦 Invoice items for invoice 65:');
    const { data: invoiceItems, error: invoiceItemsError } = await supabase
      .from('invoice_items')
      .select(`
        id,
        service_id,
        quantity,
        unit_price,
        total_price
      `)
      .eq('invoice_id', 65);
      
    if (invoiceItemsError) {
      console.error('❌ Invoice items error:', invoiceItemsError);
    } else {
      console.log(`Found ${invoiceItems.length} invoice items:`);
      invoiceItems.forEach((item, index) => {
        console.log(`${index + 1}. Service ID: ${item.service_id} - Qty: ${item.quantity} - Price: ${item.unit_price} - Total: ${item.total_price}`);
      });
    }
    
    // 3. Kiểm tra order 74
    console.log('\n📋 Order 74 details:');
    const { data: order74, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', 74)
      .single();
      
    if (orderError) {
      console.error('❌ Order 74 error:', orderError);
    } else {
      console.log('Order 74:', order74);
    }
    
    // 4. Kiểm tra order_items của order 74
    console.log('\n🍽️ Order items for order 74:');
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        food_item_id,
        quantity,
        unit_price,
        total_price,
        food_items (
          id,
          name,
          price
        )
      `)
      .eq('order_id', 74);
      
    if (orderItemsError) {
      console.error('❌ Order items error:', orderItemsError);
    } else {
      console.log(`Found ${orderItems.length} order items:`);
      orderItems.forEach((item, index) => {
        console.log(`${index + 1}. ID ${item.food_item_id}: ${item.food_items?.name} - Qty: ${item.quantity} - Price: ${item.unit_price}`);
      });
    }
    
    // 5. Kiểm tra buffet_packages
    console.log('\n🎫 Buffet packages:');
    const { data: buffetPackages, error: buffetError } = await supabase
      .from('buffet_packages')
      .select('id, name, price')
      .order('id');
      
    if (buffetError) {
      console.error('❌ Buffet packages error:', buffetError);
    } else {
      console.log('Available buffet packages:');
      buffetPackages.forEach(pkg => {
        console.log(`ID ${pkg.id}: ${pkg.name} - ${pkg.price}đ`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debugInvoice65();
