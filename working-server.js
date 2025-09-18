const http = require('http');
const url = require('url');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './server/.env' });

const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'july-spa-secret-key-2024';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper function to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Auth endpoints
async function handleAuth(req, res, path) {
  if (path === '/auth/login' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { username, password } = body;

      if (!username || !password) {
        return sendJSON(res, 400, { error: 'Username and password are required' });
      }

      // Query user from database
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, username, password, fullname, email, role FROM users WHERE username = $1',
          [username]
        );

        if (result.rows.length === 0) {
          return sendJSON(res, 401, { error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return sendJSON(res, 401, { error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role: user.role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        sendJSON(res, 200, {
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            role: user.role
          }
        });

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Login error:', error);
      sendJSON(res, 500, { error: 'Internal server error' });
    }
  } else if (path === '/auth/me' && req.method === 'GET') {
    // Get current user info
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendJSON(res, 401, { error: 'No token provided' });
    }

    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, username, fullname, email, role FROM users WHERE id = $1',
          [decoded.id]
        );

        if (result.rows.length === 0) {
          return sendJSON(res, 401, { error: 'User not found' });
        }

        sendJSON(res, 200, { user: result.rows[0] });
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Auth error:', error);
      sendJSON(res, 401, { error: 'Invalid token' });
    }
  } else {
    sendJSON(res, 404, { error: 'Auth endpoint not found' });
  }
}

// Dashboard endpoint
async function handleDashboard(req, res) {
  if (req.method !== 'GET') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    try {
      // Get basic stats
      const stats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM customers) as total_customers,
          (SELECT COUNT(*) FROM employees WHERE is_active = true) as total_employees,
          (SELECT COUNT(*) FROM services WHERE is_active = true) as total_services,
          (SELECT COUNT(*) FROM invoices) as total_invoices,
          (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) as total_revenue
      `);

      // Get recent invoices
      const recentInvoices = await client.query(`
        SELECT 
          i.id,
          i.invoice_number,
          i.total_amount,
          i.created_at,
          c.fullname as customer_name,
          e.employee_code
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN employees e ON i.employee_id = e.id
        ORDER BY i.created_at DESC
        LIMIT 10
      `);

      sendJSON(res, 200, {
        stats: stats.rows[0],
        recentInvoices: recentInvoices.rows
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Dashboard error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

// Main server handler
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  console.log(`${req.method} ${path}`);

  try {
    if (path === '/health') {
      sendJSON(res, 200, {
        status: 'OK',
        message: 'JULY SPA API Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } else if (path.startsWith('/auth/')) {
      await handleAuth(req, res, path);
    } else if (path === '/dashboard') {
      await handleDashboard(req, res);
    } else {
      sendJSON(res, 404, {
        error: 'Not Found',
        message: `Route ${path} not found`
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 JULY SPA API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔐 Auth endpoints: /auth/login, /auth/me`);
  console.log(`📈 Dashboard: /dashboard`);
});

module.exports = server;

