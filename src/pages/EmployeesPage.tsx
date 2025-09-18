import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Person, Edit, Delete } from '@mui/icons-material';
import { employeeAPI } from '../services/api';
import { Employee } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    employee_code: '',
    position: '',
    department: '',
    base_salary: 0,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getEmployees();
      const apiData = response.data as any;
      setEmployees(apiData || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditingEmployee(null);
    setFormData({
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
      employee_code: '',
      position: '',
      department: '',
      base_salary: 0,
    });
  };

  const handleEdit = (employee: Employee) => {
    setEditMode(true);
    setEditingEmployee(employee);
    setFormData({
      username: employee.username || '',
      password: '', // Không hiển thị mật khẩu cũ
      fullname: employee.fullname || '',
      email: employee.email || '',
      phone: employee.phone || '',
      employee_code: employee.employee_code || '',
      position: employee.position || '',
      department: '',
      base_salary: employee.base_salary || 0,
    });
    setOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    alert('Chức năng xóa chỉ khả dụng trong phiên bản đầy đủ với backend');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'base_salary' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock implementation - just close dialog
    alert('Chức năng này chỉ khả dụng trong phiên bản đầy đủ với backend');
    handleClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Quản lý nhân viên</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
          Thêm nhân viên
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nhân viên</TableCell>
              <TableCell>Mã NV</TableCell>
              <TableCell>Chức vụ</TableCell>
              <TableCell>Lương cơ bản</TableCell>
              <TableCell>Hoa hồng</TableCell>
              <TableCell>Ngày vào làm</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.fullname} />
                      ) : (
                        <Person />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{employee.fullname}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.email}
                      </Typography>
                      {employee.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {employee.phone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{employee.employee_code}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{formatCurrency(employee.base_salary)}</TableCell>
                <TableCell>{employee.commission_rate}%</TableCell>
                <TableCell>{formatDate(employee.hire_date)}</TableCell>
                <TableCell>
                  <Chip
                    label={employee.is_active ? 'Đang làm việc' : 'Nghỉ việc'}
                    color={employee.is_active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(employee)}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(employee)}
                    >
                      Xóa
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog thêm nhân viên */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editMode ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Tên đăng nhập"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label={editMode ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editMode}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Họ và tên"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                required
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Mã nhân viên"
                  name="employee_code"
                  value={formData.employee_code}
                  onChange={handleChange}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Chức vụ</InputLabel>
                  <Select
                    name="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    label="Chức vụ"
                  >
                    <MenuItem value="owner">Chủ quán</MenuItem>
                    <MenuItem value="manager">Quản lý</MenuItem>
                    <MenuItem value="chef">Bếp trưởng</MenuItem>
                    <MenuItem value="cook">Đầu bếp</MenuItem>
                    <MenuItem value="waiter">Phục vụ</MenuItem>
                    <MenuItem value="cashier">Thu ngân</MenuItem>
                    <MenuItem value="bartender">Pha chế</MenuItem>
                    <MenuItem value="host">Lễ tân</MenuItem>
                    <MenuItem value="cleaner">Tạp vụ</MenuItem>
                    <MenuItem value="security">Bảo vệ</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Phòng ban</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    label="Phòng ban"
                  >
                    <MenuItem value="spa">Spa</MenuItem>
                    <MenuItem value="reception">Lễ tân</MenuItem>
                    <MenuItem value="management">Quản lý</MenuItem>
                    <MenuItem value="maintenance">Bảo trì</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Lương cơ bản (VNĐ)"
                  name="base_salary"
                  type="number"
                  value={formData.base_salary}
                  onChange={handleChange}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="submit" variant="contained">
              {editMode ? 'Cập nhật' : 'Thêm nhân viên'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;
