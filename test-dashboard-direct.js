const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testDashboardDirect() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing dashboard API logic directly...');
    
    // Simulate the exact dashboard API logic
    const stats = {
      today: {
        revenue: 0,
        invoices: 0,
        customers: 0,
        appointments: 0
      },
      totals: {
        customers: 0,
        employees: 0,
        services: 0,
        monthlyRevenue: 0
      }
    };

    // Count customers
    try {
      const customersResult = await client.query('SELECT COUNT(*) as count FROM customers WHERE is_active = true');
      stats.totals.customers = parseInt(customersResult.rows[0]?.count || 0) || 0;
      console.log('✅ Customers count:', stats.totals.customers);
    } catch (error) {
      console.log('❌ Customers count failed:', error.message);
      stats.totals.customers = 0;
    }

    // Count employees  
    try {
      const employeesResult = await client.query('SELECT COUNT(*) as count FROM employees WHERE is_active = true');
      stats.totals.employees = parseInt(employeesResult.rows[0]?.count || 0) || 0;
      console.log('✅ Employees count:', stats.totals.employees);
    } catch (error) {
      console.log('❌ Employees count failed:', error.message);
      stats.totals.employees = 0;
    }

    // Count services
    try {
      const servicesResult = await client.query('SELECT COUNT(*) as count FROM services WHERE is_active = true');
      stats.totals.services = parseInt(servicesResult.rows[0]?.count || 0) || 0;
      console.log('✅ Services count:', stats.totals.services);
    } catch (error) {
      console.log('❌ Services count failed:', error.message);
      stats.totals.services = 0;
    }

    // Today's invoices - using Vietnam timezone
    try {
      const todayInvoicesResult = await client.query(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
        FROM invoices 
        WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
        AND payment_status = 'paid'
      `);
      stats.today.invoices = parseInt(todayInvoicesResult.rows[0]?.count || 0) || 0;
      stats.today.revenue = parseFloat(todayInvoicesResult.rows[0]?.revenue || 0) || 0;
      console.log('✅ Today invoices:', stats.today.invoices, 'Revenue:', stats.today.revenue);
    } catch (error) {
      console.log('❌ Today invoices failed:', error.message);
      stats.today.invoices = 0;
      stats.today.revenue = 0;
    }

    // Monthly revenue - using Vietnam timezone
    try {
      const monthlyRevenueResult = await client.query(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue 
        FROM invoices 
        WHERE DATE_TRUNC('month', created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
        AND payment_status = 'paid'
      `);
      const revenue = parseFloat(monthlyRevenueResult.rows[0]?.revenue || 0);
      stats.totals.monthlyRevenue = isNaN(revenue) ? 0 : revenue;
      console.log('✅ Monthly revenue:', stats.totals.monthlyRevenue);
    } catch (error) {
      console.log('❌ Monthly revenue failed:', error.message);
      stats.totals.monthlyRevenue = 0;
    }

    // Get today's invoices with details
    let todayInvoices = [];
    try {
      const todayInvoicesResult = await client.query(`
        SELECT 
          i.id,
          i.invoice_number,
          i.total_amount,
          i.payment_method,
          i.payment_status,
          i.created_at,
          c.fullname as customer_name,
          ii.service_id,
          s.name as service_name,
          s.price as service_price,
          ii.quantity,
          ii.unit_price,
          e.fullname as employee_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        LEFT JOIN services s ON ii.service_id = s.id
        LEFT JOIN employees e ON ii.employee_id = e.id
        WHERE DATE(i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
        AND i.payment_status = 'paid'
        ORDER BY i.created_at DESC
      `);
      todayInvoices = todayInvoicesResult.rows;
      console.log('✅ Today invoices details:', todayInvoices.length);
    } catch (error) {
      console.log('❌ Today invoices details failed:', error.message);
      todayInvoices = [];
    }

    // Final dashboard data
    const dashboardData = {
      stats,
      revenueChart: [
        { name: 'T2', revenue: 0 },
        { name: 'T3', revenue: 0 },
        { name: 'T4', revenue: 0 },
        { name: 'T5', revenue: 0 },
        { name: 'T6', revenue: 0 },
        { name: 'T7', revenue: 0 },
        { name: 'CN', revenue: 0 }
      ],
      topServices: [],
      employeePerformance: [],
      todayAppointments: [],
      todayInvoices: todayInvoices
    };

    console.log('\n📊 Final Dashboard Data:');
    console.log(JSON.stringify(dashboardData, null, 2));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testDashboardDirect().catch(console.error);
