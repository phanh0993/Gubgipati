const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixTimezoneSync() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking timezone synchronization...');
    
    // Check current timezone settings
    const timezoneInfo = await client.query(`
      SELECT 
        CURRENT_TIMESTAMP as current_timestamp,
        CURRENT_DATE as current_date,
        NOW() as now,
        timezone('UTC', NOW()) as utc_time,
        timezone('Asia/Ho_Chi_Minh', NOW()) as vietnam_time,
        EXTRACT(TIMEZONE FROM NOW()) as timezone_offset
    `);
    
    console.log('🕐 Current Timezone Information:');
    console.log('- Current Timestamp:', timezoneInfo.rows[0].current_timestamp);
    console.log('- Current Date:', timezoneInfo.rows[0].current_date);
    console.log('- Now:', timezoneInfo.rows[0].now);
    console.log('- UTC Time:', timezoneInfo.rows[0].utc_time);
    console.log('- Vietnam Time:', timezoneInfo.rows[0].vietnam_time);
    console.log('- Timezone Offset:', timezoneInfo.rows[0].timezone_offset);
    
    // Check all invoices with their timestamps
    const allInvoices = await client.query(`
      SELECT 
        invoice_number,
        total_amount,
        payment_status,
        created_at,
        DATE(created_at) as db_date,
        DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') as vietnam_date,
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') as vietnam_hour
      FROM invoices 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 All invoices with timezone info:');
    allInvoices.rows.forEach(invoice => {
      console.log(`- ${invoice.invoice_number}: ${invoice.total_amount} ₫ (${invoice.payment_status})`);
      console.log(`  DB Date: ${invoice.db_date}, Vietnam Date: ${invoice.vietnam_date}, Hour: ${invoice.vietnam_hour}`);
      console.log(`  Created: ${invoice.created_at}`);
    });
    
    // Test different date filters
    console.log('\n🔍 Testing different date filters:');
    
    // 1. Current date (UTC)
    const currentDateUTC = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid'
    `);
    console.log(`1. Current Date (UTC): ${currentDateUTC.rows[0].count} invoices, ${currentDateUTC.rows[0].revenue} ₫`);
    
    // 2. Vietnam date
    const vietnamDate = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND payment_status = 'paid'
    `);
    console.log(`2. Vietnam Date: ${vietnamDate.rows[0].count} invoices, ${vietnamDate.rows[0].revenue} ₫`);
    
    // 3. Last 24 hours
    const last24Hours = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE created_at >= NOW() - INTERVAL '24 hours' AND payment_status = 'paid'
    `);
    console.log(`3. Last 24 Hours: ${last24Hours.rows[0].count} invoices, ${last24Hours.rows[0].revenue} ₫`);
    
    // 4. Today in Vietnam timezone (correct approach)
    const todayVietnam = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND payment_status = 'paid'
    `);
    console.log(`4. Today Vietnam: ${todayVietnam.rows[0].count} invoices, ${todayVietnam.rows[0].revenue} ₫`);
    
    // 5. All paid invoices (no date filter)
    const allPaid = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
      FROM invoices 
      WHERE payment_status = 'paid'
    `);
    console.log(`5. All Paid: ${allPaid.rows[0].count} invoices, ${allPaid.rows[0].revenue} ₫`);
    
    // Check customers count
    const customersCount = await client.query(`
      SELECT COUNT(*) as count FROM customers WHERE is_active = true
    `);
    console.log(`\n👥 Customers: ${customersCount.rows[0].count}`);
    
    // Check employees count
    const employeesCount = await client.query(`
      SELECT COUNT(*) as count FROM employees WHERE is_active = true
    `);
    console.log(`👨‍💼 Employees: ${employeesCount.rows[0].count}`);
    
    // Check services count
    const servicesCount = await client.query(`
      SELECT COUNT(*) as count FROM services WHERE is_active = true
    `);
    console.log(`🛍️ Services: ${servicesCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
fixTimezoneSync().catch(console.error);
