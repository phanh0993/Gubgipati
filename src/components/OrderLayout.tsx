import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Logout, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface OrderLayoutProps {
  children: React.ReactNode;
}

const OrderLayout: React.FC<OrderLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <AppBar position="static" sx={{ bgcolor: '#4caf50' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img
              src="/logo.jpg"
              alt="GUBGIPATI"
              style={{ height: 40, marginRight: 16 }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              GUBGIPATI - POS System
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleGoHome}
              title="Về trang chính"
            >
              <Home />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
};

export default OrderLayout;
