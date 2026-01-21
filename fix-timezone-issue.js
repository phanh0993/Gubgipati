const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixTimezoneIssue() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking timezone and date issues...');
    
    // Check current timezone settings
    const timezoneInfo = await client.query(`
      SELECT 
        CURRENT_TIMESTAMP as current_timestamp,
        CURRENT_DATE as current_date,
        NOW() as now,
        timezone('UTC', NOW()) as utc_time,
        timezone('Asia/Ho_Chi_Minh', NOW()) as vietnam_time
    `);
    
    console.log('🕐 Timezone Information:');
    console.log('- Current Timestamp:', timezoneInfo.rows[0].current_timestamp);
    console.log('- Current Date:', timezoneInfo.rows[0].current_date);
    console.log('- Now:', timezoneInfo.rows[0].now);
    console.log('- UTC Time:', timezoneInfo.rows[0].utc_time);
    console.log('- Vietnam Time:', timezoneInfo.rows[0].vietnam_time);
    
    // Check invoices with different date filters
    console.log('\n📊 Invoices with different date filters:');
    
    // Using CURRENT_DATE (might be UTC)
    const currentDateInvoices = await client.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid'
    `);
    console.log(`- CURRENT_DATE filter: ${currentDateInvoices.rows[0].count} invoices, ${currentDateInvoices.rows[0].revenue} ₫`);
    
    // Using today with timezone
    const todayInvoices = await client.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE 
      AND payment_status = 'paid'
    `);
    console.log(`- Vietnam timezone filter: ${todayInvoices.rows[0].count} invoices, ${todayInvoices.rows[0].revenue} ₫`);
    
    // Using last 24 hours
    const last24HoursInvoices = await client.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE created_at >= NOW() - INTERVAL '24 hours' AND payment_status = 'paid'
    `);
    console.log(`- Last 24 hours: ${last24HoursInvoices.rows[0].count} invoices, ${last24HoursInvoices.rows[0].revenue} ₫`);
    
    // Check all recent invoices with their actual dates
    const recentInvoices = await client.query(`
      SELECT 
        invoice_number,
        total_amount,
        payment_status,
        created_at,
        DATE(created_at) as invoice_date,
        DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') as vietnam_date
      FROM invoices 
      WHERE payment_status = 'paid'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Recent paid invoices:');
    recentInvoices.rows.forEach(invoice => {
      console.log(`- ${invoice.invoice_number}: ${invoice.total_amount} ₫ - ${invoice.created_at} (DB date: ${invoice.invoice_date}, VN date: ${invoice.vietnam_date})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
fixTimezoneIssue().catch(console.error);
