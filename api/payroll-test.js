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
    console.log('🔍 Payroll Test API called with query:', req.query);
    
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
        const { employee_id, month } = req.query;
        
        console.log('📊 Parameters:', { employee_id, month });
        
        if (!employee_id || !month) {
          return res.json({
            error: 'Missing parameters',
            received: { employee_id, month },
            message: 'Please provide employee_id and month'
          });
        }
        
        const employeeId = parseInt(employee_id);
        
        // Simple employee lookup
        const employeeQuery = `SELECT id, employee_code, fullname, position, base_salary FROM employees WHERE id = $1 LIMIT 1`;
        const employeeResult = await client.query(employeeQuery, [employeeId]);
        
        console.log('👤 Employee query result:', employeeResult.rows);
        
        if (employeeResult.rows.length === 0) {
          return res.json({
            error: 'Employee not found',
            employeeId,
            message: 'No employee found with this ID'
          });
        }
        
        const employee = employeeResult.rows[0];
        
        // Return simple structure
        return res.json({
          success: true,
          employee: {
            id: employee.id,
            employee_code: employee.employee_code,
            fullname: employee.fullname,
            username: employee.fullname,
            position: employee.position,
            base_salary: parseFloat(employee.base_salary || 0),
            commission_rate: 0
          },
          period: month,
          baseSalary: parseFloat(employee.base_salary || 0),
          totalCommission: 0,
          totalSalary: parseFloat(employee.base_salary || 0),
          invoices: [],
          summary: {
            totalInvoices: 0,
            totalRevenue: 0,
            averageCommissionPerInvoice: 0
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
    console.error('❌ Payroll Test API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
