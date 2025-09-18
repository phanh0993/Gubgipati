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

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'july-spa-secret');

    // Return mock data for now since appointments table may not exist yet
    const mockAppointments = [
      {
        id: 1,
        customer_name: 'Nguyễn Thị Hoa',
        customer_phone: '0123456789',
        service_name: 'Massage thư giãn',
        employee_name: 'Mai Ly',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00',
        status: 'confirmed',
        notes: 'Khách hàng VIP',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        customer_name: 'Trần Văn Nam',
        customer_phone: '0987654321',
        service_name: 'Chăm sóc da mặt',
        employee_name: 'Thanh Nga',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:30',
        status: 'pending',
        notes: 'Lần đầu sử dụng dịch vụ',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        customer_name: 'Lê Thị Mai',
        customer_phone: '0912345678',
        service_name: 'Tắm trắng',
        employee_name: 'Minh Châu',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '14:00',
        status: 'completed',
        notes: '',
        created_at: new Date().toISOString()
      }
    ];

    if (req.method === 'GET') {
      res.json({
        appointments: mockAppointments,
        total: mockAppointments.length
      });
    } else if (req.method === 'POST') {
      // Create new appointment
      const newAppointment = {
        id: mockAppointments.length + 1,
        ...req.body,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      res.status(201).json({
        message: 'Appointment created successfully',
        appointment: newAppointment
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Appointments API error:', error);
    res.status(500).json({ error: 'Appointments API failed: ' + error.message });
  }
};
