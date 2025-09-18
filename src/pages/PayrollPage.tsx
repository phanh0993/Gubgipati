import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material';
import { AccountBalance, Person, Receipt, ExpandMore, AccessTime, Add, Delete } from '@mui/icons-material';
import { employeeAPI, payrollAPI } from '../services/api';
import { Employee } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface EmployeePayroll {
  employee: Employee;
  baseSalary: number;
  invoices: any[];
  totalCommission: number;
  totalOvertimeAmount: number;
  totalSalary: number;
  overtime_records: any[];
  period: string;
}

const PayrollPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [payrollData, setPayrollData] = useState<EmployeePayroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Overtime dialog states
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    notes: ''
  });
  const [overtimeLoading, setOvertimeLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeePayroll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, selectedMonth]);

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

  const loadEmployeePayroll = async () => {
    if (!selectedEmployeeId) return;
    
    try {
      setLoadingPayroll(true);
      setError(''); // Clear previous errors
      
      console.log('🔍 Loading payroll for employee:', selectedEmployeeId, 'month:', selectedMonth);
      
      // Try to use mock API first
      try {
        const response = await payrollAPI.getPayroll();
        const data = response.data;
        
        console.log('📊 Payroll data received from API:', data);

        // Find employee data
        const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
        if (!selectedEmployee) {
          throw new Error('Employee not found');
        }

        // Find payroll record for this employee
        const payrollRecord = data.find((record: any) => record.employee_id === selectedEmployeeId);
        
        setPayrollData({
          employee: selectedEmployee,
          baseSalary: payrollRecord?.base_salary || selectedEmployee.base_salary || 0,
          invoices: [],
          totalCommission: (payrollRecord?.commission_total ?? payrollRecord?.bonus_amount ?? 0),
          totalOvertimeAmount: 0,
          totalSalary: (
            (
              payrollRecord?.net_pay ??
              payrollRecord?.gross_pay ??
              (
                (payrollRecord?.base_salary || 0) +
                (payrollRecord?.commission_total || 0) +
                (0) -
                (payrollRecord?.deductions || 0)
              )
            ) ?? (selectedEmployee.base_salary || 0)
          ),
          overtime_records: [],
          period: selectedMonth
        });
        
        return; // Success with API
      } catch (apiError) {
        console.error('❌ API failed:', apiError);
        // Set fallback data instead of throwing error
        const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
        if (selectedEmployee) {
          setPayrollData({
            employee: selectedEmployee,
            invoices: [],
            baseSalary: selectedEmployee.base_salary || 0,
            totalCommission: 0,
            totalOvertimeAmount: 0,
            totalSalary: selectedEmployee.base_salary || 0,
            overtime_records: [],
            period: selectedMonth
          });
          setError('Không thể tải dữ liệu từ server. Hiển thị dữ liệu cơ bản.');
        } else {
          throw apiError; // Only throw if we can't find employee
        }
      }

    } catch (err: any) {
      console.error('❌ Error loading payroll:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Không thể tải thông tin lương';
      setError(errorMessage);
      // Don't crash - just show error
      setPayrollData(null);
    } finally {
      setLoadingPayroll(false);
    }
  };

  const handleAddOvertime = async () => {
    if (!selectedEmployeeId || !overtimeForm.hours || parseFloat(overtimeForm.hours) <= 0) {
      alert('Vui lòng nhập số giờ tăng ca hợp lệ');
      return;
    }

    setOvertimeLoading(true);
    try {
      await overtimeAPI.addOvertimeRecord({
        employee_id: selectedEmployeeId as number,
        date: overtimeForm.date,
        hours: parseFloat(overtimeForm.hours),
        notes: overtimeForm.notes
      });

      // Reset form
      setOvertimeForm({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        notes: ''
      });
      setOvertimeDialogOpen(false);

      // Reload payroll data
      await loadEmployeePayroll();
      
      alert('Đã thêm giờ tăng ca thành công!');
    } catch (error) {
      console.error('Error adding overtime:', error);
      alert('Có lỗi xảy ra khi thêm giờ tăng ca');
    } finally {
      setOvertimeLoading(false);
    }
  };

  const handleDeleteOvertime = async (overtimeId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi tăng ca này?')) {
      return;
    }

    try {
      await overtimeAPI.deleteOvertimeRecord(overtimeId);
      await loadEmployeePayroll();
      alert('Đã xóa bản ghi tăng ca thành công!');
    } catch (error) {
      console.error('Error deleting overtime:', error);
      alert('Có lỗi xảy ra khi xóa bản ghi tăng ca');
    }
  };

  const getMonthYearText = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `Tháng ${month}/${year}`;
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
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance />
          Quản lý lương nhân viên
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Employee & Month Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Chọn nhân viên và tháng
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Chọn nhân viên</InputLabel>
              <Select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value as number)}
                label="Chọn nhân viên"
              >
                <MenuItem value="">-- Chọn nhân viên --</MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" />
                      {employee.fullname || employee.username} - {employee.employee_code}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="month"
              label="Chọn tháng"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Payroll Details */}
      {selectedEmployeeId && (
        <>
          {loadingPayroll ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : payrollData ? (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Nhân viên
                      </Typography>
                      <Typography variant="h6">
                        {payrollData?.employee?.fullname || payrollData?.employee?.username || 'Nhân viên'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {payrollData?.employee?.employee_code || 'N/A'} - {payrollData?.employee?.position || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Lương cơ bản
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(payrollData?.baseSalary || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getMonthYearText(payrollData?.period || selectedMonth)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Tổng hoa hồng
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {formatCurrency(payrollData?.totalCommission || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Từ {payrollData?.invoices?.length || 0} hóa đơn
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card 
                    sx={{ 
                      bgcolor: 'warning.light', 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'warning.main' }
                    }}
                    onClick={() => setOvertimeDialogOpen(true)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime />
                        <Typography color="text.secondary" gutterBottom>
                          Lương tăng ca
                        </Typography>
                      </Box>
                      <Typography variant="h5" color="warning.dark">
                        {formatCurrency(payrollData?.totalOvertimeAmount || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {payrollData?.overtime_records?.length || 0} bản ghi
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <CardContent>
                      <Typography gutterBottom sx={{ color: 'inherit' }}>
                        Tổng lương nhận
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'inherit' }}>
                        {formatCurrency(payrollData?.totalSalary || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.8 }}>
                        Cơ bản + Hoa hồng + Tăng ca
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Invoice Details */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt />
                    Chi tiết hóa đơn và hoa hồng ({(payrollData?.invoices?.length || 0)} hóa đơn)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {payrollData?.invoices && payrollData.invoices.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Mã HĐ</TableCell>
                            <TableCell>Ngày</TableCell>
                            <TableCell>Khách hàng</TableCell>
                            <TableCell>Dịch vụ</TableCell>
                            <TableCell align="right">Giá trị HĐ</TableCell>
                            <TableCell align="right">Hoa hồng</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payrollData.invoices.map((invoice, index) => {
                            // Safe rendering with fallbacks
                            const invoiceNumber = invoice?.invoice_number || `HĐ-${index + 1}`;
                            const createdAt = invoice?.created_at || new Date().toISOString();
                            const customerName = invoice?.customer_name || 'Khách hàng';
                            const customerPhone = invoice?.customer_phone || '';
                            const totalAmount = parseFloat(invoice?.total_amount || 0);
                            const employeeCommission = parseFloat(invoice?.employee_commission || 0);
                            const items = Array.isArray(invoice?.items) ? invoice.items : [];
                            
                            return (
                              <TableRow key={invoice?.id || index} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold">
                                    {invoiceNumber}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {formatDate(createdAt)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {customerName}
                                  </Typography>
                                  {customerPhone && (
                                    <Typography variant="caption" color="text.secondary">
                                      {customerPhone}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    {items.length > 0 ? (
                                      items.map((item: any, idx: number) => (
                                        <Typography key={idx} variant="body2">
                                          {item?.service_name || 'Dịch vụ'} x{item?.quantity || 1}
                                        </Typography>
                                      ))
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        Không có dịch vụ
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(totalAmount)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold" color="success.main">
                                    {formatCurrency(employeeCommission)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Total Row */}
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell colSpan={4}>
                              <Typography variant="h6" fontWeight="bold">
                                Tổng cộng
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="h6" fontWeight="bold">
                                {formatCurrency(payrollData?.invoices?.reduce((sum, inv) => sum + parseFloat(inv?.total_amount || 0), 0) || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="h6" fontWeight="bold" color="success.main">
                                {formatCurrency(payrollData?.totalCommission || 0)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">
                        Không có hóa đơn nào trong {getMonthYearText(selectedMonth)}
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Chọn nhân viên để xem thông tin lương
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* Overtime Dialog */}
      <Dialog 
        open={overtimeDialogOpen} 
        onClose={() => setOvertimeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AccessTime />
            Quản lý tăng ca - {payrollData?.employee?.fullname}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thêm giờ tăng ca
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Ngày tăng ca"
                  type="date"
                  value={overtimeForm.date}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Số giờ tăng ca"
                  type="number"
                  value={overtimeForm.hours}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, hours: e.target.value })}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  onClick={handleAddOvertime}
                  disabled={overtimeLoading}
                  startIcon={<Add />}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  {overtimeLoading ? 'Đang thêm...' : 'Thêm'}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi chú (tùy chọn)"
                  value={overtimeForm.notes}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, notes: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Danh sách tăng ca tháng {getMonthYearText(selectedMonth)}
          </Typography>
          
          {payrollData?.overtime_records && payrollData.overtime_records.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell align="center">Số giờ</TableCell>
                    <TableCell align="right">Lương/giờ</TableCell>
                    <TableCell align="right">Tổng tiền</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payrollData.overtime_records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Chip 
                          label={formatDate(record.date)} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {record.hours}h
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(record.hourly_rate)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="success.main">
                          {formatCurrency(record.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {record.notes || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteOvertime(record.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="h6">
                        Tổng cộng
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {formatCurrency(payrollData?.totalOvertimeAmount || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <AccessTime sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                Chưa có bản ghi tăng ca nào trong tháng này
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOvertimeDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollPage;