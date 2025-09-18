const { Pool } = require('pg');
require('dotenv').config();

async function testPayrollAPI() {
  console.log('🔍 Testing Payroll API directly...');
  
  const pool = new Pool({
    connectionString: 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // Test employee lookup
    const employeeId = 1;
    const month = '2025-01';
    
    console.log('📊 Testing with:', { employeeId, month });
    
    // Get employee info
    const employeeQuery = `
      SELECT id, employee_code, fullname, position, base_salary, commission_rate, is_active
      FROM employees 
      WHERE id = $1 AND is_active = true
    `;
    
    const employeeResult = await client.query(employeeQuery, [employeeId]);
    console.log('👤 Employee result:', employeeResult.rows);
    
    if (employeeResult.rows.length === 0) {
      console.log('❌ No employee found');
      return;
    }
    
    const employee = employeeResult.rows[0];
    
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-');
    console.log('📅 Date parts:', { year, monthNum });
    
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
      AND EXTRACT(YEAR FROM i.created_at) = $2
      AND EXTRACT(MONTH FROM i.created_at) = $3
      AND i.payment_status = 'paid'
      ORDER BY i.created_at DESC
    `;
    
    const invoicesResult = await client.query(invoicesQuery, [employeeId, parseInt(year), parseInt(monthNum)]);
    console.log('📋 Invoices result:', invoicesResult.rows);
    
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
    
    console.log('📦 Invoices with items:', JSON.stringify(invoicesWithItems, null, 2));
    
    // Calculate totals
    const totalCommission = invoicesWithItems.reduce((sum, invoice) => sum + invoice.employee_commission, 0);
    const baseSalary = parseFloat(employee.base_salary || 0);
    const totalSalary = baseSalary + totalCommission;
    
    console.log('💰 Calculations:', { baseSalary, totalCommission, totalSalary });
    
    const finalData = {
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
    };
    
    console.log('🎯 Final API Response:');
    console.log(JSON.stringify(finalData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testPayrollAPI().catch(console.error);
