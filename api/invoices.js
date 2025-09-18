const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

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

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'july-spa-secret');

    const dbPool = getPool();
    const client = await dbPool.connect();

    try {
      if (req.method === 'GET') {
        // Check if this is a request for a specific invoice by ID
        const url = req.url || '';
        const pathParts = url.split('?')[0].split('/');
        const invoiceId = pathParts[pathParts.length - 1];
        
        // If URL ends with a number, it's a specific invoice request
        if (invoiceId && !isNaN(parseInt(invoiceId))) {
          console.log('🔍 Getting invoice details for ID:', invoiceId);
          
          // Get specific invoice with details
          const invoiceQuery = `
            SELECT i.*, 
                   c.fullname as customer_name, c.phone as customer_phone,
                   COALESCE(i.employee_name, COALESCE(e.fullname, e.employee_code)) as employee_name,
                   i.dichvu
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            LEFT JOIN employees e ON i.employee_id = e.id
            WHERE i.id = $1
          `;
          
          const invoiceResult = await client.query(invoiceQuery, [parseInt(invoiceId)]);
          
          if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
          }
          
          const invoice = invoiceResult.rows[0];
          
          // Get invoice items with employee and service details
          const itemsQuery = `
            SELECT ii.*, 
                   s.name as service_name, s.description as service_description,
                   COALESCE(e.fullname, e.employee_code) as employee_name,
                   s.commission_rate,
                   ii.unit_price * ii.quantity * COALESCE(s.commission_rate, 0) / 100 as commission_amount
            FROM invoice_items ii
            LEFT JOIN services s ON ii.service_id = s.id
            LEFT JOIN employees e ON ii.employee_id = e.id
            WHERE ii.invoice_id = $1
          `;
          
          const itemsResult = await client.query(itemsQuery, [parseInt(invoiceId)]);
          
          return res.json({
            invoice: invoice,
            items: itemsResult.rows
          });
        }
        
        // Get daily invoices or all invoices
        const { date } = req.query;
        
        // Query real database - OPTIMIZED: Only select needed fields
        let query = `
          SELECT 
            i.id, i.invoice_number, i.total_amount, i.payment_status, 
            i.payment_method, i.invoice_date, i.created_at, i.notes,
            i.discount_amount, i.tax_amount, i.dichvu,
            c.fullname as customer_name, c.phone as customer_phone,
            COALESCE(i.employee_name, COALESCE(e.fullname, e.employee_code)) as employee_name
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          LEFT JOIN employees e ON i.employee_id = e.id
        `;
        
        const queryParams = [];
        
        if (date) {
          // Filter by date in Vietnam timezone (UTC+7)
          query += ` WHERE DATE(i.invoice_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1`;
          queryParams.push(date);
        }
        
        query += ` ORDER BY i.created_at DESC LIMIT 50`;
        
        const result = await client.query(query, queryParams);
        
        // Get invoice items for each invoice
        const invoicesWithItems = await Promise.all(
          result.rows.map(async (invoice) => {
            const itemsQuery = `
              SELECT ii.*, s.name as service_name
              FROM invoice_items ii
              LEFT JOIN services s ON ii.service_id = s.id
              WHERE ii.invoice_id = $1
            `;
            const itemsResult = await client.query(itemsQuery, [invoice.id]);
            
            return {
              ...invoice,
              items: itemsResult.rows
            };
          })
        );
        
        res.json({
          invoices: invoicesWithItems,
          total: invoicesWithItems.length
        });

      } else if (req.method === 'POST') {
        // Create new invoice
        const { customer_id, items, service_employee_mapping, payment_method, payment_status, notes } = req.body;

        if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'Customer ID and items are required' });
        }

        // Try to create tables first if they don't exist
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS invoices (
              id SERIAL PRIMARY KEY,
              invoice_number VARCHAR(50) UNIQUE NOT NULL,
              customer_id INTEGER NOT NULL,
              total_amount DECIMAL(12,2) NOT NULL,
              status VARCHAR(20) DEFAULT 'pending',
              payment_method VARCHAR(50) DEFAULT 'cash',
              notes TEXT,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);

          await client.query(`
            CREATE TABLE IF NOT EXISTS invoice_items (
              id SERIAL PRIMARY KEY,
              invoice_id INTEGER NOT NULL,
              service_id INTEGER NOT NULL,
              employee_id INTEGER,
              quantity INTEGER DEFAULT 1,
              unit_price DECIMAL(10,2) NOT NULL,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);
        } catch (tableError) {
          console.log('Table creation error (might already exist):', tableError.message);
        }

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
            // Fallback to timestamp-based number
            invoiceNumber = `INV${Date.now().toString().slice(-6)}`;
          }

          // Calculate total and prepare service summary
          let totalAmount = 0;
          const serviceSummary = [];
          const employeeNames = new Set();
          
          // Use service_employee_mapping to calculate correct total (avoid double counting)
          if (service_employee_mapping) {
            try {
              const mapping = JSON.parse(service_employee_mapping);
              for (const serviceMapping of mapping) {
                // Calculate total based on actual service quantity and price, not per employee
                const servicePrice = items.find(item => item.service_id === serviceMapping.service_id)?.unit_price || 0;
                totalAmount += servicePrice * serviceMapping.total_quantity;
                
                // Prepare service summary
                const serviceName = serviceMapping.service.toUpperCase();
                serviceSummary.push(`${serviceMapping.total_quantity}${serviceName}`);
                
                // Collect employee names
                serviceMapping.employees.forEach(empName => employeeNames.add(empName));
              }
            } catch (mappingError) {
              console.log('Service mapping parsing error, fallback to items:', mappingError.message);
              // Fallback to old method if mapping fails
              for (const item of items) {
                totalAmount += (item.unit_price || 0) * (item.quantity || 1);
              }
            }
          } else {
            // Fallback for invoices without service_employee_mapping
            for (const item of items) {
              totalAmount += (item.unit_price || 0) * (item.quantity || 1);
            }
          }
          
          // Get service names and employee names for legacy fields
          for (const item of items) {
            // Get service name for DICHVU column (if not already populated)
            if (serviceSummary.length === 0) {
              try {
                const serviceQuery = 'SELECT name FROM services WHERE id = $1';
                const serviceResult = await client.query(serviceQuery, [item.service_id]);
                if (serviceResult.rows.length > 0) {
                  const serviceName = serviceResult.rows[0].name.toUpperCase();
                  serviceSummary.push(`${item.quantity || 1}${serviceName}`);
                }
              } catch (serviceError) {
                console.log('Service lookup error:', serviceError.message);
                serviceSummary.push(`${item.quantity || 1}UNKNOWN`);
              }
            }
            
            // Get employee name for NAME column (if not already populated)
            if (item.employee_id && employeeNames.size === 0) {
              try {
                const empQuery = 'SELECT COALESCE(fullname, employee_code) as name FROM employees WHERE id = $1';
                const empResult = await client.query(empQuery, [item.employee_id]);
                if (empResult.rows.length > 0) {
                  employeeNames.add(empResult.rows[0].name);
                }
              } catch (empError) {
                console.log('Employee lookup error:', empError.message);
              }
            }
          }
          
          const dichvuString = serviceSummary.join(',');
          const employeeNamesString = Array.from(employeeNames).join(', ');

          // Get primary employee_id (first employee from items)
          const primaryEmployeeId = items.find(item => item.employee_id)?.employee_id || null;

          // Create invoice with employee_id and employee_name
          const invoiceResult = await client.query(`
            INSERT INTO invoices (invoice_number, customer_id, employee_id, total_amount, payment_method, payment_status, notes, employee_name, dichvu, service_employee_mapping, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *
          `, [invoiceNumber, customer_id, primaryEmployeeId, totalAmount, payment_method || 'cash', payment_status || 'paid', notes || '', employeeNamesString || null, dichvuString || null, service_employee_mapping || null]);

          const invoice = invoiceResult.rows[0];

          // Create invoice items
          const invoiceItems = [];
          for (const item of items) {
            const itemResult = await client.query(`
              INSERT INTO invoice_items (invoice_id, service_id, employee_id, quantity, unit_price, created_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              RETURNING *
            `, [invoice.id, item.service_id, item.employee_id || null, item.quantity || 1, item.unit_price || 0]);

            invoiceItems.push(itemResult.rows[0]);
          }

          // Update customer loyalty points (optional, don't fail if this fails)
          try {
            await client.query(`
              UPDATE customers 
              SET loyalty_points = loyalty_points + 1, updated_at = NOW()
              WHERE id = $1
            `, [customer_id]);
          } catch (loyaltyError) {
            console.log('Loyalty points update failed:', loyaltyError.message);
          }

          await client.query('COMMIT');

          res.status(201).json({
            message: 'Invoice created successfully',
            invoice: invoice,
            items: invoiceItems
          });

        } catch (error) {
          await client.query('ROLLBACK');
          console.error('Invoice creation error:', error);
          throw error;
        }

      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Invoices API error:', error);
    res.status(500).json({ error: 'Invoices API failed: ' + error.message });
  }
};
