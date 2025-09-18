const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkInvoicesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking invoices table...');
    
    // Check if invoices table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invoices'
      );
    `);
    
    console.log('Invoices table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check invoices table structure
      const invoicesColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'invoices'
        ORDER BY ordinal_position
      `);
      
      console.log('Invoices columns:', invoicesColumns.rows.map(row => row.column_name));
      
      // Check invoice_items table
      const itemsTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'invoice_items'
        );
      `);
      
      console.log('Invoice_items table exists:', itemsTableExists.rows[0].exists);
      
      if (itemsTableExists.rows[0].exists) {
        const itemsColumns = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'invoice_items'
          ORDER BY ordinal_position
        `);
        
        console.log('Invoice_items columns:', itemsColumns.rows.map(row => row.column_name));
      }
      
      // Sample data
      const invoicesSample = await client.query('SELECT * FROM invoices LIMIT 3');
      console.log('Invoices sample:', invoicesSample.rows);
      
      if (itemsTableExists.rows[0].exists) {
        const itemsSample = await client.query('SELECT * FROM invoice_items LIMIT 3');
        console.log('Invoice_items sample:', itemsSample.rows);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking invoices table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkInvoicesTable().catch(console.error);
