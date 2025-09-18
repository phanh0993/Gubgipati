import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,

  Paper,
} from '@mui/material';
import { TrendingUp, Receipt, People, Build, DateRange } from '@mui/icons-material';
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
import { formatCurrency } from '../utils/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = '#1976d2' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const SimpleDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayInvoices: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalServices: 0,
    monthlyRevenue: 0
  });
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);

  // Generate mock hourly data
  const generateHourlyData = () => {
    const hours = [];
    for (let i = 8; i <= 20; i++) {
      hours.push({
        hour: `${i}:00`,
        customers: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 500000) + 100000
      });
    }
    return hours;
  };

  // Generate mock daily data
  const generateDailyData = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        customers: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 1000000) + 200000
      });
    }
    return days;
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔍 SimpleDashboard: Fetching data for range:', timeRange);
        
        const response = await dashboardAPI.getOverview();
        console.log('📊 SimpleDashboard: API Response:', response.data);

        const data = response.data;
        
        // Get stats from API response
        setStats({
          todayRevenue: parseFloat(data?.stats?.total_revenue || '0'),
          todayInvoices: parseInt(data?.stats?.paid_invoices || '0'),
          totalCustomers: parseInt(data?.stats?.total_customers || '0'),
          totalEmployees: parseInt(data?.stats?.total_employees || '0'),
          totalServices: parseInt(data?.stats?.total_food_items || '0'),
          monthlyRevenue: parseFloat(data?.stats?.total_revenue || '0')
        });

        // Generate analytics data
        setHourlyData(generateHourlyData());
        setDailyData(generateDailyData());

        console.log('📈 SimpleDashboard: Data updated for range:', timeRange);
      } catch (error) {
        console.error('❌ SimpleDashboard: Error fetching data:', error);
        // Keep default values (0) if error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, customStartDate, customEndDate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Tổng quan hoạt động spa
      </Typography>

      {/* Time Range Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <DateRange sx={{ color: '#1976d2' }} />
          <Typography variant="h6">Chọn khoảng thời gian:</Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Thời gian</InputLabel>
            <Select
              value={timeRange}
              label="Thời gian"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="today">Hôm nay</MenuItem>
              <MenuItem value="week">7 ngày qua</MenuItem>
              <MenuItem value="month">30 ngày qua</MenuItem>
              <MenuItem value="custom">Tùy chọn</MenuItem>
            </Select>
          </FormControl>

          {timeRange === 'custom' && (
            <>
              <TextField
                label="Từ ngày"
                type="date"
                size="small"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Đến ngày"
                type="date"
                size="small"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Today's Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(stats.todayRevenue)}
            icon={<TrendingUp />}
            color="#4caf50"
          />
        </Grid>

        {/* Today's Invoices */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hóa đơn hôm nay"
            value={stats.todayInvoices}
            icon={<Receipt />}
            color="#2196f3"
          />
        </Grid>

        {/* Total Customers */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng khách hàng"
            value={stats.totalCustomers}
            icon={<People />}
            color="#ff9800"
          />
        </Grid>

        {/* Total Employees */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng nhân viên"
            value={stats.totalEmployees}
            icon={<Build />}
            color="#9c27b0"
          />
        </Grid>

        {/* Monthly Revenue */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Doanh thu tháng này
              </Typography>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {formatCurrency(stats.monthlyRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Services */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tổng số dịch vụ
              </Typography>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                {stats.totalServices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Customer Analytics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Phân tích khách hàng theo khung giờ
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'customers' ? `${value} khách` : formatCurrency(Number(value)),
                      name === 'customers' ? 'Số khách' : 'Doanh thu'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="customers" fill="#2196f3" name="Số khách" />
                  <Bar dataKey="revenue" fill="#4caf50" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Customer Analytics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Phân tích khách hàng theo ngày (7 ngày gần nhất)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'customers' ? `${value} khách` : formatCurrency(Number(value)),
                      name === 'customers' ? 'Số khách' : 'Doanh thu'
                    ]}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="customers" 
                    stroke="#2196f3" 
                    strokeWidth={3}
                    name="Số khách"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4caf50" 
                    strokeWidth={3}
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleDashboard;
