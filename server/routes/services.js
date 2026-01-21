const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách dịch vụ
router.get('/', (req, res) => {
  const { category, active } = req.query;
  
  let query = 'SELECT * FROM services';
  let params = [];
  let conditions = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (active !== undefined) {
    conditions.push('is_active = ?');
    params.push((active === true || active === 'true') ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY name ASC';

  db.all(query, params, (err, services) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ services });
  });
});

// Lấy thông tin một dịch vụ
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM services WHERE id = ?', [id], (err, service) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  });
});

// Thêm dịch vụ mới
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { name, description, price, duration, category, commission_rate } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  db.run(
    `INSERT INTO services (name, description, price, duration, category, commission_rate) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, price, duration || 60, category, commission_rate || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create service' });
      }

      db.get('SELECT * FROM services WHERE id = ?', [this.lastID], (err, service) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          message: 'Service created successfully',
          service
        });
      });
    }
  );
});

// Cập nhật dịch vụ
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { id } = req.params;
  const { name, description, price, duration, category, commission_rate, is_active } = req.body;

  db.run(
    `UPDATE services SET 
     name = COALESCE(?, name),
     description = COALESCE(?, description),
     price = COALESCE(?, price),
     duration = COALESCE(?, duration),
     category = COALESCE(?, category),
     commission_rate = COALESCE(?, commission_rate),
     is_active = COALESCE(?, is_active),
     updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, description, price, duration, category, commission_rate, is_active, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update service' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      db.get('SELECT * FROM services WHERE id = ?', [id], (err, service) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          message: 'Service updated successfully',
          service
        });
      });
    }
  );
});

// Xóa dịch vụ (soft delete)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE services SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete service' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({ message: 'Service deleted successfully' });
    }
  );
});

// Lấy danh sách categories
router.get('/categories/list', authenticateToken, (req, res) => {
  db.all(
    'SELECT DISTINCT category FROM services WHERE category IS NOT NULL AND is_active = 1 ORDER BY category',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const categories = rows.map(row => row.category);
      res.json({ categories });
    }
  );
});

module.exports = router;
