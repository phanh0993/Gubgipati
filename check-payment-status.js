const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkPaymentStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking invoices table structure for payment status...');
    
    // Check invoices table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'invoices'
      ORDER BY ordinal_position
    `);
    
    console.log('Invoices table structure:');
    tableStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check if payment_status column exists and its values
    const paymentStatusCheck = await client.query(`
      SELECT DISTINCT payment_status, COUNT(*) as count
      FROM invoices 
      GROUP BY payment_status
    `);
    
    console.log('\nPayment status values:');
    paymentStatusCheck.rows.forEach(row => {
      console.log(`- ${row.payment_status}: ${row.count} invoices`);
    });
    
    // Check recent invoices
    const recentInvoices = await client.query(`
      SELECT id, invoice_number, total_amount, payment_status, payment_method, created_at
      FROM invoices 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\nRecent invoices:');
    recentInvoices.rows.forEach(invoice => {
      console.log(`- ${invoice.invoice_number}: ${invoice.total_amount} ₫ (${invoice.payment_status}) - ${invoice.payment_method}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkPaymentStatus().catch(console.error);
