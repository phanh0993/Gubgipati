const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function rebuildAllInvoiceItems() {
  console.log('🔄 Rebuilding all invoice_items from orders and order_items...');
  
  try {
    // 1. Xóa toàn bộ invoice_items
    console.log('🗑️ Deleting all existing invoice_items...');
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .neq('id', 0); // Delete all records
      
    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return;
    }
    console.log('✅ Deleted all existing invoice_items');
    
    // 2. Lấy tất cả invoices
    console.log('📋 Fetching all invoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, notes, employee_id')
      .order('created_at', { ascending: false });
      
    if (invoicesError) {
      throw new Error(`Error fetching invoices: ${invoicesError.message}`);
    }
    
    console.log(`📊 Found ${invoices.length} invoices`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 3. Xử lý từng invoice
    for (const invoice of invoices) {
      console.log(`\n🔍 Processing invoice ID ${invoice.id} (${invoice.invoice_number})...`);
      
      try {
        let orderId = null;
        
        // Strategy 1: Parse order_id từ notes
        if (invoice.notes) {
          const match = String(invoice.notes).match(/order\s*[:#-]?\s*(\d+)/i);
          if (match) {
            orderId = Number(match[1]);
            console.log(`✅ Found order_id from notes: ${orderId}`);
          } else {
            // Strategy 2: Parse order_number từ notes (BUF-xxx)
            const match2 = String(invoice.notes).match(/BUF-(\d+)/i);
            if (match2) {
              const orderNumber = `BUF-${match2[1]}`;
              console.log(`🔍 Looking up order by order_number: ${orderNumber}`);
              
              const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('id')
                .eq('order_number', orderNumber)
                .maybeSingle();
                
              if (orderError) {
                console.error(`❌ Error looking up order: ${orderError.message}`);
                continue;
              }
              
              if (order?.id) {
                orderId = order.id;
                console.log(`✅ Found order_id from order_number: ${orderId}`);
              }
            }
          }
        }
        
        // Strategy 3: Tìm order có order_number giống invoice_number
        if (!orderId && invoice.invoice_number) {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id')
            .eq('order_number', invoice.invoice_number)
            .maybeSingle();
            
          if (!orderError && order?.id) {
            orderId = order.id;
            console.log(`✅ Found order_id matching invoice_number: ${orderId}`);
          }
        }
        
        if (!orderId) {
          console.log(`⚠️ No order found for invoice ${invoice.id}`);
          errorCount++;
          continue;
        }
        
        // Lấy thông tin order để có buffet_package_id
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('buffet_package_id, buffet_quantity, employee_id')
          .eq('id', orderId)
          .single();
          
        if (orderError) {
          console.error(`❌ Error fetching order: ${orderError.message}`);
          errorCount++;
          continue;
        }
        
        // Lấy order_items
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('food_item_id, quantity, unit_price')
          .eq('order_id', orderId);
          
        if (orderItemsError) {
          console.error(`❌ Error fetching order_items: ${orderItemsError.message}`);
          errorCount++;
          continue;
        }
        
        console.log(`📦 Found ${orderItems.length} order_items`);
        
        // Tạo invoice_items với vé buffet + món ăn
        let invoiceItems = [];
        
        // 1. Thêm vé buffet nếu có
        if (order.buffet_package_id) {
          console.log('🎫 Adding buffet package:', order.buffet_package_id);
          const { data: buffetPackage, error: buffetErr } = await supabase
            .from('buffet_packages')
            .select('id, name, price')
            .eq('id', order.buffet_package_id)
            .single();
          
          if (!buffetErr && buffetPackage) {
            invoiceItems.push({
              invoice_id: invoice.id,
              service_id: buffetPackage.id, // Lưu buffet_package_id vào service_id
              employee_id: order.employee_id,
              quantity: Number(order.buffet_quantity || 1),
              unit_price: Number(buffetPackage.price || 0)
            });
            console.log('✅ Added buffet ticket:', buffetPackage.name, buffetPackage.price);
          }
        }
        
        // 2. Thêm món ăn
        if (orderItems && orderItems.length > 0) {
          console.log('🍽️ Adding food items:', orderItems.length);
          const foodItems = orderItems.map((item) => ({
            invoice_id: invoice.id,
            service_id: item.food_item_id, // Lưu food_item_id vào service_id
            employee_id: order.employee_id,
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0)
          }));
          invoiceItems.push(...foodItems);
        }
        
        // Insert tất cả items
        if (invoiceItems.length > 0) {
          console.log('💾 Inserting invoice_items:', invoiceItems.length, 'items');
          const { data: inserted, error: insertError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems)
            .select('*');
            
          if (insertError) {
            console.error('❌ Insert error:', insertError);
            errorCount++;
            continue;
          }
          
          console.log('✅ Successfully created invoice_items:', inserted.length);
          successCount++;
        } else {
          console.log('⚠️ No items to insert for invoice', invoice.id);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Rebuild completed!`);
    console.log(`✅ Successfully processed: ${successCount} invoices`);
    console.log(`❌ Errors: ${errorCount} invoices`);
    
    // 4. Verify kết quả
    console.log('\n🔍 Verifying results...');
    const { data: verifyItems, error: verifyError } = await supabase
      .from('invoice_items')
      .select('invoice_id, service_id, quantity, unit_price')
      .order('invoice_id', { ascending: false })
      .limit(10);
      
    if (!verifyError) {
      console.log('📋 Sample invoice_items:');
      verifyItems.forEach((item, index) => {
        console.log(`${index + 1}. Invoice ${item.invoice_id} - Service ID: ${item.service_id} - Qty: ${item.quantity} - Price: ${item.unit_price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Rebuild failed:', error.message);
    process.exit(1);
  }
}

rebuildAllInvoiceItems();
