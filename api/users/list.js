const { Pool } = require('pg');

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
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
      // Get all users (without passwords)
      const result = await client.query(`
        SELECT id, username, fullname, email, phone, role, created_at 
        FROM users 
        ORDER BY created_at DESC
      `);

      res.status(200).json({
        users: result.rows,
        count: result.rows.length,
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ 
      error: 'Failed to list users: ' + error.message 
    });
  }
};
