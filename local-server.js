const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import API routes
const authRoutes = require('./api/auth/login');
const dashboardRoutes = require('./api/dashboard');
const invoicesRoutes = require('./api/invoices');
const customersRoutes = require('./api/customers');
const employeesRoutes = require('./api/employees');
const servicesRoutes = require('./api/services');
const payrollRoutes = require('./api/payroll');
const overtimeRoutes = require('./api/overtime');

// API Routes
app.use('/auth', (req, res, next) => {
  if (req.path === '/login') {
    return authRoutes(req, res);
  }
  next();
});

app.use('/dashboard', dashboardRoutes);
app.use('/invoices', invoicesRoutes);
app.use('/customers', customersRoutes);
app.use('/employees', employeesRoutes);
app.use('/services', servicesRoutes);
app.use('/payroll', payrollRoutes);
app.use('/overtime', overtimeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'JULY SPA API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JULY SPA API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

module.exports = app;