const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://yydxhcvxkmxbohqtbbvw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwMzc2MCwiZXhwIjoyMDczNTc5NzYwfQ.h13AABZM9Sy9dM4sbTIlI8f6XHs_rDA0UNifwvQorqs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInvoiceAmounts() {
  try {
    console.log('🔄 Bắt đầu cập nhật amount cho invoices...');
    
    // 1. Lấy tất cả invoices có notes chứa "Migrated from Order"
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .like('notes', '%Migrated from Order%');
    
    if (invoicesError) {
      throw invoicesError;
    }
    
    console.log(`📊 Tìm thấy ${invoices.length} invoices cần cập nhật`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const invoice of invoices) {
      try {
        // Lấy order_id từ notes
        const match = invoice.notes.match(/Order: ([A-Z0-9-]+)/);
        if (!match) {
          console.log(`⚠️ Không tìm thấy order_id trong notes của invoice ${invoice.id}`);
          continue;
        }
        
        const orderNumber = match[1];
        
        // Tìm order tương ứng
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();
        
        if (orderError || !order) {
          console.log(`⚠️ Không tìm thấy order ${orderNumber} cho invoice ${invoice.id}`);
          continue;
        }
        
        // Cập nhật invoice với amount từ order
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            subtotal: order.total_amount || 0,
            total_amount: order.total_amount || 0,
            tax_amount: 0
          })
          .eq('id', invoice.id);
        
        if (updateError) {
          console.error(`❌ Lỗi cập nhật invoice ${invoice.id}:`, updateError.message);
          errorCount++;
          continue;
        }
        
        // Tạo invoice_items từ order_items
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            food_item_id,
            quantity,
            unit_price,
            total_price,
            food_items (name)
          `)
          .eq('order_id', order.id);
        
        if (itemsError) {
          console.error(`⚠️ Lỗi lấy order_items cho order ${order.id}:`, itemsError.message);
        } else if (orderItems && orderItems.length > 0) {
          // Xóa invoice_items cũ
          await supabase
            .from('invoice_items')
            .delete()
            .eq('invoice_id', invoice.id);
          
          // Tạo invoice_items mới
          const invoiceItems = orderItems.map(item => ({
            invoice_id: invoice.id,
            service_id: item.food_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));
          
          const { error: insertItemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems);
          
          if (insertItemsError) {
            console.error(`⚠️ Lỗi tạo invoice_items cho invoice ${invoice.id}:`, insertItemsError.message);
          } else {
            console.log(`✅ Tạo ${invoiceItems.length} invoice_items cho invoice ${invoice.id}`);
          }
        }
        
        console.log(`✅ Cập nhật invoice ${invoice.id} - Amount: ${(order.total_amount || 0).toLocaleString()} VND`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Lỗi xử lý invoice ${invoice.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Kết quả cập nhật:');
    console.log(`✅ Thành công: ${successCount} invoices`);
    console.log(`❌ Lỗi: ${errorCount} invoices`);
    
  } catch (error) {
    console.error('💥 Lỗi cập nhật:', error);
  }
}

// Chạy cập nhật
updateInvoiceAmounts();
