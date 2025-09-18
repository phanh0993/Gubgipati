const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
    const dbPool = getPool();
    const client = await dbPool.connect();

    try {
      // Check if users table exists and count admins
      const result = await client.query(`
        SELECT COUNT(*) as admin_count 
        FROM users 
        WHERE role = 'admin'
      `);

      const adminCount = parseInt(result.rows[0].admin_count);

      res.status(200).json({
        hasAdmin: adminCount > 0,
        adminCount,
        needsSetup: adminCount === 0
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Status check error:', error);
    
    // If table doesn't exist, we need setup
    if (error.message.includes('relation "users" does not exist')) {
      return res.status(200).json({
        hasAdmin: false,
        adminCount: 0,
        needsSetup: true,
        message: 'Database needs initialization'
      });
    }

    res.status(500).json({ error: 'Status check failed: ' + error.message });
  }
};
