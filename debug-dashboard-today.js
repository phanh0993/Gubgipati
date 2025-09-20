const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Vui lòng cấu hình SUPABASE_URL và SUPABASE_ANON_KEY trong file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDashboardToday() {
  try {
    console.log('🔍 Debug dashboard "Hôm nay" (20/9/2025)...\n');

    // 1. Kiểm tra date range như dashboard
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    console.log('📅 Date range calculation:');
    console.log(`   Now: ${now.toISOString()}`);
    console.log(`   Today start: ${todayStart.toISOString()}`);
    console.log(`   Today end: ${todayEnd.toISOString()}`);
    console.log('');

    // 2. Kiểm tra invoices hôm nay
    console.log('📋 Invoices hôm nay:');
    const { data: todayInvoices, error: todayError } = await supabase
      .from('invoices')
      .select('id, invoice_number, created_at, invoice_date, payment_status, total_amount')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .order('created_at', { ascending: false });

    if (todayError) {
      console.error('❌ Lỗi lấy invoices hôm nay:', todayError);
    } else {
      console.log(`   Số invoices hôm nay: ${todayInvoices?.length || 0}`);
      if (todayInvoices && todayInvoices.length > 0) {
        console.log('   Chi tiết:');
        todayInvoices.forEach((inv, index) => {
          console.log(`   ${index + 1}. ID: ${inv.id}, Số: ${inv.invoice_number}`);
          console.log(`      Created: ${inv.created_at}`);
          console.log(`      Invoice Date: ${inv.invoice_date}`);
          console.log(`      Status: ${inv.payment_status}`);
          console.log(`      Amount: ${inv.total_amount?.toLocaleString()} VND`);
          console.log('');
        });
      }
    }

    // 3. Kiểm tra orders hôm nay
    console.log('📦 Orders hôm nay:');
    const { data: todayOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, created_at, status, total_amount')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Lỗi lấy orders hôm nay:', ordersError);
    } else {
      console.log(`   Số orders hôm nay: ${todayOrders?.length || 0}`);
      if (todayOrders && todayOrders.length > 0) {
        console.log('   Chi tiết:');
        todayOrders.forEach((order, index) => {
          console.log(`   ${index + 1}. ID: ${order.id}, Số: ${order.order_number}`);
          console.log(`      Created: ${order.created_at}`);
          console.log(`      Status: ${order.status}`);
          console.log(`      Amount: ${order.total_amount?.toLocaleString()} VND`);
          console.log('');
        });
      }
    }

    // 4. Kiểm tra tất cả invoices để xem có bao nhiêu hôm nay
    console.log('🔍 Kiểm tra tất cả invoices có created_at hôm nay:');
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('id, invoice_number, created_at, payment_status, total_amount')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Lỗi lấy tất cả invoices:', allError);
    } else {
      const todayInvoicesAll = allInvoices?.filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate.getDate() === now.getDate() && 
               invDate.getMonth() === now.getMonth() && 
               invDate.getFullYear() === now.getFullYear();
      }) || [];
      
      console.log(`   Tổng invoices: ${allInvoices?.length || 0}`);
      console.log(`   Invoices hôm nay (filtered): ${todayInvoicesAll.length}`);
      
      if (todayInvoicesAll.length > 0) {
        console.log('   Chi tiết invoices hôm nay:');
        todayInvoicesAll.forEach((inv, index) => {
          console.log(`   ${index + 1}. ID: ${inv.id}, Số: ${inv.invoice_number}`);
          console.log(`      Created: ${inv.created_at}`);
          console.log(`      Status: ${inv.payment_status}`);
          console.log(`      Amount: ${inv.total_amount?.toLocaleString()} VND`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('💥 Lỗi:', error);
  }
}

debugDashboardToday();
