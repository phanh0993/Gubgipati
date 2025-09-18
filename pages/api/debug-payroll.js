const { Pool } = require('pg');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Debug Payroll API called:', req.query);

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        query: req.query
      };

      // 1. Check if employees exist
      const employeesResult = await client.query('SELECT id, employee_code, fullname FROM employees ORDER BY id');
      debugInfo.employees = employeesResult.rows;

      // 2. Check if invoices exist  
      const invoicesResult = await client.query('SELECT id, invoice_number, employee_id, employee_name, created_at, payment_status FROM invoices ORDER BY created_at DESC LIMIT 10');
      debugInfo.invoices = invoicesResult.rows;

      // 3. Check if invoice_items exist
      const itemsResult = await client.query('SELECT id, invoice_id, service_id, employee_id, quantity, unit_price FROM invoice_items ORDER BY id DESC LIMIT 10');
      debugInfo.invoice_items = itemsResult.rows;

      // 4. Check services
      const servicesResult = await client.query('SELECT id, name, commission_rate FROM services ORDER BY id');
      debugInfo.services = servicesResult.rows;

      // 5. Check specific employee data if provided
      const { employee_id } = req.query;
      if (employee_id) {
        const empId = parseInt(employee_id);
        
        // Check employee details
        const empResult = await client.query('SELECT * FROM employees WHERE id = $1', [empId]);
        debugInfo.specific_employee = empResult.rows[0] || null;

        // Check invoices for this employee
        const empInvoicesResult = await client.query(`
          SELECT i.*, COUNT(ii.id) as item_count
          FROM invoices i
          LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
          WHERE ii.employee_id = $1 OR i.employee_id = $1
          GROUP BY i.id
          ORDER BY i.created_at DESC
        `, [empId]);
        debugInfo.employee_invoices = empInvoicesResult.rows;

        // Check invoice items for this employee
        const empItemsResult = await client.query(`
          SELECT ii.*, s.name as service_name, s.commission_rate
          FROM invoice_items ii
          LEFT JOIN services s ON ii.service_id = s.id
          WHERE ii.employee_id = $1
          ORDER BY ii.id DESC
        `, [empId]);
        debugInfo.employee_items = empItemsResult.rows;
      }

      return res.json(debugInfo);
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        message: dbError.message,
        stack: dbError.stack
      });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Debug API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};
