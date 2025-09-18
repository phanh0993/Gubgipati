const http = require('http');
const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper function to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body) {
          resolve({});
          return;
        }
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Handle tables API
async function handleTables(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT id, table_number, table_name, area, capacity, status, created_at, updated_at
        FROM tables 
        ORDER BY area, table_number
      `);
      sendJSON(res, 200, result.rows);
      
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      console.log('POST /api/tables body:', body);
      
      const { table_number, table_name, area, capacity } = body;
      
      if (!table_number || !table_name || !area) {
        sendJSON(res, 400, { error: 'Thiếu thông tin bắt buộc' });
        return;
      }
      
      // Kiểm tra duplicate
      const existing = await client.query(
        'SELECT id FROM tables WHERE table_number = $1',
        [table_number]
      );
      
      if (existing.rows.length > 0) {
        sendJSON(res, 400, { error: `Số bàn ${table_number} đã tồn tại` });
        return;
      }
      
      // Tạo bàn mới
      const result = await client.query(`
        INSERT INTO tables (table_number, table_name, area, capacity, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [table_number, table_name, area, capacity || 4, 'empty']);
      
      console.log('✅ Tạo bàn thành công:', result.rows[0]);
      sendJSON(res, 201, result.rows[0]);
      
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      
      const { table_number, table_name, area, capacity, status } = body;
      
      const result = await client.query(`
        UPDATE tables 
        SET table_number = $1, table_name = $2, area = $3, capacity = $4, status = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `, [table_number, table_name, area, capacity, status, id]);
      
      if (result.rows.length === 0) {
        sendJSON(res, 404, { error: 'Không tìm thấy bàn' });
        return;
      }
      
      sendJSON(res, 200, result.rows[0]);
      
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('DELETE FROM tables WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Xóa bàn thành công' });
      
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tables error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Create server
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

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  console.log(`${req.method} ${path}`);

  try {
    if (path === '/health') {
      sendJSON(res, 200, { status: 'OK', message: 'Simple Table API Server' });
    } else if (path.startsWith('/api/tables') || path.startsWith('/tables')) {
      await handleTables(req, res);
    } else {
      sendJSON(res, 404, { error: 'Not found' });
    }
  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, { error: 'Internal Server Error' });
  }
});

const PORT = 8001;
server.listen(PORT, () => {
  console.log(`🚀 Simple Table API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🍽️ Tables API: http://localhost:${PORT}/api/tables`);
});

