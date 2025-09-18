const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Đăng ký tài khoản admin đầu tiên
router.post('/setup', (req, res) => {
  const { admin, business } = req.body;
  const { username, password, fullname, email, phone } = admin || req.body;

  // Validate required fields
  if (!username || !password || !fullname) {
    return res.status(400).json({ 
      error: 'Username, password, and fullname are required' 
    });
  }

  // Kiểm tra xem đã có admin chưa
  db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (row.count > 0) {
      return res.status(400).json({ error: 'Admin account already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
      `INSERT INTO users (username, password, fullname, email, phone, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, fullname, email, phone, 'admin'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create admin account' });
        }

        const user = {
          id: this.lastID,
          username,
          fullname,
          email,
          phone,
          role: 'admin'
        };

        const token = generateToken(user);

        res.status(201).json({
          message: 'Admin account created successfully',
          user,
          token
        });
      }
    );
  });
});

// Đăng nhập
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = bcrypt.compareSync(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const userInfo = {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      };

      const token = generateToken(userInfo);

      res.json({
        message: 'Login successful',
        user: userInfo,
        token
      });
    }
  );
});

// Lấy thông tin user hiện tại
router.get('/me', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, username, fullname, email, phone, role, avatar FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    }
  );
});

// Đổi mật khẩu
router.put('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  db.get(
    'SELECT password FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = bcrypt.compareSync(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, req.user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update password' });
          }

          res.json({ message: 'Password updated successfully' });
        }
      );
    }
  );
});

module.exports = router;
