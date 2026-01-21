const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Use PostgreSQL for production, SQLite for development
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;
const db = isProduction ? require('./database-pg') : require('./database');
const { createTables } = isProduction ? require('./supabase') : { createTables: () => {} };

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const customerRoutes = require('./routes/customers');
const employeeRoutes = require('./routes/employees');
const appointmentRoutes = require('./routes/appointments');
const invoiceRoutes = require('./routes/invoices');
const payrollRoutes = require('./routes/payroll');
const importRoutes = require('./routes/import');
const { addCustomerFields } = require('./migrations/add_customer_fields');
const scheduleRoutes = require('./routes/schedules');
const dashboardRoutes = require('./routes/dashboard');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/import', importRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Spa Management API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database
const initializeDatabase = async () => {
  try {
    if (isProduction) {
      await createTables();
      console.log('✅ PostgreSQL database initialized');
    } else {
      // Run SQLite migrations for development
      setTimeout(() => {
        addCustomerFields();
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

// Initialize database
initializeDatabase();

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Database: ${isProduction ? 'PostgreSQL (Supabase)' : 'SQLite (Local)'}`);
  });
}

// Export app for Vercel
module.exports = app;
