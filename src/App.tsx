import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// import { LocalizationProvider } from '@mui/x-date-pickers';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/vi';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MobileProtectedRoute from './components/MobileProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/NewDashboard';
import CustomersPage from './pages/CustomersPage';
import EmployeesPage from './pages/EmployeesPage';
import AppointmentsPage from './pages/AppointmentsPage';

import InvoicesPage from './pages/InvoicesPage';
import PayrollPage from './pages/PayrollPage';
import OrderPage from './pages/OrderPage';
import MainOrderPage from './pages/MainOrderPage';
import ImportPage from './pages/ImportPage';

// Restaurant Management Pages
import TableManagementPage from './pages/TableManagementPage';
import SimpleTableManagement from './pages/SimpleTableManagement';
import InventoryManagementPage from './pages/InventoryManagementPage';
import FoodManagementPage from './pages/FoodManagementPage';
import POSLoginPage from './pages/POSLoginPage';
import BuffetTableSelection from './pages/BuffetTableSelection';
import BuffetFoodManagement from './pages/BuffetFoodManagement';
import SimpleBuffetPOS from './pages/SimpleBuffetPOS';
import MobileTablesPage from './pages/MobileTablesPage';
import MobileMenuPage from './pages/MobileMenuPage';
import MobileBillPage from './pages/MobileBillPage';
import MobileLoginPage from './pages/MobileLoginPage';
import MobileInvoicesPage from './pages/MobileInvoicesPage';
import MobileOrderDetailsPage from './pages/MobileOrderDetailsPage';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi"> */}
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/setup" element={<SetupPage />} />
              
              {/* POS Routes - No Layout */}
              <Route path="/pos-login" element={<POSLoginPage />} />
              <Route path="/mobile-login" element={<MobileLoginPage />} />
              <Route 
                path="/buffet-tables" 
                element={
                  <ProtectedRoute>
                    <BuffetTableSelection />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buffet-menu" 
                element={
                  <ProtectedRoute>
                    <SimpleBuffetPOS />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buffet-food-management" 
                element={
                  <ProtectedRoute>
                    <BuffetFoodManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* Mobile Routes - No Layout */}
              <Route 
                path="/mobile-tables" 
                element={
                  <MobileProtectedRoute>
                    <MobileTablesPage />
                  </MobileProtectedRoute>
                } 
              />
              <Route 
                path="/mobile-menu" 
                element={
                  <MobileProtectedRoute>
                    <MobileMenuPage />
                  </MobileProtectedRoute>
                } 
              />
        <Route
          path="/mobile-bill"
          element={
            <MobileProtectedRoute>
              <MobileBillPage />
            </MobileProtectedRoute>
          }
        />
        <Route
          path="/mobile-invoices"
          element={
            <MobileProtectedRoute>
              <MobileInvoicesPage />
            </MobileProtectedRoute>
          }
        />
        <Route
          path="/mobile-order-details/:orderId"
          element={
            <MobileProtectedRoute>
              <MobileOrderDetailsPage />
            </MobileProtectedRoute>
          }
        />
              
              {/* Standalone Order Page - No sidebar - Temporarily disable auth */}
              <Route 
                path="/main/order" 
                element={<MainOrderPage />}
              />
              
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/order" element={<OrderPage />} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/employees" element={<EmployeesPage />} />
                        <Route path="/appointments" element={<AppointmentsPage />} />

                        <Route path="/invoices" element={<InvoicesPage />} />
                        <Route path="/payroll" element={<PayrollPage />} />
                        <Route path="/import" element={<ImportPage />} />
                        
                  {/* Restaurant Management Routes */}
                  <Route path="/tables" element={<SimpleTableManagement />} />
                  <Route path="/inventory" element={<InventoryManagementPage />} />
                  <Route path="/food" element={<FoodManagementPage />} />
                  <Route path="/buffet-food" element={<BuffetFoodManagement />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      {/* </LocalizationProvider> */}
    </ThemeProvider>
  );
}

export default App;
