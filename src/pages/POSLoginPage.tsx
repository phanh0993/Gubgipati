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
import { supabase } from '../services/supabaseClient';

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
      console.log('POS login attempt:', { username, password });
      
      // Chuyển username về lowercase để tìm (vì username trong DB là lowercase)
      const usernameLower = username.toLowerCase();
      
      // Tìm user từ users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', usernameLower)
        .limit(1);

      if (userError) {
        console.error('Supabase query error:', userError);
        setError('Lỗi đăng nhập');
        setLoading(false);
        return;
      }

      if (!users || users.length === 0) {
        console.log('User not found:', username);
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setLoading(false);
        return;
      }

      const user = users[0];

      // Check password (plain text comparison)
      if (user.password !== password) {
        console.log('Password mismatch');
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        setLoading(false);
        return;
      }

      // Chỉ cho phép manager đăng nhập POS trên PC
      if (user.role !== 'manager') {
        if (user.role === 'staff') {
          setError('Nhân viên (staff) không có quyền truy cập POS trên PC. Vui lòng sử dụng Mobile Login.');
        } else {
          setError('Chỉ Trưởng ca (manager) mới có quyền truy cập hệ thống POS trên PC');
        }
        setLoading(false);
        return;
      }

      // Tìm employee từ employees table
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (empError || !employees || employees.length === 0) {
        console.error('Employee not found for user:', user.id);
        setError('Không tìm thấy thông tin nhân viên');
        setLoading(false);
        return;
      }

      const employee = employees[0];

      // Check is_active
      if (employee.is_active === false) {
        console.log('Employee inactive:', username);
        setError('Tài khoản đã bị vô hiệu hóa');
        setLoading(false);
        return;
      }

      // Tạo token đơn giản cho POS
      // Dùng encodeURIComponent để xử lý ký tự tiếng Việt trước khi btoa
      const tokenData = {
        employee_id: employee.id,
        user_id: user.id,
        username: user.username,
        fullname: employee.fullname || employee.full_name,
        employee_code: employee.employee_code,
        position: employee.position,
        role: user.role,
        type: 'pos'
      };
      
      // Encode an toàn cho ký tự tiếng Việt
      const jsonString = JSON.stringify(tokenData);
      const posToken = btoa(encodeURIComponent(jsonString));

      // Lưu token và employee vào localStorage
      localStorage.setItem('pos_token', posToken);
      localStorage.setItem('pos_employee', JSON.stringify({
        ...employee,
        role: user.role,
        username: user.username
      }));

      console.log('✅ POS login successful for:', employee.fullname || employee.full_name);
      
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
                  'Đăng Nhập'
                )}
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