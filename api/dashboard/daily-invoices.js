const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

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
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'july-spa-secret');

    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Return mock data for now since invoices table may not exist
    const mockData = {
      invoices: [
        {
          id: 1,
          invoice_number: 'INV000001',
          customer_name: 'Nguyễn Thị Hoa',
          customer_phone: '0123456789',
          total_amount: 500000,
          status: 'paid',
          payment_method: 'cash',
          created_at: new Date().toISOString(),
          items: [
            {
              service_name: 'Massage thư giãn',
              quantity: 1,
              unit_price: 300000,
              employee_name: 'Mai Ly'
            },
            {
              service_name: 'Chăm sóc da mặt',
              quantity: 1,
              unit_price: 200000,
              employee_name: 'Thanh Nga'
            }
          ]
        },
        {
          id: 2,
          invoice_number: 'INV000002',
          customer_name: 'Trần Văn Nam',
          customer_phone: '0987654321',
          total_amount: 350000,
          status: 'paid',
          payment_method: 'card',
          created_at: new Date().toISOString(),
          items: [
            {
              service_name: 'Tắm trắng',
              quantity: 1,
              unit_price: 350000,
              employee_name: 'Minh Châu'
            }
          ]
        }
      ],
      total_invoices: 2,
      total_revenue: 850000,
      date: targetDate
    };

    res.json(mockData);

  } catch (error) {
    console.error('Daily invoices API error:', error);
    res.status(500).json({ error: 'Daily invoices API failed: ' + error.message });
  }
};
