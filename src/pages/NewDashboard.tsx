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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Receipt,
  People,
  Restaurant,
  DateRange,
  Refresh,
  Print,
  Download
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

import { dashboardAPI, invoicesAPI, orderAPI, buffetAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = '#1976d2', subtitle }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

interface TopFoodItem {
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

interface HourlyData {
  hour: string;
  customers: number;
  revenue: number;
  orders: number;
}

const NewDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState<Dayjs | null>(dayjs());
  const [customEndDate, setCustomEndDate] = useState<Dayjs | null>(dayjs());
  const [refreshing, setRefreshing] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalFoodItems: 0,
    averageOrderValue: 0,
    paidInvoices: 0
  });
  
  // Charts data
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [topFoods, setTopFoods] = useState<TopFoodItem[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  
  // Error state
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = dayjs();
    let startDate: Dayjs;
    let endDate: Dayjs = now;

    switch (timeRange) {
      case 'today':
        startDate = now.startOf('day');
        break;
      case 'yesterday':
        startDate = now.subtract(1, 'day').startOf('day');
        endDate = now.subtract(1, 'day').endOf('day');
        break;
      case 'week':
        startDate = now.startOf('week');
        break;
      case 'month':
        startDate = now.startOf('month');
        break;
      case 'custom':
        startDate = customStartDate || now.startOf('day');
        endDate = customEndDate || now;
        break;
      default:
        startDate = now.startOf('day');
    }

    return {
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD'),
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString()
    };
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { start, end, startISO, endISO } = getDateRange();
      console.log('📊 Loading dashboard data for:', { start, end, timeRange });

      // Load all data in parallel
      const [
        invoicesRes,
        ordersRes,
        dashboardRes,
        topFoodsRes
      ] = await Promise.all([
        invoicesAPI.getAll({ 
          limit: 1000, 
          offset: 0,
          start_date: start,
          end_date: end
        }),
        orderAPI.getOrders({ 
          start_date: start,
          end_date: end
        }),
        dashboardAPI.getOverview(),
        loadTopFoods(startISO, endISO)
      ]);

      // Process invoices data
      const invoices = invoicesRes.data.invoices || [];
      const paidInvoices = invoices.filter((inv: any) => inv.payment_status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => 
        sum + Number(inv.total_amount || 0), 0
      );

      // Process orders data
      const orders = ordersRes.data || [];
      const paidOrders = orders.filter((order: any) => order.status === 'paid');
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Process dashboard overview
      const dashboardData = dashboardRes.data;
      const totalCustomers = Number(dashboardData.stats?.total_customers || 0);
      const totalEmployees = Number(dashboardData.stats?.total_employees || 0);
      const totalFoodItems = Number(dashboardData.stats?.total_food_items || 0);

      // Update stats
      setStats({
        totalRevenue,
        totalInvoices: invoices.length,
        totalOrders,
        totalCustomers,
        totalEmployees,
        totalFoodItems,
        averageOrderValue,
        paidInvoices: paidInvoices.length
      });

      // Load hourly data
      await loadHourlyData(startISO, endISO);
      
      // Load daily revenue data
      await loadDailyRevenueData(start, end);

      console.log('✅ Dashboard data loaded successfully');
      
    } catch (err: any) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err.message || 'Lỗi khi tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadTopFoods = async (startISO: string, endISO: string): Promise<TopFoodItem[]> => {
    try {
      // Get all orders in date range
      const ordersRes = await orderAPI.getOrders({
        start_date: startISO,
        end_date: endISO
      });
      
      const orders = ordersRes.data || [];
      const foodCounts: { [key: string]: { quantity: number; revenue: number } } = {};
      
      // Count food items from all orders
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const foodName = item.name || 'Unknown Food';
            if (!foodCounts[foodName]) {
              foodCounts[foodName] = { quantity: 0, revenue: 0 };
            }
            foodCounts[foodName].quantity += Number(item.quantity || 0);
            foodCounts[foodName].revenue += Number(item.total || 0);
          });
        }
      });
      
      // Convert to array and sort by quantity
      const topFoods = Object.entries(foodCounts)
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue,
          percentage: 0 // Will be calculated after sorting
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
      
      // Calculate percentages
      const totalQuantity = topFoods.reduce((sum, item) => sum + item.quantity, 0);
      topFoods.forEach(item => {
        item.percentage = totalQuantity > 0 ? (item.quantity / totalQuantity) * 100 : 0;
      });
      
      return topFoods;
    } catch (error) {
      console.error('Error loading top foods:', error);
      return [];
    }
  };

  const loadHourlyData = async (startISO: string, endISO: string) => {
    try {
      // Get orders grouped by hour
      const ordersRes = await orderAPI.getOrders({
        start_date: startISO,
        end_date: endISO
      });
      
      const orders = ordersRes.data || [];
      const hourlyStats: { [key: string]: { customers: number; revenue: number; orders: number } } = {};
      
      // Initialize all hours from 8:00 to 22:00
      for (let hour = 8; hour <= 22; hour++) {
        hourlyStats[`${hour}:00`] = { customers: 0, revenue: 0, orders: 0 };
      }
      
      // Process orders
      orders.forEach((order: any) => {
        const orderDate = new Date(order.created_at || order.buffet_start_time);
        const hour = orderDate.getHours();
        const hourKey = `${hour}:00`;
        
        if (hourlyStats[hourKey]) {
          hourlyStats[hourKey].orders += 1;
          hourlyStats[hourKey].revenue += Number(order.total_amount || 0);
          // Estimate customers (assuming 1 customer per order for simplicity)
          hourlyStats[hourKey].customers += 1;
        }
      });
      
      // Convert to array
      const hourlyData = Object.entries(hourlyStats)
        .map(([hour, data]) => ({
          hour,
          customers: data.customers,
          revenue: data.revenue,
          orders: data.orders
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
      
      setHourlyData(hourlyData);
    } catch (error) {
      console.error('Error loading hourly data:', error);
    }
  };

  const loadDailyRevenueData = async (start: string, end: string) => {
    try {
      // Generate daily data for the selected range
      const startDate = dayjs(start);
      const endDate = dayjs(end);
      const days = [];
      
      let current = startDate;
      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        days.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }
      
      // For each day, get revenue
      const dailyData = await Promise.all(
        days.map(async (day) => {
          try {
            const dayStart = dayjs(day).startOf('day').toISOString();
            const dayEnd = dayjs(day).endOf('day').toISOString();
            
            const invoicesRes = await invoicesAPI.getAll({
              limit: 1000,
              offset: 0,
              start_date: day,
              end_date: day
            });
            
            const invoices = invoicesRes.data.invoices || [];
            const paidInvoices = invoices.filter((inv: any) => inv.payment_status === 'paid');
            const revenue = paidInvoices.reduce((sum: number, inv: any) => 
              sum + Number(inv.total_amount || 0), 0
            );
            
            return {
              date: dayjs(day).format('DD/MM'),
              revenue,
              invoices: paidInvoices.length
            };
          } catch (error) {
            console.error(`Error loading data for ${day}:`, error);
            return {
              date: dayjs(day).format('DD/MM'),
              revenue: 0,
              invoices: 0
            };
          }
        })
      );
      
      setDailyRevenue(dailyData);
    } catch (error) {
      console.error('Error loading daily revenue data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Chức năng xuất dữ liệu sẽ được thêm sau');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Làm mới">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="In báo cáo">
              <IconButton onClick={handlePrint}>
                <Print />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xuất dữ liệu">
              <IconButton onClick={handleExport}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Time Range Selector */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Khoảng thời gian</InputLabel>
                  <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    label="Khoảng thời gian"
                  >
                    <MenuItem value="today">Hôm nay</MenuItem>
                    <MenuItem value="yesterday">Hôm qua</MenuItem>
                    <MenuItem value="week">Tuần này</MenuItem>
                    <MenuItem value="month">Tháng này</MenuItem>
                    <MenuItem value="custom">Tùy chỉnh</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {timeRange === 'custom' && (
                <>
                  <Grid item xs={12} sm={3} md={2}>
                    <TextField
                      label="Từ ngày"
                      type="date"
                      value={customStartDate?.format('YYYY-MM-DD') || ''}
                      onChange={(e) => setCustomStartDate(dayjs(e.target.value))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3} md={2}>
                    <TextField
                      label="Đến ngày"
                      type="date"
                      value={customEndDate?.format('YYYY-MM-DD') || ''}
                      onChange={(e) => setCustomEndDate(dayjs(e.target.value))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12} sm={6} md={2}>
                <Chip
                  icon={<DateRange />}
                  label={`${getDateRange().start} - ${getDateRange().end}`}
                  color="primary"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Doanh thu"
              value={formatCurrency(stats.totalRevenue)}
              icon={<TrendingUp />}
              color="#4caf50"
              subtitle={`${stats.paidInvoices} hóa đơn đã thanh toán`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tổng hóa đơn"
              value={stats.totalInvoices}
              icon={<Receipt />}
              color="#2196f3"
              subtitle={`${stats.paidInvoices} đã thanh toán`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tổng đơn hàng"
              value={stats.totalOrders}
              icon={<Restaurant />}
              color="#ff9800"
              subtitle={`Giá trị TB: ${formatCurrency(stats.averageOrderValue)}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Khách hàng"
              value={stats.totalCustomers}
              icon={<People />}
              color="#9c27b0"
              subtitle="Tổng số khách hàng"
            />
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Hourly Revenue Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Doanh thu theo giờ (24h)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Doanh thu' : name === 'customers' ? 'Khách hàng' : 'Đơn hàng'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4caf50" name="Doanh thu" />
                    <Bar dataKey="customers" fill="#2196f3" name="Khách hàng" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Daily Revenue Trend */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Xu hướng doanh thu
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Doanh thu']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4caf50" 
                      strokeWidth={2}
                      dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Foods and Additional Stats */}
        <Grid container spacing={3}>
          {/* Top Foods */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Món ăn được order nhiều nhất
                </Typography>
                <List>
                  {topFoods.slice(0, 10).map((food, index) => (
                    <ListItem key={food.name} divider={index < 9}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={food.name}
                        secondary={`${food.quantity} lần order - ${formatCurrency(food.revenue)}`}
                      />
                      <Chip 
                        label={`${food.percentage.toFixed(1)}%`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thống kê bổ sung
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary">
                        {stats.totalEmployees}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nhân viên
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h4" color="secondary">
                        {stats.totalFoodItems}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Món ăn
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">
                        Giá trị đơn hàng trung bình
                      </Typography>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(stats.averageOrderValue)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
  );
};

export default NewDashboard;
