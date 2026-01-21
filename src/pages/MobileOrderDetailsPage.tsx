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
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowBack,
  TableRestaurant,
  AccessTime
} from '@mui/icons-material';
import { getTimeElapsed } from '../utils/timeUtils';

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
  buffet_package_id?: number;
  buffet_package_name?: string;
  buffet_package_price?: number;
  food_items?: any[];
  notes?: string;
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
  const { user } = useAuth();
  const canEdit = user?.role === 'manager' || user?.role === 'admin';
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
        // Map items to food_items for compatibility (treat tickets as items)
        if (orderData.items) {
          orderData.food_items = orderData.items.map((item: any) => ({
            food_item: {
              name: item.name,
              price: item.price
            },
            name: item.name,
            food_item_id: item.food_item_id,
            quantity: item.quantity,
            price: item.price,
            special_instructions: item.special_instructions || ''
          }));
        }

        // Fetch buffet package info from database (based on buffet_package_id)
        if (orderData.buffet_package_id && (!orderData.buffet_package_name || !orderData.buffet_package_price)) {
          try {
            const { buffetAPI } = await import('../services/api');
            const packageResponse = await buffetAPI.getBuffetPackageById(orderData.buffet_package_id);
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

        // Đọc số vé thực tế từ order_buffet thay vì dùng buffet_quantity cũ
        if (orderData.buffet_package_id) {
          try {
            const { supabase } = await import('../services/supabaseClient');
            const { data: buffetTickets, error: buffetError } = await supabase
              .from('order_buffet')
              .select('quantity')
              .eq('order_id', orderData.id);
            
            if (!buffetError && buffetTickets && buffetTickets.length > 0) {
              const totalTicketQuantity = buffetTickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
              orderData.buffet_quantity = totalTicketQuantity;
              console.log(`🎫 [Mobile Order Details] Order ${orderData.id}: Found ${buffetTickets.length} ticket rows, total quantity: ${totalTicketQuantity}`);
            } else {
              console.log(`🎫 [Mobile Order Details] Order ${orderData.id}: No tickets found in order_buffet`);
              orderData.buffet_quantity = 0;
            }
          } catch (e) {
            console.warn(`🎫 [Mobile Order Details] Failed to read order_buffet for order ${orderData.id}:`, e);
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

  const calculateTotalAmount = () => {
    if (!order) return 0;
    
    // Tính tổng từ vé buffet
    const buffetTotal = (order.buffet_quantity || 0) * (order.buffet_package_price || 0);
    
    // Tính tổng từ món ăn
    const itemsTotal = (order.food_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1) * (item.price || 0), 0);
    
    return buffetTotal + itemsTotal;
  };

  const handleBack = () => {
    navigate('/mobile-invoices');
  };

  const handlePrint = async () => {
    try {
      if (!order) return;
      
      console.log('🖨️ [MOBILE] Bắt đầu in bill...');
      
      // Lấy items từ order (BỎ vé buffet nếu có trong items)
      const items = (order.food_items || [])
        .filter((item: any) => {
          // Bỏ items có note "Vé buffet"
          const note = item.special_instructions || item.note || '';
          return !note.includes('Vé buffet') && !note.includes('vé buffet');
        })
        .map((item: any) => ({
          name: item.name || item.food_item?.name || 'Món không xác định',
          quantity: item.quantity || 1,
          price: item.price || 0,
          note: item.special_instructions || ''
        }));
      
      // Tạo bill data
      const billData = {
        orderNumber: order.order_number || `ORD-${order.id}`,
        tableName: order.table_name || `Bàn ${order.table_id}`,
        area: order.area || '',
        staffName: order.employee_name || 'N/A',
        customerName: 'Khách lẻ',
        items,
        buffetPackageName: order.buffet_package_name,
        buffetQuantity: order.buffet_quantity,
        buffetPrice: order.buffet_package_price,
        totalAmount: order.total_amount || 0,
        createdAt: order.created_at
      };
      
      console.log('📄 Bill data:', billData);
      
      // In bill qua helper function (FULL món)
      const { printBill } = await import('../utils/billImageGenerator');
      const result = await printBill(billData, 'POS-80C', false, false);
      
      if (result.success) {
        alert('✅ Hóa đơn đã được tạo!\n\n(In tự động chỉ dùng cho PC. Mobile có thể tải ảnh bill nếu cần)');
      } else {
        alert(`⚠️ ${result.message}`);
      }
    } catch (e) {
      console.warn('❌ Error:', e);
      alert('Lỗi tạo bill');
    }
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
      // Tính lại items như nguồn sự thật (bao gồm vé buffet như item)
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
      
      // Tính tổng vé buffet nếu có thay đổi
      const newBuffetQuantity = editingQuantities.buffet_quantity !== undefined 
        ? editingQuantities.buffet_quantity 
        : (order.buffet_quantity || 0);
      const buffetTotal = newBuffetQuantity * (order.buffet_package_price || 0);
      
      const newSubtotal = itemsTotal + buffetTotal;
      const newTax = 0; // Bỏ thuế
      const newTotal = newSubtotal + newTax;
      
      // Cập nhật order - bao gồm cả buffet_quantity nếu có thay đổi
      const { orderAPI } = await import('../services/api');
      
      // Lọc items để chỉ giữ những item có food_item_id hợp lệ
      const validItems = updatedItems
        .filter((item: any) => {
          const foodItemId = item.food_item_id || item.food_item?.id;
          if (!foodItemId) {
            console.warn('⚠️ Skipping item without food_item_id:', item);
            return false;
          }
          return true;
        })
        .map((item: any) => ({
          food_item_id: item.food_item_id || item.food_item?.id,
          name: item.food_item?.name || item.name || 'Món không xác định',
          price: item.price || 0,
          quantity: item.quantity || 0,
          total: (item.price || 0) * (item.quantity || 0),
          special_instructions: item.special_instructions || item.note || '',
          printer_id: null
        }));
      
      const updateData: any = {
        subtotal: newSubtotal,
        tax_amount: newTax,
        total_amount: newTotal,
        items: validItems
      };
      
      // Chỉ cập nhật buffet_quantity nếu có thay đổi và có buffet_package_id
      if (editingQuantities.buffet_quantity !== undefined && order.buffet_package_id) {
        // Tính số vé cần thêm (có thể âm nếu giảm)
        const currentBuffetQuantity = order.buffet_quantity || 0;
        const additionalQty = newBuffetQuantity - currentBuffetQuantity;
        
        if (additionalQty !== 0) {
          updateData.buffet_quantity = additionalQty; // Gửi số vé thêm/bớt, API sẽ tự cộng dồn
          updateData.buffet_package_id = order.buffet_package_id; // Đảm bảo có buffet_package_id
        }
      }
      
      console.log('📝 [UPDATE ORDER] Update data:', updateData);
      
      const response = await orderAPI.updateOrder(order.id, updateData);
      
      if (response.status === 200) {
        alert('Cập nhật thành công!');
        setEditingQuantities({});
        fetchOrderDetails();
      } else {
        console.error('❌ [UPDATE ORDER] Response error:', response);
        alert('Lỗi khi cập nhật order. Status: ' + response.status);
      }
    } catch (error) {
      console.error('❌ [UPDATE ORDER] Error updating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [UPDATE ORDER] Error details:', errorMessage);
      alert('Lỗi khi cập nhật order: ' + errorMessage);
    }
  };

  const handlePayment = async () => {
    if (!order || paymentLoading) return;
    
    try {
      setPaymentLoading(true);
      
      // Lấy thông tin nhân viên từ localStorage - ưu tiên mobile login
      const mobileEmployee = localStorage.getItem('mobile_employee');
      const posEmployee = localStorage.getItem('pos_employee');
      let employeeData = null;
      if (mobileEmployee) {
        try {
          employeeData = JSON.parse(mobileEmployee);
        } catch (e) {
          console.error('Error parsing mobile employee:', e);
        }
      } else if (posEmployee) {
        try {
          employeeData = JSON.parse(posEmployee);
        } catch (e) {
          console.error('Error parsing pos employee:', e);
        }
      }
      
      // 1. Tạo invoice trước để ghi nhận doanh thu (truyền đầy đủ items để tránh fallback chậm)
      const mappedItems = (order.food_items || []).map((it: any) => ({
        service_id: it.food_item_id || it.food_item?.id || null,
        quantity: Number(it.quantity || 0),
        unit_price: Number(it.price || 0)
      }));

      const invoiceData = {
        customer_id: order.customer_id || undefined,
        employee_id: employeeData?.id || order.employee_id || 14,
        order_id: order.id,
        order_number: order.order_number,
        items: mappedItems.length > 0 ? mappedItems : [
          { service_id: 1, quantity: 1, unit_price: Number(order.total_amount || 0) }
        ],
        discount_amount: 0,
        tax_amount: 0, // Bỏ thuế
        payment_method: 'cash',
        notes: `Order: ${order.order_number || order.id} - NV: ${employeeData?.fullname || 'Unknown'}`
      } as any;
      
      const { invoicesAPI } = await import('../services/api');
      // Thêm timeout để tránh treo
      const withTimeout = async <T,>(p: Promise<T>, ms = 12000): Promise<T> => {
        return await Promise.race<T>([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)) as Promise<T>
        ]);
      };

      const invoiceResponse = await withTimeout(invoicesAPI.create(invoiceData), 12000);
      
      if (invoiceResponse.status === 200) {
        // 2. Cập nhật trạng thái order thành 'paid' sau khi tạo invoice thành công
        const { orderAPI } = await import('../services/api');
        let response;
        try {
          response = await withTimeout(orderAPI.updateOrder(order.id, { status: 'paid' }), 8000);
        } catch (e) {
          console.warn('Update order status timeout/failed, continue:', e);
          response = { status: 200 } as any; // tiếp tục điều hướng
        }

        if (response.status === 200) {
          // 3. In hóa đơn thanh toán (chỉ món có tiền > 0)
          try {
            const orderData = {
              id: order.id,
              table_id: order.table_id,
              created_at: order.created_at,
              total_amount: order.total_amount,
              customer_name: 'Khách lẻ',
              notes: ''
            };

            const items = (order.food_items || []).map((item: any) => ({
              id: item.food_item_id || item.id,
              name: item.name || item.food_item?.name || 'Món không xác định',
              quantity: item.quantity || 1,
              price: item.price || 0,
              special_instructions: item.special_instructions || ''
            }));

            const { invoicePrintAPI } = await import('../services/api');
            await invoicePrintAPI.processInvoicePrint(orderData, items, true);
            console.log('✅ Payment invoice printed');
          } catch (printError) {
            console.error('❌ Payment invoice print failed:', printError);
          }
          
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
                  {order.employee_name || 'Chưa xác định'}
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
              {/* Hiển thị vé buffet ở trên cùng */}
              {order.buffet_package_id && order.buffet_quantity && order.buffet_quantity > 0 && (
                <>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000' }}>
                              VÉ {Math.round((order.buffet_package_price || 0) / 1000)}K
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000' }}>
                              {order.buffet_quantity}
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {((order.buffet_quantity || 0) * (order.buffet_package_price || 0)).toLocaleString('vi-VN')} ₫
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                </>
              )}
              
              {/* Hiển thị món ăn (loại bỏ vé buffet) */}
              {order.food_items && order.food_items.length > 0 && (
                <>
                  {order.food_items
                    .filter((item: any) => !item.is_ticket && item.food_item_id !== order.buffet_package_id) // Loại bỏ vé buffet
                    .map((item: any, index: number) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {item.food_item?.name || item.name || 'Món ăn'}
                              </Typography>
                              <TextField
                                type="number"
                                value={editingQuantities[`item_${index}`] !== undefined ? editingQuantities[`item_${index}`] : (item.quantity || 1)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange('item', parseInt(e.target.value) || 0, index)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                sx={{ width: '50px' }}
                                size="small"
                                disabled={!canEdit}
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
            
            {/* Chi tiết tổng tiền */}
            {order.buffet_package_id && order.buffet_quantity && order.buffet_quantity > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Vé buffet ({order.buffet_quantity} × {Math.round((order.buffet_package_price || 0) / 1000)}K):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {((order.buffet_quantity || 0) * (order.buffet_package_price || 0)).toLocaleString('vi-VN')} ₫
                  </Typography>
                </Box>
                {(order.food_items && order.food_items.length > 0) && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Món ăn:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(order.food_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1) * (item.price || 0), 0).toLocaleString('vi-VN')} ₫
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
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
            disabled={!canEdit}
            sx={{ width: '100%' }}
          >
            Lưu thay đổi
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MobileOrderDetailsPage;
