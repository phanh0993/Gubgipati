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

    const dbPool = getPool();
    const client = await dbPool.connect();

    try {
      if (req.method === 'GET') {
        // Try to get services from database, fallback to mock data if table doesn't exist
        try {
          const result = await client.query(`
            SELECT id, name, description, price, duration, category, commission_rate, is_active, created_at, updated_at
            FROM services 
            WHERE is_active = true
            ORDER BY name ASC
          `);

          res.json({
            services: result.rows,
            total: result.rows.length
          });
        } catch (dbError) {
          console.log('Services table not found, returning mock data:', dbError.message);
          
          // Return mock data if table doesn't exist
          const mockServices = [
            {
              id: 1,
              name: 'Massage thư giãn',
              description: 'Massage toàn thân giúp thư giãn cơ bắp',
              price: 300000,
              duration: 60,
              category: 'Massage',
              commission_rate: 5.0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              name: 'Chăm sóc da mặt',
              description: 'Làm sạch và chăm sóc da mặt chuyên nghiệp',
              price: 200000,
              duration: 45,
              category: 'Chăm sóc da',
              commission_rate: 4.5,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 3,
              name: 'Tắm trắng',
              description: 'Dịch vụ tắm trắng toàn thân',
              price: 350000,
              duration: 90,
              category: 'Làm đẹp',
              commission_rate: 6.0,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];

          res.json({
            services: mockServices,
            total: mockServices.length
          });
        }

      } else if (req.method === 'POST') {
        // Create new service
        const { name, description, price, duration, category, commission_rate } = req.body;

        if (!name || !price) {
          return res.status(400).json({ error: 'Name and price are required' });
        }

        // Try to create table first if it doesn't exist
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS services (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              price DECIMAL(10,2) NOT NULL,
              duration INTEGER DEFAULT 60,
              category VARCHAR(100) DEFAULT 'General',
              commission_rate DECIMAL(5,2) DEFAULT 0.00,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);
        } catch (tableError) {
          console.log('Table creation error (might already exist):', tableError.message);
        }

        const result = await client.query(`
          INSERT INTO services (name, description, price, duration, category, commission_rate, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
          RETURNING *
        `, [name, description || '', price, duration || 60, category || 'General', commission_rate || 0]);

        res.status(201).json({
          message: 'Service created successfully',
          service: result.rows[0]
        });

      } else if (req.method === 'PUT') {
        // Update service - get ID from URL path or query
        const urlParts = req.url.split('?')[0].split('/'); // Remove query string first
        const idFromPath = urlParts[urlParts.length - 1];
        const { id } = req.query;
        const serviceId = (idFromPath && idFromPath !== 'services') ? idFromPath : id;
        
        const { name, description, price, duration, category, commission_rate } = req.body;

        console.log('Service update request:', {
          serviceId: serviceId,
          idFromPath: idFromPath,
          idFromQuery: id,
          url: req.url,
          urlParts: urlParts,
          body: req.body
        });

        if (!serviceId) {
          return res.status(400).json({ error: 'Service ID is required' });
        }
        
        const parsedServiceId = parseInt(serviceId);
        if (isNaN(parsedServiceId)) {
          return res.status(400).json({ error: 'Invalid service ID' });
        }

        if (!name || !price) {
          return res.status(400).json({ error: 'Name and price are required' });
        }

        const result = await client.query(`
          UPDATE services 
          SET name = $1, description = $2, price = $3, duration = $4, category = $5, 
              commission_rate = $6, updated_at = NOW()
          WHERE id = $7
          RETURNING *
        `, [name, description || '', price, duration || 60, category || 'General', commission_rate || 0, parsedServiceId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Service not found' });
        }

        res.json({
          message: 'Service updated successfully',
          service: result.rows[0]
        });

      } else if (req.method === 'DELETE') {
        // Soft delete service - get ID from URL path or query
        const urlParts = req.url.split('?')[0].split('/'); // Remove query string first
        const idFromPath = urlParts[urlParts.length - 1];
        const { id } = req.query;
        const serviceId = (idFromPath && idFromPath !== 'services') ? idFromPath : id;

        console.log('Service delete request:', {
          serviceId: serviceId,
          idFromPath: idFromPath,
          idFromQuery: id,
          url: req.url,
          urlParts: urlParts
        });

        if (!serviceId) {
          return res.status(400).json({ error: 'Service ID is required' });
        }
        
        const parsedServiceId = parseInt(serviceId);
        if (isNaN(parsedServiceId)) {
          return res.status(400).json({ error: 'Invalid service ID' });
        }

        const result = await client.query(`
          UPDATE services 
          SET is_active = false, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [parsedServiceId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Service not found' });
        }

        res.json({
          message: 'Service deleted successfully',
          service: result.rows[0]
        });

      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Services API error:', error);
    res.status(500).json({ error: 'Services API failed: ' + error.message });
  }
};
