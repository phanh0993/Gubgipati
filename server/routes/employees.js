const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách nhân viên
router.get('/', (req, res) => {
  const { active, position } = req.query;
  
  let query = `
    SELECT e.*, u.username, u.fullname, u.email, u.phone, u.avatar
    FROM employees e
    JOIN users u ON e.user_id = u.id
  `;
  
  let params = [];
  let conditions = [];

  if (active !== undefined) {
    conditions.push('e.is_active = ?');
    params.push((active === true || active === 'true') ? 1 : 0);
  }

  if (position) {
    conditions.push('e.position = ?');
    params.push(position);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY u.fullname ASC';

  db.all(query, params, (err, employees) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse skills JSON
    employees = employees.map(emp => ({
      ...emp,
      skills: emp.skills ? JSON.parse(emp.skills) : []
    }));

    res.json({ employees });
  });
});

// Tạo nhân viên mới
router.post('/', (req, res) => {
  const { 
    username, password, fullname, email, phone, 
    employee_code, position, department, hire_date, 
    base_salary, skills, is_active = true 
  } = req.body;

  // Validate required fields
  if (!username || !password || !fullname || !employee_code) {
    return res.status(400).json({ 
      error: 'Username, password, fullname, and employee_code are required' 
    });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.serialize(() => {
    // Insert user first
    db.run(
      `INSERT INTO users (username, password, fullname, email, phone, role) 
       VALUES (?, ?, ?, ?, ?, 'employee')`,
      [username, hashedPassword, fullname, email, phone],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }

        const userId = this.lastID;

        // Insert employee
        db.run(
          `INSERT INTO employees (
            user_id, employee_code, position, hire_date, 
            base_salary, skills, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, employee_code, position, hire_date,
            base_salary, JSON.stringify(skills || []), is_active ? 1 : 0
          ],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create employee' });
            }

            res.status(201).json({ 
              message: 'Employee created successfully',
              employee_id: this.lastID,
              user_id: userId
            });
          }
        );
      }
    );
  });
});

// Lấy thông tin một nhân viên
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT e.*, u.username, u.fullname, u.email, u.phone, u.avatar
     FROM employees e
     JOIN users u ON e.user_id = u.id
     WHERE e.id = ?`,
    [id],
    (err, employee) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Parse skills
      employee.skills = employee.skills ? JSON.parse(employee.skills) : [];

      // Lấy thống kê doanh thu của nhân viên
      db.get(
        `SELECT 
           COUNT(ii.id) as total_services,
           COALESCE(SUM(ii.total_price), 0) as total_revenue,
           COALESCE(SUM(ii.commission_amount), 0) as total_commission
         FROM invoice_items ii
         WHERE ii.employee_id = ?`,
        [id],
        (err, stats) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            employee,
            stats: stats || { total_services: 0, total_revenue: 0, total_commission: 0 }
          });
        }
      );
    }
  );
});

