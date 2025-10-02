const http = require('http');
const url = require('url');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './server/.env' });

const PORT = process.env.RESTAURANT_PORT || 8001;
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
    console.log('parseBody: Starting to parse request body');
    
    req.on('data', chunk => {
      body += chunk.toString();
      console.log('parseBody: Received chunk, body length:', body.length);
    });
    
    req.on('end', () => {
      console.log('parseBody: Request ended, final body:', body);
      try {
        if (!body) {
          console.log('parseBody: Empty body, returning {}');
          resolve({});
          return;
        }
        const parsed = JSON.parse(body);
        console.log('parseBody: Successfully parsed:', parsed);
        resolve(parsed);
      } catch (error) {
        console.error('parseBody error:', error, 'body:', body);
        reject(error);
      }
    });
    
    req.on('error', (error) => {
      console.error('parseBody request error:', error);
      reject(error);
    });
  });
}

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

// Invoices endpoint
async function handleInvoices(req, res) {
  const client = await pool.connect();
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const invoiceId = pathParts[pathParts.length - 1];
    
    if (req.method === 'GET') {
      if (invoiceId && !isNaN(invoiceId)) {
        // Get specific invoice with details
        const result = await client.query(`
          SELECT i.*, c.fullname as customer_name, c.phone as customer_phone,
                 e.fullname as employee_name, e.phone as employee_phone
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          LEFT JOIN employees e ON i.employee_id = e.id
          WHERE i.id = $1
        `, [invoiceId]);
        
        if (result.rows.length === 0) {
          sendJSON(res, 404, { error: 'Invoice not found' });
          return;
        }
        
        // Get invoice items
        const itemsResult = await client.query(`
          SELECT * FROM invoice_items WHERE invoice_id = $1
        `, [invoiceId]);
        
        sendJSON(res, 200, {
          invoice: result.rows[0],
          items: itemsResult.rows
        });
      } else {
        // Get all invoices
        const result = await client.query(`
          SELECT i.id, i.invoice_number, i.total_amount, i.payment_status, i.invoice_date,
                 i.payment_method, i.notes, i.subtotal, i.tax_amount,
                 c.fullname as customer_name, c.phone as customer_phone,
                 e.fullname as employee_name, e.phone as employee_phone
          FROM invoices i
          LEFT JOIN customers c ON i.customer_id = c.id
          LEFT JOIN employees e ON i.employee_id = e.id
          ORDER BY i.invoice_date DESC
          LIMIT 50
        `);
        sendJSON(res, 200, result.rows);
      }
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { invoice_number, customer_id, employee_id, subtotal, tax_amount, total_amount, payment_method, payment_status, notes } = body;
      
      const result = await client.query(`
        INSERT INTO invoices (
          invoice_number, customer_id, employee_id, subtotal, tax_amount, 
          total_amount, payment_method, payment_status, invoice_date, notes,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC', $9, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC')
        RETURNING *
      `, [invoice_number, customer_id, employee_id, subtotal, tax_amount, total_amount, payment_method, payment_status, notes]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'PUT' && invoiceId && !isNaN(invoiceId)) {
      // Update invoice
      const body = await parseBody(req);
      const { payment_status, payment_method, notes, subtotal, tax_amount, total_amount } = body;
      
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (payment_status !== undefined) {
        updateFields.push(`payment_status = $${paramCount++}`);
        values.push(payment_status);
      }
      if (payment_method !== undefined) {
        updateFields.push(`payment_method = $${paramCount++}`);
        values.push(payment_method);
      }
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCount++}`);
        values.push(notes);
      }
      if (subtotal !== undefined) {
        updateFields.push(`subtotal = $${paramCount++}`);
        values.push(subtotal);
      }
      if (tax_amount !== undefined) {
        updateFields.push(`tax_amount = $${paramCount++}`);
        values.push(tax_amount);
      }
      if (total_amount !== undefined) {
        updateFields.push(`total_amount = $${paramCount++}`);
        values.push(total_amount);
      }
      
      if (updateFields.length === 0) {
        sendJSON(res, 400, { error: 'No fields to update' });
        return;
      }
      
      updateFields.push(`updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'`);
      values.push(invoiceId);
      
      const result = await client.query(`
        UPDATE invoices 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        sendJSON(res, 404, { error: 'Invoice not found' });
        return;
      }
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE' && invoiceId && !isNaN(invoiceId)) {
      // Delete invoice
      const result = await client.query(`
        DELETE FROM invoices WHERE id = $1 RETURNING *
      `, [invoiceId]);
      
      if (result.rows.length === 0) {
        sendJSON(res, 404, { error: 'Invoice not found' });
        return;
      }
      
      sendJSON(res, 200, { message: 'Invoice deleted successfully' });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Invoices error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Function to create invoice from paid order
async function createInvoiceFromOrder(orderId, client) {
  try {
    // 1. Lấy thông tin order
    const orderResult = await client.query(`
      SELECT o.*, t.table_name, t.area, e.fullname as employee_name, c.fullname as customer_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN employees e ON o.employee_id = e.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1 AND o.status = 'paid'
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found or not paid');
    }

    const order = orderResult.rows[0];

    // 2. Kiểm tra xem đã có invoice chưa
    const existingInvoice = await client.query(`
      SELECT id FROM invoices WHERE notes LIKE '%' || $1 || '%'
    `, [order.order_number]);

    if (existingInvoice.rows.length > 0) {
      console.log(`Invoice already exists for order ${order.order_number}`);
      return existingInvoice.rows[0].id;
    }

    // 3. Tạo invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // 4. Tạo invoice
    const invoiceResult = await client.query(`
      INSERT INTO invoices (
        invoice_number, customer_id, employee_id, subtotal, tax_amount, 
        total_amount, payment_method, payment_status, invoice_date, notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC')
      RETURNING id
    `, [
      invoiceNumber,
      order.customer_id,
      order.employee_id,
      order.subtotal,
      order.tax_amount,
      order.total_amount,
      'cash', // Mặc định thanh toán tiền mặt
      'paid',
      order.created_at,
      `Buffet Order: ${order.order_number} - Table: ${order.table_name} (${order.area})`
    ]);

    const invoiceId = invoiceResult.rows[0].id;

    // 5. Tạo invoice items cho buffet package (tổng quantity từ tất cả dòng order_buffet)
    if (order.buffet_package_id) {
      // Tổng quantity từ tất cả dòng order_buffet cùng order_id
      const buffetCountRes = await client.query(
        `SELECT SUM(quantity)::int AS total_qty FROM order_buffet WHERE order_id = $1`,
        [orderId]
      );
      const buffetQty = buffetCountRes.rows[0]?.total_qty || 0;
      if (buffetQty > 0) {
      const packageResult = await client.query(`
        SELECT name, price FROM buffet_packages WHERE id = $1
      `, [order.buffet_package_id]);

        if (packageResult.rows.length > 0) {
          const pkg = packageResult.rows[0];
          await client.query(`
            INSERT INTO invoice_items (
              invoice_id, service_id, employee_id, quantity, unit_price, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC')
          `, [
            invoiceId,
            null, // Không có service_id cho buffet package
            order.employee_id,
            buffetQty,
            pkg.price
          ]);
        }
      }
    }

    // 6. Tạo invoice items cho food items
    const itemsResult = await client.query(`
      SELECT oi.*, fi.name as food_item_name
      FROM order_items oi
      LEFT JOIN food_items fi ON oi.food_item_id = fi.id
      WHERE oi.order_id = $1
    `, [orderId]);

    for (const item of itemsResult.rows) {
      await client.query(`
        INSERT INTO invoice_items (
          invoice_id, service_id, employee_id, quantity, unit_price, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC')
      `, [
        invoiceId,
        null, // Không có service_id cho food items
        order.employee_id,
        item.quantity,
        item.unit_price
      ]);
    }

    console.log(`✅ Created invoice ${invoiceNumber} from order ${order.order_number}`);
    return invoiceId;

  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
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
        const isValidPassword = bcrypt.compareSync(password, user.password);

        if (!isValidPassword) {
          return sendJSON(res, 401, { error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
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
      const stats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM customers) as total_customers,
          (SELECT COUNT(*) FROM employees WHERE is_active = true) as total_employees,
          (SELECT COUNT(*) FROM food_items WHERE is_available = true) as total_food_items,
          (SELECT COUNT(*) FROM orders) as total_orders,
          (SELECT COUNT(*) FROM invoices WHERE payment_status = 'paid') as paid_invoices,
          (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE payment_status = 'paid') as total_revenue
      `);

      const recentInvoices = await client.query(`
        SELECT 
          i.id,
          i.invoice_number,
          i.total_amount,
          i.payment_status,
          i.invoice_date,
          i.notes,
          c.fullname as customer_name,
          e.fullname as employee_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN employees e ON i.employee_id = e.id
        WHERE i.payment_status = 'paid'
        ORDER BY i.invoice_date DESC
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

// Tables endpoint
async function handleTables(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT id, table_number, table_name, capacity, status, created_at, area
        FROM tables 
        ORDER BY area, table_number
      `);
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        console.log('POST /api/tables body:', body);
        
        if (!body || !body.table_number) {
          sendJSON(res, 400, { error: 'Thiếu thông tin bắt buộc' });
          return;
        }
        
        const { table_number, table_name, capacity, area, status } = body;
        
        console.log(`Checking duplicate for table_number: ${table_number}`);
        
        // Kiểm tra table_number đã tồn tại chưa
        const existingTable = await client.query(
          'SELECT id, table_name FROM tables WHERE table_number = $1 AND is_active = true',
          [table_number]
        );
        
        console.log('Duplicate check result:', existingTable.rows);
        
        if (existingTable.rows.length > 0) {
          const existingTableName = existingTable.rows[0].table_name;
          console.log(`Table ${table_number} already exists: ${existingTableName}`);
          sendJSON(res, 400, { 
            error: `Số bàn ${table_number} đã tồn tại (${existingTableName}). Vui lòng chọn số bàn khác.` 
          });
          return;
        }
        
        console.log(`Creating new table: ${table_number}`);
        
        const result = await client.query(`
          INSERT INTO tables (table_number, table_name, capacity, area, status, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC')
          RETURNING *
        `, [table_number, table_name, capacity, area || 'A', status || 'empty', true]);
        
        console.log('Table created successfully:', result.rows[0]);
        sendJSON(res, 201, result.rows[0]);
        
      } catch (error) {
        console.error('POST /api/tables error:', error);
        if (error.code === '23505') {
          // Duplicate key constraint violation
          sendJSON(res, 400, { error: 'Số bàn đã tồn tại. Vui lòng chọn số bàn khác.' });
        } else {
          sendJSON(res, 500, { error: error.message });
        }
      }
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { table_number, table_name, capacity, area, status } = body;
      
      const result = await client.query(`
        UPDATE tables 
        SET table_number = $1, table_name = $2, capacity = $3, area = $4, status = $5, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
        WHERE id = $6
        RETURNING *
      `, [table_number, table_name, capacity, area, status, id]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('UPDATE tables SET is_active = false WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Table deleted successfully' });
    }
  } catch (error) {
    console.error('Tables error:', error);
    sendJSON(res, 500, { error: error.message });
  } finally {
    client.release();
  }
}

// Food Categories endpoint
async function handleFoodCategories(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT id, name, description, sort_order, is_active, created_at
        FROM food_categories 
        WHERE is_active = true
        ORDER BY sort_order, name
      `);
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { name, description, sort_order } = body;
      
      const result = await client.query(`
        INSERT INTO food_categories (name, description, sort_order)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [name, description, sort_order || 0]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { name, description, sort_order } = body;
      
      const result = await client.query(`
        UPDATE food_categories 
        SET name = $1, description = $2, sort_order = $3
        WHERE id = $4
        RETURNING *
      `, [name, description, sort_order, id]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('UPDATE food_categories SET is_active = false WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Food category deleted successfully' });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Food categories error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Food Items endpoint
async function handleFoodItems(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT fi.id, fi.name, fi.description, fi.category_id, fi.type, fi.price, fi.cost, 
               fi.preparation_time, fi.is_available, fi.image_url, fi.created_at,
               fc.name as category_name
        FROM food_items fi
        LEFT JOIN food_categories fc ON fi.category_id = fc.id
        WHERE fi.is_available = true
        ORDER BY fi.type, fi.name
      `);
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { name, description, category_id, type, price, cost, preparation_time, is_available, image_url } = body;
      
      const result = await client.query(`
        INSERT INTO food_items (name, description, category_id, type, price, cost, preparation_time, is_available, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [name, description, category_id, type, price, cost, preparation_time, is_available, image_url]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { name, description, category_id, type, price, cost, preparation_time, is_available, image_url } = body;
      
      const result = await client.query(`
        UPDATE food_items 
        SET name = $1, description = $2, category_id = $3, type = $4, price = $5, cost = $6, 
            preparation_time = $7, is_available = $8, image_url = $9, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
        WHERE id = $10
        RETURNING *
      `, [name, description, category_id, type, price, cost, preparation_time, is_available, image_url, id]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('UPDATE food_items SET is_available = false WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Food item deleted successfully' });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Food items error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Ingredients endpoint
async function handleIngredients(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT id, name, unit, current_stock, min_stock, cost_per_unit, supplier, is_active, created_at
        FROM ingredients 
        WHERE is_active = true
        ORDER BY name
      `);
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { name, unit, current_stock, min_stock, cost_per_unit, supplier } = body;
      
      const result = await client.query(`
        INSERT INTO ingredients (name, unit, current_stock, min_stock, cost_per_unit, supplier)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, unit, current_stock, min_stock, cost_per_unit, supplier]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { name, unit, current_stock, min_stock, cost_per_unit, supplier } = body;
      
      const result = await client.query(`
        UPDATE ingredients 
        SET name = $1, unit = $2, current_stock = $3, min_stock = $4, cost_per_unit = $5, supplier = $6, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
        WHERE id = $7
        RETURNING *
      `, [name, unit, current_stock, min_stock, cost_per_unit, supplier, id]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('UPDATE ingredients SET is_active = false WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Ingredient deleted successfully' });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Ingredients error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Recipe Ingredients endpoint
async function handleRecipeIngredients(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const parsedUrl = url.parse(req.url, true);
      const foodItemId = parsedUrl.query.food_item_id;
      
      const result = await client.query(`
        SELECT ri.id, ri.food_item_id, ri.ingredient_id, ri.quantity, ri.unit,
               i.name as ingredient_name
        FROM recipe_ingredients ri
        LEFT JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.food_item_id = $1
        ORDER BY i.name
      `, [foodItemId]);
      
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { food_item_id, ingredient_id, quantity, unit } = body;
      
      const result = await client.query(`
        INSERT INTO recipe_ingredients (food_item_id, ingredient_id, quantity, unit)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [food_item_id, ingredient_id, quantity, unit]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('DELETE FROM recipe_ingredients WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Recipe ingredient deleted successfully' });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Recipe ingredients error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Orders endpoint
async function handleOrders(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      // Kiểm tra nếu có ID trong URL (GET /api/orders/:id)
      const pathParts = req.url.split('/');
      const orderId = pathParts[pathParts.length - 1];
      
      if (orderId && !isNaN(orderId)) {
        // Lấy chi tiết order theo ID
        const result = await client.query(`
          SELECT o.id, o.order_number, o.table_id, o.status, o.order_type, o.subtotal, o.tax_amount, o.total_amount, o.notes, o.created_at,
                 o.buffet_package_id, o.buffet_duration_minutes, o.buffet_start_time, o.buffet_quantity,
                 t.table_name, t.area, c.fullname as customer_name, e.employee_code, e.fullname as employee_name,
                 bp.name as buffet_package_name, bp.price as buffet_package_price
          FROM orders o
          LEFT JOIN tables t ON o.table_id = t.id
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN employees e ON o.employee_id = e.id
          LEFT JOIN buffet_packages bp ON o.buffet_package_id = bp.id
          WHERE o.id = $1
        `, [orderId]);

        // Đếm số vé từ order_buffet và cập nhật buffet_quantity
        if (result.rows.length > 0) {
          const buffetCountRes = await client.query(
            `SELECT COUNT(*)::int AS qty FROM order_buffet WHERE order_id = $1`,
            [orderId]
          );
          const actualBuffetQty = buffetCountRes.rows[0]?.qty || 0;
          result.rows[0].buffet_quantity = actualBuffetQty;
          console.log(`🎫 Order ${orderId}: buffet_quantity updated from order_buffet = ${actualBuffetQty}`);
        }
        
        if (result.rows.length === 0) {
          sendJSON(res, 404, { error: 'Order not found' });
          return;
        }
        
        const order = result.rows[0];

        // Đọc tổng số vé từ tất cả dòng order_buffet cùng order_id
        if (order.buffet_package_id) {
          const buffetCountRes = await client.query(
            `SELECT SUM(quantity)::int AS total_qty FROM order_buffet WHERE order_id = $1`,
            [order.id]
          );
          order.buffet_quantity = buffetCountRes.rows[0]?.total_qty || 0;
        }
        
        // Lấy order items
        const itemsResult = await client.query(`
          SELECT oi.id, oi.food_item_id, oi.quantity, oi.unit_price, oi.total_price, oi.special_instructions, oi.note,
                 fi.name, fi.printer_id
          FROM order_items oi
          LEFT JOIN food_items fi ON oi.food_item_id = fi.id
          WHERE oi.order_id = $1
          ORDER BY oi.id
        `, [order.id]);
        
        order.items = itemsResult.rows.map(item => ({
          food_item_id: item.food_item_id,
          name: item.name,
          price: parseFloat(item.unit_price) || 0,
          quantity: parseInt(item.quantity) || 0,
          total: parseFloat(item.total_price) || 0,
          special_instructions: item.special_instructions,
          printer_id: item.printer_id
        }));
        
        sendJSON(res, 200, order);
        return;
      }
      
      // Lấy tất cả orders (logic cũ)
                  const result = await client.query(`
                    SELECT o.id, o.order_number, o.table_id, o.status, o.order_type, o.subtotal, o.tax_amount, o.total_amount, o.notes, o.created_at,
                           o.buffet_package_id, o.buffet_duration_minutes, o.buffet_start_time, o.buffet_quantity,
                           t.table_name, t.area, c.fullname as customer_name, e.employee_code, e.fullname as employee_name
                    FROM orders o
                    LEFT JOIN tables t ON o.table_id = t.id
                    LEFT JOIN customers c ON o.customer_id = c.id
                    LEFT JOIN employees e ON o.employee_id = e.id
                    ORDER BY o.created_at DESC
                    LIMIT 50
                  `);
      
      // Lấy order items cho mỗi order
      const orders = result.rows;
      // Lấy tổng số vé cho từng order từ tất cả dòng order_buffet
      for (const o of orders) {
        if (o.buffet_package_id) {
          const buffetCountRes = await client.query(
            `SELECT SUM(quantity)::int AS total_qty FROM order_buffet WHERE order_id = $1`,
            [o.id]
          );
          o.buffet_quantity = buffetCountRes.rows[0]?.total_qty || 0;
        }
      }
      for (const order of orders) {
        const itemsResult = await client.query(`
          SELECT oi.id, oi.food_item_id, oi.quantity, oi.unit_price, oi.total_price, oi.special_instructions, oi.note,
                 fi.name, fi.printer_id
          FROM order_items oi
          LEFT JOIN food_items fi ON oi.food_item_id = fi.id
          WHERE oi.order_id = $1
          ORDER BY oi.id
        `, [order.id]);
        
        order.items = itemsResult.rows.map(item => ({
          food_item_id: item.food_item_id,
          name: item.name,
          price: parseFloat(item.unit_price) || 0,
          quantity: parseInt(item.quantity) || 0,
          total: parseFloat(item.total_price) || 0,
          special_instructions: item.special_instructions,
          printer_id: item.printer_id
        }));
        
        // Tính order_count từ notes nếu có
        const orderCountMatch = order.notes?.match(/Order lần (\d+)/);
        order.order_count = orderCountMatch ? parseInt(orderCountMatch[1]) : 1;
      }
      
      sendJSON(res, 200, orders);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { order_number, table_id, customer_id, employee_id, order_type, subtotal, tax_amount, total_amount, notes, items, order_count } = body;
      
      // Convert to numbers to avoid numeric errors
      const subtotalNum = parseFloat(subtotal) || 0;
      const taxAmountNum = parseFloat(tax_amount) || 0;
      const totalAmountNum = parseFloat(total_amount) || 0;
      
      // Check if order exists for this table
      const existingOrder = await client.query(`
        SELECT id FROM orders WHERE table_id = $1 AND status != 'paid' ORDER BY created_at DESC LIMIT 1
      `, [table_id]);
      
      let order;
      if (existingOrder.rows.length > 0) {
        // Update existing order
        const result = await client.query(`
          UPDATE orders 
          SET subtotal = $1, tax_amount = $2, total_amount = $3, notes = $4, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
          WHERE id = $5
          RETURNING *
        `, [subtotalNum, taxAmountNum, totalAmountNum, notes || `Order lần ${order_count || 1}`, existingOrder.rows[0].id]);
        order = result.rows[0];
        
        // Clear existing order items
        await client.query(`DELETE FROM order_items WHERE order_id = $1`, [order.id]);
        await client.query(`DELETE FROM kitchen_orders WHERE order_id = $1`, [order.id]);
      } else {
        // Create new order
        // Tự động tạo order_number nếu không có
        const finalOrderNumber = order_number || `BUF-${Date.now()}`;
        
        const result = await client.query(`
          INSERT INTO orders (order_number, table_id, customer_id, employee_id, order_type, subtotal, tax_amount, total_amount, notes, buffet_package_id, buffet_duration_minutes, buffet_start_time, buffet_quantity, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC' AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC' AT TIME ZONE 'UTC')
          RETURNING *
        `, [finalOrderNumber, table_id, customer_id, employee_id, order_type, subtotalNum, taxAmountNum, totalAmountNum, notes, body.buffet_package_id || null, body.buffet_duration_minutes || null, body.buffet_start_time || null, 0]);
        order = result.rows[0];
      }
      
      // Insert buffet tickets into order_buffet if provided
      if (body.buffet_package_id && Number(body.buffet_quantity) > 0) {
        const qty = parseInt(body.buffet_quantity) || 0;
        for (let i = 0; i < qty; i++) {
          await client.query(
            `INSERT INTO order_buffet (order_id, buffet_package_id, created_at) VALUES ($1, $2, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC')`,
            [order.id, body.buffet_package_id]
          );
        }
      }

      // Insert order items
      if (items && items.length > 0) {
        for (const item of items) {
          const orderItemResult = await client.query(`
            INSERT INTO order_items (order_id, food_item_id, quantity, unit_price, total_price, special_instructions)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `, [order.id, item.food_item_id, parseInt(item.quantity) || 0, parseFloat(item.price) || 0, parseFloat(item.total) || 0, item.special_instructions]);
          
          const orderItemId = orderItemResult.rows[0].id;
          
          // Create kitchen order
          await client.query(`
            INSERT INTO kitchen_orders (order_id, order_item_id, food_item_name, quantity, table_number, special_instructions)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [order.id, orderItemId, item.name, item.quantity, order.table_id, item.special_instructions]);
        }
      }
      
      sendJSON(res, 201, { ...order, order_count: order_count || 1 });
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { status, notes, payment_method, buffet_quantity, subtotal, tax_amount, total_amount, items, buffet_package_id } = body;
      
      // Cập nhật order
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;
      
      if (status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        updateValues.push(status);
      }
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCount++}`);
        updateValues.push(notes);
      }
      if (payment_method !== undefined) {
        updateFields.push(`payment_method = $${paramCount++}`);
        updateValues.push(payment_method);
      }
      // Vé buffet: thêm/xóa dòng trong order_buffet, không dùng cột buffet_quantity nữa
      if (subtotal !== undefined) {
        updateFields.push(`subtotal = $${paramCount++}`);
        updateValues.push(subtotal);
      }
      if (tax_amount !== undefined) {
        updateFields.push(`tax_amount = $${paramCount++}`);
        updateValues.push(tax_amount);
      }
      if (total_amount !== undefined) {
        updateFields.push(`total_amount = $${paramCount++}`);
        updateValues.push(total_amount);
      }
      
      updateFields.push(`updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'`);
      updateValues.push(id);
      
      const result = await client.query(`
        UPDATE orders 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, updateValues);
      
      // Cập nhật vé buffet: tạo dòng mới cho mỗi lần order thêm vé
      if (buffet_quantity !== undefined) {
        const additionalQty = parseInt(buffet_quantity) || 0;
        let pkgId = buffet_package_id || result.rows[0]?.buffet_package_id;
        
        // Nếu buffet_package_id = 0, lấy từ order cũ
        if (!pkgId) {
          const orderRes = await client.query(
            `SELECT buffet_package_id FROM orders WHERE id = $1`,
            [id]
          );
          if (orderRes.rows.length > 0) {
            pkgId = orderRes.rows[0].buffet_package_id;
          }
        }
        
        if (additionalQty > 0 && pkgId) {
          console.log(`🎫 [SERVER UPDATE ORDER] Adding ${additionalQty} tickets for order ${id}, package ${pkgId}`);
          // Tạo dòng mới với quantity = additionalQty
          await client.query(
            `INSERT INTO order_buffet (order_id, buffet_package_id, quantity, created_at) VALUES ($1, $2, $3, NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC')`,
            [id, pkgId, additionalQty]
          );
          console.log(`✅ [SERVER UPDATE ORDER] Successfully added ${additionalQty} tickets`);
        } else {
          console.log(`🎫 [SERVER UPDATE ORDER] Skipping ticket sync: additionalQty=${additionalQty}, pkgId=${pkgId}`);
        }
      }

      // Nếu có items mới, thay thế items cũ (không cộng dồn)
      if (items && Array.isArray(items)) {
        console.log('🔄 Replacing items (not merging):', items.map(item => ({
          food_item_id: item.food_item_id,
          quantity: item.quantity,
          name: item.name || 'Unknown'
        })));
        
        // Xóa items cũ và thêm items mới
        await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
        
        for (const item of items) {
          // Chỉ insert nếu có food_item_id hợp lệ
          if (item.food_item_id) {
            await client.query(`
              INSERT INTO order_items (order_id, food_item_id, quantity, unit_price, total_price, special_instructions)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [id, item.food_item_id, item.quantity, item.price, item.total, item.special_instructions]);
          }
        }
      }
      
      // Nếu status được cập nhật thành 'paid', tạo invoice
      if (status === 'paid') {
        try {
          await createInvoiceFromOrder(id, client);
          console.log(`✅ Created invoice for paid order ${id}`);
        } catch (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
          // Không throw error để không ảnh hưởng đến việc cập nhật order
        }
      }
      
      sendJSON(res, 200, result.rows[0]);
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Orders error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}





// Inventory Transactions endpoint
async function handleInventoryTransactions(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT it.id, it.ingredient_id, it.transaction_type, it.quantity, it.unit, 
               it.reason, it.notes, it.created_at,
               i.name as ingredient_name
        FROM inventory_transactions it
        LEFT JOIN ingredients i ON it.ingredient_id = i.id
        ORDER BY it.created_at DESC
        LIMIT 100
      `);
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { ingredient_id, transaction_type, quantity, reason, notes } = body;
      
      // Get ingredient unit
      const ingredientResult = await client.query('SELECT unit FROM ingredients WHERE id = $1', [ingredient_id]);
      if (ingredientResult.rows.length === 0) {
        return sendJSON(res, 400, { error: 'Ingredient not found' });
      }
      
      const unit = ingredientResult.rows[0].unit;
      
      // Create transaction
      const transactionResult = await client.query(`
        INSERT INTO inventory_transactions (ingredient_id, transaction_type, quantity, unit, reason, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [ingredient_id, transaction_type, quantity, unit, reason, notes]);
      
      // Update ingredient stock
      const stockChange = transaction_type === 'in' ? quantity : -quantity;
      await client.query(`
        UPDATE ingredients 
        SET current_stock = current_stock + $1, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
        WHERE id = $2
      `, [stockChange, ingredient_id]);
      
      sendJSON(res, 201, transactionResult.rows[0]);
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory transactions error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Customers endpoint
async function handleCustomers(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT id, fullname, phone, email, address, birthday, gender, loyalty_points, total_spent, last_visit, created_at
        FROM customers 
        ORDER BY fullname
      `);
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { fullname, phone, email, address, birthday, gender, notes } = body;
      
      const result = await client.query(`
        INSERT INTO customers (fullname, phone, email, address, birthday, gender, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [fullname, phone, email, address, birthday, gender, notes]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { fullname, phone, email, address, birthday, gender, notes } = body;
      
      const result = await client.query(`
        UPDATE customers 
        SET fullname = $1, phone = $2, email = $3, address = $4, birthday = $5, gender = $6, notes = $7, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
        WHERE id = $8
        RETURNING *
      `, [fullname, phone, email, address, birthday, gender, notes, id]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('DELETE FROM customers WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Customer deleted successfully' });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customers error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Employees endpoint
async function handleEmployees(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT e.id, e.employee_code, e.position, e.base_salary, e.commission_rate, e.hire_date, e.is_active,
               e.fullname, e.email, e.phone, e.user_id
        FROM employees e
        WHERE e.is_active = true
        ORDER BY e.employee_code
      `);
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        console.log('Received body:', body);
        
        const { employee_code, position, base_salary, commission_rate, hire_date, fullname, email, phone, username, password } = body;
        
        if (!employee_code || !fullname) {
          return sendJSON(res, 400, { error: 'Employee code and fullname are required' });
        }

        // Tạo user account trước
        let userId = null;
        if (username && password) {
          const hashedPassword = bcrypt.hashSync(password, 10);
          const userResult = await client.query(`
            INSERT INTO users (username, password, fullname, email, phone, role)
            VALUES ($1, $2, $3, $4, $5, 'employee')
            RETURNING id
          `, [username, hashedPassword, fullname, email || '', phone || '']);
          userId = userResult.rows[0].id;
        }

        // Tạo employee với user_id
        const result = await client.query(`
          INSERT INTO employees (employee_code, position, base_salary, commission_rate, hire_date, fullname, email, phone, username, user_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
          RETURNING *
        `, [employee_code, position || '', base_salary || 0, commission_rate || 0, hire_date || new Date(), fullname, email || '', phone || '', username || employee_code, userId]);
        
        sendJSON(res, 201, result.rows[0]);
      } catch (error) {
        console.error('Error in POST employees:', error);
        sendJSON(res, 500, { error: 'Failed to create employee: ' + error.message });
      }
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { employee_code, position, base_salary, commission_rate, hire_date, is_active, fullname, email, phone } = body;
      
      // Lấy thông tin hiện tại để giữ hire_date nếu không được cung cấp
      const currentEmployee = await client.query('SELECT hire_date FROM employees WHERE id = $1', [id]);
      const currentHireDate = currentEmployee.rows[0]?.hire_date;
      
      const result = await client.query(`
        UPDATE employees 
        SET employee_code = $1, position = $2, base_salary = $3, commission_rate = $4, 
            hire_date = $5, is_active = $6, fullname = $7, email = $8, phone = $9, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
        WHERE id = $10
        RETURNING *
      `, [
        employee_code, 
        position, 
        base_salary, 
        commission_rate, 
        hire_date || currentHireDate || new Date(), 
        is_active, 
        fullname, 
        email, 
        phone, 
        id
      ]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('UPDATE employees SET is_active = false WHERE id = $1', [id]);
      sendJSON(res, 200, { message: 'Employee deleted successfully' });
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Employees error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Legacy endpoints for compatibility
async function handleLegacyEndpoints(req, res, path) {
  const client = await pool.connect();
  try {
    if (path === '/services' && req.method === 'GET') {
      const result = await client.query(`
        SELECT id, name, description, price, duration, category, commission_rate, is_active, created_at
        FROM services 
        WHERE is_active = true
        ORDER BY name
      `);
      sendJSON(res, 200, result.rows);
    } else if (path.startsWith('/invoices') && req.method === 'GET') {
      const result = await client.query(`
        SELECT i.id, i.invoice_number, i.total_amount, i.payment_status, i.created_at,
               i.payment_method, i.notes, i.subtotal, i.tax_amount,
               c.fullname as customer_name, c.phone as customer_phone,
               e.employee_code, e.fullname as employee_name, e.phone as employee_phone
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN employees e ON i.employee_id = e.id
        ORDER BY i.created_at DESC
        LIMIT 50
      `);
      sendJSON(res, 200, result.rows);
    } else if (path.startsWith('/appointments') && req.method === 'GET') {
      const result = await client.query(`
        SELECT a.id, a.appointment_date, a.duration, a.status, a.notes, a.created_at,
               c.fullname as customer_name, e.employee_code, s.name as service_name
        FROM appointments a
        LEFT JOIN customers c ON a.customer_id = c.id
        LEFT JOIN employees e ON a.employee_id = e.id
        LEFT JOIN services s ON a.service_id = s.id
        ORDER BY a.appointment_date DESC
        LIMIT 50
      `);
      sendJSON(res, 200, result.rows);
    } else {
      sendJSON(res, 404, { error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Legacy endpoint error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
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
        message: 'JULY Restaurant API Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } else if (path.startsWith('/auth/')) {
      await handleAuth(req, res, path);
    } else if (path === '/dashboard') {
      await handleDashboard(req, res);
    } else if (path.startsWith('/api/tables') || path.startsWith('/tables')) {
      await handleTables(req, res);
    } else if (path.startsWith('/api/food-categories') || path.startsWith('/food-categories')) {
      await handleFoodCategories(req, res);
    } else if (path.startsWith('/api/food-items') || path.startsWith('/food-items')) {
      await handleFoodItems(req, res);
    } else if (path.startsWith('/api/ingredients') || path.startsWith('/ingredients')) {
      await handleIngredients(req, res);
    } else if (path.startsWith('/api/recipe-ingredients') || path.startsWith('/recipe-ingredients')) {
      await handleRecipeIngredients(req, res);
    } else if (path.startsWith('/api/inventory-transactions') || path.startsWith('/inventory-transactions')) {
      await handleInventoryTransactions(req, res);
    } else if (path.startsWith('/api/orders') || path.startsWith('/orders')) {
      await handleOrders(req, res);
    } else if (path.startsWith('/api/buffet-packages') || path.startsWith('/buffet-packages')) {
      await handleBuffetPackages(req, res);
    } else if (path.startsWith('/api/printers') || path.startsWith('/printers')) {
      await handlePrinters(req, res);
    } else if (path.startsWith('/api/buffet-package-items') || path.startsWith('/buffet-package-items')) {
      await handleBuffetPackageItems(req, res);
    } else if (path.startsWith('/api/customers') || path.startsWith('/customers')) {
      await handleCustomers(req, res);
    } else if (path.startsWith('/api/employees') || path.startsWith('/employees')) {
      await handleEmployees(req, res);
    } else if (path.startsWith('/api/invoices') || path.startsWith('/invoices')) {
      await handleInvoices(req, res);
    } else {
      await handleLegacyEndpoints(req, res, path);
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
  console.log(`🚀 JULY Restaurant API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔐 Auth endpoints: /auth/login, /auth/me`);
  console.log(`📈 Dashboard: /dashboard`);
  console.log(`🍽️  Restaurant APIs:`);
  console.log(`   - Tables: /tables`);
  console.log(`   - Food Categories: /food-categories`);
  console.log(`   - Food Items: /food-items`);
  console.log(`   - Ingredients: /ingredients`);
  console.log(`   - Recipe Ingredients: /recipe-ingredients`);
  console.log(`   - Inventory Transactions: /inventory-transactions`);
  console.log(`🔄 Legacy APIs: /services, /customers, /employees, /invoices, /appointments`);
});

// Buffet Packages endpoint
async function handleBuffetPackages(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM buffet_packages WHERE is_active = true ORDER BY price');
      sendJSON(res, 200, result.rows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { name, description, price, duration_minutes, is_active } = body;
      
      const result = await client.query(`
        INSERT INTO buffet_packages (name, description, price, duration_minutes, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [name, description, price, duration_minutes, is_active]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { name, description, price, duration_minutes, is_active } = body;
      
      const result = await client.query(`
        UPDATE buffet_packages
        SET name = $1, description = $2, price = $3, duration_minutes = $4, is_active = $5, updated_at = NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' AT TIME ZONE 'UTC'
        WHERE id = $6
        RETURNING *
      `, [name, description, price, duration_minutes, is_active, id]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('DELETE FROM buffet_packages WHERE id = $1', [id]);
      sendJSON(res, 204, {});
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Buffet Packages error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Buffet Package Items endpoint
async function handleBuffetPackageItems(req, res) {
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const packageId = url.searchParams.get('package_id');
      
      let query = `
        SELECT bpi.*, fi.name as food_item_name, fi.price as food_item_price, fi.description as food_item_description
        FROM buffet_package_items bpi
        LEFT JOIN food_items fi ON bpi.food_item_id = fi.id
      `;
      let params = [];
      
      if (packageId) {
        query += ' WHERE bpi.package_id = $1';
        params.push(packageId);
      }
      
      query += ' ORDER BY fi.name';
      
      const result = await client.query(query, params);
      
      // Transform the result to match the expected format
      const transformedRows = result.rows.map(row => ({
        id: row.id,
        package_id: row.package_id,
        food_item_id: row.food_item_id,
        is_unlimited: row.is_unlimited,
        max_quantity: row.max_quantity,
        food_item: {
          id: row.food_item_id,
          name: row.food_item_name,
          price: row.food_item_price,
          description: row.food_item_description
        }
      }));
      
      sendJSON(res, 200, transformedRows);
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      const { package_id, food_item_id, is_unlimited, max_quantity } = body;
      
      const result = await client.query(`
        INSERT INTO buffet_package_items (package_id, food_item_id, is_unlimited, max_quantity)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [package_id, food_item_id, is_unlimited, max_quantity]);
      
      sendJSON(res, 201, result.rows[0]);
    } else if (req.method === 'PUT') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      const body = await parseBody(req);
      const { package_id, food_item_id, is_unlimited, max_quantity } = body;
      
      const result = await client.query(`
        UPDATE buffet_package_items
        SET package_id = $1, food_item_id = $2, is_unlimited = $3, max_quantity = $4
        WHERE id = $5
        RETURNING *
      `, [package_id, food_item_id, is_unlimited, max_quantity, id]);
      
      sendJSON(res, 200, result.rows[0]);
    } else if (req.method === 'DELETE') {
      const pathParts = req.url.split('/');
      const id = pathParts[pathParts.length - 1];
      
      await client.query('DELETE FROM buffet_package_items WHERE id = $1', [id]);
      sendJSON(res, 204, {});
    } else {
      sendJSON(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Buffet Package Items error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// Printers endpoint
async function handlePrinters(req, res) {
  const client = await pool.connect();
  try {
    const path = req.url;
    
    if (path.includes('/scan')) {
      // Quét máy in từ Windows
      if (req.method === 'POST') {
        console.log('🔍 Scanning Windows printers...');
        
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          // Sử dụng PowerShell để lấy danh sách máy in
          const { stdout } = await execAsync('powershell "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json"');
          
          const printerList = JSON.parse(stdout);
          
          const printers = printerList.map((printer, index) => ({
            id: `printer_${index}`,
            name: printer.Name,
            driver: printer.DriverName,
            port: printer.PortName,
            status: printer.PrinterStatus === 'Normal' ? 'ready' : 'error'
          }));
          
          console.log(`✅ Found ${printers.length} Windows printers`);
          sendJSON(res, 200, { printers });
          
        } catch (scanError) {
          console.error('❌ Error scanning Windows printers:', scanError);
          sendJSON(res, 500, { error: 'Failed to scan printers', details: scanError.message });
        }
      } else {
        sendJSON(res, 405, { error: 'Method not allowed' });
      }
    } else if (path.includes('/test')) {
      // Test in máy in
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { printer_id, content } = body;
        
        try {
          // Lấy thông tin máy in từ database
          const printerResult = await client.query('SELECT * FROM printers WHERE id = $1', [printer_id]);
          
          if (printerResult.rows.length === 0) {
            return sendJSON(res, 404, { error: 'Printer not found' });
          }
          
          const printer = printerResult.rows[0];
          
          // In test
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const fs = require('fs');
          const path = require('path');
          
          const execAsync = promisify(exec);
          
          // Tạo file tạm
          const tempFile = path.join(__dirname, `test_print_${Date.now()}.txt`);
          fs.writeFileSync(tempFile, content, 'utf8');
          
          // In file tạm
          const printCommand = `powershell "Get-Content '${tempFile}' | Out-Printer -Name '${printer.name}'"`;
          
          await execAsync(printCommand);
          
          // Xóa file tạm
          fs.unlinkSync(tempFile);
          
          console.log(`✅ Test print successful to ${printer.name}`);
          sendJSON(res, 200, { message: `Printed to ${printer.name}`, success: true });
          
        } catch (printError) {
          console.error(`❌ Test print failed: ${printError.message}`);
          sendJSON(res, 500, { error: `Print failed: ${printError.message}` });
        }
      } else {
        sendJSON(res, 405, { error: 'Method not allowed' });
      }
    } else {
      // CRUD operations cho printers
      if (req.method === 'GET') {
        const result = await client.query(`
          SELECT * FROM printers 
          ORDER BY created_at DESC
        `);
        sendJSON(res, 200, result.rows);
      } else if (req.method === 'POST') {
        const body = await parseBody(req);
        const { name, connection_type, usb_port, ip_address, port_number, driver_name, location, notes } = body;
        
        const result = await client.query(`
          INSERT INTO printers (name, connection_type, usb_port, ip_address, port_number, driver_name, location, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [name, connection_type, usb_port, ip_address, port_number, driver_name, location, notes]);
        
        sendJSON(res, 201, result.rows[0]);
      } else if (req.method === 'PUT') {
        const pathParts = req.url.split('/');
        const id = pathParts[pathParts.length - 1];
        const body = await parseBody(req);
        const { name, connection_type, usb_port, ip_address, port_number, driver_name, location, notes, status } = body;
        
        const result = await client.query(`
          UPDATE printers 
          SET name = $1, connection_type = $2, usb_port = $3, ip_address = $4, port_number = $5, 
              driver_name = $6, location = $7, notes = $8, status = $9, updated_at = NOW()
          WHERE id = $10
          RETURNING *
        `, [name, connection_type, usb_port, ip_address, port_number, driver_name, location, notes, status, id]);
        
        sendJSON(res, 200, result.rows[0]);
      } else if (req.method === 'DELETE') {
        const pathParts = req.url.split('/');
        const id = pathParts[pathParts.length - 1];
        
        await client.query(`DELETE FROM printers WHERE id = $1`, [id]);
        sendJSON(res, 200, { message: 'Printer deleted successfully' });
      } else {
        sendJSON(res, 405, { error: 'Method not allowed' });
      }
    }
  } catch (error) {
    console.error('Printers error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  } finally {
    client.release();
  }
}

module.exports = server;
