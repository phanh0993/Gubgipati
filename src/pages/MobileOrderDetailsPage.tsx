import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  TableRestaurant,
  AccessTime,
  Receipt,
  Print
} from '@mui/icons-material';

interface Order {
  id: number;
  order_number: string;
  table_id: number;
  status: string;
  order_type?: string;
  buffet_start_time?: string;
  created_at: string;
  table_name?: string;
  area?: string;
  employee_name?: string;
  total_amount?: number;
  customer_id?: number;
  employee_id?: number;
  subtotal?: number;
  tax_amount?: number;
  buffet_quantity?: number;
  buffet_package_name?: string;
  buffet_package_price?: number;
  food_items?: any[];
}

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  capacity: number;
  status: string;
  area: string;
}

const MobileOrderDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingQuantities, setEditingQuantities] = useState<any>({});
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch specific order
      const { orderAPI } = await import('../services/api');
      const orderResponse = await orderAPI.getOrderById(Number(orderId));
      if (orderResponse.status === 200) {
        const orderData = orderResponse.data;
        // Map items to food_items for compatibility
        if (orderData.items) {
          orderData.food_items = orderData.items.map((item: any) => ({
            food_item: {
              name: item.name,
              price: item.price
            },
            quantity: item.quantity,
            price: item.price
          }));
        }
        
        // Fetch buffet package info from database if missing
        if (orderData.buffet_quantity && (!orderData.buffet_package_name || !orderData.buffet_package_price)) {
          try {
            const { buffetAPI } = await import('../services/api');
            const packageResponse = await buffetAPI.getBuffetPackageById(orderData.buffet_package_id || 1);
            if (packageResponse.status === 200) {
              const packageData = packageResponse.data;
              orderData.buffet_package_name = packageData.name || 'Buffet Package';
              orderData.buffet_package_price = packageData.price || 0;
            }
          } catch (error) {
            console.error('Error fetching buffet package:', error);
            // Fallback values
            orderData.buffet_package_name = orderData.buffet_package_name || 'Buffet Package';
            orderData.buffet_package_price = orderData.buffet_package_price || 0;
          }
        }
        setOrder(orderData);
        
        // Fetch table info
        const { tableAPI } = await import('../services/api');
        const tablesResponse = await tableAPI.getTables();
        if (tablesResponse.status === 200) {
          const tablesData = tablesResponse.data;
          const tableInfo = tablesData.find((t: Table) => t.id === orderData.table_id);
          setTable(tableInfo);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeElapsed = (startTime: string) => {
    // Sử dụng buffet_start_time thay vì created_at để tính thời gian
    const start = new Date(startTime);
    const now = new Date();
    
    // Điều chỉnh timezone về GMT+7 (Việt Nam)
    const vietnamOffset = 7 * 60; // +7 giờ = 420 phút
    const startVietnam = new Date(start.getTime() + (start.getTimezoneOffset() + vietnamOffset) * 60000);
    const nowVietnam = new Date(now.getTime() + (now.getTimezoneOffset() + vietnamOffset) * 60000);
    
    // Tính toán chênh lệch thời gian chính xác
    const diffMs = nowVietnam.getTime() - startVietnam.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Nếu thời gian âm, sử dụng thời gian hiện tại
    if (diffMinutes < 0) {
      return 'Vừa tạo';
    }
    
    if (diffMinutes < 60) {
      return `${diffMinutes} phút`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}p`;
    }
  };

  const calculateTotalAmount = () => {
    if (!order) return 0;
    
    let total = 0;
    
    // Add buffet package amount
    if (order.buffet_quantity && order.buffet_package_price) {
      total += order.buffet_quantity * order.buffet_package_price;
    }
    
    // Add individual food items amount (only if food_items exist)
    if (order.food_items && order.food_items.length > 0) {
      order.food_items.forEach((item: any) => {
        total += (item.quantity || 1) * (item.price || 0);
      });
    }
    
    return total;
  };

  const handleBack = () => {
    navigate('/mobile-invoices');
  };

  const handlePrint = () => {
    // Implement print functionality
    window.print();
  };

  const handleQuantityChange = (type: 'buffet' | 'item', newQuantity: number, itemIndex?: number) => {
    if (!order) return;
    
    const newQuantities = { ...editingQuantities };
    
    if (type === 'buffet') {
      newQuantities.buffet_quantity = Math.max(0, newQuantity);
    } else if (type === 'item' && itemIndex !== undefined) {
      newQuantities[`item_${itemIndex}`] = Math.max(0, newQuantity);
    }
    
    setEditingQuantities(newQuantities);
  };

  const handleSaveChanges = async () => {
    if (!order) return;
    
    try {
      // Tính toán tổng tiền mới
      const newBuffetQuantity = editingQuantities.buffet_quantity !== undefined 
        ? editingQuantities.buffet_quantity 
        : (order.buffet_quantity || 0);
      const buffetTotal = (order.buffet_package_price || 0) * newBuffetQuantity;
      
      let itemsTotal = 0;
      const items = order.food_items || [];
      const updatedItems = items.map((item: any, index: number) => {
        const newQuantity = editingQuantities[`item_${index}`] !== undefined 
          ? editingQuantities[`item_${index}`] 
          : (item.quantity || 0);
        const itemTotal = (item.price || 0) * newQuantity;
        itemsTotal += itemTotal;
        return {
          ...item,
          quantity: newQuantity,
          total: itemTotal
        };
      });
      
      const newSubtotal = buffetTotal + itemsTotal;
      const newTax = 0; // Bỏ thuế
      const newTotal = newSubtotal + newTax;
      
      // Cập nhật order
      const { orderAPI } = await import('../services/api');
      const response = await orderAPI.updateOrder(order.id, {
        buffet_quantity: newBuffetQuantity,
        subtotal: newSubtotal,
        tax_amount: newTax,
        total_amount: newTotal,
        items: updatedItems.map((item: any) => ({
          food_item_id: item.food_item?.id || item.food_item_id || null,
          name: item.food_item?.name || item.name,
          price: item.price || 0,
          quantity: item.quantity,
          total: (item.price || 0) * item.quantity,
          special_instructions: item.special_instructions || '',
          printer_id: null
        }))
      });
      
      if (response.status === 200) {
        alert('Cập nhật thành công!');
        setEditingQuantities({});
        fetchOrderDetails();
      } else {
        alert('Lỗi khi cập nhật order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Lỗi khi cập nhật order');
    }
  };

  const handlePayment = async () => {
    if (!order || paymentLoading) return;
    
    try {
      setPaymentLoading(true);
      
      // Lấy thông tin nhân viên từ localStorage
      const employee = localStorage.getItem('pos_employee');
      const employeeData = employee ? JSON.parse(employee) : null;
      
      // 1. Tạo invoice trước để ghi nhận doanh thu
      const invoiceData = {
        customer_id: order.customer_id || undefined,
        employee_id: employeeData?.id || order.employee_id || 14,
        items: [
          {
            service_id: 1, // Dummy service ID for orders
            quantity: 1,
            unit_price: order.total_amount || 0,
          }
        ],
        discount_amount: 0,
        tax_amount: 0, // Bỏ thuế
        payment_method: 'cash',
        notes: `Order: ${order.order_number || order.id} - NV: ${employeeData?.fullname || 'Unknown'}`
      };
      
      const { invoicesAPI } = await import('../services/api');
      const invoiceResponse = await invoicesAPI.create(invoiceData);
      
      if (invoiceResponse.status === 200) {
        // 2. Cập nhật trạng thái order thành 'paid' sau khi tạo invoice thành công
        const { orderAPI } = await import('../services/api');
        const response = await orderAPI.updateOrder(order.id, { status: 'paid' });

        if (response.status === 200) {
          // 3. In bill
          await handlePrint();
          
          alert('Thanh toán thành công! Hóa đơn đã được ghi nhận vào doanh thu và in bill.');
          navigate('/mobile-invoices');
        } else {
          alert('Hóa đơn đã được tạo nhưng lỗi khi cập nhật trạng thái order');
        }
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

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
              Chi Tiết Hóa Đơn
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Đang tải...</Typography>
        </Box>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
              Chi Tiết Hóa Đơn
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Không tìm thấy hóa đơn</Typography>
        </Box>
      </Box>
    );
  }

  const totalAmount = calculateTotalAmount();

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Chi Tiết Hóa Đơn
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* Order Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              {order.order_number}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Bàn
                </Typography>
                <Typography variant="h6">
                  {table?.table_name || `Bàn ${order.table_id}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Khu vực
                </Typography>
                <Typography variant="h6">
                  Khu {table?.area || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Thời gian
                </Typography>
                <Typography variant="h6">
                  {getTimeElapsed(order.buffet_start_time || order.created_at)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Nhân viên
                </Typography>
                <Typography variant="h6">
                  {(() => {
                    const employee = localStorage.getItem('pos_employee');
                    const employeeData = employee ? JSON.parse(employee) : null;
                    return employeeData?.fullname || employeeData?.full_name || order.employee_name || 'Chưa xác định';
                  })()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Chi Tiết Đơn Hàng
            </Typography>
            
            <List>
              {/* Buffet Package */}
              {order.buffet_quantity && order.buffet_package_name && order.buffet_package_price && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {order.buffet_package_name}
                          </Typography>
                          <TextField
                            type="number"
                            value={editingQuantities.buffet_quantity !== undefined ? editingQuantities.buffet_quantity : order.buffet_quantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange('buffet', parseInt(e.target.value) || 0)}
                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                            sx={{ width: '60px' }}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {((editingQuantities.buffet_quantity !== undefined ? editingQuantities.buffet_quantity : order.buffet_quantity) * order.buffet_package_price).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              )}
              
              {/* Food Items */}
              {order.food_items && order.food_items.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  {order.food_items.map((item: any, index: number) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {item.food_item?.name || 'Món ăn'}
                              </Typography>
                              <TextField
                                type="number"
                                value={editingQuantities[`item_${index}`] !== undefined ? editingQuantities[`item_${index}`] : (item.quantity || 1)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange('item', parseInt(e.target.value) || 0, index)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                sx={{ width: '50px' }}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="primary.main">
                              {((editingQuantities[`item_${index}`] !== undefined ? editingQuantities[`item_${index}`] : (item.quantity || 1)) * (item.price || 0)).toLocaleString('vi-VN')} ₫
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </>
              )}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Tổng cộng:
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {totalAmount.toLocaleString('vi-VN')} ₫
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: 'column' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSaveChanges}
            sx={{ width: '100%' }}
          >
            Lưu thay đổi
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{ flex: 1 }}
            >
              In Hóa Đơn
            </Button>
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={handlePayment}
              disabled={paymentLoading}
              sx={{ flex: 1 }}
            >
              {paymentLoading ? 'Đang xử lý...' : 'Thanh Toán'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MobileOrderDetailsPage;
