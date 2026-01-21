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
    console.log('🔍 Payroll API called:', req.method, req.query);

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { employee_id, month } = req.query;
    
    if (!employee_id || !month) {
      return res.status(400).json({ error: 'Employee ID and month are required' });
    }
    
    const employeeId = parseInt(employee_id);
    const [year, monthNum] = month.split('-');
    
    console.log('📊 Processing payroll for:', { employeeId, year, monthNum });

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      // 1. Get employee info
      const employeeQuery = `
        SELECT id, employee_code, fullname, username, position, base_salary, commission_rate, is_active
        FROM employees 
        WHERE id = $1 AND is_active = true
      `;
      const employeeResult = await client.query(employeeQuery, [employeeId]);
      
      if (employeeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      const employee = employeeResult.rows[0];
      console.log('👤 Employee found:', employee.fullname);
      
      // 2. Get invoices where this employee performed services
      const invoicesQuery = `
        SELECT DISTINCT
          i.id,
          i.invoice_number,
          i.total_amount,
          i.created_at,
          i.dichvu,
          COALESCE(c.fullname, c.name, 'Unknown') as customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        INNER JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE ii.employee_id = $1
          AND EXTRACT(YEAR FROM i.created_at) = $2
          AND EXTRACT(MONTH FROM i.created_at) = $3
          AND i.payment_status = 'paid'
        ORDER BY i.created_at DESC
      `;
      
      const invoicesResult = await client.query(invoicesQuery, [employeeId, parseInt(year), parseInt(monthNum)]);
      console.log(`📋 Found ${invoicesResult.rows.length} invoices for employee`);
      console.log('🔍 Invoice query params:', { employeeId, year: parseInt(year), month: parseInt(monthNum) });
      console.log('🔍 Sample invoices:', invoicesResult.rows.slice(0, 2));
      
      // If no invoices found, try alternative queries for debugging
      if (invoicesResult.rows.length === 0) {
        console.log('⚠️ No invoices found, trying alternative queries...');
        
        // Check if any invoices exist at all
        const allInvoicesResult = await client.query('SELECT COUNT(*) as count FROM invoices');
        console.log('📊 Total invoices in system:', allInvoicesResult.rows[0].count);
        
        // Check if any invoice_items exist for this employee
        const itemsCheckResult = await client.query('SELECT COUNT(*) as count FROM invoice_items WHERE employee_id = $1', [employeeId]);
        console.log('📊 Total invoice_items for employee:', itemsCheckResult.rows[0].count);
        
        // Check recent invoices regardless of employee
        const recentInvoicesResult = await client.query(`
          SELECT id, invoice_number, employee_id, employee_name, created_at, payment_status
          FROM invoices 
          WHERE EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2
          ORDER BY created_at DESC LIMIT 5
        `, [parseInt(year), parseInt(monthNum)]);
        console.log('📊 Recent invoices this month:', recentInvoicesResult.rows);
        
        // Check if there are any invoice_items for recent invoices
        const recentItemsResult = await client.query(`
          SELECT ii.*, i.invoice_number
          FROM invoice_items ii
          INNER JOIN invoices i ON ii.invoice_id = i.id
          WHERE EXTRACT(YEAR FROM i.created_at) = $1 AND EXTRACT(MONTH FROM i.created_at) = $2
          LIMIT 10
        `, [parseInt(year), parseInt(monthNum)]);
        console.log('📊 Recent invoice items this month:', recentItemsResult.rows);
      }
      
      // 3. Get detailed items with commission for each invoice
      let totalCommission = 0;
      const invoicesWithDetails = [];
      
      for (const invoice of invoicesResult.rows) {
        // Get invoice items for this employee only
        const itemsQuery = `
          SELECT 
            ii.service_id,
            ii.quantity,
            ii.unit_price,
            s.name as service_name,
            s.commission_rate,
            (ii.unit_price * s.commission_rate / 100) as commission_per_item
          FROM invoice_items ii
          INNER JOIN services s ON ii.service_id = s.id
          WHERE ii.invoice_id = $1 AND ii.employee_id = $2
        `;
        
        const itemsResult = await client.query(itemsQuery, [invoice.id, employeeId]);
        const items = itemsResult.rows;
        
        // Calculate employee's commission for this invoice
        let employeeCommission = 0;
        items.forEach(item => {
          const itemCommission = parseFloat(item.commission_per_item) * item.quantity;
          employeeCommission += itemCommission;
        });
        
        totalCommission += employeeCommission;
        
        invoicesWithDetails.push({
          ...invoice,
          employee_commission: Math.round(employeeCommission),
          items: items.map(item => ({
            ...item,
            commission: Math.round(parseFloat(item.commission_per_item) * item.quantity)
          }))
        });
        
        console.log(`💰 Invoice ${invoice.invoice_number}: ${Math.round(employeeCommission)}₫ commission`);
      }
      
      const response = {
        employee: {
          id: employee.id,
          employee_code: employee.employee_code,
          fullname: employee.fullname,
          username: employee.username,
          position: employee.position,
          base_salary: parseInt(employee.base_salary) || 0,
          commission_rate: parseFloat(employee.commission_rate) || 0
        },
        period: month,
        baseSalary: parseInt(employee.base_salary) || 0,
        totalCommission: Math.round(totalCommission),
        totalSalary: (parseInt(employee.base_salary) || 0) + Math.round(totalCommission),
        invoices: invoicesWithDetails,
        summary: {
          totalInvoices: invoicesResult.rows.length,
          totalRevenue: Math.round(invoicesResult.rows.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)),
          averageCommissionPerInvoice: invoicesResult.rows.length > 0 ? Math.round(totalCommission / invoicesResult.rows.length) : 0
        }
      };
      
      console.log('✅ Payroll calculation complete:', {
        employee: employee.fullname,
        invoices: invoicesResult.rows.length,
        totalCommission: Math.round(totalCommission),
        totalSalary: response.totalSalary
      });
      
      return res.json(response);
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        message: dbError.message 
      });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Payroll API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};