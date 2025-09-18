const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testPaymentStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing payment status functionality...');
    
    // Test data
    const testData = {
      customer_id: 2, // phuc anh
      items: [
        {
          service_id: 1, // Bông service
          employee_id: 1, // 000009 employee
          quantity: 1,
          unit_price: 100000
        }
      ],
      payment_method: 'cash',
      notes: 'Test paid invoice'
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
      
      // Create invoice with payment_status = 'paid'
      const invoiceResult = await client.query(`
        INSERT INTO invoices (invoice_number, customer_id, total_amount, payment_method, payment_status, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'paid', $5, NOW(), NOW())
        RETURNING *
      `, [invoiceNumber, testData.customer_id, totalAmount, testData.payment_method || 'cash', testData.notes || '']);
      
      const invoice = invoiceResult.rows[0];
      console.log('Created PAID invoice:', invoice);
      
      // Create invoice items
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
      
      console.log('✅ PAID Invoice creation successful!');
      console.log('Invoice:', invoice);
      console.log('Items:', invoiceItems);
      
      // Test dashboard query
      console.log('\n🔍 Testing dashboard revenue calculation...');
      const dashboardResult = await client.query(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
        FROM invoices 
        WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid'
      `);
      
      console.log('Today\'s paid invoices:', dashboardResult.rows[0]);
      
      // Test today's invoices with details
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
        WHERE DATE(i.created_at) = CURRENT_DATE AND i.payment_status = 'paid'
        ORDER BY i.created_at DESC
      `);
      
      console.log('Today\'s invoices with details:');
      todayInvoicesResult.rows.forEach(invoice => {
        console.log(`- ${invoice.invoice_number}: ${invoice.customer_name} - ${invoice.service_name} - ${invoice.total_amount} ₫ (${invoice.payment_status})`);
      });
      
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
testPaymentStatus().catch(console.error);