// Thêm nhân viên mới
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { 
    username, password, fullname, email, phone, 
    employee_code, position, base_salary, commission_rate, 
    hire_date, skills 
  } = req.body;

  if (!username || !password || !fullname || !employee_code) {
    return res.status(400).json({ 
      error: 'Username, password, fullname, and employee code are required' 
    });
  }

  // Kiểm tra username trùng lặp
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Kiểm tra employee_code trùng lặp
    db.get('SELECT id FROM employees WHERE employee_code = ?', [employee_code], (err, existingEmployee) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingEmployee) {
        return res.status(400).json({ error: 'Employee code already exists' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      // Tạo user trước
      db.run(
        `INSERT INTO users (username, password, fullname, email, phone, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, fullname, email, phone, 'employee'],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user account' });
          }

          const userId = this.lastID;

          // Tạo employee record
          db.run(
            `INSERT INTO employees 
             (user_id, employee_code, position, base_salary, commission_rate, hire_date, skills) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              userId, employee_code, position, 
              base_salary || 0, commission_rate || 0, 
              hire_date || new Date().toISOString().split('T')[0],
              skills ? JSON.stringify(skills) : JSON.stringify([])
            ],
            function(err) {
              if (err) {
                // Rollback user creation
                db.run('DELETE FROM users WHERE id = ?', [userId]);
                return res.status(500).json({ error: 'Failed to create employee' });
              }

              // Lấy thông tin nhân viên vừa tạo
              db.get(
                `SELECT e.*, u.username, u.fullname, u.email, u.phone
                 FROM employees e
                 JOIN users u ON e.user_id = u.id
                 WHERE e.id = ?`,
                [this.lastID],
                (err, employee) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  employee.skills = JSON.parse(employee.skills || '[]');

                  res.status(201).json({
                    message: 'Employee created successfully',
                    employee
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});





// Lấy doanh thu theo nhân viên
router.get('/:id/revenue', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, limit = 10 } = req.query;

  let query = `
    SELECT 
      DATE(i.invoice_date) as date,
      COUNT(ii.id) as services_count,
      SUM(ii.total_price) as revenue,
      SUM(ii.commission_amount) as commission
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE ii.employee_id = ?
  `;
  
  let params = [id];

  if (start_date) {
    query += ' AND DATE(i.invoice_date) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(i.invoice_date) <= ?';
    params.push(end_date);
  }

  query += `
    GROUP BY DATE(i.invoice_date)
    ORDER BY DATE(i.invoice_date) DESC
    LIMIT ?
  `;
  
  params.push(parseInt(limit));

  db.all(query, params, (err, revenue) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ revenue });
  });
});

// Lấy danh sách vị trí/chức vụ
router.get('/positions/list', authenticateToken, (req, res) => {
  db.all(
    'SELECT DISTINCT position FROM employees WHERE position IS NOT NULL ORDER BY position',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const positions = rows.map(row => row.position);
      res.json({ positions });
    }
  );
});

// Cập nhật nhân viên
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    username, password, fullname, email, phone, 
    employee_code, position, base_salary, skills, is_active 
  } = req.body;

  // Validate required fields
  if (!fullname || !employee_code) {
    return res.status(400).json({ 
      error: 'Fullname and employee_code are required' 
    });
  }

  db.serialize(() => {
    // Get employee's user_id first
    db.get('SELECT user_id FROM employees WHERE id = ?', [id], (err, employee) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Update user table
      let userQuery = 'UPDATE users SET fullname = ?, email = ?, phone = ?';
      let userParams = [fullname, email, phone];
      
      if (username) {
        userQuery += ', username = ?';
        userParams.push(username);
      }
      
      if (password) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync(password, 10);
        userQuery += ', password = ?';
        userParams.push(hashedPassword);
      }
      
      userQuery += ' WHERE id = ?';
      userParams.push(employee.user_id);

      db.run(userQuery, userParams, (err) => {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Failed to update user' });
        }

        // Update employee table
        db.run(
          `UPDATE employees SET 
           employee_code = ?, position = ?, base_salary = ?, 
           skills = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            employee_code, position, base_salary,
            JSON.stringify(skills || []), is_active ? 1 : 0, id
          ],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update employee' });
            }

            res.json({ 
              message: 'Employee updated successfully'
            });
          }
        );
      });
    });
  });
});

// Xóa nhân viên
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    // Get employee's user_id first
    db.get('SELECT user_id FROM employees WHERE id = ?', [id], (err, employee) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Check if employee has invoices
      db.get('SELECT COUNT(*) as count FROM invoice_items WHERE employee_id = ?', [id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.count > 0) {
          // Don't delete, just deactivate
          db.run(
            'UPDATE employees SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to deactivate employee' });
              }
              res.json({ message: 'Employee deactivated successfully (has invoice history)' });
            }
          );
        } else {
          // Safe to delete
          db.run('DELETE FROM employees WHERE id = ?', [id], (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to delete employee' });
            }

            // Also delete user account
            db.run('DELETE FROM users WHERE id = ?', [employee.user_id], (err) => {
              if (err) {
                console.error('Failed to delete user account:', err);
              }
              res.json({ message: 'Employee deleted successfully' });
            });
          });
        }
      });
    });
  });
});

module.exports = router;
