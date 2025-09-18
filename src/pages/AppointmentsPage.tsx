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
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { appointmentsAPI } from '../services/api';
import { Appointment } from '../types';
import { formatDateTime, formatCurrency, getStatusColor } from '../utils/formatters';

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await appointmentsAPI.getAll({
        start_date: today,
        limit: 50,
        offset: 0,
      });
      setAppointments(response.data.appointments);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: 'Đã đặt lịch',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
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
        <Typography variant="h4">Quản lý lịch hẹn</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Đặt lịch mới
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
              <TableCell>Khách hàng</TableCell>
              <TableCell>Dịch vụ</TableCell>
              <TableCell>Nhân viên</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id} hover>
                <TableCell>
                  <Typography variant="body1">
                    {appointment.customer_name || 'Khách lẻ'}
                  </Typography>
                  {appointment.customer_phone && (
                    <Typography variant="body2" color="text.secondary">
                      {appointment.customer_phone}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body1">{appointment.service_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {appointment.service_duration} phút
                  </Typography>
                </TableCell>
                <TableCell>
                  {appointment.employee_name || 'Chưa chỉ định'}
                </TableCell>
                <TableCell>
                  {formatDateTime(appointment.appointment_date)}
                </TableCell>
                <TableCell>
                  {formatCurrency(appointment.service_price)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(appointment.status)}
                    color={getStatusColor(appointment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                    {appointment.notes || '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AppointmentsPage;
