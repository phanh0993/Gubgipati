// Direct login API endpoint
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

  console.log('=== LOGIN API CALLED ===');
  console.log('Body:', req.body);

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    const dbPool = getPool();
    const client = await dbPool.connect();

    try {
      // Find user by username (case insensitive)
      const result = await client.query(
        'SELECT id, username, password, fullname, email, phone, role FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
      );

      if (result.rows.length === 0) {
        console.log('User not found:', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = result.rows[0];
      console.log('User found:', user.username);

      // Check password
      const isValidPassword = bcrypt.compareSync(password, user.password);
      console.log('Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Remove password from user object
      delete user.password;

      // Create token with 30 days expiry for persistent login
      const token = jwt.sign(user, process.env.JWT_SECRET || 'july-spa-secret', {
        expiresIn: '30d'
      });

      console.log('Login successful for:', user.username);

      res.status(200).json({
        message: 'Login successful',
        user,
        token
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
};
