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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Fixing password hash for existing user...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
      // Get current user
      const currentUser = await client.query('SELECT * FROM users WHERE username = $1', ['Ly09']);
      
      if (currentUser.rows.length === 0) {
        return res.status(404).json({ error: 'User Ly09 not found' });
      }

      const user = currentUser.rows[0];
      console.log('Current user:', { username: user.username, currentPassword: user.password });

      // The current password is stored as plain text: "0333109514"
      // We need to hash it
      const plainPassword = user.password; // "0333109514"
      const hashedPassword = bcrypt.hashSync(plainPassword, 10);
      
      console.log('Hashing password:', { 
        plain: plainPassword, 
        hashedLength: hashedPassword.length 
      });

      // Update with hashed password
      await client.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [hashedPassword, 'Ly09']
      );

      console.log('✅ Password updated to hash');

      // Verify the update
      const updatedUser = await client.query(
        'SELECT username, password FROM users WHERE username = $1', 
        ['Ly09']
      );

      res.status(200).json({
        message: 'Password hash fixed successfully',
        user: {
          username: updatedUser.rows[0].username,
          passwordHashLength: updatedUser.rows[0].password.length,
          isHashed: updatedUser.rows[0].password.startsWith('$2')
        },
        canLoginWith: {
          username: 'Ly09',
          password: '0333109514'
        }
      });

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Fix password error:', error);
    res.status(500).json({ 
      error: 'Fix password failed: ' + error.message 
    });
  }
};
