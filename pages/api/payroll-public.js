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
    console.log('🔍 Public Payroll API called:', req.method, req.query);

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
      
      // 2. Get invoices where this employee is involved (from invoices table)
      const invoicesQuery = `
        SELECT 
          i.id,
          i.invoice_number,
          i.total_amount,
          i.created_at,
          i.employee_id,
          i.employee_name,
          i.dichvu,
          COALESCE(c.fullname, c.name, 'Unknown') as customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE (i.employee_id = $1 OR i.employee_name LIKE '%' || (SELECT fullname FROM employees WHERE id = $1) || '%')
          AND EXTRACT(YEAR FROM i.created_at) = $2
          AND EXTRACT(MONTH FROM i.created_at) = $3
          AND i.payment_status = 'paid'
        ORDER BY i.created_at DESC
      `;
      
      const invoicesResult = await client.query(invoicesQuery, [employeeId, parseInt(year), parseInt(monthNum)]);
      console.log(`📋 Found ${invoicesResult.rows.length} invoices for employee`);
      
      // 3. Parse dichvu and calculate commission for each invoice
      let totalCommission = 0;
      const invoicesWithDetails = [];
      
      // Get services data for commission calculation
      const servicesResult = await client.query('SELECT id, name, commission_rate FROM services');
      const servicesMap = new Map();
      servicesResult.rows.forEach(service => {
        servicesMap.set(service.name.toUpperCase(), {
          id: service.id,
          name: service.name,
          commission_rate: parseFloat(service.commission_rate)
        });
      });
      
      for (const invoice of invoicesResult.rows) {
        let invoiceCommission = 0;
        const items = [];
        
        // Parse dichvu string (e.g., "1TI,1BÔNG" or "2TI,1BÔNG")
        if (invoice.dichvu) {
          const services = invoice.dichvu.split(',');
          
          for (const serviceStr of services) {
            const match = serviceStr.trim().match(/^(\d+)(.+)$/);
            if (match) {
              const quantity = parseInt(match[1]);
              const serviceName = match[2].toUpperCase();
              
              const service = servicesMap.get(serviceName);
              if (service) {
                // Calculate commission only if this employee is involved
                const employeeName = employee.fullname;
                const isEmployeeInvolved = invoice.employee_name.includes(employeeName);
                
                let employeeShare = 0;
                if (isEmployeeInvolved) {
                  // If multiple employees, split commission
                  const employeeCount = invoice.employee_name.split(',').length;
                  employeeShare = 1 / employeeCount;
                }
                
                // Calculate commission based on service price and commission rate
                // For Ti: 100,000 × 10% = 10,000 per service
                const servicePrice = serviceName === 'TI' ? 100000 : 50000; // Ti or Bông
                const commission = servicePrice * (service.commission_rate / 100) * quantity * employeeShare;
                
                invoiceCommission += commission;
                
                items.push({
                  service_name: service.name,
                  quantity: quantity,
                  commission_rate: service.commission_rate,
                  commission: Math.round(commission),
                  employee_share: employeeShare
                });
              }
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
          commission_rate: parseFloat(employee.commission_rate) || 0
        },
        period: month,
        baseSalary: parseInt(employee.base_salary) || 0,
        totalCommission: Math.round(totalCommission),
        totalSalary: (parseInt(employee.base_salary) || 0) + Math.round(totalCommission),
        invoices: invoicesWithDetails,
        summary: {
          totalInvoices: invoicesWithDetails.length,
          totalItems: itemsResult.rows.length,
          totalRevenue: Math.round(invoicesWithDetails.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)),
          averageCommissionPerInvoice: invoicesWithDetails.length > 0 ? Math.round(totalCommission / invoicesWithDetails.length) : 0
        }
      };
      
      console.log('✅ Payroll calculation complete:', {
        employee: employee.fullname,
        invoices: invoicesWithDetails.length,
        totalItems: itemsResult.rows.length,
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
