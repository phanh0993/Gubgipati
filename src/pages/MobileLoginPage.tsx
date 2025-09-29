import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Container,
  InputAdornment,
} from '@mui/material';
import {
  Restaurant,
  Person,
  Lock,
  PhoneAndroid,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: number;
  username: string;
  fullname: string;
  employee_code: string;
  position: string;
}

const MobileLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use Supabase employee API for mobile login
      console.log('Mobile login attempt:', { username, password });
      const { employeeAPI } = await import('../services/api');
      const loginResponse = await employeeAPI.mobileLogin({ username, password });
      const loginData = loginResponse.data;
      
      // Lưu thông tin user vào localStorage
      localStorage.setItem('pos_employee', JSON.stringify(loginData.user));
      
      console.log('✅ Mobile login successful, redirecting...');
      
      // Force reload để trigger AuthContext re-check
      setTimeout(() => {
        window.location.href = '/mobile-tables';
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ maxWidth: 400, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <PhoneAndroid sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Mobile POS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Đăng nhập để sử dụng hệ thống POS trên điện thoại
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />

              <TextField
                fullWidth
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Đăng Nhập Mobile'
                )}
              </Button>
            </form>

            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Hướng dẫn Mobile:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Sử dụng tên đăng nhập của nhân viên<br/>
                • Mật khẩu có thể để trống<br/>
                • Giao diện tối ưu cho điện thoại<br/>
                • Chỉ nhân viên nhà hàng mới có quyền truy cập<br/>
                • Thông tin nhân viên sẽ được ghi nhận trong hóa đơn
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/pos-login')}
                sx={{ fontSize: '0.875rem' }}
              >
                ← Quay về Desktop Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default MobileLoginPage;
