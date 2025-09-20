import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Paper,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  TableRestaurant,
  Restaurant,
  ShoppingCart,
  Payment,
  Add,
  Remove,
  Delete,
  Print,
  Logout,
  Receipt,
  TableBar
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';

interface Table {
  id: number;
  table_name: string;
  capacity: number;
  status: 'empty' | 'occupied' | 'reserved' | 'busy';
  position_x?: number;
  position_y?: number;
}

interface FoodItem {
  id: number;
  name: string;
  price: number;
  category_id: number;
  printer_id?: number;
  is_available: boolean;
}

interface OrderItem {
  food_item_id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  special_instructions?: string;
  printer_id?: number;
}

interface Order {
  id: number;
  order_number: string;
  table_id: number;
  table_name: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  order_count: number;
  customer_id?: number;
  employee_id?: number;
}

const SimpleRestaurantPOS: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'orders'>('tables');
  const [orderCount, setOrderCount] = useState(1);
  const [openTableDialog, setOpenTableDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    // Kiểm tra authentication
    const posToken = localStorage.getItem('pos_token');
    const posEmployee = localStorage.getItem('pos_employee');
    
    if (!posToken || !posEmployee) {
      navigate('/pos-login');
      return;
    }
    
    setCurrentEmployee(JSON.parse(posEmployee));
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { tableAPI, buffetAPI, orderAPI } = await import('../services/api');
      const [tablesRes, foodItemsRes, ordersRes] = await Promise.all([
        tableAPI.getTables(),
        buffetAPI.getFoodItems(),
        orderAPI.getOrders()
      ]);

      const tablesData = tablesRes.data;
      const foodItemsData = foodItemsRes.data;
      const ordersData = ordersRes.data;

      setTables(tablesData);
      setFoodItems(foodItemsData.filter((item: FoodItem) => item.is_available));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Lỗi tải dữ liệu', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (tableId: number, status: string) => {
    // Mock implementation - just update local state
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, status: status as any } : table
    ));
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    
    // Tạo order mới cho bàn (không hiện order cũ)
    setCurrentOrder({
      id: 0,
      order_number: `ORD-${Date.now()}`,
      table_id: table.id,
      table_name: table.table_name,
      status: 'pending',
      order_type: 'dine_in',
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
      items: [],
      created_at: new Date().toISOString(),
      order_count: 1
    });
    setSelectedOrder(null);
    setOrderCount(1);
    
    // Chuyển về tab chọn bàn để order mới
    setActiveTab('tables');
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setCurrentOrder(order);
    setSelectedTable(tables.find(t => t.id === order.table_id) || null);
  };

  const handleAddItem = (foodItem: FoodItem) => {
    if (!currentOrder) return;

    const existingItem = currentOrder.items?.find(item => item.food_item_id === foodItem.id);
    
    if (existingItem) {
      const updatedItems = currentOrder.items?.map(item =>
        item.food_item_id === foodItem.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * parseFloat(String(item.price)) }
          : item
      ) || [];
      updateOrder(updatedItems);
    } else {
      const newItem: OrderItem = {
        food_item_id: foodItem.id,
        name: foodItem.name,
        price: parseFloat(String(foodItem.price)) || 0,
        quantity: 1,
        total: parseFloat(String(foodItem.price)) || 0,
        printer_id: foodItem.printer_id,
      };
      updateOrder([...(currentOrder.items || []), newItem]);
    }
  };

  const handleUpdateQuantity = (foodItemId: number, quantity: number) => {
    if (!currentOrder) return;

    if (quantity === 0) {
      const updatedItems = currentOrder.items?.filter(item => item.food_item_id !== foodItemId) || [];
      updateOrder(updatedItems);
    } else {
      const updatedItems = currentOrder.items?.map(item =>
        item.food_item_id === foodItemId
          ? { ...item, quantity, total: quantity * parseFloat(String(item.price)) }
          : item
      ) || [];
      updateOrder(updatedItems);
    }
  };

  const updateOrder = (items: OrderItem[]) => {
    if (!currentOrder) return;

    const subtotal = (items || []).reduce((sum, item) => {
      const itemTotal = parseFloat(String(item.total)) || 0;
      return sum + itemTotal;
    }, 0);
    const tax_amount = 0; // Bỏ thuế
    const total_amount = subtotal + tax_amount;

    setCurrentOrder({
      ...currentOrder,
      items,
      subtotal,
      tax_amount,
      total_amount,
    });
  };

  const handleSendOrder = async () => {
    if (!currentOrder || !currentOrder.items?.length) {
      setSnackbar({ open: true, message: 'Vui lòng chọn món ăn', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      // Kiểm tra xem có order hiện tại cho bàn này không
      const existingOrder = orders.find(order => 
        order.table_id === currentOrder.table_id && order.status !== 'paid'
      );

      const orderData = {
        order_number: currentOrder.order_number,
        table_id: currentOrder.table_id,
        customer_id: null,
        employee_id: currentEmployee?.id || 1,
        order_type: 'dine_in',
        subtotal: parseFloat(String(currentOrder.subtotal)) || 0,
        tax_amount: parseFloat(String(currentOrder.tax_amount)) || 0,
        total_amount: parseFloat(String(currentOrder.total_amount)) || 0,
        notes: `Order lần ${orderCount} - NV: ${currentEmployee?.fullname || 'Unknown'}`,
        items: currentOrder.items?.map(item => ({
          food_item_id: item.food_item_id,
          name: item.name,
          price: parseFloat(String(item.price)) || 0,
          quantity: parseInt(String(item.quantity)) || 0,
          special_instructions: item.special_instructions,
          printer_id: item.printer_id,
        })) || [],
        order_count: orderCount,
      };

      const response = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const newOrder = await response.json();
        
        // Gửi order đến máy in
        await printOrder(newOrder);
        
        // Cập nhật danh sách orders
        await fetchData();
        
        // Reset giao diện order về trạng thái trống
        setCurrentOrder({
          id: 0,
          order_number: `ORD-${Date.now()}`,
          table_id: selectedTable?.id || 0,
          table_name: selectedTable?.table_name || '',
          status: 'pending',
          order_type: 'dine_in',
          subtotal: 0,
          tax_amount: 0,
          total_amount: 0,
          items: [],
          created_at: new Date().toISOString(),
          order_count: 1
        });
        
        // Tăng order count cho lần order tiếp theo
        setOrderCount(prev => prev + 1);
        
        // Chuyển sang tab danh sách hóa đơn để xem order vừa tạo
        setActiveTab('orders');
        
        setSnackbar({ open: true, message: 'Order đã được gửi đến bếp!', severity: 'success' });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error sending order:', error);
      setSnackbar({ open: true, message: 'Lỗi gửi order', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const printOrder = async (order: any) => {
    try {
      await fetch('http://localhost:8000/api/print-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          printer_id: 1, // Default printer
          order_number: order.order_number,
          table_name: order.table_name,
          items: order.items || [],
          order_count: order.order_count || 1
        }),
      });
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      
      // 1. Tạo invoice trước để ghi nhận doanh thu
      const { invoicesAPI } = await import('../services/api');
      const invoiceData = {
        customer_id: selectedOrder.customer_id || undefined,
        employee_id: selectedOrder.employee_id || 1,
        items: [{ service_id: 1, quantity: 1, unit_price: selectedOrder.total_amount || 0 }],
        discount_amount: 0,
        tax_amount: 0,
        payment_method: paymentMethod,
        notes: `Restaurant Order: ${selectedOrder.order_number || selectedOrder.id}`
      };
      
      const invoiceResponse = await invoicesAPI.create(invoiceData);
      
      if (invoiceResponse.status === 200) {
        // 2. Cập nhật order status thành 'paid' sau khi tạo invoice thành công
        const { orderAPI } = await import('../services/api');
        await orderAPI.updateOrder(selectedOrder.id, {
          status: 'paid',
          payment_method: paymentMethod,
        });
        
        setSnackbar({ open: true, message: 'Thanh toán thành công! Hóa đơn đã được ghi nhận vào doanh thu.', severity: 'success' });
        
        // 3. Refresh data để cập nhật trạng thái bàn
        await fetchData();
        
        setSelectedOrder(null);
        setCurrentOrder(null);
        setSelectedTable(null);
        setOpenPaymentDialog(false);
      } else {
        setSnackbar({ open: true, message: 'Lỗi khi tạo hóa đơn', severity: 'error' });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setSnackbar({ open: true, message: 'Lỗi thanh toán', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_employee');
    navigate('/pos-login');
  };

  const getTableStatus = (table: Table) => {
    // Kiểm tra xem bàn có order chưa thanh toán không
    const hasUnpaidOrder = orders.some(order => 
      order.table_id === table.id && order.status !== 'paid'
    );
    
    return hasUnpaidOrder ? 'busy' : 'empty';
  };

  const getStatusText = (table: Table) => {
    const status = getTableStatus(table);
    switch (status) {
      case 'empty': return 'Trống';
      case 'busy': return 'Kín';
      default: return status;
    }
  };

  const getStatusColor = (table: Table) => {
    const status = getTableStatus(table);
    switch (status) {
      case 'empty': return 'success';
      case 'busy': return 'error';
      default: return 'default';
    }
  };

  const pendingOrders = orders.filter(order => order.status !== 'paid');

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Restaurant sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GUBGIPATI Restaurant POS
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            NV: {currentEmployee?.fullname || 'Unknown'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab 
              icon={<TableBar />} 
              label="Chọn Bàn - Thực Đơn - Bill" 
              value="tables"
            />
            <Tab 
              icon={<Receipt />} 
              label={`Danh Sách Hóa Đơn (${pendingOrders.length})`} 
              value="orders"
            />
          </Tabs>
        </Paper>

        {activeTab === 'tables' && (
          <Grid container spacing={3}>
            {/* Danh sách bàn */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <TableRestaurant sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Chọn Bàn
                  </Typography>
                  <Grid container spacing={2}>
                    {tables.map((table) => (
                      <Grid item xs={6} key={table.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: 2,
                            borderColor: selectedTable?.id === table.id ? 'primary.main' : 'divider',
                          }}
                          onClick={() => handleSelectTable(table)}
                        >
                          <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <TableRestaurant sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h6">{table.table_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Sức chứa: {table.capacity}
                            </Typography>
                            <Chip
                              label={getStatusText(table)}
                              color={getStatusColor(table) as any}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Thực đơn */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Restaurant sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Thực Đơn
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {foodItems.map((item) => (
                      <Card key={item.id} sx={{ mb: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1">{item.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatCurrency(item.price)}
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddItem(item)}
                              disabled={!selectedTable}
                            >
                              <Add />
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Bill hiện tại */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Bill - {selectedTable?.table_name || 'Chưa chọn bàn'}
                  </Typography>
                  
                  {currentOrder && currentOrder.items && currentOrder.items.length > 0 ? (
                    <Box>
                      <List dense>
                        {currentOrder.items.map((item, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={item.name}
                              secondary={
                                <Box component="div">
                                  <Typography component="span" variant="body2">
                                    {formatCurrency(item.price)} x {item.quantity}
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateQuantity(item.food_item_id, item.quantity - 1)}
                                >
                                  <Remove />
                                </IconButton>
                                <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateQuantity(item.food_item_id, item.quantity + 1)}
                                >
                                  <Add />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateQuantity(item.food_item_id, 0)}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Tạm tính:</Typography>
                        <Typography>{formatCurrency(currentOrder.subtotal)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>VAT (10%):</Typography>
                        <Typography>{formatCurrency(currentOrder.tax_amount)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Tổng cộng:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(currentOrder.total_amount)}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={handleSendOrder}
                        disabled={loading}
                        sx={{ mb: 1 }}
                      >
                        <Print sx={{ mr: 1 }} />
                        Order (Lần {orderCount})
                      </Button>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      {selectedTable ? 'Chọn món ăn từ thực đơn' : 'Vui lòng chọn bàn'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 'orders' && (
          <Grid container spacing={3}>
            {/* Danh sách hóa đơn */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Danh Sách Hóa Đơn Chưa Thanh Toán
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Add />}
                      onClick={() => setActiveTab('tables')}
                    >
                      Order Mới
                    </Button>
                  </Box>
                  <List>
                    {pendingOrders.map((order) => (
                      <ListItem
                        key={order.id}
                        button
                        selected={selectedOrder?.id === order.id}
                        onClick={() => handleSelectOrder(order)}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          mb: 1,
                          borderRadius: 1,
                        }}
                      >
                        <ListItemText
                          primary={`${order.order_number} - ${order.table_name}`}
                          secondary={
                            <Box component="div">
                              <Typography component="span" variant="body2">
                                {order.items?.length || 0} món • {formatCurrency(order.total_amount)}
                              </Typography>
                              <Chip
                                label={order.status === 'pending' ? 'Chờ xử lý' : 'Đang chuẩn bị'}
                                color="warning"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setOpenPaymentDialog(true);
                            }}
                          >
                            <Payment sx={{ mr: 1 }} />
                            Thanh toán
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Chi tiết hóa đơn */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chi Tiết Hóa Đơn
                  </Typography>
                  
                  {selectedOrder ? (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedOrder.order_number} - {selectedOrder.table_name}
                      </Typography>
                      
                      <List dense>
                        {selectedOrder.items?.map((item, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={item.name}
                              secondary={`${formatCurrency(item.price)} x ${item.quantity}`}
                            />
                            <Typography variant="body2">
                              {formatCurrency(item.total)}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Tạm tính:</Typography>
                        <Typography>{formatCurrency(selectedOrder.subtotal)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>VAT (10%):</Typography>
                        <Typography>{formatCurrency(selectedOrder.tax_amount)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Tổng cộng:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(selectedOrder.total_amount)}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => setOpenPaymentDialog(true)}
                      >
                        <Payment sx={{ mr: 1 }} />
                        Thanh toán
                      </Button>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Chọn hóa đơn để xem chi tiết
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Dialog thanh toán */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Thanh toán</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card')}
            >
              <MenuItem value="cash">Tiền mặt</MenuItem>
              <MenuItem value="card">Thẻ</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Hủy</Button>
          <Button onClick={handlePayment} variant="contained" disabled={loading}>
            Xác nhận thanh toán
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SimpleRestaurantPOS;