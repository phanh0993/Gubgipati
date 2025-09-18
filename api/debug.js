const { Pool } = require('pg');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : null,
      hasJwtSecret: !!process.env.JWT_SECRET
    };

    // Test database connection
    if (process.env.DATABASE_URL) {
      try {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        const client = await pool.connect();
        
        try {
          const result = await client.query('SELECT NOW() as current_time');
          debugInfo.databaseConnection = 'SUCCESS';
          debugInfo.databaseTime = result.rows[0].current_time;
          
          // Check if users table exists
          try {
            const tableCheck = await client.query(`
              SELECT COUNT(*) as count FROM information_schema.tables 
              WHERE table_name = 'users'
            `);
            debugInfo.usersTableExists = tableCheck.rows[0].count > 0;
            
            if (debugInfo.usersTableExists) {
              const userCount = await client.query('SELECT COUNT(*) as count FROM users');
              debugInfo.userCount = userCount.rows[0].count;
            }
          } catch (tableError) {
            debugInfo.tableCheckError = tableError.message;
          }
          
        } finally {
          client.release();
        }
        
        await pool.end();
        
      } catch (dbError) {
        debugInfo.databaseConnection = 'FAILED';
        debugInfo.databaseError = dbError.message;
      }
    }

    res.status(200).json(debugInfo);

  } catch (error) {
    res.status(500).json({
      error: 'Debug failed',
      message: error.message
    });
  }
};
