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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  TextField,
  Grid,
  Card,
  CardContent,
  Skeleton,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Visibility, Close, CalendarToday, Clear, Edit, Delete, Warning } from '@mui/icons-material';
import { invoicesAPI } from '../services/api';
import { Invoice, InvoiceFilters } from '../types';
import { formatCurrency, formatDateTime, getStatusColor } from '../utils/formatters';

interface InvoiceDetail {
  invoice: Invoice;
  items: any[];
}

// Loading Skeleton Component
const InvoicesTableSkeleton: React.FC = () => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Số hóa đơn</TableCell>
          <TableCell>Khách hàng</TableCell>
          <TableCell>Nhân viên</TableCell>
          <TableCell>Dịch vụ</TableCell>
          <TableCell>Ghi chú</TableCell>
          <TableCell>Tổng tiền</TableCell>
          <TableCell>Phương thức TT</TableCell>
          <TableCell>Trạng thái</TableCell>
          <TableCell>Ngày tạo</TableCell>
          <TableCell>Thao tác</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
          <TableRow key={row}>
            <TableCell><Skeleton variant="text" width={100} /></TableCell>
            <TableCell>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={80} />
            </TableCell>
            <TableCell><Skeleton variant="text" width={100} /></TableCell>
            <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
            <TableCell><Skeleton variant="text" width={80} /></TableCell>
            <TableCell><Skeleton variant="text" width={90} /></TableCell>
            <TableCell><Skeleton variant="text" width={60} /></TableCell>
            <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
            <TableCell><Skeleton variant="text" width={120} /></TableCell>
            <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Statistics Cards Skeleton
