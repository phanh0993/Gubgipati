const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Temp Payroll API called v2:', req.query);

    const { employee_id, month } = req.query;
    
    if (!employee_id || !month) {
      return res.status(400).json({ error: 'Employee ID and month are required' });
    }
    
    const employeeId = parseInt(employee_id);
    const [year, monthNum] = month.split('-');

    const client = await getPool().connect();
    
    try {
      // Get employee info
      const employeeResult = await client.query(
        'SELECT id, employee_code, fullname, position, base_salary FROM employees WHERE id = $1 AND is_active = true',
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
               i.employee_id, i.employee_name, i.dichvu, i.service_employee_mapping,
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
      
      // Get all services with commission rates from database
      const servicesResult = await client.query('SELECT id, name, price, commission_rate FROM services WHERE is_active = true');
      const servicesMap = new Map();
      servicesResult.rows.forEach(service => {
        servicesMap.set(service.name.toUpperCase(), {
          id: service.id,
          name: service.name,
          price: parseFloat(service.price),
          commission_rate: parseFloat(service.commission_rate)
        });
      });
      
      console.log(`💼 Loaded ${servicesResult.rows.length} services with commission rates:`, 
        servicesResult.rows.map(s => `${s.name}: ${s.commission_rate}%`));
      
      // Get overtime records for this employee in this month
      const overtimeResult = await client.query(`
        SELECT id, date, hours, hourly_rate, total_amount, notes
        FROM overtime 
        WHERE employee_id = $1 
          AND EXTRACT(YEAR FROM date) = $2 
          AND EXTRACT(MONTH FROM date) = $3
        ORDER BY date DESC
      `, [employeeId, parseInt(year), parseInt(monthNum)]);
      
      const totalOvertimeAmount = overtimeResult.rows.reduce((sum, record) => {
        return sum + parseFloat(record.total_amount);
      }, 0);
      
      console.log(`⏰ Found ${overtimeResult.rows.length} overtime records, total: ${totalOvertimeAmount}₫`);
      
      // Calculate commission
      let totalCommission = 0;
      const invoicesWithDetails = [];

      for (const invoice of invoicesResult.rows) {
        let invoiceCommission = 0;
        const items = [];
        
        // Use service_employee_mapping if available (new format)
        if (invoice.service_employee_mapping) {
          try {
            const serviceMapping = JSON.parse(invoice.service_employee_mapping);
            
            for (const mapping of serviceMapping) {
              // Check if this employee is in the mapping
              if (mapping.employees.includes(employee.fullname)) {
                // Get service info from database
                const serviceInfo = servicesMap.get(mapping.service.toUpperCase());
                
                if (serviceInfo) {
                  // Calculate commission based on database values
                  const commission = serviceInfo.price * (serviceInfo.commission_rate / 100) * mapping.total_quantity * mapping.commission_split;
                  invoiceCommission += commission;
                  
                  items.push({
                    service_name: mapping.service,
                    quantity: mapping.total_quantity,
                    commission_rate: serviceInfo.commission_rate,
                    commission: Math.round(commission),
                    employee_share: mapping.commission_split,
                    other_employees: mapping.employees.filter(emp => emp !== employee.fullname),
                    service_price: serviceInfo.price
                  });
                } else {
                  console.warn(`⚠️ Service not found in database: ${mapping.service}`);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing service_employee_mapping:', error);
            // Fall back to old method
          }
        }
        
        // Fall back to old method if no service_employee_mapping (backward compatibility)
        if (!invoice.service_employee_mapping && invoice.dichvu) {
          const services = invoice.dichvu.split(',');
          const employeeCount = invoice.employee_name.split(',').length;
          const employeeShare = 1 / employeeCount;
          
          for (const serviceStr of services) {
            const match = serviceStr.trim().match(/^(\d+)(.+)$/);
            if (match) {
              const quantity = parseInt(match[1]);
              const serviceName = match[2].toUpperCase();
              
              // Get service info from database
              const serviceInfo = servicesMap.get(serviceName);
              
              if (serviceInfo) {
                const commission = serviceInfo.price * (serviceInfo.commission_rate / 100) * quantity * employeeShare;
                invoiceCommission += commission;
                
                items.push({
                  service_name: serviceName,
                  quantity: quantity,
                  commission_rate: serviceInfo.commission_rate,
                  commission: Math.round(commission),
                  employee_share: employeeShare,
                  service_price: serviceInfo.price
                });
              } else {
                console.warn(`⚠️ Service not found in database (fallback): ${serviceName}`);
                // Use default values for unknown services
                items.push({
                  service_name: serviceName,
                  quantity: quantity,
                  commission_rate: 0,
                  commission: 0,
                  employee_share: employeeShare,
                  service_price: 0
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
          username: employee.fullname, // Use fullname as username
          position: employee.position,
          base_salary: parseInt(employee.base_salary) || 0,
          commission_rate: 0
        },
        period: month,
        baseSalary: parseInt(employee.base_salary) || 0,
        totalCommission: Math.round(totalCommission),
        totalOvertimeAmount: Math.round(totalOvertimeAmount),
        totalSalary: (parseInt(employee.base_salary) || 0) + Math.round(totalCommission) + Math.round(totalOvertimeAmount),
        invoices: invoicesWithDetails,
        overtime_records: overtimeResult.rows,
        summary: {
          totalInvoices: invoicesWithDetails.length,
          totalItems: invoicesWithDetails.reduce((sum, inv) => sum + inv.items.length, 0),
          totalRevenue: Math.round(invoicesWithDetails.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)),
          totalOvertimeHours: overtimeResult.rows.reduce((sum, record) => sum + parseFloat(record.hours), 0),
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
