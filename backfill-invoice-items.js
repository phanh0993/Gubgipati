const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillInvoiceItems() {
  console.log('🔄 Starting backfill of invoice_items...');
  
  try {
    // 1. Lấy tất cả invoices chưa có invoice_items
    console.log('📋 Fetching invoices without invoice_items...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, notes, created_at')
      .order('created_at', { ascending: false });

    if (invoicesError) {
      throw new Error(`Error fetching invoices: ${invoicesError.message}`);
    }

    console.log(`📊 Found ${invoices.length} invoices`);

    // 2. Lấy danh sách invoice_items đã có
    const { data: existingItems, error: itemsError } = await supabase
      .from('invoice_items')
      .select('invoice_id');

    if (itemsError) {
      throw new Error(`Error fetching existing invoice_items: ${itemsError.message}`);
    }

    const existingInvoiceIds = new Set(existingItems.map(item => item.invoice_id));
    console.log(`📦 Found ${existingInvoiceIds.size} invoices with existing invoice_items`);

    // 3. Tìm invoices cần backfill
    const invoicesToProcess = invoices.filter(inv => !existingInvoiceIds.has(inv.id));
    console.log(`🔄 Need to process ${invoicesToProcess.length} invoices`);

    let successCount = 0;
    let errorCount = 0;

    for (const invoice of invoicesToProcess) {
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
        
        if (!orderItems || orderItems.length === 0) {
          console.log(`⚠️ No order_items found for order ${orderId}`);
          errorCount++;
          continue;
        }
        
        console.log(`📦 Found ${orderItems.length} order_items`);
        
        // Tạo invoice_items
        const invoiceItems = orderItems.map(item => ({
          invoice_id: invoice.id,
          service_id: null, // Set to null since we don't have services for food items
          employee_id: null, // Will be filled from invoice if needed
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0)
          // total_price is generated column
        }));
        
        const { data: inserted, error: insertError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems)
          .select('*');
          
        if (insertError) {
          console.error(`❌ Error inserting invoice_items: ${insertError.message}`);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Successfully created ${inserted.length} invoice_items`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Backfill completed!`);
    console.log(`✅ Successfully processed: ${successCount} invoices`);
    console.log(`❌ Errors: ${errorCount} invoices`);
    
  } catch (error) {
    console.error('❌ Backfill failed:', error.message);
    process.exit(1);
  }
}

// Chạy script
backfillInvoiceItems();
