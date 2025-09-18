const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách khách hàng
router.get('/', (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  
  let query = `
    SELECT c.*, 
           COUNT(ch.id) as visit_count,
           MAX(ch.visit_date) as last_visit_date
    FROM customers c
    LEFT JOIN customer_history ch ON c.id = ch.customer_id
  `;
  
  let params = [];
  
  if (search) {
    query += ' WHERE (c.fullname LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += `
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Đếm tổng số khách hàng
    let countQuery = 'SELECT COUNT(*) as total FROM customers';
    let countParams = [];
    
    if (search) {
      countQuery += ' WHERE (fullname LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        customers,
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
});

// Tạo khách hàng mới
router.post('/', (req, res) => {
  const {
    fullname, phone, email, address, birthday, gender,
    notes, loyalty_points = 0, total_spent = 0
  } = req.body;

  // Validate required fields
  if (!fullname || !phone) {
    return res.status(400).json({ 
      error: 'Fullname and phone are required' 
    });
  }

  db.run(
    `INSERT INTO customers (
      fullname, phone, email, address, birthday, gender,
      notes, loyalty_points, total_spent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fullname, phone, email, address, birthday, gender,
      notes, loyalty_points, total_spent
    ],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Phone number already exists' });
        }
        return res.status(500).json({ error: 'Failed to create customer' });
      }

      res.status(201).json({ 
        message: 'Customer created successfully',
        customer_id: this.lastID
      });
    }
  );
});

// Lấy thông tin một khách hàng
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Lấy lịch sử khách hàng
    db.all(
      `SELECT ch.*, s.name as service_name 
       FROM customer_history ch
       LEFT JOIN services s ON ch.service_name = s.name
       WHERE ch.customer_id = ?
       ORDER BY ch.visit_date DESC
       LIMIT 20`,
      [id],
      (err, history) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          customer,
          history
        });
      }
    );
  });
});

// Thêm khách hàng mới
router.post('/', authenticateToken, (req, res) => {
  const { fullname, phone, email, address, birthday, gender, notes } = req.body;

  if (!fullname) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  // Kiểm tra khách hàng trùng lặp (cả tên và số điện thoại)
  if (phone && fullname) {
    db.get(
      'SELECT id, fullname, phone FROM customers WHERE TRIM(LOWER(fullname)) = ? AND TRIM(phone) = ?', 
      [fullname.trim().toLowerCase(), phone.trim()], 
      (err, existingCustomer) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingCustomer) {
          return res.status(400).json({ 
            error: `Khách hàng đã tồn tại với tên "${existingCustomer.fullname}" và số điện thoại "${existingCustomer.phone}"`,
            existingCustomer: {
              id: existingCustomer.id,
              name: existingCustomer.fullname,
              phone: existingCustomer.phone
            }
          });
        }

        createCustomer();
      }
    );
  } else {
    createCustomer();
  }

  function createCustomer() {
    db.run(
      `INSERT INTO customers (fullname, phone, email, address, birthday, gender, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullname, phone, email, address, birthday, gender, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create customer' });
        }

        db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (err, customer) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.status(201).json({
            message: 'Customer created successfully',
            customer
          });
        });
      }
    );
  }
});

// Cập nhật thông tin khách hàng




// Tìm kiếm khách hàng theo số điện thoại
router.get('/search/phone/:phone', authenticateToken, (req, res) => {
  const { phone } = req.params;

  db.get('SELECT * FROM customers WHERE phone = ?', [phone], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ customer: customer || null });
  });
});

// Thống kê khách hàng VIP (chi tiêu nhiều)
router.get('/stats/vip', authenticateToken, (req, res) => {
  const { limit = 20 } = req.query;

  db.all(
    `SELECT c.*, 
            COUNT(ch.id) as visit_count,
            COALESCE(SUM(ch.amount), 0) as total_spent,
            MAX(ch.visit_date) as last_visit
     FROM customers c
     LEFT JOIN customer_history ch ON c.id = ch.customer_id
     GROUP BY c.id
     HAVING total_spent > 0
     ORDER BY total_spent DESC, visit_count DESC
     LIMIT ?`,
    [parseInt(limit)],
    (err, vipCustomers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ vipCustomers });
    }
  );
});

// Cập nhật khách hàng
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    fullname, phone, email, address, birthday, gender, notes
  } = req.body;

  // Validate required fields
  if (!fullname || !phone) {
    return res.status(400).json({ 
      error: 'Fullname and phone are required' 
    });
  }

  db.run(
    `UPDATE customers SET 
     fullname = ?, phone = ?, email = ?, address = ?, 
     birthday = ?, gender = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [fullname, phone, email, address, birthday, gender, notes, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Phone number already exists' });
        }
        return res.status(500).json({ error: 'Failed to update customer' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({ 
        message: 'Customer updated successfully'
      });
    }
  );
});

// Xóa khách hàng
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { force } = req.query; // Thêm tham số force để xóa bắt buộc

  // Check if customer has invoices
  db.get('SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.count > 0 && !force) {
      return res.status(400).json({ 
        error: 'Khách hàng này có lịch sử hóa đơn. Bạn có muốn xóa bắt buộc không?',
        hasInvoices: true
      });
    }

    // Proceed to delete customer
    db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete customer' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // If customer had invoices, we should note this in the response
      const message = result.count > 0 ? 
        'Customer deleted successfully (had invoice history)' : 
        'Customer deleted successfully';
        
      res.json({ message });
    });
  });
});

module.exports = router;
