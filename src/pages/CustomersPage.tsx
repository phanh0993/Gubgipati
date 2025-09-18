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
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Search, Phone, Email, Edit, Delete } from '@mui/icons-material';
import { customersAPI } from '../services/api';
import { Customer } from '../types';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    address: '',
    birthday: '',
    gender: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll({
        search,
        limit: 200, // Tăng limit lên 200 để hiển thị nhiều khách hàng hơn
        offset: 0,
      });
      const apiData = response.data as any;
      setCustomers(apiData.customers || apiData || []);
      setTotal(apiData.total || 0);
    } catch (err: any) {
      console.error('Customers API error:', err);
      setError(err.response?.data?.error || 'Không thể tải danh sách khách hàng');
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
    setEditingCustomer(null);
    setFormData({
      fullname: '',
      phone: '',
      email: '',
      address: '',
      birthday: '',
      gender: '',
      notes: '',
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditMode(true);
    setEditingCustomer(customer);
    setFormData({
      fullname: customer.name || customer.fullname || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      birthday: customer.birthday || '',
      gender: customer.gender || '',
      notes: customer.notes || '',
    });
    setOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name || customer.fullname}"?`)) {
      try {
        await customersAPI.delete(customer.id);
        loadCustomers();
        setError('');
      } catch (err: any) {
        const errorData = err.response?.data;
        
        // Nếu khách hàng có lịch sử hóa đơn, hỏi có muốn xóa bắt buộc không
        if (errorData?.hasInvoices) {
          const forceDelete = window.confirm(
            `${errorData.error}\n\nLưu ý: Việc xóa khách hàng có lịch sử hóa đơn có thể ảnh hưởng đến báo cáo. Bạn có chắc chắn muốn tiếp tục?`
          );
          
          if (forceDelete) {
            try {
              await customersAPI.delete(customer.id, true); // force = true
              loadCustomers();
              setError('');
            } catch (forceErr: any) {
              setError(forceErr.response?.data?.error || 'Không thể xóa khách hàng');
            }
          }
        } else {
          setError(errorData?.error || 'Không thể xóa khách hàng');
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && editingCustomer) {
        // Update customer
        await customersAPI.update(editingCustomer.id, formData);
      } else {
        // Create new customer
        await customersAPI.create(formData);
      }
      handleClose();
      loadCustomers();
      setError('');
    } catch (err: any) {
      const errorData = err.response?.data;
      
      // Kiểm tra nếu là lỗi khách hàng đã tồn tại
      if (errorData?.existingCustomer) {
        const existing = errorData.existingCustomer;
        const useExisting = window.confirm(
          `${errorData.error}\n\nBạn có muốn sử dụng khách hàng đã có sẵn không?`
        );
        
        if (useExisting) {
          handleClose();
          // Có thể thêm logic để chọn khách hàng đã có trong danh sách
        }
      } else {
        setError(errorData?.error || `Không thể ${editMode ? 'cập nhật' : 'tạo'} khách hàng`);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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
        <Typography variant="h4">Quản lý khách hàng</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
          Thêm khách hàng
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm khách hàng theo tên, số điện thoại..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper>
        <Box p={2}>
          <Typography variant="body2" color="text.secondary">
            Tìm thấy {total} khách hàng
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên khách hàng</TableCell>
                <TableCell>Liên hệ</TableCell>
                <TableCell>Tổng chi tiêu</TableCell>
                <TableCell>Điểm tích lũy</TableCell>
                <TableCell>Lần cuối</TableCell>
                <TableCell>Ngày tham gia</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Typography variant="body1">{customer.name || customer.fullname}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {customer.phone && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Phone fontSize="small" />
                          <Typography variant="body2">
                            {formatPhone(customer.phone)}
                          </Typography>
                        </Box>
                      )}
                      {customer.email && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Email fontSize="small" />
                          <Typography variant="body2">{customer.email}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" color="primary">
                      {formatCurrency(customer.total_spent)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${customer.loyalty_points} điểm`}
                      color={customer.loyalty_points > 100 ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {customer.last_visit ? formatDate(customer.last_visit) : 'Chưa có'}
                  </TableCell>
                  <TableCell>{formatDate(customer.created_at)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEdit(customer)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDelete(customer)}
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
      </Paper>

      {/* Dialog thêm khách hàng */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editMode ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                  label="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Địa chỉ"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Ngày sinh"
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    label="Giới tính"
                  >
                    <MenuItem value="male">Nam</MenuItem>
                    <MenuItem value="female">Nữ</MenuItem>
                    <MenuItem value="other">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <TextField
                fullWidth
                label="Ghi chú"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Ghi chú về khách hàng, sở thích, yêu cầu đặc biệt..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="submit" variant="contained">
              {editMode ? 'Cập nhật' : 'Thêm khách hàng'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;
