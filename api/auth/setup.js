const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== SETUP REQUEST ===');
  console.log('Body:', req.body);

  try {
    const { admin } = req.body;
    const { username, password, fullname, email, phone } = admin || req.body;

    if (!username || !password || !fullname) {
      return res.status(400).json({ 
        error: 'Username, password, and fullname are required' 
      });
    }

    const dbPool = getPool();
    const client = await dbPool.connect();

    try {
      // Create users table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          fullname VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          role VARCHAR(50) DEFAULT 'employee',
          avatar TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if admin exists
      const existingAdmin = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['admin']
      );

      if (parseInt(existingAdmin.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Admin account already exists' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      // Create admin user
      const result = await client.query(
        `INSERT INTO users (username, password, fullname, email, phone, role) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, fullname, email, phone, role`,
        [username, hashedPassword, fullname, email, phone, 'admin']
      );

      const user = result.rows[0];

      const token = jwt.sign(user, process.env.JWT_SECRET || 'july-spa-secret', {
        expiresIn: '24h'
      });

      console.log('✅ Setup successful');

      res.status(201).json({
        message: 'Admin account created successfully',
        user,
        token
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      error: 'Failed to create admin account: ' + error.message
    });
  }
};