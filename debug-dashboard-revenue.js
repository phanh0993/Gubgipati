const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function debugDashboardRevenue() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging dashboard revenue calculation...');
    
    // Check all invoices today
    const todayInvoices = await client.query(`
      SELECT 
        id,
        invoice_number,
        total_amount,
        payment_status,
        payment_method,
        created_at,
        DATE(created_at) as invoice_date
      FROM invoices 
      WHERE DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC
    `);
    
    console.log('\n📊 All invoices today:');
    todayInvoices.rows.forEach(invoice => {
      console.log(`- ${invoice.invoice_number}: ${invoice.total_amount} ₫ (${invoice.payment_status}) - ${invoice.created_at}`);
    });
    
    // Check paid invoices today
    const paidInvoicesToday = await client.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid'
    `);
    
    console.log('\n💰 Paid invoices today:');
    console.log(`- Count: ${paidInvoicesToday.rows[0].count}`);
    console.log(`- Revenue: ${paidInvoicesToday.rows[0].revenue} ₫`);
    
    // Check all invoices (not just today)
    const allPaidInvoices = await client.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE payment_status = 'paid'
    `);
    
    console.log('\n💰 All paid invoices:');
    console.log(`- Count: ${allPaidInvoices.rows[0].count}`);
    console.log(`- Revenue: ${allPaidInvoices.rows[0].revenue} ₫`);
    
    // Check monthly revenue
    const monthlyRevenue = await client.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) 
      AND payment_status = 'paid'
    `);
    
    console.log('\n📅 Monthly revenue (current month):');
    console.log(`- Count: ${monthlyRevenue.rows[0].count}`);
    console.log(`- Revenue: ${monthlyRevenue.rows[0].revenue} ₫`);
    
    // Check if there are any invoices with different payment_status values
    const paymentStatusCounts = await client.query(`
      SELECT 
        payment_status, 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM invoices 
      GROUP BY payment_status
    `);
    
    console.log('\n📋 Payment status breakdown:');
    paymentStatusCounts.rows.forEach(row => {
      console.log(`- ${row.payment_status}: ${row.count} invoices, ${row.revenue} ₫`);
    });
    
    // Test the exact query used in dashboard API
    console.log('\n🔍 Testing dashboard API query:');
    const dashboardQuery = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid'
    `);
    
    console.log('Dashboard query result:');
    console.log(`- Today's paid invoices: ${dashboardQuery.rows[0].count}`);
    console.log(`- Today's revenue: ${dashboardQuery.rows[0].revenue} ₫`);
    
    // Check current date
    const currentDate = await client.query(`SELECT CURRENT_DATE as today, NOW() as now`);
    console.log(`\n📅 Current date: ${currentDate.rows[0].today}`);
    console.log(`📅 Current time: ${currentDate.rows[0].now}`);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the debug
debugDashboardRevenue().catch(console.error);
