import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Restaurant, Lock, Person } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';

const LoginPage: React.FC = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeCode || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const success = await login(employeeCode, password);
    if (!success) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              textAlign: 'center',
              py: 4,
            }}
          >
            <Restaurant sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              JULY POS
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Hệ Thống Bán Hàng
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" textAlign="center" mb={3}>
              Đăng Nhập
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Mã nhân viên"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)',
                  },
                }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Đăng Nhập'
                )}
              </Button>
            </Box>

            <Typography variant="body2" textAlign="center" color="text.secondary" mt={2}>
              Chỉ dành cho nhân viên có quyền truy cập POS
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;

