const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database setup...');
    
    // 1. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullname VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'admin',
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // 2. Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        fullname VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        birthday DATE,
        gender VARCHAR(10),
        notes TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0,
        last_visit TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Customers table created');

    // 3. Create employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(50) UNIQUE NOT NULL,
        fullname VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        avatar VARCHAR(255),
        employee_code VARCHAR(20) UNIQUE NOT NULL,
        position VARCHAR(50),
        base_salary DECIMAL(12,2) DEFAULT 0,
        commission_rate DECIMAL(5,2) DEFAULT 0,
        hire_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        skills INTEGER[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Employees table created');

    // 4. Create services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration INTEGER NOT NULL,
        category VARCHAR(50),
        commission_rate DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Services table created');

    // 5. Create invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        employee_id INTEGER REFERENCES employees(id),
        subtotal DECIMAL(12,2) DEFAULT 0,
        discount_amount DECIMAL(12,2) DEFAULT 0,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        payment_status VARCHAR(20) DEFAULT 'pending',
        invoice_date TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        employee_name VARCHAR(100),
        dichvu TEXT,
        service_employee_mapping TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Invoices table created');

    // 6. Create invoice_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id),
        employee_id INTEGER REFERENCES employees(id),
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
        commission_amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Invoice items table created');

    // 7. Create overtime_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS overtime_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        date DATE NOT NULL,
        hours DECIMAL(4,2) NOT NULL,
        hourly_rate DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Overtime records table created');

    // 8. Create appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        employee_id INTEGER REFERENCES employees(id),
        service_id INTEGER REFERENCES services(id),
        appointment_date TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Appointments table created');

    // 9. Insert default admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const adminExists = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminExists.rows.length === 0) {
      await client.query(`
        INSERT INTO users (username, password, fullname, email, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', hashedPassword, 'Administrator', 'admin@julyspa.com', 'admin']);
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // 10. Insert sample services
    const servicesExist = await client.query('SELECT id FROM services LIMIT 1');
    
    if (servicesExist.rows.length === 0) {
      const sampleServices = [
        ['Massage Thái', 'Massage truyền thống Thái Lan', 500000, 90, 'Massage', 10],
        ['Massage Đá Nóng', 'Massage với đá nóng thư giãn', 600000, 120, 'Massage', 12],
        ['Facial Treatment', 'Chăm sóc da mặt chuyên sâu', 800000, 60, 'Chăm sóc da', 15],
        ['Body Scrub', 'Tẩy tế bào chết toàn thân', 400000, 45, 'Chăm sóc da', 8],
        ['Aromatherapy', 'Liệu pháp hương thơm thư giãn', 700000, 75, 'SPA', 12]
      ];

      for (const service of sampleServices) {
        await client.query(`
          INSERT INTO services (name, description, price, duration, category, commission_rate)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, service);
      }
      console.log('✅ Sample services inserted');
    } else {
      console.log('ℹ️  Services already exist');
    }

    // 11. Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(employee_code)');
    console.log('✅ Database indexes created');

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy content from local-env.txt to .env file');
    console.log('2. Copy content from server-env.txt to server/.env file');
    console.log('3. Run: npm install');
    console.log('4. Run: npm run dev');
    console.log('\n🔑 Default admin login:');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = setupDatabase;
