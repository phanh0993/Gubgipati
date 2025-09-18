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
        // Ensure employees table exists
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              employee_code VARCHAR(50),
              phone VARCHAR(20),
              email VARCHAR(255),
              position VARCHAR(100),
              base_salary DECIMAL(12,2) DEFAULT 0,
              commission_rate DECIMAL(5,2) DEFAULT 0.00,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);
        } catch (tableError) {
          console.log('Table creation error (might already exist):', tableError.message);
        }

        // Get employees from database with fullname
        console.log('Getting employees with fullname');

        // Get employees from database
        const { search = '', limit = 50, offset = 0 } = req.query;
        
        let query = `
          SELECT id, COALESCE(fullname, employee_code) as name, employee_code, fullname, position, 
                 base_salary, commission_rate, is_active, created_at, updated_at
          FROM employees 
          WHERE is_active = true
        `;
        
        const queryParams = [];
        
        if (search) {
          query += ` AND (employee_code ILIKE $1 OR position ILIKE $1 OR fullname ILIKE $1)`;
          queryParams.push(`%${search}%`);
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const result = await client.query(query, queryParams);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM employees WHERE is_active = true';
        const countParams = [];
        
        if (search) {
          countQuery += ` AND (${columnName} ILIKE $1 OR employee_code ILIKE $1 OR phone ILIKE $1)`;
          countParams.push(`%${search}%`);
        }
        
        const countResult = await client.query(countQuery, countParams);

        res.json({
          employees: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset)
        });

      } else if (req.method === 'POST') {
        // Create new employee
        const { name, fullname, employee_code, phone, email, position, base_salary, commission_rate } = req.body;

        if (!employee_code) {
          return res.status(400).json({ error: 'Employee code is required' });
        }

        if (!fullname && !name) {
          return res.status(400).json({ error: 'Employee name is required' });
        }

        const employeeName = fullname || name;

        // Try to create table first if it doesn't exist
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              employee_code VARCHAR(50),
              phone VARCHAR(20),
              email VARCHAR(255),
              position VARCHAR(100),
              base_salary DECIMAL(12,2) DEFAULT 0,
              commission_rate DECIMAL(5,2) DEFAULT 0.00,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);
        } catch (tableError) {
          console.log('Table creation error (might already exist):', tableError.message);
        }

        const result = await client.query(`
          INSERT INTO employees (employee_code, fullname, position, base_salary, commission_rate, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
          RETURNING *
        `, [employee_code, employeeName, position || '', base_salary || 0, commission_rate || 0]);

        res.status(201).json({
          message: 'Employee created successfully',
          employee: result.rows[0]
        });

      } else if (req.method === 'PUT') {
        // Update employee
        const { id } = req.query;
        const { name, fullname, employee_code, phone, email, position, base_salary, commission_rate } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Employee ID is required' });
        }

        if (!employee_code) {
          return res.status(400).json({ error: 'Employee code is required' });
        }

        if (!fullname && !name) {
          return res.status(400).json({ error: 'Employee name is required' });
        }

        const employeeName = fullname || name;

        const result = await client.query(`
          UPDATE employees 
          SET employee_code = $1, fullname = $2, position = $3, base_salary = $4, commission_rate = $5, updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `, [employee_code, employeeName, position || '', base_salary || 0, commission_rate || 0, id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({
          message: 'Employee updated successfully',
          employee: result.rows[0]
        });

      } else if (req.method === 'DELETE') {
        // Soft delete employee
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'Employee ID is required' });
        }

        const result = await client.query(`
          UPDATE employees 
          SET is_active = false, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({
          message: 'Employee deleted successfully',
          employee: result.rows[0]
        });

      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Employees API error:', error);
    res.status(500).json({ error: 'Employees API failed: ' + error.message });
  }
};
