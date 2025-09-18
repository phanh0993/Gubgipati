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
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const client = await getPool().connect();
    
    try {
      if (req.method === 'GET') {
        const { employee_id, month } = req.query;
        
        if (!employee_id || !month) {
          return res.status(400).json({ error: 'Employee ID and month are required' });
        }

        // Parse month (format: YYYY-MM)
        const [year, monthNum] = month.split('-');
        
        // Get overtime records for employee in specific month
        const overtimeResult = await client.query(`
          SELECT id, date, hours, hourly_rate, total_amount, notes, created_at
          FROM overtime 
          WHERE employee_id = $1 
            AND EXTRACT(YEAR FROM date) = $2 
            AND EXTRACT(MONTH FROM date) = $3
          ORDER BY date DESC
        `, [employee_id, parseInt(year), parseInt(monthNum)]);

        // Calculate total overtime amount
        const totalOvertimeAmount = overtimeResult.rows.reduce((sum, record) => {
          return sum + parseFloat(record.total_amount);
        }, 0);

        return res.json({
          success: true,
          overtime_records: overtimeResult.rows,
          total_overtime_amount: totalOvertimeAmount,
          count: overtimeResult.rows.length
        });

      } else if (req.method === 'POST') {
        const { employee_id, date, hours, notes } = req.body;
        
        if (!employee_id || !date || !hours) {
          return res.status(400).json({ error: 'Employee ID, date, and hours are required' });
        }

        // Get employee's overtime hourly rate
        const employeeResult = await client.query(`
          SELECT overtime_hourly_rate, fullname 
          FROM employees 
          WHERE id = $1 AND is_active = true
        `, [employee_id]);

        if (employeeResult.rows.length === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        const employee = employeeResult.rows[0];
        const hourlyRate = parseFloat(employee.overtime_hourly_rate) || 20000; // Default 20k/hour
        const totalAmount = parseFloat(hours) * hourlyRate;

        // Insert overtime record
        const result = await client.query(`
          INSERT INTO overtime (employee_id, date, hours, hourly_rate, total_amount, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING *
        `, [employee_id, date, hours, hourlyRate, totalAmount, notes || null]);

        return res.status(201).json({
          success: true,
          overtime: result.rows[0],
          message: `Đã thêm ${hours} giờ tăng ca cho ${employee.fullname}`
        });

      } else if (req.method === 'DELETE') {
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ error: 'Overtime ID is required' });
        }

        const result = await client.query(`
          DELETE FROM overtime 
          WHERE id = $1 
          RETURNING *
        `, [parseInt(id)]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Overtime record not found' });
        }

        return res.json({
          success: true,
          message: 'Đã xóa bản ghi tăng ca',
          deleted_overtime: result.rows[0]
        });

      } else {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Overtime API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
