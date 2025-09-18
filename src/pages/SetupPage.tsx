import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Link,
} from '@mui/material';
// import { MedicalServices } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const steps = ['Thông tin spa', 'Tài khoản admin'];

const SetupPage: React.FC = () => {
  const { login } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [businessData, setBusinessData] = useState({
    businessName: '',
    address: '',
    phone: '',
  });

  const [adminData, setAdminData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    email: '',
    phone: '',
  });

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessData({
      ...businessData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminData({
      ...adminData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate business data
      if (!businessData.businessName.trim() || !businessData.address.trim()) {
        setError('Vui lòng điền đầy đủ thông tin spa');
        return;
      }
    }
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminData.password !== adminData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (adminData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business: businessData,
          admin: {
            username: adminData.username,
            password: adminData.password,
            fullname: adminData.fullname,
            email: adminData.email,
            phone: adminData.phone,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Auto login after successful setup
        setTimeout(async () => {
          try {
            await login({ username: adminData.username, password: adminData.password });
          } catch (loginError) {
            console.error('Auto login failed:', loginError);
            // Redirect to login page if auto login fails
            window.location.href = '/login';
          }
        }, 2000);
      } else {
        setError(data.message || 'Có lỗi xảy ra khi thiết lập hệ thống');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Thông tin spa của bạn
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required
                fullWidth
                id="businessName"
                label="Tên spa"
                name="businessName"
                value={businessData.businessName}
                onChange={handleBusinessChange}
              />
              <TextField
                required
                fullWidth
                id="address"
                label="Địa chỉ"
                name="address"
                value={businessData.address}
                onChange={handleBusinessChange}
              />
              <TextField
                fullWidth
                id="phone"
                label="Số điện thoại"
                name="phone"
                value={businessData.phone}
                onChange={handleBusinessChange}
              />
            </Box>
          </>
        );
      case 1:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Tạo tài khoản quản trị viên
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required
                fullWidth
                id="username"
                label="Tên đăng nhập"
                name="username"
                value={adminData.username}
                onChange={handleAdminChange}
              />
              <TextField
                required
                fullWidth
                id="fullname"
                label="Họ và tên"
                name="fullname"
                value={adminData.fullname}
                onChange={handleAdminChange}
              />
              <TextField
                fullWidth
                id="email"
                label="Email"
                name="email"
                type="email"
                value={adminData.email}
                onChange={handleAdminChange}
              />
              <TextField
                fullWidth
                id="phone"
                label="Số điện thoại"
                name="phone"
                value={adminData.phone}
                onChange={handleAdminChange}
              />
              <TextField
                required
                fullWidth
                id="password"
                label="Mật khẩu"
                name="password"
                type="password"
                value={adminData.password}
                onChange={handleAdminChange}
              />
              <TextField
                required
                fullWidth
                id="confirmPassword"
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                value={adminData.confirmPassword}
                onChange={handleAdminChange}
              />
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: 600,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
              <img 
                src="/logo.jpg" 
                alt="GUBGIPATI" 
                style={{ width: 50, height: 50, borderRadius: '50%', marginRight: 16 }}
              />
              <Typography component="h1" variant="h4" color="primary">
                Thiết lập GUBGIPATI
              </Typography>
            </Box>
            
            <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thiết lập thành công!
              </Typography>
              <Typography variant="body2">
                Hệ thống đã được thiết lập thành công. Bạn sẽ được chuyển hướng đến trang chính trong giây lát...
              </Typography>
            </Alert>
            
            <CircularProgress sx={{ mt: 2 }} />
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 600,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
            <img 
              src="/logo.jpg" 
              alt="GUBGIPATI" 
              style={{ width: 50, height: 50, borderRadius: '50%', marginRight: 16 }}
            />
            <Typography component="h1" variant="h4" color="primary">
              Thiết lập GUBGIPATI
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Quay lại
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Hoàn tất thiết lập'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Tiếp theo
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            Bạn đã có tài khoản?{' '}
            <Link href="/login" variant="body2">
              Đăng nhập ngay
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default SetupPage;