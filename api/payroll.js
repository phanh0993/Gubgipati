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
    // Skip JWT verification for now to debug
    console.log('🔍 Payroll API called:', req.method, req.query);
    
    // Verify JWT token
    // const authHeader = req.headers.authorization;
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return res.status(401).json({ error: 'No token provided' });
    // }

    // const token = authHeader.substring(7);
    // jwt.verify(token, process.env.JWT_SECRET || 'july-spa-secret');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
      if (req.method === 'GET') {
        // Handle employee-specific payroll requests
        const { employee_id, month, year } = req.query;
        
        // Check if this is an employee-specific request
        if (employee_id && month) {
          const employeeId = parseInt(employee_id);
          
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
          
          console.log('📊 Parsed month:', { year, monthNum, employeeId });
          
          // Get invoices for this employee in the specified month (using employee_id from invoices table)
          const invoicesQuery = `
            SELECT DISTINCT
              i.id,
              i.invoice_number,
              i.total_amount,
              i.created_at,
              i.payment_status,
              i.dichvu,
              COALESCE(c.fullname, c.name) as customer_name,
              c.phone as customer_phone
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.employee_id = $1 
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
                  s.commission_rate,
                  ii.unit_price * ii.quantity * COALESCE(s.commission_rate, 0) / 100 as commission
                FROM invoice_items ii
                LEFT JOIN services s ON ii.service_id = s.id
                WHERE ii.invoice_id = $1 AND ii.employee_id = $2
              `;
              
              const itemsResult = await client.query(itemsQuery, [invoice.id, employeeId]);
              
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
        }
        
        // Default payroll overview
        const { employee_id: emp_id, month: month_filter, year: year_filter } = req.query;
        
        let query = `
          SELECT 
            e.id as employee_id,
            e.employee_code,
            e.fullname,
            e.position,
            e.base_salary,
            e.commission_rate,
            COUNT(i.id) as total_invoices,
            COALESCE(SUM(i.total_amount), 0) as total_revenue,
            COALESCE(SUM(
              (SELECT SUM(ii.unit_price * ii.quantity * COALESCE(s.commission_rate, 0) / 100)
               FROM invoice_items ii 
               LEFT JOIN services s ON ii.service_id = s.id
               WHERE ii.invoice_id = i.id AND ii.employee_id = e.id)
            ), 0) as commission_earned
          FROM employees e
          LEFT JOIN invoices i ON e.id = i.employee_id
          WHERE e.is_active = true
        `;
        
        const queryParams = [];
        
        if (emp_id) {
          query += ` AND e.id = $1`;
          queryParams.push(emp_id);
        }
        
        if (month_filter && year_filter) {
          query += ` AND EXTRACT(MONTH FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $${queryParams.length + 1} AND EXTRACT(YEAR FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $${queryParams.length + 2}`;
          queryParams.push(month_filter, year_filter);
        }
        
        query += ` GROUP BY e.id, e.employee_code, e.fullname, e.position, e.base_salary, e.commission_rate`;
        
        const result = await client.query(query, queryParams);
        
        // Get invoice details for each employee
        const payrollData = await Promise.all(
          result.rows.map(async (employee) => {
            const invoicesQuery = `
              SELECT 
                i.invoice_number,
                s.name as service_name,
                ii.unit_price * ii.quantity as amount,
                ii.unit_price * ii.quantity * $1 / 100 as commission
              FROM invoice_items ii
              JOIN invoices i ON ii.invoice_id = i.id
              JOIN services s ON ii.service_id = s.id
              WHERE ii.employee_id = $2
              ORDER BY i.created_at DESC
              LIMIT 10
            `;
            
            const invoicesResult = await client.query(invoicesQuery, [employee.commission_rate, employee.employee_id]);
            
            const baseSalary = parseFloat(employee.base_salary || 0);
            const commissionEarned = parseFloat(employee.commission_earned || 0);
            const totalSalary = baseSalary + commissionEarned;
            
            return {
              id: employee.employee_id,
              employee_id: employee.employee_id,
              employee_name: employee.fullname || employee.employee_code, // Use fullname if available
              employee_code: employee.employee_code,
              position: employee.position,
              base_salary: baseSalary,
              commission_rate: parseFloat(employee.commission_rate || 0),
              total_invoices: parseInt(employee.total_invoices || 0),
              total_revenue: parseFloat(employee.total_revenue || 0),
              commission_earned: commissionEarned,
              total_salary: totalSalary,
              invoices: invoicesResult.rows
            };
          })
        );
        
        res.json({
          payroll: payrollData,
          total: payrollData.length
        });

      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Payroll API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};