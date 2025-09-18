import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, MedicalServices } from '@mui/icons-material';
import { servicesAPI } from '../services/api';
import { Service } from '../types';
import { formatCurrency } from '../utils/formatters';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 0,
    category: '',
    commission_rate: 0,
    is_active: true,
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      const apiData = response.data as any;
      setServices(apiData.services || apiData || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpen = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price,
        duration: service.duration,
        category: service.category || '',
        commission_rate: service.commission_rate || 0,
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 0,
        category: '',
        commission_rate: 0,
        is_active: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: 0,
      category: '',
      commission_rate: 0,
      is_active: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await servicesAPI.update(editingService.id, formData);
      } else {
        await servicesAPI.create(formData);
      }
      await fetchServices();
      handleClose();
    } catch (error) {
      console.error('Error saving service:', error);
      setError(editingService ? 'Không thể cập nhật dịch vụ' : 'Không thể tạo dịch vụ mới');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await servicesAPI.delete(id);
        await fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        setError('Không thể xóa dịch vụ');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MedicalServices sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Quản lý dịch vụ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Thêm dịch vụ
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên dịch vụ</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell align="right">Giá</TableCell>
              <TableCell align="right">Thời gian</TableCell>
              <TableCell align="right">Hoa hồng</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length > 0 ? (
              services.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {service.name}
                      </Typography>
                      {service.description && (
                        <Typography variant="body2" color="text.secondary">
                          {service.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{service.category || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(service.price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{service.duration} phút</TableCell>
                  <TableCell align="right">{service.commission_rate || 0}%</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: service.is_active ? 'success.light' : 'grey.300',
                        color: service.is_active ? 'success.dark' : 'grey.600',
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        textAlign: 'center',
                        minWidth: 80,
                      }}
                    >
                      {service.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(service)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(service.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    Chưa có dịch vụ nào được tạo
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Tên dịch vụ"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Giá (VNĐ)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Thời gian (phút)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Danh mục"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  label="Tỷ lệ hoa hồng (%)"
                  name="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="submit" variant="contained">
              {editingService ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ServicesPage;