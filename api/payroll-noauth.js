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
    console.log('🔍 No-Auth Payroll API called:', req.query);

    const { employee_id, month } = req.query;
    
    if (!employee_id || !month) {
      return res.status(400).json({ error: 'Employee ID and month are required' });
    }
    
    const employeeId = parseInt(employee_id);
    const [year, monthNum] = month.split('-');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      // Get employee info
      const employeeResult = await client.query(
        'SELECT id, employee_code, fullname, username, position, base_salary FROM employees WHERE id = $1 AND is_active = true',
        [employeeId]
      );
      
      if (employeeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      const employee = employeeResult.rows[0];
      console.log('👤 Employee found:', employee.fullname);
      
      // Get invoices for this employee
      const invoicesResult = await client.query(`
        SELECT i.id, i.invoice_number, i.total_amount, i.created_at, 
               i.employee_id, i.employee_name, i.dichvu,
               COALESCE(c.fullname, c.name, 'Unknown') as customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE (i.employee_id = $1 OR i.employee_name LIKE '%' || $2 || '%')
          AND EXTRACT(YEAR FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3
          AND EXTRACT(MONTH FROM i.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $4
          AND i.payment_status = 'paid'
        ORDER BY i.created_at DESC
      `, [employeeId, employee.fullname, parseInt(year), parseInt(monthNum)]);

      console.log(`📋 Found ${invoicesResult.rows.length} invoices`);
      
      // Calculate commission
      let totalCommission = 0;
      const invoicesWithDetails = [];

      for (const invoice of invoicesResult.rows) {
        let invoiceCommission = 0;
        const items = [];
        
        // Parse dichvu (e.g., "1TI,1BÔNG")
        if (invoice.dichvu) {
          const services = invoice.dichvu.split(',');
          const employeeCount = invoice.employee_name.split(',').length;
          const employeeShare = 1 / employeeCount;
          
          for (const serviceStr of services) {
            const match = serviceStr.trim().match(/^(\d+)(.+)$/);
            if (match) {
              const quantity = parseInt(match[1]);
              const serviceName = match[2].toUpperCase();
              
              // Commission: Ti = 10%, Bông = 0%
              const commissionRate = serviceName === 'TI' ? 10 : 0;
              const servicePrice = serviceName === 'TI' ? 100000 : 50000;
              
              const commission = servicePrice * (commissionRate / 100) * quantity * employeeShare;
              invoiceCommission += commission;
              
              items.push({
                service_name: serviceName,
                quantity: quantity,
                commission_rate: commissionRate,
                commission: Math.round(commission),
                employee_share: employeeShare
              });
            }
          }
        }
        
        totalCommission += invoiceCommission;
        
        invoicesWithDetails.push({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          created_at: invoice.created_at,
          customer_name: invoice.customer_name,
          dichvu: invoice.dichvu,
          employee_commission: Math.round(invoiceCommission),
          items: items
        });
      }

      const response = {
        employee: {
          id: employee.id,
          employee_code: employee.employee_code,
          fullname: employee.fullname,
          username: employee.username,
          position: employee.position,
          base_salary: parseInt(employee.base_salary) || 0,
          commission_rate: 0
        },
        period: month,
        baseSalary: parseInt(employee.base_salary) || 0,
        totalCommission: Math.round(totalCommission),
        totalSalary: (parseInt(employee.base_salary) || 0) + Math.round(totalCommission),
        invoices: invoicesWithDetails,
        summary: {
          totalInvoices: invoicesWithDetails.length,
          totalItems: invoicesWithDetails.reduce((sum, inv) => sum + inv.items.length, 0),
          totalRevenue: Math.round(invoicesWithDetails.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)),
          averageCommissionPerInvoice: invoicesWithDetails.length > 0 ? Math.round(totalCommission / invoicesWithDetails.length) : 0
        }
      };
      
      console.log('✅ Payroll complete:', {
        employee: employee.fullname,
        invoices: invoicesWithDetails.length,
        totalCommission: Math.round(totalCommission),
        totalSalary: response.totalSalary
      });
      
      return res.json(response);
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Payroll API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};
