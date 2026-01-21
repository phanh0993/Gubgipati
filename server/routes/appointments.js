const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách lịch hẹn
router.get('/', (req, res) => {
  const { 
    date, employee_id, customer_id, status, 
    start_date, end_date, limit = 50, offset = 0 
  } = req.query;

  let query = `
    SELECT a.*, 
           c.fullname as customer_name, c.phone as customer_phone,
           e.employee_code, u.fullname as employee_name,
           s.name as service_name, s.price as service_price, s.duration as service_duration
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
  `;

  let params = [];
  let conditions = [];

  if (date) {
    conditions.push('DATE(a.appointment_date) = ?');
    params.push(date);
  }

  if (start_date && end_date) {
    conditions.push('DATE(a.appointment_date) BETWEEN ? AND ?');
    params.push(start_date, end_date);
  }

  if (employee_id) {
    conditions.push('a.employee_id = ?');
    params.push(employee_id);
  }

  if (customer_id) {
    conditions.push('a.customer_id = ?');
    params.push(customer_id);
  }

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY a.appointment_date ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, appointments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ appointments });
  });
});

// Lấy lịch hẹn theo ngày (calendar view)
router.get('/calendar/:date', authenticateToken, (req, res) => {
  const { date } = req.params;

  db.all(
    `SELECT a.*, 
            c.fullname as customer_name, c.phone as customer_phone,
            e.employee_code, u.fullname as employee_name,
            s.name as service_name, s.price as service_price, s.duration as service_duration
     FROM appointments a
     LEFT JOIN customers c ON a.customer_id = c.id
     LEFT JOIN employees e ON a.employee_id = e.id
     LEFT JOIN users u ON e.user_id = u.id
     LEFT JOIN services s ON a.service_id = s.id
     WHERE DATE(a.appointment_date) = ?
     ORDER BY a.appointment_date ASC`,
    [date],
    (err, appointments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ appointments });
    }
  );
});

