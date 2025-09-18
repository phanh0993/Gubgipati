const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('🐘 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

// Create tables for PostgreSQL
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'employee',
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration INTEGER DEFAULT 60,
        category VARCHAR(100),
        commission_rate DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table with all Excel import fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        birthday DATE,
        gender VARCHAR(10),
        notes TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0,
        last_visit DATE,
        customer_code VARCHAR(50),
        company VARCHAR(255),
        tax_code VARCHAR(50),
        source VARCHAR(100),
        facebook VARCHAR(255),
        customer_group VARCHAR(100),
        branch VARCHAR(100),
        area VARCHAR(100),
        ward VARCHAR(100),
        last_transaction DATE,
        debt_amount DECIMAL(12,2) DEFAULT 0,
        card_balance DECIMAL(12,2) DEFAULT 0,
        service_sessions INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        customer_type VARCHAR(50),
        created_by VARCHAR(100),
        created_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        employee_code VARCHAR(50) UNIQUE,
        position VARCHAR(100),
        base_salary DECIMAL(10,2) DEFAULT 0,
        commission_rate DECIMAL(5,2) DEFAULT 0,
        hire_date DATE,
        is_active BOOLEAN DEFAULT true,
        skills JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Shifts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        shift_id INTEGER REFERENCES shifts(id),
        work_date DATE,
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        employee_id INTEGER REFERENCES employees(id),
        service_id INTEGER REFERENCES services(id),
        appointment_date TIMESTAMP,
        duration INTEGER DEFAULT 60,
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE,
        customer_id INTEGER REFERENCES customers(id),
        employee_id INTEGER REFERENCES employees(id),
        subtotal DECIMAL(12,2) DEFAULT 0,
        discount_amount DECIMAL(12,2) DEFAULT 0,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending',
        invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoice items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id),
        service_id INTEGER REFERENCES services(id),
        employee_id INTEGER REFERENCES employees(id),
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        commission_amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payroll table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        pay_period_start DATE,
        pay_period_end DATE,
        base_salary DECIMAL(10,2) DEFAULT 0,
        commission_total DECIMAL(10,2) DEFAULT 0,
        bonus_amount DECIMAL(10,2) DEFAULT 0,
        deduction_amount DECIMAL(10,2) DEFAULT 0,
        gross_pay DECIMAL(10,2) DEFAULT 0,
        net_pay DECIMAL(10,2) DEFAULT 0,
        pay_status VARCHAR(20) DEFAULT 'pending',
        pay_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customer history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_history (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        invoice_id INTEGER REFERENCES invoices(id),
        service_name VARCHAR(255),
        employee_name VARCHAR(255),
        amount DECIMAL(10,2),
        visit_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ PostgreSQL tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, createTables };
