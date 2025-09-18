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
        // Try to get customers from database, fallback to mock data if table doesn't exist
        try {
          // Try to create table first if it doesn't exist
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

          // Ensure all required columns exist (in case table exists but missing columns)
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
            console.log('Ensured all required columns exist in customers table (GET)');
          } catch (alterError) {
            console.log('Column addition error (GET):', alterError.message);
          }

          // Use fullname column since that's what exists in database
          const columnName = 'fullname';
          console.log('Using column: fullname');

          // Get all customers with pagination
          const { search = '', limit = 50, offset = 0 } = req.query;
          
          let query = `
            SELECT id, ${columnName} as name, ${columnName} as fullname, phone, email, address, gender, birth_date, 
                   loyalty_points, is_active, created_at, updated_at
            FROM customers 
            WHERE is_active = true
          `;
          
          const queryParams = [];
          
          if (search) {
            query += ` AND (${columnName} ILIKE $1 OR phone ILIKE $1)`;
            queryParams.push(`%${search}%`);
          }
          
          query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
          queryParams.push(limit, offset);

          const result = await client.query(query, queryParams);
          console.log(`Query result: ${result.rows.length} customers found`);
          if (result.rows.length > 0) {
            console.log('First customer sample:', {
              id: result.rows[0].id,
              name: result.rows[0].name,
              fullname: result.rows[0].fullname,
              phone: result.rows[0].phone
            });
          }

          // Get total count (optimized)
          let countQuery = 'SELECT COUNT(*) FROM customers WHERE is_active = true';
          const countParams = [];
          
          if (search) {
            countQuery += ` AND (${columnName} ILIKE $1 OR phone ILIKE $1)`;
            countParams.push(`%${search}%`);
          }
          
          const countResult = await client.query(countQuery, countParams);

          const response = {
            customers: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
          };
          
          console.log('API Response sample:', {
            totalCustomers: response.total,
            firstCustomer: response.customers[0] ? {
              id: response.customers[0].id,
              name: response.customers[0].name,
              fullname: response.customers[0].fullname,
              phone: response.customers[0].phone,
              gender: response.customers[0].gender
            } : 'No customers'
          });
          
          res.json(response);

        } catch (dbError) {
          console.log('Customers table not found, returning mock data:', dbError.message);
          
          // Return mock data if table doesn't exist
          const mockCustomers = [
            {
              id: 1,
              name: 'Nguyễn Thị Hoa',
              phone: '0123456789',
              email: 'hoa.nguyen@email.com',
              address: '123 Đường ABC, Quận 1, TP.HCM',
              gender: 'Nữ',
              birth_date: '1990-05-15',
              loyalty_points: 15,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              name: 'Trần Văn Nam',
              phone: '0987654321',
              email: 'nam.tran@email.com',
              address: '456 Đường XYZ, Quận 2, TP.HCM',
              gender: 'Nam',
              birth_date: '1985-08-20',
              loyalty_points: 8,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 3,
              name: 'Lê Thị Mai',
              phone: '0912345678',
              email: 'mai.le@email.com',
              address: '789 Đường DEF, Quận 3, TP.HCM',
              gender: 'Nữ',
              birth_date: '1992-12-10',
              loyalty_points: 22,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];

          const { search = '', limit = 50, offset = 0 } = req.query;
          
          let filteredCustomers = mockCustomers;
          
          if (search) {
            filteredCustomers = mockCustomers.filter(customer => 
              customer.name.toLowerCase().includes(search.toLowerCase()) ||
              customer.phone.includes(search)
            );
          }

          res.json({
            customers: filteredCustomers.slice(offset, offset + parseInt(limit)),
            total: filteredCustomers.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
          });
        }

      } else if (req.method === 'POST') {
        // Create new customer
        const { name, fullname, phone, email, address, gender, birth_date, birthday } = req.body;

        // Map field names - frontend sends 'fullname' but API expects 'name'
        const customerName = name || fullname;
        const customerBirthDate = birth_date || birthday;

        // Clean and validate data
        const cleanName = (customerName || '').trim();
        const cleanPhone = (phone || '').trim();

        console.log('Customer creation request:', {
          name: customerName,
          fullname: fullname,
          phone: phone,
          email: email,
          address: address,
          gender: gender,
          birth_date: customerBirthDate
        });

        if (!cleanName || !cleanPhone) {
          return res.status(400).json({ error: 'Tên và số điện thoại là bắt buộc' });
        }

        // Try to create table first if it doesn't exist
        try {
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
        }

        // Ensure all required columns exist (in case table exists but missing columns)
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
          console.log('Ensured all required columns exist in customers table');
        } catch (alterError) {
          console.log('Column addition error:', alterError.message);
        }

        // Use fullname column since that's what exists in database
        const columnName = 'fullname';
        console.log('Using column: fullname');

        // Kiểm tra khách hàng trùng lặp (cả tên và số điện thoại)
        if (cleanName && cleanPhone) {
          const duplicateCheck = await client.query(`
            SELECT id, ${columnName} as name, phone 
            FROM customers 
            WHERE LOWER(TRIM(${columnName})) = LOWER(TRIM($1)) 
              AND TRIM(phone) = TRIM($2)
              AND is_active = true
          `, [cleanName, cleanPhone]);

          if (duplicateCheck.rows.length > 0) {
            const existing = duplicateCheck.rows[0];
            return res.status(400).json({
              error: `Khách hàng đã tồn tại với tên "${existing.name}" và số điện thoại "${existing.phone}"`,
              existingCustomer: {
                id: existing.id,
                name: existing.name,
                phone: existing.phone
              }
            });
          }
        }

        const result = await client.query(`
          INSERT INTO customers (${columnName}, phone, email, address, gender, birth_date, loyalty_points, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, 0, true, NOW(), NOW())
          RETURNING *
        `, [cleanName, cleanPhone, email || '', address || '', gender || '', customerBirthDate || null]);

        res.status(201).json({
          message: 'Customer created successfully',
          customer: result.rows[0]
        });

      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Customers API error:', error);
    res.status(500).json({ error: 'Customers API failed: ' + error.message });
  }
};
