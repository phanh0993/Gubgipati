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
import { supabase } from '../services/supabaseClient';
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
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    let startDate: Dayjs;
    let endDate: Dayjs;

    switch (timeRange) {
      case 'today':
        startDate = now.startOf('day');
        endDate = now.endOf('day');
        break;
      case 'yesterday':
        startDate = now.subtract(1, 'day').startOf('day');
        endDate = now.subtract(1, 'day').endOf('day');
        break;
      case 'week':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'month':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'custom':
        startDate = customStartDate || now.startOf('day');
        endDate = customEndDate || now.endOf('day');
        break;
      default:
        startDate = now.startOf('day');
        endDate = now.endOf('day');
    }

    // SỬA: Sử dụng UTC để tránh timezone issues
    const startUTC = startDate.utc();
    const endUTC = endDate.utc();

    return {
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD'),
      startISO: startUTC.toISOString(),
      endISO: endUTC.toISOString()
    };
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { start, end, startISO, endISO } = getDateRange();
      console.log('📊 Loading dashboard data for:', { start, end, timeRange });
      console.log('📅 Date range details:', { 
        start, 
        end, 
        startISO, 
        endISO,
        startTime: new Date(startISO).toLocaleString('vi-VN'),
        endTime: new Date(endISO).toLocaleString('vi-VN'),
        timeRange
      });

      // Dùng supabase client dùng chung (đã kiểm tra env và log lỗi nếu thiếu)
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      // 1. Lấy tất cả invoices trong khoảng thời gian - SỬA: Sử dụng date string thay vì ISO
      console.log('🔍 Fetching invoices directly from Supabase...');
      const { data: allInvoices, error: allInvoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, created_at, invoice_date, payment_status, total_amount, subtotal, tax_amount')
        .order('created_at', { ascending: false });

      if (allInvoicesError) {
        throw new Error(`Error fetching all invoices: ${allInvoicesError.message}`);
      }

      // Filter invoices by date range manually to avoid timezone issues
      const invoices = allInvoices?.filter((inv: any) => {
        const invDate = dayjs(inv.created_at).tz('Asia/Ho_Chi_Minh');
        const invDateStr = invDate.format('YYYY-MM-DD');
        return invDateStr >= start && invDateStr <= end;
      }) || [];

      console.log('📋 Raw invoices data:', invoices?.length || 0, 'invoices');
      console.log('📋 Sample invoice:', invoices?.[0]);

      // 2. Lấy tất cả orders để hiển thị số lượng - SỬA: Sử dụng date string thay vì ISO
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('id, status, created_at, total_amount')
        .order('created_at', { ascending: false });

      if (allOrdersError) {
        console.warn('Warning: Could not fetch orders:', allOrdersError.message);
      }

      // Filter orders by date range manually to avoid timezone issues
      const orders = allOrders?.filter((order: any) => {
        const orderDate = dayjs(order.created_at).tz('Asia/Ho_Chi_Minh');
        const orderDateStr = orderDate.format('YYYY-MM-DD');
        return orderDateStr >= start && orderDateStr <= end;
      }) || [];

      // 3. Lấy thống kê tổng quan
      const { data: statsData, error: statsError } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true });

      const { data: foodItemsData, error: foodItemsError } = await supabase
        .from('food_items')
        .select('id', { count: 'exact', head: true });

      // 4. Xử lý dữ liệu invoices
      const paidInvoices = invoices.filter((inv: any) => inv.payment_status === 'paid');
      console.log('💰 Paid invoices:', paidInvoices.length);
      
      const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => 
        sum + Number(inv.total_amount || 0), 0
      );
      console.log('💰 Total revenue:', totalRevenue);

      // 5. Xử lý dữ liệu orders
      const totalOrders = orders.length;
      const averageOrderValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

      // 6. Cập nhật stats
      setStats({
        totalRevenue, // Từ invoices
        totalInvoices: allInvoices.length, // Tổng số invoices
        totalOrders, // Tổng số orders
        totalCustomers: statsData?.length || 0,
        totalEmployees: employeesData?.length || 0,
        totalFoodItems: foodItemsData?.length || 0,
        averageOrderValue, // Tính từ invoices
        paidInvoices: paidInvoices.length // Số invoices đã thanh toán
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
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        return [];
      }

      // Lấy tất cả invoices với invoice_items - SỬA: Sử dụng date string thay vì ISO
      const { data: allInvoices, error: allInvoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          payment_status,
          total_amount,
          invoice_items (
            service_id,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (allInvoicesError) {
        console.error('Error fetching invoices for top foods:', allInvoicesError);
        return [];
      }

      // Filter invoices by date range manually to avoid timezone issues
      const startDate = dayjs(startISO).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      const endDate = dayjs(endISO).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      
      const invoices = allInvoices?.filter((inv: any) => {
        const invDate = dayjs(inv.created_at).tz('Asia/Ho_Chi_Minh');
        const invDateStr = invDate.format('YYYY-MM-DD');
        return invDateStr >= startDate && invDateStr <= endDate;
      }) || [];

      const foodCounts: { [key: string]: { quantity: number; revenue: number } } = {};
      
      // Count food items from all paid invoices
      invoices?.forEach((invoice: any) => {
        if (invoice.invoice_items && Array.isArray(invoice.invoice_items)) {
          invoice.invoice_items.forEach((item: any) => {
            const foodName = `Service ${item.service_id}` || 'Unknown Food';
            if (!foodCounts[foodName]) {
              foodCounts[foodName] = { quantity: 0, revenue: 0 };
            }
            foodCounts[foodName].quantity += Number(item.quantity || 0);
            foodCounts[foodName].revenue += Number(item.total_price || 0);
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
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        return;
      }

      // Lấy tất cả invoices - SỬA: Sử dụng date string thay vì ISO
      const { data: allInvoices, error: allInvoicesError } = await supabase
        .from('invoices')
        .select('id, created_at, total_amount, payment_status')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (allInvoicesError) {
        console.error('Error fetching invoices for hourly data:', allInvoicesError);
        return;
      }

      // Filter invoices by date range manually to avoid timezone issues
      const startDate = dayjs(startISO).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      const endDate = dayjs(endISO).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      
      const invoices = allInvoices?.filter((inv: any) => {
        const invDate = dayjs(inv.created_at).tz('Asia/Ho_Chi_Minh');
        const invDateStr = invDate.format('YYYY-MM-DD');
        return invDateStr >= startDate && invDateStr <= endDate;
      }) || [];

      const hourlyStats: { [key: string]: { customers: number; revenue: number; orders: number } } = {};
      
      // Initialize all hours from 8:00 to 22:00
      for (let hour = 8; hour <= 22; hour++) {
        hourlyStats[`${hour}:00`] = { customers: 0, revenue: 0, orders: 0 };
      }
      
      // Process invoices
      invoices?.forEach((invoice: any) => {
        const invoiceDate = new Date(invoice.created_at);
        const hour = invoiceDate.getHours();
        const hourKey = `${hour}:00`;
        
        if (hourlyStats[hourKey]) {
          hourlyStats[hourKey].orders += 1;
          hourlyStats[hourKey].revenue += Number(invoice.total_amount || 0);
          // Estimate customers (assuming 1 customer per invoice for simplicity)
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
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        return;
      }

      // Generate daily data for the selected range
      const startDate = dayjs(start);
      const endDate = dayjs(end);
      const days = [];
      
      let current = startDate;
      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        days.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }
      
      // For each day, get revenue directly from Supabase
      const dailyData = await Promise.all(
        days.map(async (day) => {
          try {
            const dayStart = dayjs(day).startOf('day').toISOString();
            const dayEnd = dayjs(day).endOf('day').toISOString();
            
            const { data: allInvoices, error: allInvoicesError } = await supabase
              .from('invoices')
              .select('id, created_at, total_amount, payment_status')
              .eq('payment_status', 'paid')
              .order('created_at', { ascending: false });
            
            if (allInvoicesError) {
              console.error(`Error fetching invoices for ${day}:`, allInvoicesError);
              return {
                date: dayjs(day).format('DD/MM'),
                revenue: 0,
                invoices: 0
              };
            }

            // Filter invoices by date manually to avoid timezone issues
            const invoices = allInvoices?.filter((inv: any) => {
              const invDate = dayjs(inv.created_at).tz('Asia/Ho_Chi_Minh');
              const invDateStr = invDate.format('YYYY-MM-DD');
              return invDateStr === day;
            }) || [];
            
            const paidInvoices = invoices || [];
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
              value={stats.paidInvoices}
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
