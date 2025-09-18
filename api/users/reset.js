const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

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

  try {
    const { username, password, fullname, email, phone } = req.body;

    if (!username || !password || !fullname) {
      return res.status(400).json({ 
        error: 'Username, password, and fullname are required' 
      });
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
      console.log('🗑️ Clearing users table...');
      await client.query('DELETE FROM users');
      console.log('✅ Users table cleared');

      console.log('👤 Creating new admin user...');
      const hashedPassword = bcrypt.hashSync(password, 10);

      const result = await client.query(`
        INSERT INTO users (username, password, fullname, email, phone, role) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, username, fullname, email, phone, role
      `, [username, hashedPassword, fullname, email, phone, 'admin']);

      const user = result.rows[0];
      console.log('✅ Admin user created:', user);

      res.status(201).json({
        message: 'Database reset and admin created successfully',
        user
      });

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ 
      error: 'Reset failed: ' + error.message 
    });
  }
};
