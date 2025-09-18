const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'july-spa-secret');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
      if (req.method === 'GET') {
        const employeeId = parseInt(req.query.id);
        const { month } = req.query;
        
        console.log('🔍 Payroll Employee API called:', { employeeId, month, query: req.query });
        
        if (!employeeId || !month) {
          return res.status(400).json({ error: 'Employee ID and month are required' });
        }
        
        // Get employee info
        const employeeQuery = `
          SELECT id, employee_code, fullname, position, base_salary, commission_rate, is_active
          FROM employees 
          WHERE id = $1 AND is_active = true
        `;
        
        const employeeResult = await client.query(employeeQuery, [employeeId]);
        
        if (employeeResult.rows.length === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }
        
        const employee = employeeResult.rows[0];
        
        // Parse month (format: YYYY-MM)
        const [year, monthNum] = month.split('-');
        
        // Get invoices for this employee in the specified month
        const invoicesQuery = `
          SELECT DISTINCT
            i.id,
            i.invoice_number,
            i.total_amount,
            i.created_at,
            i.payment_status,
            COALESCE(c.fullname, c.name) as customer_name,
            c.phone as customer_phone
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
          WHERE ii.employee_id = $1 
          AND EXTRACT(YEAR FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2
          AND EXTRACT(MONTH FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3
          AND i.payment_status = 'paid'
          ORDER BY i.created_at DESC
        `;
        
        const invoicesResult = await client.query(invoicesQuery, [employeeId, parseInt(year), parseInt(monthNum)]);
        
        // Get invoice items for each invoice
        const invoicesWithItems = await Promise.all(
          invoicesResult.rows.map(async (invoice) => {
            const itemsQuery = `
              SELECT 
                ii.service_id,
                ii.quantity,
                ii.unit_price,
                s.name as service_name,
                ii.unit_price * ii.quantity * $1 / 100 as commission
              FROM invoice_items ii
              LEFT JOIN services s ON ii.service_id = s.id
              WHERE ii.invoice_id = $2 AND ii.employee_id = $3
            `;
            
            const itemsResult = await client.query(itemsQuery, [employee.commission_rate, invoice.id, employeeId]);
            
            const employeeCommission = itemsResult.rows.reduce((sum, item) => sum + parseFloat(item.commission || 0), 0);
            
            return {
              ...invoice,
              items: itemsResult.rows,
              employee_commission: employeeCommission
            };
          })
        );
        
        // Calculate totals
        const totalCommission = invoicesWithItems.reduce((sum, invoice) => sum + invoice.employee_commission, 0);
        const baseSalary = parseFloat(employee.base_salary || 0);
        const totalSalary = baseSalary + totalCommission;
        
        console.log('📊 Payroll calculation:', { baseSalary, totalCommission, totalSalary });
        
        return res.json({
          employee: {
            id: employee.id,
            employee_code: employee.employee_code,
            fullname: employee.fullname,
            username: employee.fullname, // For compatibility
            position: employee.position,
            base_salary: baseSalary,
            commission_rate: employee.commission_rate
          },
          period: month,
          baseSalary,
          totalCommission,
          totalSalary,
          invoices: invoicesWithItems,
          summary: {
            totalInvoices: invoicesWithItems.length,
            totalRevenue: invoicesWithItems.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
            averageCommissionPerInvoice: invoicesWithItems.length > 0 ? totalCommission / invoicesWithItems.length : 0
          }
        });

      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Payroll Employee API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
