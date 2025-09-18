const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate invoice number
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  return `INV${year}${month}${day}${time}`;
}

// Lấy danh sách hóa đơn
router.get('/', (req, res) => {
  const { 
    customer_id, employee_id, payment_status, 
    start_date, end_date, limit = 50, offset = 0 
  } = req.query;

  let query = `
    SELECT i.*, 
           c.fullname as customer_name, c.phone as customer_phone,
           u.fullname as employee_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN employees e ON i.employee_id = e.id
    LEFT JOIN users u ON e.user_id = u.id
  `;

  let params = [];
  let conditions = [];

  if (customer_id) {
    conditions.push('i.customer_id = ?');
    params.push(customer_id);
  }

  if (employee_id) {
    conditions.push('i.employee_id = ?');
    params.push(employee_id);
  }

  if (payment_status) {
    conditions.push('i.payment_status = ?');
    params.push(payment_status);
  }

  if (start_date) {
    conditions.push('DATE(i.invoice_date) >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('DATE(i.invoice_date) <= ?');
    params.push(end_date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY i.invoice_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, invoices) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Đếm tổng số hóa đơn
    let countQuery = 'SELECT COUNT(*) as total FROM invoices i';
    let countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ').replace(/i\./g, '');
      countParams = params.slice(0, -2); // Remove limit and offset
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        invoices,
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
});

// Lấy chi tiết một hóa đơn
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT i.*, 
            c.fullname as customer_name, c.phone as customer_phone, c.email as customer_email,
            u.fullname as employee_name
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     LEFT JOIN employees e ON i.employee_id = e.id
     LEFT JOIN users u ON e.user_id = u.id
     WHERE i.id = ?`,
    [id],
    (err, invoice) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Lấy chi tiết các dịch vụ trong hóa đơn
      db.all(
        `SELECT ii.*, s.name as service_name, s.description as service_description,
                u.fullname as employee_name
         FROM invoice_items ii
         LEFT JOIN services s ON ii.service_id = s.id
         LEFT JOIN employees e ON ii.employee_id = e.id
         LEFT JOIN users u ON e.user_id = u.id
         WHERE ii.invoice_id = ?`,
        [id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            invoice,
            items
          });
        }
      );
    }
  );
});

// Tạo hóa đơn mới
router.post('/', (req, res) => {
  const { 
    customer_id, employee_id, items, discount_amount = 0, 
    tax_amount = 0, payment_method, payment_status = 'paid', notes 
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invoice items are required' });
  }

  // Tính tổng tiền
  let subtotal = 0;
  const processedItems = [];

  // Xử lý từng item và tính commission
  const itemPromises = items.map(item => {
    return new Promise((resolve, reject) => {
      if (!item.service_id || !item.quantity || item.quantity <= 0) {
        return reject(new Error('Invalid item: service_id and quantity are required'));
      }

      // Lấy thông tin dịch vụ
      db.get('SELECT * FROM services WHERE id = ?', [item.service_id], (err, service) => {
        if (err) return reject(err);
        if (!service) return reject(new Error(`Service not found: ${item.service_id}`));

        const unitPrice = item.unit_price || service.price;
        const totalPrice = unitPrice * item.quantity;
        
        // Tính hoa hồng
        let commissionAmount = 0;
        if (item.employee_id) {
          // Lấy tỷ lệ hoa hồng của nhân viên hoặc dịch vụ
          db.get('SELECT commission_rate FROM employees WHERE id = ?', [item.employee_id], (err, employee) => {
            if (err) return reject(err);
            
            const commissionRate = employee?.commission_rate || service.commission_rate || 0;
            commissionAmount = (totalPrice * commissionRate) / 100;

            processedItems.push({
              service_id: item.service_id,
              employee_id: item.employee_id,
              quantity: item.quantity,
              unit_price: unitPrice,
              total_price: totalPrice,
              commission_amount: commissionAmount
            });

            subtotal += totalPrice;
            resolve();
          });
        } else {
          processedItems.push({
            service_id: item.service_id,
            employee_id: null,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            commission_amount: 0
          });

          subtotal += totalPrice;
          resolve();
        }
      });
    });
  });

  Promise.all(itemPromises)
    .then(() => {
      const totalAmount = subtotal - discount_amount + tax_amount;
      const invoiceNumber = generateInvoiceNumber();

      // Tạo hóa đơn
      db.run(
        `INSERT INTO invoices 
         (invoice_number, customer_id, employee_id, subtotal, discount_amount, tax_amount, 
          total_amount, payment_method, payment_status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceNumber, customer_id, employee_id, subtotal, discount_amount, 
          tax_amount, totalAmount, payment_method, payment_status, notes
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create invoice' });
          }

          const invoiceId = this.lastID;

          // Thêm các items vào hóa đơn
          const itemInsertPromises = processedItems.map(item => {
            return new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO invoice_items 
                 (invoice_id, service_id, employee_id, quantity, unit_price, total_price, commission_amount) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  invoiceId, item.service_id, item.employee_id, item.quantity,
                  item.unit_price, item.total_price, item.commission_amount
                ],
                (err) => {
                  if (err) return reject(err);
                  resolve();
                }
              );
            });
          });

          Promise.all(itemInsertPromises)
            .then(() => {
              // Cập nhật thông tin khách hàng nếu có
              if (customer_id) {
                db.run(
                  `UPDATE customers SET 
                   total_spent = total_spent + ?, 
                   last_visit = CURRENT_TIMESTAMP 
                   WHERE id = ?`,
                  [totalAmount, customer_id]
                );

                // Thêm vào lịch sử khách hàng
                processedItems.forEach(item => {
                  db.get('SELECT name FROM services WHERE id = ?', [item.service_id], (err, service) => {
                    if (!err && service) {
                      db.get('SELECT fullname FROM users u JOIN employees e ON u.id = e.user_id WHERE e.id = ?', 
                        [item.employee_id], (err, employee) => {
                          db.run(
                            `INSERT INTO customer_history 
                             (customer_id, invoice_id, service_name, employee_name, amount, visit_date) 
                             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                            [customer_id, invoiceId, service.name, employee?.fullname || null, item.total_price]
                          );
                        });
                    }
                  });
                });
              }

              // Cộng điểm tích lũy nếu hóa đơn đã thanh toán
              if (payment_status === 'paid' && customer_id) {
                db.run(
                  'UPDATE customers SET loyalty_points = loyalty_points + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                  [customer_id],
                  (err) => {
                    if (err) {
                      console.error('Failed to update loyalty points:', err);
                      // Không return error vì hóa đơn đã tạo thành công
                    }
                  }
                );
              }

              // Lấy thông tin hóa đơn vừa tạo
              db.get(
                `SELECT i.*, 
                        c.fullname as customer_name, c.phone as customer_phone,
                        u.fullname as employee_name
                 FROM invoices i
                 LEFT JOIN customers c ON i.customer_id = c.id
                 LEFT JOIN employees e ON i.employee_id = e.id
                 LEFT JOIN users u ON e.user_id = u.id
                 WHERE i.id = ?`,
                [invoiceId],
                (err, invoice) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  res.status(201).json({
                    message: 'Invoice created successfully',
                    invoice,
                    items: processedItems
                  });
                }
              );
            })
            .catch(error => {
              res.status(500).json({ error: 'Failed to create invoice items: ' + error.message });
            });
        }
      );
    })
    .catch(error => {
      res.status(400).json({ error: error.message });
    });
});

// Cập nhật trạng thái thanh toán
router.put('/:id/payment', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { payment_status, payment_method } = req.body;

  if (!payment_status) {
    return res.status(400).json({ error: 'Payment status is required' });
  }

  db.run(
    `UPDATE invoices SET 
     payment_status = ?, 
     payment_method = COALESCE(?, payment_method),
     updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [payment_status, payment_method, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update payment status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({ message: 'Payment status updated successfully' });
    }
  );
});

// Cập nhật hóa đơn
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { discount_amount, tax_amount, notes } = req.body;

  // Tính lại tổng tiền nếu có thay đổi discount hoặc tax
  if (discount_amount !== undefined || tax_amount !== undefined) {
    db.get('SELECT subtotal, discount_amount, tax_amount FROM invoices WHERE id = ?', [id], (err, invoice) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const newDiscount = discount_amount !== undefined ? discount_amount : invoice.discount_amount;
      const newTax = tax_amount !== undefined ? tax_amount : invoice.tax_amount;
      const newTotal = invoice.subtotal - newDiscount + newTax;

      db.run(
        `UPDATE invoices SET 
         discount_amount = ?,
         tax_amount = ?,
         total_amount = ?,
         notes = COALESCE(?, notes),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newDiscount, newTax, newTotal, notes, id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update invoice' });
          }

          res.json({ message: 'Invoice updated successfully' });
        }
      );
    });
  } else {
    db.run(
      `UPDATE invoices SET 
       notes = COALESCE(?, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [notes, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update invoice' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({ message: 'Invoice updated successfully' });
      }
    );
  }
});

// Xóa hóa đơn (chỉ cho phép nếu chưa thanh toán)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT payment_status FROM invoices WHERE id = ?', [id], (err, invoice) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.payment_status === 'paid') {
      return res.status(400).json({ error: 'Cannot delete paid invoice' });
    }

    // Xóa items trước
    db.run('DELETE FROM invoice_items WHERE invoice_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete invoice items' });
      }

      // Xóa hóa đơn
      db.run('DELETE FROM invoices WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete invoice' });
        }

        res.json({ message: 'Invoice deleted successfully' });
      });
    });
  });
});

// Thống kê hóa đơn theo ngày
router.get('/stats/daily', authenticateToken, (req, res) => {
  const { start_date, end_date, limit = 30 } = req.query;

  let query = `
    SELECT 
      DATE(invoice_date) as date,
      COUNT(*) as invoice_count,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_invoice_value
    FROM invoices
    WHERE payment_status = 'paid'
  `;

  let params = [];

  if (start_date) {
    query += ' AND DATE(invoice_date) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(invoice_date) <= ?';
    params.push(end_date);
  }

  query += `
    GROUP BY DATE(invoice_date)
    ORDER BY DATE(invoice_date) DESC
    LIMIT ?
  `;

  params.push(parseInt(limit));

  db.all(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ stats });
  });
});

module.exports = router;