const StatisticsCardsSkeleton: React.FC = () => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4, 5].map((card) => (
      <Grid item xs={12} sm={6} md={2.4} key={card}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Skeleton variant="text" width={100} height={20} sx={{ mx: 'auto' }} />
            <Skeleton variant="text" width={80} height={48} sx={{ mx: 'auto' }} />
            <Skeleton variant="text" width={60} height={16} sx={{ mx: 'auto' }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Date filter states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalPaidInvoices, setTotalPaidInvoices] = useState<number>(0);
  const [totalAllInvoices, setTotalAllInvoices] = useState<number>(0); // All invoices (paid + unpaid)
  
  // Edit/Delete Invoice States
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editFormData, setEditFormData] = useState<{
    payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | '';
    payment_method: string;
    notes: string;
  }>({
    payment_status: '',
    payment_method: '',
    notes: '',
  });

  useEffect(() => {
    loadInvoices();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Lấy dữ liệu qua service layer (tự động dùng Supabase trên Vercel)
      const { data } = await invoicesAPI.getAll({ limit: 50, offset: 0 } as InvoiceFilters);
      const invoicesData = (data as any)?.invoices || [];
      
      
      setInvoices(invoicesData);
      setTotal(invoicesData.length);
      
      // Calculate summary statistics - FIXED: Handle string to number conversion
      const paidInvoices = invoicesData.filter((inv: Invoice) => inv.payment_status === 'paid');
      
      // Doanh thu thực = tổng tiền các hóa đơn đã thanh toán (FIXED: convert string to number)
      const paidRevenue = paidInvoices.reduce((sum: number, inv: Invoice) => {
        const amount = Number(inv.total_amount) || 0; // Convert string to number
        return sum + amount;
      }, 0);
      
      // Tổng giá trị = cộng tổng cột total_amount của TẤT CẢ hóa đơn đã lọc (FIXED: convert string to number)
      const totalValue = invoicesData.reduce((sum: number, inv: Invoice) => {
        const amount = Number(inv.total_amount) || 0; // Convert string to number
        return sum + amount;
      }, 0);
      
      setTotalPaidInvoices(paidInvoices.length);
      setTotalRevenue(paidRevenue);
      setTotalAllInvoices(totalValue);
      
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.response?.data?.error || 'Không thể tải danh sách hóa đơn');
      // Set fallback data
      setInvoices([]);
      setTotal(0);
      setTotalRevenue(0);
      setTotalPaidInvoices(0);
      setTotalAllInvoices(0);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      partial: 'Thanh toán một phần',
      refunded: 'Đã hoàn tiền',
    };
    return statusMap[status] || status;
  };

  const handleViewDetail = async (invoiceId: number) => {
    try {
      setLoadingDetail(true);
      const response = await invoicesAPI.getById(invoiceId);
      setSelectedInvoice(response.data);
      setDetailDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải chi tiết hóa đơn');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleClearFilter = () => {
    setSelectedDate('');
  };

  // Edit Invoice Handlers
  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditFormData({
      payment_status: invoice.payment_status || '',
      payment_method: invoice.payment_method || '',
      notes: invoice.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingInvoice(null);
    setEditFormData({
      payment_status: '',
      payment_method: '',
      notes: '',
    });
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async () => {
    if (!editingInvoice) return;
    
    try {
      setError('');
      
      // Prepare update data, filter out empty values
      const updateData: Partial<Invoice> = {};
      if (editFormData.payment_status !== '') {
        updateData.payment_status = editFormData.payment_status as 'pending' | 'paid' | 'partial' | 'refunded';
      }
      if (editFormData.payment_method) {
        updateData.payment_method = editFormData.payment_method;
      }
      if (editFormData.notes !== undefined) {
        updateData.notes = editFormData.notes;
      }
      
      await invoicesAPI.update(editingInvoice.id, updateData);
      handleEditClose();
      loadInvoices(); // Reload to show updated data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể cập nhật hóa đơn');
    }
  };

  // Delete Invoice Handlers
  const handleDeleteInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setEditingInvoice(null);
  };

  const handleDeleteConfirm = async () => {
    if (!editingInvoice) return;
    
    try {
      setError('');
      await invoicesAPI.delete(editingInvoice.id);
      handleDeleteClose();
      loadInvoices(); // Reload to show updated list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể xóa hóa đơn');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Quản lý hóa đơn</Typography>
          <Button variant="contained" startIcon={<Add />} disabled>
            Tạo hóa đơn
          </Button>
        </Box>

        {/* Loading Progress */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            ⚡ Đang tải dữ liệu hóa đơn...
          </Typography>
        </Paper>

        {/* Statistics Cards Skeleton */}
        {selectedDate && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              📊 Thống kê ngày <Skeleton variant="text" width={200} sx={{ display: 'inline-block' }} />
            </Typography>
            <StatisticsCardsSkeleton />
          </Paper>
        )}

        {/* Table Skeleton */}
        <Paper>
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              <Skeleton variant="text" width={300} />
            </Typography>
          </Box>
          <InvoicesTableSkeleton />
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Quản lý hóa đơn</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Tạo hóa đơn
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Date Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday />
          Lọc hóa đơn theo ngày
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Chọn ngày"
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              helperText={selectedDate ? `Hiển thị hóa đơn ngày ${formatDate(selectedDate)}` : 'Chọn ngày để lọc hóa đơn'}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClearFilter}
              disabled={!selectedDate}
              fullWidth
            >
              Xóa lọc
            </Button>
          </Grid>
        </Grid>

        {/* Summary Statistics */}
        {selectedDate && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              📊 Thống kê ngày {formatDate(selectedDate)}
              {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'inherit', opacity: 0.8 }}>
                      Tổng hóa đơn
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'inherit', fontWeight: 'bold' }}>
                      {total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}>
                      hóa đơn
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'inherit', opacity: 0.8 }}>
                      Đã thanh toán
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'inherit', fontWeight: 'bold' }}>
                      {totalPaidInvoices}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}>
                      hóa đơn
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'inherit', opacity: 0.8 }}>
                      Chưa thanh toán
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'inherit', fontWeight: 'bold' }}>
                      {total - totalPaidInvoices}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}>
                      hóa đơn
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'inherit', opacity: 0.8 }}>
                      💰 Doanh thu thực
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'inherit', fontWeight: 'bold' }}>
                      {formatCurrency(totalRevenue)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}>
                      đã thu
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'inherit', opacity: 0.8 }}>
                      📈 Tổng giá trị HĐ
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'inherit', fontWeight: 'bold' }}>
                      {formatCurrency(totalAllInvoices)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}>
                      cộng tất cả
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Additional Summary Row */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      Trung bình/HĐ đã thanh toán
                    </Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {totalPaidInvoices > 0 ? formatCurrency(totalRevenue / totalPaidInvoices) : formatCurrency(0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      Tỷ lệ thanh toán
                    </Typography>
                    <Typography variant="h6" color="info.main" fontWeight="bold">
                      {total > 0 ? `${((totalPaidInvoices / total) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      Nợ cần thu
                    </Typography>
                    <Typography variant="h6" color="error.main" fontWeight="bold">
                      {formatCurrency(totalAllInvoices - totalRevenue)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      Trung bình tổng/HĐ
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {total > 0 ? formatCurrency(totalAllInvoices / total) : formatCurrency(0)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>

      <Paper>
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="body2" color="text.secondary">
              {selectedDate 
                ? `Hóa đơn ngày ${formatDate(selectedDate)}: ${total} hóa đơn`
                : `Tổng cộng ${total} hóa đơn (50 gần nhất)`
              }
            </Typography>
            {!selectedDate && (
              <Typography variant="body2" color="info.main" sx={{ fontStyle: 'italic' }}>
                💡 Chọn ngày cụ thể để xem thống kê chi tiết
              </Typography>
            )}
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Số hóa đơn</TableCell>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Nhân viên</TableCell>
                <TableCell>Dịch vụ</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell>Tổng tiền</TableCell>
                <TableCell>Phương thức TT</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Không có hóa đơn nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body1" color="primary">
                      {invoice.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {invoice.customer_name || 'Khách lẻ'}
                    </Typography>
                    {invoice.customer_phone && (
                      <Typography variant="body2" color="text.secondary">
                        {invoice.customer_phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.employee_name || '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      fontFamily: 'monospace', 
                      backgroundColor: '#f5f5f5', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {(invoice as any).dichvu || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontStyle: 'italic',
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      backgroundColor: (invoice as any).notes ? '#fff3cd' : 'transparent',
                      padding: (invoice as any).notes ? '2px 6px' : '0',
                      borderRadius: (invoice as any).notes ? '4px' : '0',
                      border: (invoice as any).notes ? '1px solid #ffeaa7' : 'none'
                    }}>
                      {(invoice as any).notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" color="primary">
                        {formatCurrency(invoice.total_amount)}
                      </Typography>
                      {invoice.discount_amount > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Giảm: {formatCurrency(invoice.discount_amount)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {invoice.payment_method || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPaymentStatusText(invoice.payment_status)}
                      color={getStatusColor(invoice.payment_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDateTime(invoice.invoice_date)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetail(invoice.id)}
                        disabled={loadingDetail}
                        title="Xem chi tiết"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        color="warning"
                        onClick={() => handleEditInvoice(invoice)}
                        title="Chỉnh sửa"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteInvoice(invoice)}
                        title="Xóa hóa đơn"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Invoice Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Chi tiết hóa đơn</Typography>
            <IconButton onClick={handleCloseDetail}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              {/* Invoice Header */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {selectedInvoice.invoice.invoice_number}
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography><strong>Khách hàng:</strong> {selectedInvoice.invoice.customer_name || 'Khách lẻ'}</Typography>
                  <Typography><strong>Nhân viên:</strong> {selectedInvoice.invoice.employee_name || '-'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography><strong>Ngày tạo:</strong> {formatDateTime(selectedInvoice.invoice.invoice_date)}</Typography>
                  <Chip
                    label={getPaymentStatusText(selectedInvoice.invoice.payment_status)}
                    color={getStatusColor(selectedInvoice.invoice.payment_status)}
                    size="small"
                  />
                </Box>
              </Paper>

              {/* Invoice Items */}
              <Typography variant="h6" gutterBottom>Dịch vụ đã thực hiện</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dịch vụ</TableCell>
                      <TableCell>Ghi chú</TableCell>
                      <TableCell>Nhân viên thực hiện</TableCell>
                      <TableCell align="center">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                      <TableCell align="right">Hoa hồng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.service_name}
                          </Typography>
                          {item.service_description && (
                            <Typography variant="caption" color="text.secondary">
                              {item.service_description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            fontStyle: 'italic',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            backgroundColor: (item as any).special_instructions ? '#fff3cd' : 'transparent',
                            padding: (item as any).special_instructions ? '4px 8px' : '0',
                            borderRadius: (item as any).special_instructions ? '4px' : '0',
                            border: (item as any).special_instructions ? '1px solid #ffeaa7' : 'none'
                          }}>
                            {(item as any).special_instructions || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.employee_name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(item.commission_amount || 0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Invoice Summary */}
              <Paper sx={{ p: 2, mt: 2, bgcolor: '#f9f9f9' }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Tạm tính:</Typography>
                  <Typography>{formatCurrency(selectedInvoice.invoice.subtotal || selectedInvoice.invoice.total_amount)}</Typography>
                </Box>
                {selectedInvoice.invoice.discount_amount > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Giảm giá:</Typography>
                    <Typography color="error">-{formatCurrency(selectedInvoice.invoice.discount_amount)}</Typography>
                  </Box>
                )}
                {selectedInvoice.invoice.tax_amount > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Thuế:</Typography>
                    <Typography>+{formatCurrency(selectedInvoice.invoice.tax_amount)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Tổng cộng:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(selectedInvoice.invoice.total_amount)}
                  </Typography>
                </Box>
              </Paper>

              {selectedInvoice.invoice.notes && (
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ghi chú:</strong> {selectedInvoice.invoice.notes}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1, color: 'warning.main' }} />
            Chỉnh sửa hóa đơn
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingInvoice && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* Invoice Info */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hóa đơn: {editingInvoice.invoice_number}
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(editingInvoice.total_amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingInvoice.customer_name} • {formatDateTime(editingInvoice.invoice_date)}
                </Typography>
              </Paper>

              {/* Edit Form */}
              <FormControl fullWidth>
                <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                  value={editFormData.payment_status}
                  onChange={(e) => handleEditFormChange('payment_status', e.target.value)}
                  label="Trạng thái thanh toán"
                >
                  <MenuItem value="pending">Chờ thanh toán</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                  <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select
                  value={editFormData.payment_method}
                  onChange={(e) => handleEditFormChange('payment_method', e.target.value)}
                  label="Phương thức thanh toán"
                >
                  <MenuItem value="">Chọn phương thức</MenuItem>
                  <MenuItem value="cash">Tiền mặt</MenuItem>
                  <MenuItem value="card">Thẻ tín dụng</MenuItem>
                  <MenuItem value="bank_transfer">Chuyển khoản</MenuItem>
                  <MenuItem value="e_wallet">Ví điện tử</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={3}
                value={editFormData.notes}
                onChange={(e) => handleEditFormChange('notes', e.target.value)}
                placeholder="Ghi chú về hóa đơn..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleEditClose} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            startIcon={<Edit />}
            sx={{ minWidth: 120 }}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <Warning sx={{ mr: 1 }} />
            Xác nhận xóa hóa đơn
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingInvoice && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
              </Alert>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Bạn có chắc chắn muốn xóa hóa đơn này?
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Số hóa đơn:</strong> {editingInvoice.invoice_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Khách hàng:</strong> {editingInvoice.customer_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tổng tiền:</strong> {formatCurrency(editingInvoice.total_amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Ngày tạo:</strong> {formatDateTime(editingInvoice.invoice_date)}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleDeleteClose} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
            sx={{ minWidth: 120 }}
          >
            Xóa hóa đơn
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoicesPage;
