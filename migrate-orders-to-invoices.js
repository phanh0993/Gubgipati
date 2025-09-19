const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://yydxhcvxkmxbohqtbbvw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwMzc2MCwiZXhwIjoyMDczNTc5NzYwfQ.h13AABZM9Sy9dM4sbTIlI8f6XHs_rDA0UNifwvQorqs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateOrdersToInvoices() {
  try {
    console.log('🔄 Bắt đầu chuyển đổi orders sang invoices...');
    
    // 1. Lấy tất cả orders đã thanh toán
    const { data: paidOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          food_item_id,
          quantity,
          unit_price,
          total_price,
          food_items (name)
        )
      `)
      .in('status', ['paid', 'served', 'completed']);
    
    if (ordersError) {
      throw ordersError;
    }
    
    console.log(`📊 Tìm thấy ${paidOrders.length} orders đã thanh toán`);
    
    // 2. Lấy danh sách invoices hiện có để tránh trùng lặp (dựa vào notes)
    const { data: existingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('notes');
    
    if (invoicesError) {
      throw invoicesError;
    }
    
    const existingOrderNumbers = new Set();
    existingInvoices.forEach(inv => {
      const match = inv.notes?.match(/Order: ([A-Z0-9-]+)/);
      if (match) {
        existingOrderNumbers.add(match[1]);
      }
    });
    console.log(`📋 Đã có ${existingOrderNumbers.size} invoices từ orders`);
    
    // 3. Tạo invoices cho orders chưa có invoice
    const ordersToMigrate = paidOrders.filter(order => 
      !existingOrderNumbers.has(order.order_number || order.id.toString())
    );
    console.log(`🆕 Cần tạo ${ordersToMigrate.length} invoices mới`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const order of ordersToMigrate) {
      try {
        // Tính tổng tiền từ order_items
        const totalAmount = order.order_items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
        
        // Tạo invoice data
        const invoiceData = {
          invoice_number: `INV-${order.order_number || order.id}-${Date.now()}`,
          customer_id: order.customer_id || null,
          employee_id: order.employee_id || null,
          subtotal: totalAmount,
          total_amount: totalAmount,
          tax_amount: 0, // Bỏ thuế
          discount_amount: 0,
          payment_method: 'cash',
          payment_status: 'paid',
          invoice_date: order.created_at || new Date().toISOString(),
          notes: `Migrated from Order: ${order.order_number || order.id} - Table ID: ${order.table_id || 'N/A'}`
        };
        
        // Tạo invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert(invoiceData)
          .select('*')
          .single();
        
        if (invoiceError) {
          console.error(`❌ Lỗi tạo invoice cho order ${order.id}:`, invoiceError.message);
          errorCount++;
          continue;
        }
        
        // Tạo invoice items từ order_items
        if (order.order_items && order.order_items.length > 0) {
          const invoiceItems = order.order_items.map(item => ({
            invoice_id: newInvoice.id,
            service_id: item.food_item_id,
            service_name: item.food_items?.name || 'Food Item',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));
          
          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems);
          
          if (itemsError) {
            console.error(`⚠️ Lỗi tạo invoice items cho order ${order.id}:`, itemsError.message);
          }
        }
        
        console.log(`✅ Tạo invoice thành công cho order ${order.id} - Amount: ${totalAmount.toLocaleString()} VND`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Lỗi xử lý order ${order.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Kết quả migration:');
    console.log(`✅ Thành công: ${successCount} invoices`);
    console.log(`❌ Lỗi: ${errorCount} invoices`);
    console.log(`📊 Tổng orders đã thanh toán: ${paidOrders.length}`);
    console.log(`📋 Invoices hiện có: ${existingOrderNumbers.size}`);
    console.log(`🆕 Invoices mới tạo: ${successCount}`);
    
  } catch (error) {
    console.error('💥 Lỗi migration:', error);
  }
}

// Chạy migration
migrateOrdersToInvoices();
