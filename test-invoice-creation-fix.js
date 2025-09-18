const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testInvoiceCreationFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing invoice creation with current database structure...');
    
    // Test data
    const testData = {
      customer_id: 2, // phuc anh
      items: [
        {
          service_id: 1, // Bông service
          employee_id: 1, // 000009 employee
          quantity: 1,
          unit_price: 50000
        }
      ],
      payment_method: 'cash',
      notes: 'Test invoice'
    };
    
    console.log('Test data:', testData);
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Generate invoice number
      let invoiceNumber;
      try {
        const invoiceNumberResult = await client.query(
          'SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 0) + 1 as next_number FROM invoices WHERE invoice_number LIKE \'INV%\''
        );
        const nextNumber = invoiceNumberResult.rows[0].next_number;
        invoiceNumber = `INV${String(nextNumber).padStart(6, '0')}`;
      } catch (numberError) {
        console.log('Invoice number generation error:', numberError.message);
        invoiceNumber = `INV${Date.now().toString().slice(-6)}`;
      }
      
      console.log('Generated invoice number:', invoiceNumber);
      
      // Calculate total
      let totalAmount = 0;
      for (const item of testData.items) {
        totalAmount += (item.unit_price || 0) * (item.quantity || 1);
      }
      
      console.log('Total amount:', totalAmount);
      
      // Check invoices table structure first
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'invoices'
        ORDER BY ordinal_position
      `);
      
      console.log('Invoices table structure:');
      tableStructure.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Create invoice with correct columns
      const invoiceResult = await client.query(`
        INSERT INTO invoices (invoice_number, customer_id, total_amount, payment_method, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [invoiceNumber, testData.customer_id, totalAmount, testData.payment_method || 'cash', testData.notes || '']);
      
      const invoice = invoiceResult.rows[0];
      console.log('Created invoice:', invoice);
      
      // Check invoice_items table structure
      const itemsTableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'invoice_items'
        ORDER BY ordinal_position
      `);
      
      console.log('Invoice_items table structure:');
      itemsTableStructure.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Create invoice items with correct columns
      const invoiceItems = [];
      for (const item of testData.items) {
        const itemResult = await client.query(`
          INSERT INTO invoice_items (invoice_id, service_id, employee_id, quantity, unit_price, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING *
        `, [invoice.id, item.service_id, item.employee_id || null, item.quantity || 1, item.unit_price || 0]);
        
        invoiceItems.push(itemResult.rows[0]);
        console.log('Created invoice item:', itemResult.rows[0]);
      }
      
      // Update customer loyalty points
      try {
        await client.query(`
          UPDATE customers 
          SET loyalty_points = loyalty_points + 1, updated_at = NOW()
          WHERE id = $1
        `, [testData.customer_id]);
        console.log('Updated customer loyalty points');
      } catch (loyaltyError) {
        console.log('Loyalty points update failed:', loyaltyError.message);
      }
      
      await client.query('COMMIT');
      
      console.log('✅ Invoice creation successful!');
      console.log('Invoice:', invoice);
      console.log('Items:', invoiceItems);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Invoice creation error:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testInvoiceCreationFix().catch(console.error);
