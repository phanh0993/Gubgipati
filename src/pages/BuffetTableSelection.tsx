import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  TextField,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  TableRestaurant,
  Logout,
  AccessTime,
  Receipt,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { getTimeElapsed, formatVietnamDateTime } from '../utils/timeUtils';

interface Table {
  id: number;
  table_name: string;
  area: string;
  table_number: string;
  capacity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  order_number: string;
  table_id: number;
  status: string;
  buffet_start_time: string;
  buffet_duration_minutes: number;
  created_at: string;
  table_name: string;
  area: string;
  total_amount?: number;
}

const BuffetTableSelection: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const canEdit = user?.role === 'manager' || user?.role === 'admin';
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('A');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState<any>({});
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const employee = localStorage.getItem('pos_employee');
    if (employee) {
      setCurrentEmployee(JSON.parse(employee));
    }
    fetchData();
    
    // Auto-refresh every 5 seconds để cập nhật real-time
    const interval = setInterval(() => {
      fetchData(true); // Hiển thị indicator khi auto-refresh
    }, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showIndicator = false) => {
    try {
      if (showIndicator) {
        setIsRefreshing(true);
      }
      
      const { tableAPI, orderAPI } = await import('../services/api');
      const [tablesRes, ordersRes] = await Promise.all([
        tableAPI.getTables(),
        orderAPI.getOrders()
      ]);

      const tablesData = tablesRes.data;
      const ordersData = ordersRes.data;

      console.log('Tables data:', tablesData);
      console.log('Orders data:', ordersData);

      // Đảm bảo tablesData là array
      if (Array.isArray(tablesData)) {
        setTables(tablesData);
      } else {
        console.error('Tables data is not an array:', tablesData);
        setTables([]);
      }

      // Lọc chỉ lấy orders buffet và chưa thanh toán
      if (Array.isArray(ordersData)) {
        const buffetOrders = ordersData.filter(order => 
          order.order_type === 'buffet' && order.status === 'pending'
        );
        
        // Map table info to orders
        const ordersWithTableInfo = buffetOrders.map(order => {
          const table = tablesData.find(t => t.id === order.table_id);
          return {
            ...order,
            table_name: table?.table_name || `Bàn ${order.table_id}`,
            area: table?.area || 'Unknown'
          };
        });
        
        setOrders(ordersWithTableInfo);
        console.log('Buffet orders with table info:', ordersWithTableInfo);
      } else {
        console.error('Orders data is not an array:', ordersData);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTables([]);
      setOrders([]);
    } finally {
      if (showIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  const getTableStatus = (table: Table) => {
    const hasUnpaidOrder = orders.some(order => 
      order.table_id === table.id && order.status === 'pending'
    );
    return hasUnpaidOrder ? 'busy' : 'empty';
  };

  const getTableOrder = (table: Table) => {
    return orders.find(order => 
      order.table_id === table.id && order.status === 'pending'
    );
  };

  // Function gộp món trùng nhau
  const mergeDuplicateItems = (items: any[]) => {
    if (!items || items.length === 0) return [];
    
    const mergedItems: { [key: string]: any } = {};
    
    items.forEach(item => {
      const key = `${item.food_item_id || item.id || item.name}-${Number(item.price || 0)}`;
      if (mergedItems[key]) {
        // Nếu đã có món này, cộng dồn số lượng
        mergedItems[key].quantity += item.quantity || 1;
      } else {
        // Nếu chưa có, tạo mới
        mergedItems[key] = {
          ...item,
          quantity: item.quantity || 1
        };
      }
    });
    
    return Object.values(mergedItems);
  };

  const getStatusText = (table: Table) => {
    const status = getTableStatus(table);
    switch (status) {
      case 'empty': return 'Trống';
      case 'busy': return 'Có khách';
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

  const handleSelectTable = (table: Table) => {
    // Chuyển đến trang chọn thực đơn buffet
    navigate('/buffet-menu', { 
      state: { 
        selectedTable: table,
        currentOrder: getTableOrder(table)
      } 
    });
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
    setShowOrderDialog(true);
  };

  const handleQuantityChange = (type: 'buffet' | 'item', newQuantity: number, itemIndex?: number) => {
    if (!orderDetails) return;
    
    console.log('🔍 Quantity change:', { type, newQuantity, itemIndex, currentQuantities: editingQuantities });
    
    const newQuantities = { ...editingQuantities };
    
    if (type === 'buffet') {
      newQuantities.buffet_quantity = Math.max(0, newQuantity);
    } else if (type === 'item' && itemIndex !== undefined) {
      newQuantities[`item_${itemIndex}`] = Math.max(0, newQuantity);
    }
    
    console.log('🔍 New quantities:', newQuantities);
    setEditingQuantities(newQuantities);
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder || !orderDetails) return;
    
    try {
      // Tính toán tổng tiền mới
      const newBuffetQuantity = editingQuantities.buffet_quantity !== undefined 
        ? editingQuantities.buffet_quantity 
        : (orderDetails.buffet_quantity || 0);
      const buffetTotal = (orderDetails.buffet_package_price || 0) * newBuffetQuantity;
      
      let itemsTotal = 0;
      const items = mergeDuplicateItems(orderDetails.items);
      
      // Cập nhật từng món ăn riêng lẻ (thay thế, không cộng dồn)
      const { orderAPI } = await import('../services/api');
      
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const newQuantity = editingQuantities[`item_${index}`] !== undefined 
          ? editingQuantities[`item_${index}`] 
          : (item.quantity || 0);
        
        if (newQuantity !== item.quantity) {
          // Cập nhật số lượng món ăn (thay thế hoàn toàn)
          await orderAPI.updateOrderItemQuantity(selectedOrder.id, item.food_item_id, newQuantity);
        }
        
        const itemTotal = (item.price || 0) * newQuantity;
        itemsTotal += itemTotal;
      }
      
      const newSubtotal = buffetTotal + itemsTotal;
      const newTax = 0; // Bỏ thuế
      const newTotal = newSubtotal + newTax;
      
      // Cập nhật thông tin tổng của order
      await orderAPI.updateOrder(selectedOrder.id, {
        buffet_quantity: newBuffetQuantity,
        subtotal: newSubtotal,
        tax_amount: newTax,
        total_amount: newTotal
      });

      alert('Cập nhật thành công!');
      setEditingQuantities({});
      // Cập nhật lại orderDetails với dữ liệu mới
      await fetchOrderDetails(selectedOrder.id);
      fetchData();
      setShowOrderDialog(false);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Lỗi khi cập nhật order');
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const { orderAPI } = await import('../services/api');
      const res = await orderAPI.getOrderById(orderId);
      console.log('🔍 Order details from API:', res.data);
      console.log('🔍 Items in order details:', res.data?.items);
      setOrderDetails(res.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder || !orderDetails || paymentLoading) return;
    
    try {
      setPaymentLoading(true);
      const { orderAPI, invoicesAPI } = await import('../services/api');
      
      // Helper: timeout wrapper to avoid long-hanging requests
      const withTimeout = async <T,>(p: Promise<T>, ms = 8000): Promise<T> => {
        return await Promise.race<T>([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)) as Promise<T>
        ]);
      };
      
      // 1. Tạo invoice trước để ghi nhận doanh thu
      const invoiceData = {
        customer_id: orderDetails.customer_id || undefined,
        employee_id: orderDetails.employee_id || 14,
        items: [
          {
            service_id: 1, // Dummy service ID for buffet orders
            quantity: 1,
            unit_price: orderDetails.total_amount || 0,
          }
        ],
        discount_amount: 0,
        tax_amount: 0, // Bỏ thuế
        payment_method: 'cash',
        notes: `Buffet Order: ${orderDetails.order_number} - Table: ${orderDetails.table_name} (${orderDetails.area})`
      };
      
      const invoiceResponse = await withTimeout(invoicesAPI.create(invoiceData), 12000);
      
      if (invoiceResponse.status === 200) {
        // 2. Cập nhật order status thành paid sau khi tạo invoice thành công
        try {
          await withTimeout(orderAPI.updateOrder(selectedOrder.id, { status: 'paid' }), 8000);
        } catch (e) {
          console.warn('Update order status timeout/failed, continue:', e);
        }
        
        // 3. In hóa đơn thanh toán (chỉ món có tiền > 0)
        try {
          const orderData = {
            id: selectedOrder.id,
            table_id: selectedOrder.table_id,
            created_at: selectedOrder.created_at,
            total_amount: selectedOrder.total_amount,
            customer_name: 'Khách lẻ',
            notes: ''
          };

          // Tạo danh sách items chỉ có món có tiền > 0
          const items = [];
          
          // 1. Thêm vé buffet nếu có (vé buffet luôn có tiền)
          if (orderDetails.buffet_package_id && orderDetails.buffet_quantity > 0) {
            items.push({
              id: 'buffet_package',
              name: orderDetails.buffet_package_name || 'Vé Buffet',
              quantity: orderDetails.buffet_quantity,
              price: orderDetails.buffet_package_price || 0,
              special_instructions: 'Vé buffet'
            });
          }
          
          // 2. Thêm món dịch vụ (chỉ món có tiền > 0)
          if (orderDetails.order_items && orderDetails.order_items.length > 0) {
            orderDetails.order_items.forEach((item: any) => {
              if (item.price > 0) { // Chỉ thêm món có tiền > 0
                items.push({
                  id: item.food_item_id,
                  name: item.food_item?.name || 'Món không xác định',
                  quantity: item.quantity,
                  price: item.price || 0,
                  special_instructions: item.special_instructions || ''
                });
              }
            });
          }

          console.log('💰 [PAYMENT] Items to print:', items);
          console.log('💰 [PAYMENT] Order data:', orderData);

          const { invoicePrintAPI } = await import('../services/api');
          await invoicePrintAPI.processInvoicePrint(orderData, items, true);
          console.log('✅ Payment invoice printed');
        } catch (printError) {
          console.error('❌ Payment invoice print failed:', printError);
        }
        
        alert('Thanh toán thành công! Hóa đơn đã được ghi nhận vào doanh thu và in bill.');
        setShowOrderDialog(false);
        fetchData(); // Reload all data
      } else {
        alert('Lỗi khi tạo hóa đơn doanh thu');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Lỗi khi thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePrintBill = async () => {
    if (!selectedOrder || !orderDetails) return;
    
    try {
      // Lấy thông tin đầy đủ của order
      const orderData = {
        id: selectedOrder.id,
        table_id: selectedOrder.table_id,
        created_at: selectedOrder.created_at,
        total_amount: selectedOrder.total_amount,
        customer_name: 'Khách lẻ',
        notes: ''
      };

      // Tạo danh sách items đầy đủ (vé buffet + món ăn)
      const items = [];
      
      // 1. Thêm vé buffet nếu có
      if (orderDetails.buffet_package_id && orderDetails.buffet_quantity > 0) {
        items.push({
          id: 'buffet_package',
          name: orderDetails.buffet_package_name || 'Vé Buffet',
          quantity: orderDetails.buffet_quantity,
          price: orderDetails.buffet_package_price || 0,
          special_instructions: 'Vé buffet'
        });
      }
      
      // 2. Thêm món ăn từ order_items
      if (orderDetails.order_items && orderDetails.order_items.length > 0) {
        orderDetails.order_items.forEach((item: any) => {
          items.push({
            id: item.food_item_id,
            name: item.food_item?.name || 'Món không xác định',
            quantity: item.quantity,
            price: item.price || 0,
            special_instructions: item.special_instructions || ''
          });
        });
      }

      console.log('🖨️ [PRINT BILL] Items to print:', items);
      console.log('🖨️ [PRINT BILL] Order data:', orderData);

      // In full bill (tất cả món)
      const { invoicePrintAPI } = await import('../services/api');
      await invoicePrintAPI.processInvoicePrint(orderData, items, false);
      console.log('✅ Full bill printed');
      alert('In bill thành công!');
    } catch (error) {
      console.error('Error printing bill:', error);
      alert('Lỗi khi in hóa đơn');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_employee');
    navigate('/pos-login');
  };

  const areas = ['A', 'B', 'C', 'D'];
  const filteredTables = tables.filter(table => table.area === selectedArea);
  const busyTables = filteredTables.filter(table => getTableStatus(table) === 'busy');
  const emptyTables = filteredTables.filter(table => getTableStatus(table) === 'empty');

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🍽️ Buffet POS - Chọn Bàn
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentEmployee?.fullname || 'Nhân viên'}
          </Typography>
          {isRefreshing && (
            <Typography variant="body2" sx={{ mr: 2, color: 'yellow.300' }}>
              🔄 Đang cập nhật...
            </Typography>
          )}
          <IconButton 
            color="inherit" 
            onClick={() => fetchData(true)}
            title="Làm mới dữ liệu"
          >
            <Refresh />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Thống kê */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="primary">
                Tổng số đơn: {orders.filter(o => o.status !== 'paid').length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Bàn trống: {emptyTables.length}/{filteredTables.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Chọn Bàn" icon={<TableRestaurant />} />
            <Tab label="Danh Sách Hóa Đơn" icon={<Receipt />} />
          </Tabs>
        </Paper>

        {/* Tab Chọn Bàn */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Danh sách khu */}
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chọn Khu
                  </Typography>
                  <List>
                    {areas.map((area) => (
                      <ListItem
                        key={area}
                        button
                        selected={selectedArea === area}
                        onClick={() => setSelectedArea(area)}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: selectedArea === area ? 'primary.light' : 'transparent',
                          color: selectedArea === area ? 'white' : 'inherit'
                        }}
                      >
                        <ListItemText 
                          primary={`KHU ${area}`}
                          secondary={`${tables.filter(t => t.area === area && getTableStatus(t) === 'empty').length} bàn trống`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Lưới bàn */}
            <Grid item xs={9}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    KHU {selectedArea} - Chọn Bàn
                  </Typography>
                  <Grid container spacing={2}>
                    {filteredTables.map((table) => {
                      const tableOrder = getTableOrder(table);
                      const isBusy = getTableStatus(table) === 'busy';
                      
                      return (
                        <Grid item xs={4} key={table.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              border: 2,
                              borderColor: isBusy ? 'error.main' : 'success.main',
                              height: '200px', // Chiều cao cố định cho tất cả thẻ
                              display: 'flex',
                              flexDirection: 'column',
                              '&:hover': {
                                boxShadow: 4,
                                transform: 'scale(1.02)'
                              },
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleSelectTable(table)}
                          >
                            <CardContent sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              {/* Phần trên: Icon và thông tin bàn */}
                              <Box>
                                <TableRestaurant 
                                  sx={{ 
                                    fontSize: 40, 
                                    color: isBusy ? 'error.main' : 'success.main', 
                                    mb: 1 
                                  }} 
                                />
                                <Typography variant="h6">
                                  Bàn {table.table_number}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Sức chứa: {table.capacity}
                                </Typography>
                              </Box>
                              
                              {/* Phần giữa: Thông tin order hoặc placeholder */}
                              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isBusy && tableOrder ? (
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Chip
                                      icon={<AccessTime />}
                                      label={getTimeElapsed(tableOrder.buffet_start_time || tableOrder.created_at)}
                                      color="error"
                                      size="small"
                                    />
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                      Đã order: {tableOrder.order_number}
                                    </Typography>
                                  </Box>
                                ) : (
                                  // Placeholder để giữ chiều cao đồng nhất
                                  <Box sx={{ height: '40px' }} />
                                )}
                              </Box>
                              
                              {/* Phần dưới: Status chip */}
                              <Box>
                                <Chip
                                  label={getStatusText(table)}
                                  color={getStatusColor(table) as any}
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab Danh Sách Hóa Đơn */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Danh Sách Hóa Đơn Buffet
              </Typography>
              <List>
                {orders.filter(o => o.status !== 'paid').map((order) => (
                  <ListItem
                    key={order.id}
                    button
                    onClick={() => handleSelectOrder(order)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      primary={order.order_number}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Bàn: {order.table_name} - Khu {order.area}
                          </Typography>
                          <Typography variant="body2">
                            Thời gian: {getTimeElapsed(order.buffet_start_time || order.created_at)}
                          </Typography>
                          <Typography variant="body2">
                            Tổng: {order.total_amount ? order.total_amount.toLocaleString('vi-VN') : '0'} ₫
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={order.status === 'pending' ? 'Chờ xử lý' : 'Đang xử lý'}
                      color={order.status === 'pending' ? 'warning' : 'info'}
                      size="small"
                    />
                  </ListItem>
                ))}
                {orders.filter(o => o.status !== 'paid').length === 0 && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Chưa có hóa đơn nào
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Dialog Chi Tiết Hóa Đơn */}
      <Dialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi Tiết Hóa Đơn - {selectedOrder?.order_number}
        </DialogTitle>
        <DialogContent>
          {orderDetails && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông Tin Bàn
              </Typography>
              <Typography variant="body2">
                Bàn: {orderDetails?.table_name || selectedOrder?.table_name || 'N/A'} - Khu {orderDetails?.area || selectedOrder?.area || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Thời gian: {orderDetails ? getTimeElapsed(orderDetails.buffet_start_time || orderDetails.created_at) : (selectedOrder ? getTimeElapsed(selectedOrder.buffet_start_time || selectedOrder.created_at) : '')}
              </Typography>
              <Typography variant="body2">
                Nhân viên order: {orderDetails?.employee_name || 'Chưa xác định'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thời gian tạo: {orderDetails ? formatVietnamDateTime(orderDetails.created_at) : (selectedOrder ? formatVietnamDateTime(selectedOrder.created_at) : '')}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Hiển thị thông tin vé buffet */}
              {/* Hiển thị vé như item trong danh sách bên dưới, bỏ ô chỉnh vé riêng để tránh lệch */}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Món Đã Order
              </Typography>
              {(() => {
                console.log('🔍 Rendering items:', orderDetails.items);
                console.log('🔍 Items length:', orderDetails.items?.length);
                
                if (!orderDetails.items || orderDetails.items.length === 0) {
                  return <Typography color="text.secondary">Chưa có món nào</Typography>;
                }

                // Tách vé buffet và món ăn
                const buffetItems = orderDetails.items.filter((item: any) => item.is_ticket === true || item.food_item_id === orderDetails.buffet_package_id);
                const foodItems = orderDetails.items.filter((item: any) => !item.is_ticket && item.food_item_id !== orderDetails.buffet_package_id);

                return (
                  <>
                    {/* Hiển thị vé buffet ở đầu với điều chỉnh số lượng */}
                    {buffetItems.length > 0 && (
                      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#000' }}>
                          Vé buffet:
                        </Typography>
                        {buffetItems.map((item: any, index: number) => {
                          const ticketPrice = orderDetails.buffet_package_price || 0;
                          const ticketCount = item.quantity || 1;
                          return (
                            <Box key={`buffet-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: '#000', // Đổi từ xanh về đen
                                  flex: 1
                                }}
                              >
                                VÉ {Math.round(ticketPrice / 1000)}K
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    // Giảm số lượng vé
                                    const newQuantity = Math.max(0, ticketCount - 1);
                                    if (newQuantity === 0) {
                                      // Xóa dòng vé này
                                      console.log('Xóa vé buffet');
                                    } else {
                                      // Cập nhật số lượng
                                      console.log('Giảm số lượng vé:', newQuantity);
                                    }
                                  }}
                                  sx={{ minWidth: '32px', height: '32px' }}
                                >
                                  -
                                </Button>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 'bold', 
                                    color: '#000',
                                    minWidth: '40px',
                                    textAlign: 'center'
                                  }}
                                >
                                  {ticketCount}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    // Tăng số lượng vé
                                    const newQuantity = ticketCount + 1;
                                    console.log('Tăng số lượng vé:', newQuantity);
                                  }}
                                  sx={{ minWidth: '32px', height: '32px' }}
                                >
                                  +
                                </Button>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Hiển thị món ăn */}
                    {foodItems.length > 0 && (
                      <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Món ăn:
                        </Typography>
                        <List dense>
                          {mergeDuplicateItems(foodItems).map((item: any, index: number) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={item.name}
                                secondary={`Giá: ${item.price.toLocaleString('vi-VN')} ₫`}
                              />
                              <TextField
                                type="number"
                                value={editingQuantities[`item_${index}`] !== undefined ? editingQuantities[`item_${index}`] : item.quantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange('item', parseInt(e.target.value) || 0, index)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                sx={{ width: '80px' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </>
                );
              })()}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Tổng: {(() => {
                    console.log('🔍 Total amount calculation:', {
                      total_amount: orderDetails.total_amount,
                      buffet_price: orderDetails.buffet_package_price,
                      buffet_quantity: orderDetails.buffet_quantity,
                      items: orderDetails.items?.length || 0
                    });
                    return orderDetails.total_amount?.toLocaleString('vi-VN') || '0';
                  })()} ₫
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOrderDialog(false)}>
            Đóng
          </Button>
          <Button onClick={handleSaveChanges} variant="outlined" color="primary" disabled={!canEdit}>
            Lưu thay đổi
          </Button>
          <Button onClick={handlePrintBill} variant="outlined" color="info">
            In Bill
          </Button>
          <Button 
            onClick={handlePayment} 
            variant="contained" 
            color="success"
            disabled={paymentLoading}
          >
            {paymentLoading ? 'Đang xử lý...' : 'Thanh Toán'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BuffetTableSelection;
