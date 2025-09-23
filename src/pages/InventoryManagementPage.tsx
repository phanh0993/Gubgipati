import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Restaurant,
  TrendingUp,
  DateRange
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../services/supabaseClient';

interface FoodItem {
  id: number;
  name: string;
  price: number;
  is_available: boolean;
  category?: string;
}

interface FoodItemStats {
  id: number;
  name: string;
  price: number;
  total_ordered: number;
  total_revenue: number;
  order_count: number;
}

const InventoryManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState<Dayjs | null>(dayjs());
  const [customEndDate, setCustomEndDate] = useState<Dayjs | null>(dayjs());
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [foodStats, setFoodStats] = useState<FoodItemStats[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFoodItems();
    loadFoodStats();
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

    return {
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD')
    };
  };

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('food_items')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (fetchError) {
        throw new Error(`Error fetching food items: ${fetchError.message}`);
      }

      setFoodItems(data || []);
    } catch (err: any) {
      console.error('Error loading food items:', err);
      setError(err.message || 'Lỗi khi tải danh sách món ăn');
    } finally {
      setLoading(false);
    }
  };

  const loadFoodStats = async () => {
    try {
      setError('');
      const { start, end } = getDateRange();
      
      console.log('📊 Loading food stats for:', { start, end, timeRange });

      // Lấy tất cả invoices trong khoảng thời gian
      const { data: allInvoices, error: allInvoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          payment_status,
          invoice_items (
            service_id,
            quantity,
            unit_price,
            total_price,
            food_items (
              id,
              name,
              price
            )
          )
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (allInvoicesError) {
        throw new Error(`Error fetching invoices: ${allInvoicesError.message}`);
      }

      // Filter invoices by date range manually
      const invoices = allInvoices?.filter((inv: any) => {
        const invDate = dayjs(inv.created_at).tz('Asia/Ho_Chi_Minh');
        const invDateStr = invDate.format('YYYY-MM-DD');
        return invDateStr >= start && invDateStr <= end;
      }) || [];

      console.log('📋 Filtered invoices:', invoices.length);

      // Thống kê món ăn
      const foodStatsMap: { [key: number]: FoodItemStats } = {};

      // Khởi tạo tất cả món ăn với số liệu 0
      foodItems.forEach(food => {
        foodStatsMap[food.id] = {
          id: food.id,
          name: food.name,
          price: food.price,
          total_ordered: 0,
          total_revenue: 0,
          order_count: 0
        };
      });

      // Đếm từ invoice_items
      invoices.forEach((invoice: any) => {
        if (invoice.invoice_items && Array.isArray(invoice.invoice_items)) {
          invoice.invoice_items.forEach((item: any) => {
            const foodId = item.food_items?.id || item.service_id;
            const foodName = item.food_items?.name || `Service ${item.service_id}`;
            
            if (foodStatsMap[foodId]) {
              foodStatsMap[foodId].total_ordered += Number(item.quantity || 0);
              foodStatsMap[foodId].total_revenue += Number(item.total_price || 0);
              foodStatsMap[foodId].order_count += 1;
            } else {
              // Tạo mới nếu món ăn chưa có trong danh sách
              foodStatsMap[foodId] = {
                id: foodId,
                name: foodName,
                price: Number(item.unit_price || 0),
                total_ordered: Number(item.quantity || 0),
                total_revenue: Number(item.total_price || 0),
                order_count: 1
              };
            }
          });
        }
      });

      // Chuyển thành array và sắp xếp theo số lượng order
      const stats = Object.values(foodStatsMap)
        .filter(stat => stat.total_ordered > 0) // Chỉ hiển thị món đã được order
        .sort((a, b) => b.total_ordered - a.total_ordered);

      console.log('📊 Food stats:', stats.length, 'items');
      setFoodStats(stats);
      
    } catch (err: any) {
      console.error('Error loading food stats:', err);
      setError(err.message || 'Lỗi khi tải thống kê món ăn');
    }
  };

  const getTotalStats = () => {
    const totalOrdered = foodStats.reduce((sum, stat) => sum + stat.total_ordered, 0);
    const totalRevenue = foodStats.reduce((sum, stat) => sum + stat.total_revenue, 0);
    const totalOrders = foodStats.reduce((sum, stat) => sum + stat.order_count, 0);
    
    return { totalOrdered, totalRevenue, totalOrders };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const { totalOrdered, totalRevenue, totalOrders } = getTotalStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Quản Lý Kho - Thống Kê Món Ăn
        </Typography>
        <Chip
          icon={<DateRange />}
          label={`${getDateRange().start} - ${getDateRange().end}`}
          color="primary"
          variant="outlined"
        />
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
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Restaurant sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Tổng Món Ăn
              </Typography>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {foodItems.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                món có sẵn
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Tổng Số Lượng Order
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {totalOrdered}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                phần đã bán
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                💰 Doanh Thu
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatCurrency(totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                từ {foodStats.length} món được order
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Food Items Statistics Table */}
      <Paper>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Thống Kê Món Ăn Theo Thời Gian
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hiển thị {foodStats.length} món đã được order trong khoảng thời gian đã chọn
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Tên Món</TableCell>
                  <TableCell align="right">Giá</TableCell>
                  <TableCell align="center">Số Lượng Order</TableCell>
                  <TableCell align="right">Doanh Thu</TableCell>
                  <TableCell align="center">Số Lần Order</TableCell>
                  <TableCell align="right">Trung Bình/Lần</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {foodStats.map((stat, index) => (
                  <TableRow key={stat.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {stat.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(stat.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stat.total_ordered}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {formatCurrency(stat.total_revenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {stat.order_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {stat.order_count > 0 ? formatCurrency(stat.total_revenue / stat.order_count) : formatCurrency(0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {foodStats.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Không có món nào được order trong khoảng thời gian này
              </Typography>
            </Box>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
};

export default InventoryManagementPage;