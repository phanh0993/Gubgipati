const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Dashboard API working!' });
});

// API lấy hóa đơn theo ngày
router.get('/daily-invoices', (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  
  const query = `
    SELECT 
      i.id,
      i.invoice_number,
      i.total_amount,
      i.created_at,
      c.fullname as customer_name,
      c.phone as customer_phone,
      GROUP_CONCAT(
        json_object(
          'service_name', s.name,
          'quantity', ii.quantity,
          'unit_price', ii.unit_price,
          'total_price', ii.total_price,
          'employee_name', u.fullname
        )
      ) as items_json
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
    LEFT JOIN services s ON ii.service_id = s.id
    LEFT JOIN employees e ON ii.employee_id = e.id
    LEFT JOIN users u ON e.user_id = u.id
    WHERE DATE(i.created_at) = ?
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `;

  db.all(query, [date], (err, invoices) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse items JSON
    const processedInvoices = invoices.map(invoice => ({
      ...invoice,
      items: invoice.items_json ? 
        [JSON.parse(invoice.items_json)] : []
    }));

    res.json({
      date,
      invoices: processedInvoices,
      total_revenue: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      total_invoices: invoices.length
    });
  });
});

// Dashboard tổng quan
router.get('/overview', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Lấy doanh thu hôm nay (chỉ tính hóa đơn đã thanh toán)
  const todayRevenueQuery = `
    SELECT 
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as invoices,
      COUNT(DISTINCT customer_id) as customers
    FROM invoices 
    WHERE DATE(created_at) = ? AND payment_status = 'paid'
  `;
  
  db.get(todayRevenueQuery, [today], (err, todayStats) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Lấy tổng số khách hàng, nhân viên, dịch vụ
    const totalsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM employees WHERE is_active = 1) as employees,
        (SELECT COUNT(*) FROM services WHERE is_active = 1) as services,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices 
         WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') 
         AND payment_status = 'paid') as monthlyRevenue
    `;
    
    db.get(totalsQuery, [], (err, totals) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Lấy doanh thu 7 ngày gần nhất
      const revenueChartQuery = `
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM invoices 
        WHERE DATE(created_at) >= DATE('now', '-6 days') 
        AND payment_status = 'paid'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      
      db.all(revenueChartQuery, [], (err, revenueChart) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Lấy top dịch vụ
        const topServicesQuery = `
          SELECT 
            s.name,
            COALESCE(SUM(ii.total_price), 0) as revenue,
            COALESCE(SUM(ii.quantity), 0) as count
          FROM services s
          LEFT JOIN invoice_items ii ON s.id = ii.service_id
          LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.payment_status = 'paid'
          GROUP BY s.id, s.name
          ORDER BY revenue DESC
          LIMIT 5
        `;
        
        db.all(topServicesQuery, [], (err, topServices) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            date: today,
            stats: {
              today: {
                revenue: todayStats.revenue || 0,
                invoices: todayStats.invoices || 0,
                customers: todayStats.customers || 0,
                appointments: 0
              },
              totals: {
                customers: totals.customers || 0,
                employees: totals.employees || 0,
                services: totals.services || 0,
                monthlyRevenue: totals.monthlyRevenue || 0
              }
            },
            revenueChart: revenueChart || [],
            topServices: topServices || [],
            employeePerformance: [],
            todayAppointments: []
          });
        });
      });
    });
  });
});

module.exports = router;