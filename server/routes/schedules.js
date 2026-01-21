const express = require('express');
const db = require('../database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách ca làm việc
router.get('/shifts', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM shifts WHERE is_active = 1 ORDER BY start_time',
    (err, shifts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ shifts });
    }
  );
});

// Thêm ca làm việc mới
router.post('/shifts', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { name, start_time, end_time } = req.body;

  if (!name || !start_time || !end_time) {
    return res.status(400).json({ error: 'Name, start time, and end time are required' });
  }

  db.run(
    'INSERT INTO shifts (name, start_time, end_time) VALUES (?, ?, ?)',
    [name, start_time, end_time],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create shift' });
      }

      db.get('SELECT * FROM shifts WHERE id = ?', [this.lastID], (err, shift) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          message: 'Shift created successfully',
          shift
        });
      });
    }
  );
});

// Cập nhật ca làm việc
router.put('/shifts/:id', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { id } = req.params;
  const { name, start_time, end_time, is_active } = req.body;

  db.run(
    `UPDATE shifts SET 
     name = COALESCE(?, name),
     start_time = COALESCE(?, start_time),
     end_time = COALESCE(?, end_time),
     is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [name, start_time, end_time, is_active, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update shift' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Shift not found' });
      }

      db.get('SELECT * FROM shifts WHERE id = ?', [id], (err, shift) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          message: 'Shift updated successfully',
          shift
        });
      });
    }
  );
});

// Lấy lịch làm việc
router.get('/', authenticateToken, (req, res) => {
  const { employee_id, work_date, start_date, end_date } = req.query;

  let query = `
    SELECT s.*, 
           sh.name as shift_name, sh.start_time, sh.end_time,
           e.employee_code, u.fullname as employee_name
    FROM schedules s
    JOIN shifts sh ON s.shift_id = sh.id
    JOIN employees e ON s.employee_id = e.id
    JOIN users u ON e.user_id = u.id
  `;

  let params = [];
  let conditions = [];

  if (employee_id) {
    conditions.push('s.employee_id = ?');
    params.push(employee_id);
  }

  if (work_date) {
    conditions.push('s.work_date = ?');
    params.push(work_date);
  }

  if (start_date && end_date) {
    conditions.push('s.work_date BETWEEN ? AND ?');
    params.push(start_date, end_date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY s.work_date DESC, sh.start_time ASC';

  db.all(query, params, (err, schedules) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ schedules });
  });
});

// Lấy lịch làm việc theo tuần
router.get('/week/:date', authenticateToken, (req, res) => {
  const { date } = req.params;

  // Tính toán tuần (từ thứ 2 đến chủ nhật)
  const inputDate = new Date(date);
  const dayOfWeek = inputDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Chủ nhật = 0, thứ 2 = 1
  
  const monday = new Date(inputDate);
  monday.setDate(inputDate.getDate() + mondayOffset);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  db.all(
    `SELECT s.*, 
            sh.name as shift_name, sh.start_time, sh.end_time,
            e.employee_code, u.fullname as employee_name
     FROM schedules s
     JOIN shifts sh ON s.shift_id = sh.id
     JOIN employees e ON s.employee_id = e.id
     JOIN users u ON e.user_id = u.id
     WHERE s.work_date BETWEEN ? AND ?
     ORDER BY s.work_date ASC, sh.start_time ASC`,
    [startDate, endDate],
    (err, schedules) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        schedules,
        week_start: startDate,
        week_end: endDate
      });
    }
  );
});

// Tạo lịch làm việc
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { employee_id, shift_id, work_date, notes } = req.body;

  if (!employee_id || !shift_id || !work_date) {
    return res.status(400).json({ 
      error: 'Employee, shift, and work date are required' 
    });
  }

  // Kiểm tra trùng lặp
  db.get(
    'SELECT id FROM schedules WHERE employee_id = ? AND work_date = ?',
    [employee_id, work_date],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        return res.status(400).json({ 
          error: 'Employee already has a schedule for this date' 
        });
      }

      db.run(
        'INSERT INTO schedules (employee_id, shift_id, work_date, notes) VALUES (?, ?, ?, ?)',
        [employee_id, shift_id, work_date, notes],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create schedule' });
          }

          // Lấy thông tin lịch làm việc vừa tạo
          db.get(
            `SELECT s.*, 
                    sh.name as shift_name, sh.start_time, sh.end_time,
                    e.employee_code, u.fullname as employee_name
             FROM schedules s
             JOIN shifts sh ON s.shift_id = sh.id
             JOIN employees e ON s.employee_id = e.id
             JOIN users u ON e.user_id = u.id
             WHERE s.id = ?`,
            [this.lastID],
            (err, schedule) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.status(201).json({
                message: 'Schedule created successfully',
                schedule
              });
            }
          );
        }
      );
    }
  );
});

// Tạo lịch làm việc hàng loạt
router.post('/bulk', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { schedules } = req.body; // Array of {employee_id, shift_id, work_date, notes}

  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ error: 'Schedules array is required' });
  }

  const insertPromises = schedules.map(schedule => {
    return new Promise((resolve, reject) => {
      const { employee_id, shift_id, work_date, notes } = schedule;

      if (!employee_id || !shift_id || !work_date) {
        return reject(new Error('Employee, shift, and work date are required for each schedule'));
      }

      // Kiểm tra trùng lặp
      db.get(
        'SELECT id FROM schedules WHERE employee_id = ? AND work_date = ?',
        [employee_id, work_date],
        (err, existing) => {
          if (err) return reject(err);
          
          if (existing) {
            return resolve({ skipped: true, employee_id, work_date, reason: 'Already exists' });
          }

          db.run(
            'INSERT INTO schedules (employee_id, shift_id, work_date, notes) VALUES (?, ?, ?, ?)',
            [employee_id, shift_id, work_date, notes],
            function(err) {
              if (err) return reject(err);
              resolve({ created: true, id: this.lastID });
            }
          );
        }
      );
    });
  });

  Promise.all(insertPromises)
    .then(results => {
      const created = results.filter(r => r.created).length;
      const skipped = results.filter(r => r.skipped).length;

      res.json({
        message: `Bulk schedule creation completed`,
        created,
        skipped,
        results
      });
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to create bulk schedules: ' + error.message });
    });
});

// Cập nhật lịch làm việc
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { id } = req.params;
  const { shift_id, status, notes } = req.body;

  db.run(
    `UPDATE schedules SET 
     shift_id = COALESCE(?, shift_id),
     status = COALESCE(?, status),
     notes = COALESCE(?, notes)
     WHERE id = ?`,
    [shift_id, status, notes, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update schedule' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      // Lấy thông tin lịch làm việc đã cập nhật
      db.get(
        `SELECT s.*, 
                sh.name as shift_name, sh.start_time, sh.end_time,
                e.employee_code, u.fullname as employee_name
         FROM schedules s
         JOIN shifts sh ON s.shift_id = sh.id
         JOIN employees e ON s.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         WHERE s.id = ?`,
        [id],
        (err, schedule) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            message: 'Schedule updated successfully',
            schedule
          });
        }
      );
    }
  );
});

// Xóa lịch làm việc
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'manager'), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM schedules WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete schedule' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  });
});

module.exports = router;
