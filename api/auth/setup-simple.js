const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

  console.log('=== SETUP API DEBUG START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  try {
    // Parse request data
    const { admin } = req.body;
    const { username, password, fullname, email, phone } = admin || req.body;

    console.log('Parsed fields:', {
      username: username || 'MISSING',
      fullname: fullname || 'MISSING', 
      email: email || 'MISSING',
      phone: phone || 'MISSING',
      hasPassword: !!password
    });

    if (!username || !password || !fullname) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ 
        error: 'Username, password, and fullname are required',
        received: { username: !!username, password: !!password, fullname: !!fullname }
      });
    }

    console.log('✅ Validation passed');

    // Test database connection
    console.log('🔗 Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    console.log('✅ Database connected');

    try {
      // Test basic query
      console.log('🧪 Testing basic query...');
      const testResult = await client.query('SELECT NOW() as now');
      console.log('✅ Basic query successful:', testResult.rows[0]);

      // Create users table
      console.log('📋 Creating users table...');
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
      console.log('✅ Users table created/verified');

      // Check existing admin
      console.log('👤 Checking for existing admin...');
      const adminCheck = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['admin']
      );
      console.log('Admin count:', adminCheck.rows[0].count);

      if (parseInt(adminCheck.rows[0].count) > 0) {
        console.log('❌ Admin already exists');
        return res.status(400).json({ error: 'Admin account already exists' });
      }

      // Hash password
      console.log('🔐 Hashing password...');
      const hashedPassword = bcrypt.hashSync(password, 10);
      console.log('✅ Password hashed');

      // Insert admin user
      console.log('💾 Creating admin user...');
      const insertResult = await client.query(
        `INSERT INTO users (username, password, fullname, email, phone, role) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, fullname, email, phone, role`,
        [username, hashedPassword, fullname, email, phone, 'admin']
      );

      const user = insertResult.rows[0];
      console.log('✅ User created:', user);

      // Create JWT token
      console.log('🎫 Creating JWT token...');
      const token = jwt.sign(user, process.env.JWT_SECRET || 'july-spa-secret', {
        expiresIn: '24h'
      });
      console.log('✅ Token created');

      console.log('🎉 Setup completed successfully');

      res.status(201).json({
        message: 'Admin account created successfully',
        user,
        token
      });

    } finally {
      client.release();
      await pool.end();
      console.log('🔌 Database connection closed');
    }

  } catch (error) {
    console.log('=== ERROR DETAILS ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error stack:', error.stack);
    console.log('=== END ERROR ===');

    res.status(500).json({ 
      error: 'Setup failed: ' + error.message,
      code: error.code,
      detail: error.detail
    });
  }

  console.log('=== SETUP API DEBUG END ===');
};
