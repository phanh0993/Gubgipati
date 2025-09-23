const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrder71() {
  console.log('🔍 Debugging Order 71 and Invoice 61...');
  
  try {
    // 1. Kiểm tra order 71
    console.log('\n📋 Order 71 details:');
    const { data: order71, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', 71)
      .single();
      
    if (orderError) {
      console.error('❌ Order 71 error:', orderError);
    } else {
      console.log('Order 71:', order71);
    }
    
    // 2. Kiểm tra order_items của order 71
    console.log('\n🍽️ Order items for order 71:');
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
      .eq('order_id', 71);
      
    if (orderItemsError) {
      console.error('❌ Order items error:', orderItemsError);
    } else {
      console.log(`Found ${orderItems.length} order items:`);
      orderItems.forEach((item, index) => {
        console.log(`${index + 1}. ID ${item.food_item_id}: ${item.food_items?.name} - Qty: ${item.quantity} - Price: ${item.unit_price}`);
      });
    }
    
    // 3. Kiểm tra invoice 61
    console.log('\n🧾 Invoice 61 details:');
    const { data: invoice61, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', 61)
      .single();
      
    if (invoiceError) {
      console.error('❌ Invoice 61 error:', invoiceError);
    } else {
      console.log('Invoice 61:', invoice61);
    }
    
    // 4. Kiểm tra invoice_items của invoice 61
    console.log('\n📦 Invoice items for invoice 61:');
    const { data: invoiceItems, error: invoiceItemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', 61);
      
    if (invoiceItemsError) {
      console.error('❌ Invoice items error:', invoiceItemsError);
    } else {
      console.log(`Found ${invoiceItems.length} invoice items:`);
      invoiceItems.forEach((item, index) => {
        console.log(`${index + 1}. Service ID: ${item.service_id} - Qty: ${item.quantity} - Price: ${item.unit_price} - Total: ${item.total_price}`);
      });
    }
    
    // 5. Kiểm tra buffet_packages để hiểu về vé
    console.log('\n🎫 Buffet packages:');
    const { data: buffetPackages, error: buffetError } = await supabase
      .from('buffet_packages')
      .select('*')
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

debugOrder71();
