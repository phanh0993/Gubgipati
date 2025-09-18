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

  console.log('=== LOGIN DEBUG START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, hasPassword: !!password });

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    console.log('🔗 Connecting to database...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    console.log('✅ Database connected');

    try {
      console.log('🔍 Searching for user:', username);
      const result = await client.query(
        'SELECT id, username, password, fullname, email, phone, role FROM users WHERE username = $1',
        [username]
      );

      console.log('Query result rows:', result.rows.length);

      if (result.rows.length === 0) {
        console.log('❌ User not found');
        
        // List all users for debugging
        const allUsers = await client.query('SELECT username, role FROM users');
        console.log('Available users:', allUsers.rows);
        
        return res.status(401).json({ 
          error: 'Invalid username or password',
          debug: { availableUsers: allUsers.rows.map(u => u.username) }
        });
      }

      const user = result.rows[0];
      console.log('✅ User found:', { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        hasPassword: !!user.password 
      });

      console.log('🔐 Checking password...');
      console.log('Input password length:', password.length);
      console.log('Stored password hash length:', user.password ? user.password.length : 0);
      
      const isValidPassword = bcrypt.compareSync(password, user.password);
      console.log('Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({ 
          error: 'Invalid username or password',
          debug: { passwordCheck: false }
        });
      }

      console.log('✅ Password valid');

      // Remove password from user object
      delete user.password;

      console.log('🎫 Creating JWT token...');
      const token = jwt.sign(user, process.env.JWT_SECRET || 'july-spa-secret', {
        expiresIn: '24h'
      });
      console.log('✅ Token created');

      console.log('🎉 Login successful');

      res.status(200).json({
        message: 'Login successful',
        user,
        token
      });

    } finally {
      client.release();
      await pool.end();
      console.log('🔌 Database connection closed');
    }

  } catch (error) {
    console.log('=== LOGIN ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('=== END ERROR ===');
    
    res.status(500).json({ 
      error: 'Login failed: ' + error.message 
    });
  }

  console.log('=== LOGIN DEBUG END ===');
};
