const express = require('express');
const db = require('../database');

const router = express.Router();

// Lấy thông tin lương của nhân viên theo tháng
router.get('/employee/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const { month } = req.query; // Format: YYYY-MM
  
  if (!month) {
    return res.status(400).json({ error: 'Month parameter is required (YYYY-MM)' });
  }

  // Lấy thông tin nhân viên
  const employeeQuery = `
    SELECT e.*, u.fullname, u.email, u.phone
    FROM employees e
    JOIN users u ON e.user_id = u.id
    WHERE e.id = ?
  `;

  db.get(employeeQuery, [employeeId], (err, employee) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Lấy hóa đơn trong tháng mà nhân viên có tham gia
    const invoicesQuery = `
      SELECT DISTINCT
        i.id,
        i.invoice_number,
        i.total_amount,
        i.created_at,
        i.payment_status,
        c.fullname as customer_name,
        c.phone as customer_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE ii.employee_id = ? 
      AND strftime('%Y-%m', i.created_at) = ?
      AND i.payment_status = 'paid'
      ORDER BY i.created_at DESC
    `;

    db.all(invoicesQuery, [employeeId, month], (err, invoices) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Lấy chi tiết items cho từng hóa đơn
      const invoicePromises = invoices.map(invoice => {
        return new Promise((resolve, reject) => {
          const itemsQuery = `
            SELECT 
              ii.*,
              s.name as service_name
            FROM invoice_items ii
            LEFT JOIN services s ON ii.service_id = s.id
            WHERE ii.invoice_id = ? AND ii.employee_id = ?
          `;

          db.all(itemsQuery, [invoice.id, employeeId], (err, items) => {
            if (err) return reject(err);

            // Tính hoa hồng cho nhân viên này
            const commission = items.reduce((sum, item) => {
              // Hoa hồng = 20% của giá trị dịch vụ
              return sum + (item.total_price * 0.2);
            }, 0);

            resolve({
              ...invoice,
              items,
              employee_commission: commission
            });
          });
        });
      });

      Promise.all(invoicePromises)
        .then(invoicesWithItems => {
          const totalCommission = invoicesWithItems.reduce((sum, invoice) => {
            return sum + invoice.employee_commission;
          }, 0);

          const baseSalary = employee.base_salary || 0;
          const totalSalary = baseSalary + totalCommission;

          res.json({
            employee: {
              ...employee,
              skills: employee.skills ? JSON.parse(employee.skills) : []
            },
            period: month,
            baseSalary,
            totalCommission,
            totalSalary,
            invoices: invoicesWithItems,
            summary: {
              totalInvoices: invoicesWithItems.length,
              totalRevenue: invoicesWithItems.reduce((sum, inv) => sum + inv.total_amount, 0),
              averageCommissionPerInvoice: invoicesWithItems.length > 0 ? totalCommission / invoicesWithItems.length : 0
            }
          });
        })
        .catch(error => {
          console.error('Error processing invoices:', error);
          res.status(500).json({ error: 'Error processing payroll data' });
        });
    });
  });
});

// Lấy tổng quan lương tất cả nhân viên theo tháng
router.get('/summary/:month', (req, res) => {
  const { month } = req.params; // Format: YYYY-MM

  const summaryQuery = `
    SELECT 
      e.id,
      e.employee_code,
      u.fullname,
      e.base_salary,
      COALESCE(SUM(ii.total_price * 0.2), 0) as total_commission,
      COUNT(DISTINCT i.id) as total_invoices
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN invoice_items ii ON e.id = ii.employee_id
    LEFT JOIN invoices i ON ii.invoice_id = i.id 
      AND strftime('%Y-%m', i.created_at) = ? 
      AND i.payment_status = 'paid'
    WHERE e.is_active = 1
    GROUP BY e.id, e.employee_code, u.fullname, e.base_salary
    ORDER BY u.fullname ASC
  `;

  db.all(summaryQuery, [month], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const payrollSummary = results.map(row => ({
      employee_id: row.id,
      employee_code: row.employee_code,
      employee_name: row.fullname,
      base_salary: row.base_salary || 0,
      total_commission: row.total_commission || 0,
      total_salary: (row.base_salary || 0) + (row.total_commission || 0),
      total_invoices: row.total_invoices || 0
    }));

    const grandTotal = {
      total_base_salary: payrollSummary.reduce((sum, item) => sum + item.base_salary, 0),
      total_commission: payrollSummary.reduce((sum, item) => sum + item.total_commission, 0),
      total_salary: payrollSummary.reduce((sum, item) => sum + item.total_salary, 0),
      total_employees: payrollSummary.length,
      total_invoices: payrollSummary.reduce((sum, item) => sum + item.total_invoices, 0)
    };

    res.json({
      period: month,
      employees: payrollSummary,
      summary: grandTotal
    });
  });
});

module.exports = router;