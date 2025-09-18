const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rmqzggfwvhsoiijlsxwy:Locphucanh0911%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

// API Routes
app.post('/api/auth/login', async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Body:', req.body);
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, username, password, fullname, email, phone, role FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
      );

      console.log('User query result:', result.rows.length);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = result.rows[0];
      console.log('Found user:', user.username);

      const isValidPassword = bcrypt.compareSync(password, user.password);
      console.log('Password comparison:', isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      delete user.password;

      const token = jwt.sign(user, 'july-spa-secret', {
        expiresIn: '24h'
      });

      console.log('✅ Login successful');

      res.json({
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
});

app.post('/api/auth/setup', async (req, res) => {
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

    const client = await pool.connect();

    try {
      const existingAdmin = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['admin']
      );

      if (parseInt(existingAdmin.rows[0].count) > 0) {
        return res.status(400).json({ error: 'Admin account already exists' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      const result = await client.query(
        `INSERT INTO users (username, password, fullname, email, phone, role) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, fullname, email, phone, role`,
        [username, hashedPassword, fullname, email, phone, 'admin']
      );

      const user = result.rows[0];

      const token = jwt.sign(user, 'july-spa-secret', {
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
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Production server running on http://localhost:${PORT}`);
  console.log(`🌐 React app: http://localhost:${PORT}`);
  console.log(`📝 API: http://localhost:${PORT}/api/auth/login`);
  console.log(`⚙️  Setup: http://localhost:${PORT}/api/auth/setup`);
});

module.exports = app;