// Lấy thông tin một lịch hẹn
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT a.*, 
            c.fullname as customer_name, c.phone as customer_phone, c.email as customer_email,
            e.employee_code, u.fullname as employee_name,
            s.name as service_name, s.price as service_price, s.duration as service_duration
     FROM appointments a
     LEFT JOIN customers c ON a.customer_id = c.id
     LEFT JOIN employees e ON a.employee_id = e.id
     LEFT JOIN users u ON e.user_id = u.id
     LEFT JOIN services s ON a.service_id = s.id
     WHERE a.id = ?`,
    [id],
    (err, appointment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json({ appointment });
    }
  );
});

// Tạo lịch hẹn mới
router.post('/', authenticateToken, (req, res) => {
  const { customer_id, employee_id, service_id, appointment_date, notes } = req.body;

  if (!customer_id || !service_id || !appointment_date) {
    return res.status(400).json({ 
      error: 'Customer, service, and appointment date are required' 
    });
  }

  // Lấy thời lượng dịch vụ
  db.get('SELECT duration FROM services WHERE id = ?', [service_id], (err, service) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Kiểm tra xung đột lịch hẹn nếu có chỉ định nhân viên
    if (employee_id) {
      const appointmentStart = new Date(appointment_date);
      const appointmentEnd = new Date(appointmentStart.getTime() + (service.duration * 60000));

      db.get(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE employee_id = ? 
         AND status NOT IN ('cancelled', 'completed')
         AND datetime(appointment_date) < datetime(?)
         AND datetime(appointment_date, '+' || duration || ' minutes') > datetime(?)`,
        [employee_id, appointmentEnd.toISOString(), appointmentStart.toISOString()],
        (err, conflict) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (conflict.count > 0) {
            return res.status(400).json({ 
              error: 'Employee is not available at this time' 
            });
          }

          createAppointment();
        }
      );
    } else {
      createAppointment();
    }

    function createAppointment() {
      db.run(
        `INSERT INTO appointments (customer_id, employee_id, service_id, appointment_date, duration, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customer_id, employee_id, service_id, appointment_date, service.duration, notes],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create appointment' });
          }

          // Lấy thông tin lịch hẹn vừa tạo
          db.get(
            `SELECT a.*, 
                    c.fullname as customer_name, c.phone as customer_phone,
                    e.employee_code, u.fullname as employee_name,
                    s.name as service_name, s.price as service_price
             FROM appointments a
             LEFT JOIN customers c ON a.customer_id = c.id
             LEFT JOIN employees e ON a.employee_id = e.id
             LEFT JOIN users u ON e.user_id = u.id
             LEFT JOIN services s ON a.service_id = s.id
             WHERE a.id = ?`,
            [this.lastID],
            (err, appointment) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.status(201).json({
                message: 'Appointment created successfully',
                appointment
              });
            }
          );
        }
      );
    }
  });
});

// Cập nhật lịch hẹn
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { employee_id, appointment_date, status, notes } = req.body;

  // Nếu thay đổi nhân viên hoặc thời gian, kiểm tra xung đột
  if ((employee_id || appointment_date) && status !== 'cancelled') {
    db.get('SELECT * FROM appointments WHERE id = ?', [id], (err, currentAppointment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!currentAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const newEmployeeId = employee_id || currentAppointment.employee_id;
      const newAppointmentDate = appointment_date || currentAppointment.appointment_date;

      if (newEmployeeId) {
        const appointmentStart = new Date(newAppointmentDate);
        const appointmentEnd = new Date(appointmentStart.getTime() + (currentAppointment.duration * 60000));

        db.get(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE employee_id = ? 
           AND id != ?
           AND status NOT IN ('cancelled', 'completed')
           AND datetime(appointment_date) < datetime(?)
           AND datetime(appointment_date, '+' || duration || ' minutes') > datetime(?)`,
          [newEmployeeId, id, appointmentEnd.toISOString(), appointmentStart.toISOString()],
          (err, conflict) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (conflict.count > 0) {
              return res.status(400).json({ 
                error: 'Employee is not available at this time' 
              });
            }

            updateAppointment();
          }
        );
      } else {
        updateAppointment();
      }
    });
  } else {
    updateAppointment();
  }

  function updateAppointment() {
    db.run(
      `UPDATE appointments SET 
       employee_id = COALESCE(?, employee_id),
       appointment_date = COALESCE(?, appointment_date),
       status = COALESCE(?, status),
       notes = COALESCE(?, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [employee_id, appointment_date, status, notes, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update appointment' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Appointment not found' });
        }

        // Lấy thông tin lịch hẹn đã cập nhật
        db.get(
          `SELECT a.*, 
                  c.fullname as customer_name, c.phone as customer_phone,
                  e.employee_code, u.fullname as employee_name,
                  s.name as service_name, s.price as service_price
           FROM appointments a
           LEFT JOIN customers c ON a.customer_id = c.id
           LEFT JOIN employees e ON a.employee_id = e.id
           LEFT JOIN users u ON e.user_id = u.id
           LEFT JOIN services s ON a.service_id = s.id
           WHERE a.id = ?`,
          [id],
          (err, appointment) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              message: 'Appointment updated successfully',
              appointment
            });
          }
        );
      }
    );
  }
});

// Hủy lịch hẹn
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE appointments SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to cancel appointment' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json({ message: 'Appointment cancelled successfully' });
    }
  );
});

// Lấy lịch trống của nhân viên
router.get('/employee/:employeeId/available-slots', authenticateToken, (req, res) => {
  const { employeeId } = req.params;
  const { date, duration = 60 } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  // Lấy lịch hẹn hiện có của nhân viên trong ngày
  db.all(
    `SELECT appointment_date, duration FROM appointments 
     WHERE employee_id = ? 
     AND DATE(appointment_date) = ?
     AND status NOT IN ('cancelled', 'completed')
     ORDER BY appointment_date`,
    [employeeId, date],
    (err, existingAppointments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Tạo danh sách các slot trống (8:00 - 20:00, mỗi slot 30 phút)
      const workStart = new Date(`${date}T08:00:00`);
      const workEnd = new Date(`${date}T20:00:00`);
      const slotDuration = 30; // phút
      const requestedDuration = parseInt(duration);

      const availableSlots = [];
      let currentTime = new Date(workStart);

      while (currentTime < workEnd) {
        const slotEnd = new Date(currentTime.getTime() + (requestedDuration * 60000));
        
        // Kiểm tra xem slot này có bị trùng với lịch hẹn nào không
        const isConflict = existingAppointments.some(appointment => {
          const appointmentStart = new Date(appointment.appointment_date);
          const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration * 60000));
          
          return (currentTime < appointmentEnd && slotEnd > appointmentStart);
        });

        if (!isConflict && slotEnd <= workEnd) {
          availableSlots.push({
            start_time: currentTime.toTimeString().slice(0, 5),
            end_time: slotEnd.toTimeString().slice(0, 5),
            datetime: currentTime.toISOString()
          });
        }

        currentTime = new Date(currentTime.getTime() + (slotDuration * 60000));
      }

      res.json({ availableSlots });
    }
  );
});

module.exports = router;
