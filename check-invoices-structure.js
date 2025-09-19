const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yydxhcvxkmxbohqtbbvw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHhoY3Z4a214Ym9ocXRiYnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwMzc2MCwiZXhwIjoyMDczNTc5NzYwfQ.h13AABZM9Sy9dM4sbTIlI8f6XHs_rDA0UNifwvQorqs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoicesStructure() {
  try {
    console.log('🔍 Kiểm tra cấu trúc bảng invoices...');
    
    // Lấy 1 invoice để xem cấu trúc
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Lỗi:', error);
      return;
    }
    
    if (invoices && invoices.length > 0) {
      console.log('📋 Cấu trúc bảng invoices:');
      console.log(JSON.stringify(invoices[0], null, 2));
    } else {
      console.log('📋 Bảng invoices trống');
    }
    
    // Kiểm tra bảng orders
    console.log('\n🔍 Kiểm tra cấu trúc bảng orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Lỗi orders:', ordersError);
      return;
    }
    
    if (orders && orders.length > 0) {
      console.log('📋 Cấu trúc bảng orders:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('📋 Bảng orders trống');
    }
    
  } catch (error) {
    console.error('💥 Lỗi:', error);
  }
}

checkInvoicesStructure();
