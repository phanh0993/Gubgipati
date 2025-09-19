import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  TableRestaurant as TableIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

interface RestaurantTable {
  id: number;
  table_number: string;
  table_name: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  capacity: number;
}

interface FoodItem {
  id: number;
  name: string;
  description: string;
  type: 'main' | 'side' | 'combo' | 'topping' | 'drink';
  price: number;
  preparation_time: number;
  is_available: boolean;
}

interface OrderItem {
  food_item_id: number;
  name: string;
  price: number;
  quantity: number;
  special_instructions: string;
}

interface Order {
  id?: number;
  order_number: string;
  table_id: number;
  table_name: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  notes: string;
  customer_id?: number;
  employee_id?: number;
}

const RestaurantPOSPage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'main', label: 'Món Chính' },
    { value: 'side', label: 'Món Phụ' },
    { value: 'combo', label: 'Combo' },
    { value: 'topping', label: 'Topping' },
    { value: 'drink', label: 'Đồ Uống' }
  ];

  const typeColors = {
    main: 'primary',
    side: 'secondary',
    combo: 'success',
    topping: 'warning',
    drink: 'info'
  } as const;

  const typeLabels = {
    main: 'Món Chính',
    side: 'Món Phụ',
    combo: 'Combo',
    topping: 'Topping',
    drink: 'Đồ Uống'
  };

  useEffect(() => {
    fetchTables();
    fetchFoodItems();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const response = await fetch('/api/food-items');
      if (response.ok) {
        const data = await response.json();
        setFoodItems(data);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
    }
  };

  const handleTableSelect = (table: RestaurantTable) => {
    if (table.status === 'occupied') {
      setSnackbar({ open: true, message: 'Bàn này đang có khách', severity: 'error' });
      return;
    }
    
    setSelectedTable(table);
    setCurrentOrder({
      order_number: `ORD-${Date.now()}`,
      table_id: table.id,
      table_name: table.table_name,
      items: [],
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
      status: 'pending',
      notes: ''
    });
  };

  const handleAddToOrder = (foodItem: FoodItem) => {
    if (!currentOrder) return;

    const existingItem = currentOrder.items.find(item => item.food_item_id === foodItem.id);
    
    if (existingItem) {
      const updatedItems = currentOrder.items.map(item =>
        item.food_item_id === foodItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      updateOrder(updatedItems);
    } else {
      const newItem: OrderItem = {
        food_item_id: foodItem.id,
        name: foodItem.name,
        price: foodItem.price,
        quantity: 1,
        special_instructions: ''
      };
      const updatedItems = [...currentOrder.items, newItem];
      updateOrder(updatedItems);
    }
  };

  const updateOrder = (items: OrderItem[]) => {
    if (!currentOrder) return;

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax_amount = subtotal * 0.1; // 10% VAT
    const total_amount = subtotal + tax_amount;

    setCurrentOrder({
      ...currentOrder,
      items,
      subtotal,
      tax_amount,
      total_amount
    });
  };

  const handleUpdateQuantity = (foodItemId: number, quantity: number) => {
    if (!currentOrder) return;

    if (quantity <= 0) {
      const updatedItems = currentOrder.items.filter(item => item.food_item_id !== foodItemId);
      updateOrder(updatedItems);
    } else {
      const updatedItems = currentOrder.items.map(item =>
        item.food_item_id === foodItemId
          ? { ...item, quantity }
          : item
      );
      updateOrder(updatedItems);
    }
  };

  const handleRemoveItem = (foodItemId: number) => {
    if (!currentOrder) return;

    const updatedItems = currentOrder.items.filter(item => item.food_item_id !== foodItemId);
    updateOrder(updatedItems);
  };

  const handleSendOrder = async () => {
    if (!currentOrder || currentOrder.items.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng thêm món ăn vào đơn hàng', severity: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentOrder,
          status: 'confirmed'
        }),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Đơn hàng đã được gửi đến bếp', severity: 'success' });
        
        // Update table status
        await fetch('/api/tables', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: selectedTable?.id,
            status: 'occupied'
          }),
        });

        // Reset order
        setCurrentOrder(null);
        setSelectedTable(null);
        await fetchTables();
      }
    } catch (error) {
      console.error('Error sending order:', error);
      setSnackbar({ open: true, message: 'Lỗi khi gửi đơn hàng', severity: 'error' });
    }
  };

  const handlePayment = async () => {
    if (!currentOrder) return;

    try {
      setLoading(true);
      
      // 1. Tạo invoice để ghi nhận doanh thu
      const { invoicesAPI } = await import('../services/api');
      const invoiceData = {
        customer_id: currentOrder.customer_id || undefined,
        employee_id: currentOrder.employee_id || 1,
        items: [
          {
            service_id: 1, // Dummy service ID for restaurant orders
            quantity: 1,
            unit_price: currentOrder.total_amount || 0,
          }
        ],
        discount_amount: 0,
        tax_amount: 0, // Bỏ thuế
        payment_method: 'cash',
        notes: `Restaurant Order: ${currentOrder.order_number || currentOrder.id}`
      };
      
      const invoiceResponse = await invoicesAPI.create(invoiceData);
      
      if (invoiceResponse.status === 200) {
        setSnackbar({ open: true, message: 'Thanh toán thành công! Hóa đơn đã được ghi nhận vào doanh thu.', severity: 'success' });
        
        // 2. Cập nhật order status thành 'served'
        const { orderAPI } = await import('../services/api');
        await orderAPI.updateOrder(currentOrder.id, {
          ...currentOrder,
          status: 'served'
        });

        // 3. Reset
        setCurrentOrder(null);
        setSelectedTable(null);
        setOpenPaymentDialog(false);
        await fetchTables();
      } else {
        setSnackbar({ open: true, message: 'Lỗi khi tạo hóa đơn', severity: 'error' });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setSnackbar({ open: true, message: 'Lỗi khi thanh toán', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredFoodItems = selectedCategory === 'all' 
    ? foodItems 
    : foodItems.filter(item => item.type === selectedCategory);

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'hidden' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🍽️ Restaurant POS System
      </Typography>

      <Grid container spacing={3} sx={{ height: 'calc(100vh - 120px)' }}>
        {/* Tables Section */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              <TableIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Chọn Bàn
            </Typography>
            <Grid container spacing={1}>
              {tables.map((table) => (
                <Grid item xs={6} key={table.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      opacity: table.status === 'occupied' ? 0.6 : 1,
                      '&:hover': {
                        boxShadow: 4,
                      }
                    }}
                    onClick={() => handleTableSelect(table)}
                  >
                    <CardContent sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="h6">{table.table_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {table.capacity} chỗ
                      </Typography>
                      <Chip
                        label={table.status === 'available' ? 'Trống' : 
                               table.status === 'occupied' ? 'Có khách' :
                               table.status === 'reserved' ? 'Đã đặt' : 'Dọn dẹp'}
                        color={table.status === 'available' ? 'success' : 
                               table.status === 'occupied' ? 'error' :
                               table.status === 'reserved' ? 'warning' : 'info'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Menu Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <RestaurantIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Thực Đơn
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Grid container spacing={1}>
              {filteredFoodItems.map((foodItem) => (
                <Grid item xs={12} key={foodItem.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      opacity: foodItem.is_available ? 1 : 0.6,
                      '&:hover': {
                        boxShadow: 4,
                      }
                    }}
                    onClick={() => foodItem.is_available && handleAddToOrder(foodItem)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {foodItem.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {foodItem.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={typeLabels[foodItem.type]}
                              color={typeColors[foodItem.type]}
                              size="small"
                            />
                            <Typography variant="body2">
                              {foodItem.preparation_time} phút
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="h6" color="primary">
                          {foodItem.price.toLocaleString()} VNĐ
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Order Section */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Đơn Hàng - {selectedTable?.table_name || 'Chưa chọn bàn'}
            </Typography>

            {currentOrder ? (
              <>
                {/* Table Selection */}
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Bàn đã chọn: <strong>{currentOrder.table_name}</strong>
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setCurrentOrder(null);
                      setSelectedTable(null);
                    }}
                  >
                    Chọn bàn khác
                  </Button>
                </Box>

                <TableContainer sx={{ flex: 1, mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Món ăn</TableCell>
                        <TableCell align="center">SL</TableCell>
                        <TableCell align="right">Giá</TableCell>
                        <TableCell align="right">Tổng</TableCell>
                        <TableCell align="center">Xóa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {item.name}
                            </Typography>
                            {item.special_instructions && (
                              <Typography variant="caption" color="text.secondary">
                                Ghi chú: {item.special_instructions}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantity(item.food_item_id, item.quantity - 1)}
                              >
                                <RemoveIcon />
                              </IconButton>
                              <Typography variant="body2">{item.quantity}</Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantity(item.food_item_id, item.quantity + 1)}
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {item.price.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {(item.price * item.quantity).toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(item.food_item_id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tạm tính:</Typography>
                    <Typography>{currentOrder.subtotal.toLocaleString()} VNĐ</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>VAT (10%):</Typography>
                    <Typography>{currentOrder.tax_amount.toLocaleString()} VNĐ</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <Typography variant="h6">Tổng cộng:</Typography>
                    <Typography variant="h6" color="primary">
                      {currentOrder.total_amount.toLocaleString()} VNĐ
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSendOrder}
                    disabled={currentOrder.items.length === 0}
                    sx={{ flex: 1 }}
                  >
                    Order
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PaymentIcon />}
                    onClick={() => setOpenPaymentDialog(true)}
                    disabled={currentOrder.items.length === 0}
                    sx={{ flex: 1 }}
                  >
                    Thanh Toán
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                textAlign: 'center'
              }}>
                <TableIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Vui lòng chọn bàn để bắt đầu
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thanh Toán</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Tổng tiền: {currentOrder?.total_amount.toLocaleString()} VNĐ
          </Typography>
          <TextField
            fullWidth
            label="Ghi chú thanh toán"
            multiline
            rows={3}
            value={currentOrder?.notes || ''}
            onChange={(e) => setCurrentOrder(prev => prev ? { ...prev, notes: e.target.value } : null)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Hủy</Button>
          <Button onClick={handlePayment} variant="contained">
            Xác Nhận Thanh Toán
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default RestaurantPOSPage;
