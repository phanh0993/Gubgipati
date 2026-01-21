const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/spa_management.db');
const db = new sqlite3.Database(dbPath);

// Khởi tạo các bảng
db.serialize(() => {
  // Bảng người dùng
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullname TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT DEFAULT 'employee',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng dịch vụ
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      duration INTEGER DEFAULT 60,
      category TEXT,
      commission_rate DECIMAL(5,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng khách hàng
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT,
      address TEXT,
      birthday DATE,
      gender TEXT,
      notes TEXT,
      loyalty_points INTEGER DEFAULT 0,
      total_spent DECIMAL(12,2) DEFAULT 0,
      last_visit DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng nhân viên
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      employee_code TEXT UNIQUE,
      position TEXT,
      base_salary DECIMAL(10,2) DEFAULT 0,
      commission_rate DECIMAL(5,2) DEFAULT 0,
      hire_date DATE,
      is_active BOOLEAN DEFAULT 1,
      skills TEXT, -- JSON array of service IDs
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Bảng ca làm việc
  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng lịch làm việc
  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      shift_id INTEGER,
      work_date DATE,
      status TEXT DEFAULT 'scheduled', -- scheduled, completed, absent
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (shift_id) REFERENCES shifts(id)
    )
  `);

  // Bảng đặt lịch
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      employee_id INTEGER,
      service_id INTEGER,
      appointment_date DATETIME,
      duration INTEGER DEFAULT 60,
      status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    )
  `);

  // Bảng hóa đơn
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE,
      customer_id INTEGER,
      employee_id INTEGER,
      subtotal DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) DEFAULT 0,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending', -- pending, paid, partial, refunded
      invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);

  // Bảng chi tiết hóa đơn
  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      service_id INTEGER,
      employee_id INTEGER,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2),
      total_price DECIMAL(10,2),
      commission_amount DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);

  // Bảng lương thưởng
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      pay_period_start DATE,
      pay_period_end DATE,
      base_salary DECIMAL(10,2) DEFAULT 0,
      commission_total DECIMAL(10,2) DEFAULT 0,
      bonus_amount DECIMAL(10,2) DEFAULT 0,
      deduction_amount DECIMAL(10,2) DEFAULT 0,
      gross_pay DECIMAL(10,2) DEFAULT 0,
      net_pay DECIMAL(10,2) DEFAULT 0,
      pay_status TEXT DEFAULT 'pending', -- pending, paid
      pay_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);

  // Bảng lịch sử khách hàng
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      invoice_id INTEGER,
      service_name TEXT,
      employee_name TEXT,
      amount DECIMAL(10,2),
      visit_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    )
  `);

  // Thêm dữ liệu mẫu
  console.log('Database tables created successfully!');
});

module.exports = db;
