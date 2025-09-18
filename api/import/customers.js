const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const xlsx = require('xlsx');

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

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Parse Excel file to customers array
function parseExcelToCustomers(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    const customers = jsonData.map((row, index) => {
      // Debug: Log first row to see actual column names
      if (index === 0) {
        console.log('Excel column names:', Object.keys(row));
        console.log('First row data:', row);
      }

      // Map various possible column names to standard fields
      const customer = {
        name: row['Tên khách hàng'] || row['customer_name'] || row['full_name'] || row['name'] || row['Tên'] || `Khách hàng ${index + 1}`,
        phone: row['Điện thoại'] || row['phone'] || row['Phone'] || row['Số điện thoại'] || row['SDT'] || '',
        email: row['Email'] || row['email'] || row['Email'] || '',
        address: row['Địa chỉ'] || row['address'] || row['Address'] || '',
        gender: row['Giới tính'] || row['gender'] || row['Gender'] || '',
        birth_date: row['Ngày sinh'] || row['birth_date'] || row['Birth Date'] || null,
        loyalty_points: parseInt(row['Điểm tích lũy'] || row['loyalty_points'] || row['Loyalty Points'] || 0) || 0,
        notes: row['Ghi chú'] || row['notes'] || row['Notes'] || '',
        company: row['Công ty'] || row['company'] || row['Company'] || '',
        tax_id: row['Mã số thuế'] || row['tax_id'] || row['Tax ID'] || '',
        customer_source: row['Nguồn khách'] || row['customer_source'] || row['Customer Source'] || '',
        facebook: row['Facebook'] || row['facebook'] || row['Facebook'] || '',
        customer_group: row['Nhóm khách hàng'] || row['customer_group'] || row['Customer Group'] || '',
        branch: row['Chi nhánh'] || row['branch'] || row['Branch'] || '',
        area: row['Khu vực'] || row['area'] || row['Area'] || '',
        ward: row['Phường/Xã'] || row['ward'] || row['Ward'] || '',
        total_sales: parseFloat(row['Tổng bán'] || row['total_sales'] || row['Total Sales'] || 0) || 0,
        last_transaction: row['Ngày giao dịch cuối'] || row['last_transaction'] || row['Last Transaction'] || null,
        current_debt: parseFloat(row['Nợ cần thu hiện tại'] || row['current_debt'] || row['Current Debt'] || 0) || 0,
        card_balance: parseFloat(row['Số dư thẻ TK'] || row['card_balance'] || row['Card Balance'] || 0) || 0,
        remaining_sessions: parseInt(row['Số buổi còn lại gói DV'] || row['remaining_sessions'] || row['Remaining Sessions'] || 0) || 0,
        status: row['Trạng thái'] || row['status'] || row['Status'] || 'active'
      };

      return customer;
    });

    return customers;
  } catch (error) {
    throw new Error(`Error parsing Excel file: ${error.message}`);
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle file upload with multer
  const uploadMiddleware = upload.single('file');
  
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      // Verify JWT token (optional for import - allow if no token for testing)
      const authHeader = req.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          user = jwt.verify(token, process.env.JWT_SECRET || 'july-spa-secret');
          console.log('Import API: User authenticated:', user.username);
        } catch (tokenError) {
          console.log('Import API: Invalid token, continuing without auth');
        }
      } else {
        console.log('Import API: No token provided, continuing without auth');
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse Excel file to customers array
      const customers = parseExcelToCustomers(req.file.buffer);
      console.log(`Parsed ${customers.length} customers from Excel file`);
      
      // Debug: Log first few customers to see the data structure
      if (customers.length > 0) {
        console.log('First customer sample:', JSON.stringify(customers[0], null, 2));
        console.log('Available columns in first row:', Object.keys(customers[0]));
      }

      // Check if customers table exists and its structure
      try {
        const tableCheck = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'customers'
          ORDER BY ordinal_position
        `);
        console.log('Existing customers table structure:', tableCheck.rows);
      } catch (tableCheckError) {
        console.log('Table check error:', tableCheckError.message);
      }

    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ error: 'Customers array is required' });
    }

    const dbPool = getPool();
    const client = await dbPool.connect();

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      // Don't use transaction for import to avoid "current transaction is aborted" errors
      // await client.query('BEGIN');

      for (const customer of customers) {
        try {
          // Skip if no phone number
          if (!customer.phone || customer.phone.trim() === '') {
            errorCount++;
            errors.push(`Skipped customer "${customer.name}" - no phone number`);
            continue;
          }

          // Clean and validate data
          const cleanCustomer = {
            name: (customer.name || customer.customer_name || customer.full_name || 'N/A').trim(),
            phone: customer.phone.trim(),
            email: (customer.email || '').trim(),
            address: (customer.address || '').trim(),
            gender: (customer.gender || '').trim(),
            birth_date: customer.birth_date || null,
            loyalty_points: parseInt(customer.loyalty_points || 0) || 0
          };

          // Validate required fields
          if (!cleanCustomer.name || cleanCustomer.name === 'N/A') {
            errorCount++;
            errors.push(`Skipped customer - no valid name`);
            continue;
          }

          // Try to create table first if it doesn't exist, or add missing columns
          try {
            // First try to create table
            await client.query(`
              CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                email VARCHAR(255),
                address TEXT,
                gender VARCHAR(10),
                birth_date DATE,
                loyalty_points INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
              )
            `);
          } catch (tableError) {
            console.log('Table creation error (might already exist):', tableError.message);
            
            // Try to add missing columns if table exists but columns are missing
            try {
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS name VARCHAR(255)`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender VARCHAR(10)`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
              await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
              
              console.log('Added missing columns to customers table');
            } catch (alterError) {
              console.log('Column addition error:', alterError.message);
            }
          }

          // Try to insert/update customer

          // Check if customer already exists by phone
          const existingCustomer = await client.query(
            'SELECT id FROM customers WHERE phone = $1',
            [cleanCustomer.phone]
          );

          let customerId;
          if (existingCustomer.rows.length > 0) {
            // Update existing customer
            const updateResult = await client.query(`
              UPDATE customers SET
                name = $1,
                email = $2,
                address = $3,
                gender = $4,
                birth_date = $5,
                updated_at = NOW()
              WHERE phone = $6
              RETURNING id
            `, [cleanCustomer.name, cleanCustomer.email, cleanCustomer.address, cleanCustomer.gender, cleanCustomer.birth_date, cleanCustomer.phone]);
            customerId = updateResult.rows[0].id;
            console.log(`Updated existing customer: ${cleanCustomer.name} (${cleanCustomer.phone})`);
          } else {
            // Insert new customer
            const insertResult = await client.query(`
              INSERT INTO customers (name, phone, email, address, gender, birth_date, loyalty_points, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW(), NOW())
              RETURNING id
            `, [cleanCustomer.name, cleanCustomer.phone, cleanCustomer.email, cleanCustomer.address, cleanCustomer.gender, cleanCustomer.birth_date]);
            customerId = insertResult.rows[0].id;
            console.log(`Inserted new customer: ${cleanCustomer.name} (${cleanCustomer.phone})`);
          }
          
          successCount++;

        } catch (error) {
          errorCount++;
          const errorMsg = `Error importing customer "${customer.name || 'Unknown'}": ${error.message}`;
          errors.push(errorMsg);
          console.error('Customer import error:', errorMsg, error);
        }
      }

      // No transaction to commit
      // await client.query('COMMIT');

      res.json({
        message: 'Import completed',
        success: successCount,
        errors: errorCount,
        total: customers.length,
        errorDetails: errors.slice(0, 10) // Only return first 10 errors
      });

    } catch (error) {
      // No transaction to rollback
      // await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    } catch (error) {
      console.error('Import customers API error:', error);
      res.status(500).json({ error: 'Import failed: ' + error.message });
    }
  });
};
