import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Container,
} from '@mui/material';
import {
  Restaurant,
  Person,
  Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: number;
  username: string;
  fullname: string;
  employee_code: string;
  position: string;
}

const POSLoginPage: React.FC = () => {
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
      // Import mock API for production
      const isProduction = process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL?.includes('localhost');
      
      let loginData, employeesData;
      
      if (isProduction) {
        // Use mock API in production
        const { mockAPI } = await import('../services/mockApi');
        const loginResponse = await mockAPI.login({ username, password });
        loginData = loginResponse.data;
        employeesData = await mockAPI.getEmployees();
      } else {
        // Use real API in development
        const loginResponse = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json();
          setError(errorData.error || 'Đăng nhập thất bại');
          setLoading(false);
          return;
        }

        loginData = await loginResponse.json();

        // Tìm thông tin nhân viên từ user_id
        const employeesResponse = await fetch('/api/employees');
        if (!employeesResponse.ok) {
          throw new Error('Không thể tải danh sách nhân viên');
        }

        employeesData = await employeesResponse.json();
      }

      const user = loginData.user;
      const employee = employeesData.find((emp: any) => emp.user_id === user.id);

      if (!employee) {
        setError('Không tìm thấy thông tin nhân viên');
        setLoading(false);
        return;
      }

      // Kiểm tra quyền truy cập POS
      const allowedPositions = ['owner', 'manager', 'chef', 'cook', 'waiter', 'cashier', 'bartender', 'host', 'cleaner', 'security'];
      
      if (!allowedPositions.includes(employee.position)) {
        setError('Bạn không có quyền truy cập hệ thống POS');
        setLoading(false);
        return;
      }

      // Tạo token đơn giản cho POS (trong thực tế nên có authentication phức tạp hơn)
      const posToken = btoa(JSON.stringify({
        employee_id: employee.id,
        username: employee.username,
        fullname: employee.fullname,
        employee_code: employee.employee_code,
        position: employee.position,
        type: 'pos'
      }));

      // Lưu token vào localStorage
      localStorage.setItem('pos_token', posToken);
      localStorage.setItem('pos_employee', JSON.stringify(employee));

      // Chuyển đến trang POS
      navigate('/buffet-tables');
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
              <Restaurant sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Restaurant POS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Đăng nhập để sử dụng hệ thống POS
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
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
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
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
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
                  'Đăng Nhập (Desktop)'
                )}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="large"
                sx={{ mb: 2, py: 1.5 }}
                onClick={() => navigate('/mobile-login')}
              >
                Đăng Nhập (Mobile)
              </Button>
            </form>

            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Hướng dẫn:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Sử dụng tên đăng nhập của nhân viên<br/>
                • Mật khẩu có thể để trống<br/>
                • Chỉ nhân viên nhà hàng mới có quyền truy cập<br/>
                • Thông tin nhân viên sẽ được ghi nhận trong hóa đơn
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default POSLoginPage;