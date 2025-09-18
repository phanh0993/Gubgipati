import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import {
  TrendingUp,
  Receipt,
  People,
  CalendarToday,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color, fontSize: 40 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

interface DashboardOverview {
  stats: {
    today: {
      revenue: number;
      invoices: number;
      customers: number;
      appointments: number;
    };
    totals: {
      customers: number;
      employees: number;
      services: number;
      monthlyRevenue: number;
    };
  };
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  employeePerformance: Array<{
    name: string;
    revenue: number;
    appointments: number;
  }>;
  todayAppointments: Array<{
    time: string;
    customer: string;
    service: string;
    employee: string;
    status: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyInvoices, setDailyInvoices] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const loadDailyInvoices = useCallback(async (date?: string) => {
    try {
      setLoadingInvoices(true);
      const response = await dashboardAPI.getDailyInvoices(date || selectedDate);
      console.log('📋 Daily Invoices Response:', response.data);
      setDailyInvoices(response.data || { date: '', invoices: [], total_revenue: 0, total_invoices: 0 });
    } catch (error) {
      console.error('❌ Error loading daily invoices:', error);
      // Set fallback data to prevent crash
      setDailyInvoices({ date: '', invoices: [], total_revenue: 0, total_invoices: 0 });
    } finally {
      setLoadingInvoices(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔍 Fetching dashboard data...');
        const response = await dashboardAPI.getOverview();
        console.log('📊 Dashboard API Response:', response.data);
        
        // Cast response.data to any để tránh lỗi TypeScript
        const apiData = response.data as any;
        
        // Đảm bảo dữ liệu có đầy đủ các trường cần thiết với safe defaults
        const data: DashboardOverview = {
          stats: {
            today: {
              revenue: apiData?.stats?.today?.revenue || 0,
              invoices: apiData?.stats?.today?.invoices || 0,
              customers: apiData?.stats?.today?.customers || 0,
              appointments: apiData?.stats?.today?.appointments || 0
            },
            totals: {
              customers: apiData?.stats?.totals?.customers || 0,
              employees: apiData?.stats?.totals?.employees || 0,
              services: apiData?.stats?.totals?.services || 0,
              monthlyRevenue: apiData?.stats?.totals?.monthlyRevenue || 0
            }
          },
          revenueChart: Array.isArray(apiData?.revenueChart) ? apiData.revenueChart : [],
          topServices: Array.isArray(apiData?.topServices) ? apiData.topServices : [],
          employeePerformance: Array.isArray(apiData?.employeePerformance) ? apiData.employeePerformance : [],
          todayAppointments: Array.isArray(apiData?.todayAppointments) ? apiData.todayAppointments : []
        };
        
        console.log('📈 Processed Dashboard Data:', data);
        setOverview(data);
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        // Set fallback data to prevent white screen
        setOverview({
          stats: {
            today: { revenue: 0, invoices: 0, customers: 0, appointments: 0 },
            totals: { customers: 0, employees: 0, services: 0, monthlyRevenue: 0 }
          },
          revenueChart: [],
          topServices: [],
          employeePerformance: [],
          todayAppointments: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    loadDailyInvoices();
  }, [loadDailyInvoices]);



  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadDailyInvoices(newDate);
  };

  const revenueChart = overview?.revenueChart?.map(item => ({
    ...item,
    date: item.date ? formatDate(item.date, 'dd/MM') : (item as any).name || 'N/A',
  })) || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Tổng quan hoạt động spa hôm nay
      </Typography>

      {/* Overview Stats */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(overview?.stats.today.revenue || 0)}
            icon={<TrendingUp />}
            color="#4caf50"
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <StatCard
            title="Hóa đơn hôm nay"
            value={overview?.stats.today.invoices || 0}
            icon={<Receipt />}
            color="#2196f3"
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <StatCard
            title="Khách hàng hôm nay"
            value={overview?.stats.today.customers || 0}
            icon={<People />}
            color="#ff9800"
          />
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
          <StatCard
            title="Lịch hẹn hôm nay"
            value={overview?.stats.today.appointments || 0}
            icon={<CalendarToday />}
            color="#9c27b0"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Revenue Chart */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 65%' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Doanh thu 7 ngày gần nhất
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2196f3" 
                  strokeWidth={2}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Today's Appointments */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 30%' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lịch hẹn hôm nay
            </Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {overview?.todayAppointments?.length ? (
                overview.todayAppointments.map((appointment, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {appointment.time}
                          </Typography>
                          <Chip
                            label={appointment.status}
                            size="small"
                            color={
                              appointment.status === 'confirmed' ? 'success' :
                              appointment.status === 'pending' ? 'warning' : 'default'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            <strong>{appointment.customer}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.service} - {appointment.employee}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Không có lịch hẹn nào hôm nay
                </Typography>
              )}
            </List>
          </Paper>
        </Box>

        {/* Top Services */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 48%' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dịch vụ bán chạy (30 ngày)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overview?.topServices || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'count' ? `${value} lần` : formatCurrency(value),
                    name === 'count' ? 'Số lần' : 'Doanh thu'
                  ]}
                />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Số lần" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Employee Performance */}
        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 48%' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hiệu suất nhân viên (30 ngày)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overview?.employeePerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'appointments' ? `${value} lịch` : formatCurrency(value),
                    name === 'appointments' ? 'Lịch hẹn' : 'Doanh thu'
                  ]}
                />
                <Legend />
                <Bar dataKey="appointments" fill="#ffc658" name="Lịch hẹn" />
                <Bar dataKey="revenue" fill="#ff7300" name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ flex: '1 1 100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thống kê tổng quan
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {overview?.stats.totals.customers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng khách hàng
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {overview?.stats.totals.employees || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng nhân viên
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {overview?.stats.totals.services || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng dịch vụ
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {formatCurrency(overview?.stats.totals.monthlyRevenue || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Doanh thu tháng này
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Daily Invoices Section */}
      <Box sx={{ mt: 4 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              📋 Hóa Đơn Theo Ngày
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <TextField
                type="date"
                label="Chọn ngày"
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
            </Box>

            {loadingInvoices ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : dailyInvoices ? (
              <>
                <Box sx={{ mb: 3, display: 'flex', gap: 3 }}>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Tổng Hóa Đơn
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {dailyInvoices.total_invoices}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Doanh Thu
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {formatCurrency(dailyInvoices.total_revenue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {dailyInvoices.invoices.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Mã HĐ</TableCell>
                          <TableCell>Khách hàng</TableCell>
                          <TableCell>Dịch vụ</TableCell>
                          <TableCell>Nhân viên</TableCell>
                          <TableCell align="right">Tổng tiền</TableCell>
                          <TableCell>Thời gian</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dailyInvoices.invoices.map((invoice: any) => (
                          <TableRow key={invoice.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {invoice.invoice_number}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {invoice.customer_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {invoice.customer_phone}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                {invoice.items.map((item: any, idx: number) => (
                                  <Box key={idx} sx={{ mb: 0.5 }}>
                                    <Typography variant="body2">
                                      {item.service_name} x{item.quantity}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatCurrency(item.unit_price)} = {formatCurrency(item.total_price)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                {invoice.items.map((item: any, idx: number) => (
                                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                                    {item.employee_name || 'Chưa phân công'}
                                  </Typography>
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {formatCurrency(invoice.total_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(invoice.created_at, 'HH:mm')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      Không có hóa đơn nào trong ngày {formatDate(selectedDate)}
                    </Typography>
                  </Box>
                )}
              </>
            ) : null}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default DashboardPage;