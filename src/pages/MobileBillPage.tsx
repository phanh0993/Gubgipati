import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  TableRestaurant,
  Add,
  Remove
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmqzggfwvhsoiijlsxwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcXpnZ2Z3dmhzb2lpamxzeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODc1MjYsImV4cCI6MjA3MTg2MzUyNn0.EWtnieipmSr5prm18pNCgCYSfdGRtr-710ISCZ-Jsl4';
const supabase = createClient(supabaseUrl, supabaseKey);

interface TableInfo {
  id: number;
  table_number: string;
  table_name: string;
  area: string;
  capacity: number;
}

interface BuffetPackage {
  id: number;
  name: string;
  price: number;
}

interface BuffetPackageItem {
  id: number;
  food_item: {
    id: number;
    name: string;
    image_url?: string;
  };
  special_instructions?: string;
}

interface Order {
  id: number;
  order_number: string;
  table_id: number;
  status: string;
  buffet_package_id?: number;
  buffet_quantity?: number;
  items?: any[];
  total_amount?: number;
  subtotal?: number;
  tax_amount?: number;
  customer_id?: number;
  employee_id?: number;
}

const MobileBillPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const selectedTable = location.state?.selectedTable as TableInfo;
  const currentOrder = location.state?.currentOrder as Order;
  const selectedPackage = location.state?.selectedPackage as BuffetPackage;
  const packageQuantityFromState = location.state?.packageQuantity as number;
  const selectedItems = location.state?.selectedItems as BuffetPackageItem[];
  const orderItems = location.state?.orderItems as { [key: number]: number };
  const itemNotes = location.state?.itemNotes as { [key: number]: string };

  const [packageQuantity, setPackageQuantity] = useState(packageQuantityFromState ?? (currentOrder ? 0 : 1));
  const [itemQuantities, setItemQuantities] = useState<{ [key: number]: number }>(orderItems || {});
  const [itemNotesState, setItemNotesState] = useState<{ [key: number]: string }>(itemNotes || {});

  useEffect(() => {
    if (orderItems) {
      setItemQuantities(orderItems);
    }
  }, [orderItems]);

  const handleBack = () => {
    navigate('/mobile-menu', { 
      state: { 
        selectedTable,
        existingOrder: currentOrder
      }
    });
  };

  const handlePackageQuantityChange = (delta: number) => {
    const newQuantity = Math.max(0, packageQuantity + delta);
    setPackageQuantity(newQuantity);
  };

  const handleItemQuantityChange = (itemId: number, delta: number) => {
    const currentQuantity = itemQuantities[itemId] || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);
    
    if (newQuantity === 0) {
      const newQuantities = { ...itemQuantities };
      delete newQuantities[itemId];
      setItemQuantities(newQuantities);
    } else {
      setItemQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  const handleUpdateItemNote = (itemId: number, note: string) => {
    setItemNotesState(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Add package total
    if (selectedPackage) {
      total += selectedPackage.price * packageQuantity;
    }
    
    // Add items total (buffet items are usually free, so we don't add price)
    // But we can add a small fee if needed
    
    return total;
  };

  const handlePlaceOrder = async () => {
    if (!selectedPackage || !selectedTable) {
      alert('Vui lòng chọn vé và bàn');
      return;
    }

    // Nếu có order cũ và packageQuantity = 0, chỉ cập nhật món ăn
    if (currentOrder && packageQuantity === 0) {
      // Chỉ cập nhật món ăn, không thay đổi số lượng vé
      const { orderAPI } = await import('../services/api');
      const response = await orderAPI.updateOrder(currentOrder.id, {
        items: selectedItems
          .filter(item => itemQuantities[item.id] > 0)
          .map(item => ({
            food_item_id: item.food_item.id,
            name: item.food_item.name,
            price: 0,
            quantity: itemQuantities[item.id],
            total: 0,
            special_instructions: itemNotesState[item.id] || 'Gọi thoải mái',
            printer_id: null
          }))
      });

      if (response.status === 200) {
        alert('Cập nhật món ăn thành công!');
        navigate('/mobile-tables');
      } else {
        alert('Lỗi khi cập nhật món ăn');
      }
      return;
    }

    try {
      // Lấy employee_id từ user_id
      let employeeId = 14; // fallback
      if (user?.id) {
        try {
          const { employeeAPI } = await import('../services/api');
          const response = await employeeAPI.getEmployees();
          if (response.status === 200) {
            const employees = response.data;
            const employee = employees.find((emp: any) => emp.user_id === user.id);
            if (employee) {
              employeeId = employee.id;
            }
          }
        } catch (error) {
          console.error('Error fetching employee ID:', error);
        }
      }
      
      // Import Vietnam time utility
      const { getVietnamTime, getVietnamTimeForDB } = await import('../utils/timeUtils');

      // Tính toán tổng tiền
      const packageTotal = selectedPackage.price * packageQuantity;
      const itemsTotal = 0; // Buffet items are usually free
      const subtotal = packageTotal + itemsTotal;
      const tax_amount = 0; // Bỏ thuế
      const total_amount = subtotal;

      // Tạo order data với đầy đủ các trường như PC version
      const orderData = {
        order_type: 'buffet',
        table_id: selectedTable.id,
        customer_id: null,
        employee_id: employeeId,
        subtotal: subtotal,
        tax_amount: tax_amount,
        total_amount: total_amount,
        buffet_package_id: selectedPackage.id,
        buffet_duration_minutes: 90,
        buffet_start_time: getVietnamTimeForDB(),
        buffet_quantity: packageQuantity,
        notes: `Buffet ${selectedPackage.name} x${packageQuantity} - ${selectedTable.area}${selectedTable.table_number}`,
        items: selectedItems
          .filter(item => itemQuantities[item.id] > 0)
          .map(item => ({
            food_item_id: item.food_item.id,
            name: item.food_item.name,
            price: 0, // Buffet items are free
            quantity: itemQuantities[item.id],
            total: 0,
            special_instructions: itemNotesState[item.id] || 'Gọi thoải mái',
            printer_id: null
          }))
      };

      if (currentOrder) {
        // Gộp vào order cũ - không tính thuế
        const currentSubtotal = (currentOrder.total_amount || 0);
        const newCombinedSubtotal = currentSubtotal + subtotal;
        const newCombinedTax = 0;
        const newCombinedTotal = newCombinedSubtotal;
        
        // Đọc tổng số vé hiện tại từ order_buffet.quantity
        let currentTicketCount = 0;
        try {
          const { data: currentTickets, error: ticketError } = await supabase
            .from('order_buffet')
            .select('quantity')
            .eq('order_id', currentOrder.id);
          
          if (!ticketError && currentTickets) {
            currentTicketCount = currentTickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
            console.log(`🎫 [Mobile] Current tickets in order_buffet: ${currentTicketCount} (from ${currentTickets.length} rows)`);
          }
        } catch (e) {
          console.warn('🎫 [Mobile] Failed to read current tickets:', e);
        }

        console.log(`🎫 [Mobile UPDATE ORDER] Debug info:`, {
          orderId: currentOrder.id,
          selectedPackage: selectedPackage,
          buffet_package_id: selectedPackage?.id,
          buffet_quantity: packageQuantity,
          currentOrder: currentOrder
        });
        
        if (!selectedPackage || !selectedPackage.id) {
          console.error('❌ [Mobile UPDATE ORDER] selectedPackage is missing or has no id:', selectedPackage);
          alert('Lỗi: Không tìm thấy thông tin gói vé. Vui lòng chọn lại gói vé.');
          return;
        }
        
        // Chỉ gửi items mới, API sẽ tự gộp với items cũ
        const updatedOrderData = {
          employee_id: employeeId,
          buffet_package_id: selectedPackage.id,
          buffet_quantity: packageQuantity,
          subtotal: newCombinedSubtotal,
          tax_amount: newCombinedTax,
          total_amount: newCombinedTotal,
          items: selectedItems
            .filter(item => itemQuantities[item.id] > 0)
            .map(item => ({
              food_item_id: item.food_item.id,
              name: item.food_item.name,
              price: 0, // Buffet items are free
              quantity: itemQuantities[item.id],
              total: 0,
              special_instructions: itemNotesState[item.id] || 'Gọi thoải mái',
              printer_id: null
            }))
        };

        const { orderAPI } = await import('../services/api');
        const response = await orderAPI.updateOrder(currentOrder.id, updatedOrderData);

        if (response.status === 200) {
          alert('Cập nhật order thành công!');
          navigate('/mobile-tables');
        } else {
          alert('Lỗi khi cập nhật order');
        }
      } else {
        // Tạo order mới
        const { orderAPI } = await import('../services/api');
        
        // Lấy thông tin nhân viên từ localStorage
        const employee = localStorage.getItem('pos_employee');
        const employeeData = employee ? JSON.parse(employee) : null;
        
        const response = await orderAPI.createOrder({
            ...orderData,
            table_id: selectedTable.id,
            order_type: 'buffet',
            status: 'pending',
            employee_id: employeeData?.id || null
          });

        if (response.status === 200) {
          alert('Tạo order thành công!');
          navigate('/mobile-tables');
        } else {
          alert('Lỗi khi tạo order');
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Lỗi khi đặt order');
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage || !selectedTable) {
      alert('Vui lòng chọn vé và bàn');
      return;
    }

    // Nếu có order cũ và packageQuantity = 0, chỉ cập nhật món ăn và thanh toán
    if (currentOrder && packageQuantity === 0) {
      // Lấy thông tin nhân viên từ localStorage
      const employee = localStorage.getItem('pos_employee');
      const employeeData = employee ? JSON.parse(employee) : null;
      
      // 1. Cập nhật order sang paid, server tự tạo invoice
      const { orderAPI } = await import('../services/api');
      const response = await orderAPI.updateOrder(currentOrder.id, {
        status: 'paid',
        employee_id: employeeData?.id || null,
        items: selectedItems
          .filter(item => itemQuantities[item.id] > 0)
          .map(item => ({
            food_item_id: item.food_item.id,
            name: item.food_item.name,
            price: 0,
            quantity: itemQuantities[item.id],
            total: 0,
            special_instructions: itemNotesState[item.id] || 'Gọi thoải mái',
            printer_id: null
          }))
      });

      if (response.status === 200) {
        alert('Thanh toán thành công!');
        navigate('/mobile-tables');
      } else {
        alert('Lỗi khi cập nhật trạng thái order');
      }
      return;
    }

    try {
      // Lấy employee_id từ user_id
      let employeeId = 14; // fallback
      if (user?.id) {
        try {
          const { employeeAPI } = await import('../services/api');
          const response = await employeeAPI.getEmployees();
          if (response.status === 200) {
            const employees = response.data;
            const employee = employees.find((emp: any) => emp.user_id === user.id);
            if (employee) {
              employeeId = employee.id;
            }
          }
        } catch (error) {
          console.error('Error fetching employee ID:', error);
        }
      }
      
      // Import Vietnam time utility
      const { getVietnamTime, getVietnamTimeForDB } = await import('../utils/timeUtils');

      // Tính toán tổng tiền
      const packageTotal = selectedPackage.price * packageQuantity;
      const itemsTotal = 0; // Buffet items are usually free
      const subtotal = packageTotal + itemsTotal;
      const tax_amount = 0; // Bỏ thuế
      const total_amount = subtotal;

      // Tạo order data với đầy đủ các trường như PC version
      const orderData = {
        order_type: 'buffet',
        table_id: selectedTable.id,
        customer_id: null,
        employee_id: employeeId,
        subtotal: subtotal,
        tax_amount: tax_amount,
        total_amount: total_amount,
        buffet_package_id: selectedPackage.id,
        buffet_duration_minutes: 90,
        buffet_start_time: getVietnamTimeForDB(),
        buffet_quantity: packageQuantity,
        notes: `Buffet ${selectedPackage.name} x${packageQuantity} - ${selectedTable.area}${selectedTable.table_number}`,
        items: selectedItems
          .filter(item => itemQuantities[item.id] > 0)
          .map(item => ({
            food_item_id: item.food_item.id,
            name: item.food_item.name,
            price: 0, // Buffet items are free
            quantity: itemQuantities[item.id],
            total: 0,
            special_instructions: itemNotesState[item.id] || 'Gọi thoải mái',
            printer_id: null
          }))
      };

      if (currentOrder) {
        // Gộp vào order cũ và thanh toán - không tính thuế
        const currentSubtotal = (currentOrder.total_amount || 0);
        const newCombinedSubtotal = currentSubtotal + subtotal;
        const newCombinedTax = 0;
        const newCombinedTotal = newCombinedSubtotal;
        
        // Đọc tổng số vé hiện tại từ order_buffet.quantity
        let currentTicketCount = 0;
        try {
          const { data: currentTickets, error: ticketError } = await supabase
            .from('order_buffet')
            .select('quantity')
            .eq('order_id', currentOrder.id);
          
          if (!ticketError && currentTickets) {
            currentTicketCount = currentTickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
            console.log(`🎫 [Mobile] Current tickets in order_buffet: ${currentTicketCount} (from ${currentTickets.length} rows)`);
          }
        } catch (e) {
          console.warn('🎫 [Mobile] Failed to read current tickets:', e);
        }

        // Chỉ gửi items mới, API sẽ tự gộp với items cũ
        const updatedOrderData = {
          employee_id: employeeId,
          buffet_package_id: selectedPackage.id,
          buffet_quantity: packageQuantity,
          subtotal: newCombinedSubtotal,
          tax_amount: newCombinedTax,
          total_amount: newCombinedTotal,
          status: 'paid',
          items: selectedItems
            .filter(item => itemQuantities[item.id] > 0)
            .map(item => ({
              food_item_id: item.food_item.id,
              name: item.food_item.name,
              price: 0, // Buffet items are free
              quantity: itemQuantities[item.id],
              total: 0,
              special_instructions: itemNotesState[item.id] || 'Gọi thoải mái',
              printer_id: null
            }))
        };

        const { orderAPI } = await import('../services/api');
        const response = await orderAPI.updateOrder(currentOrder.id, updatedOrderData);

        if (response.status === 200) {
          alert('Thanh toán thành công!');
          navigate('/mobile-tables');
        } else {
          alert('Lỗi khi thanh toán');
        }
      } else {
        // Tạo order mới và thanh toán luôn
        const { orderAPI } = await import('../services/api');
        const response = await orderAPI.createOrder({
            ...orderData,
            table_id: selectedTable.id,
            order_type: 'buffet',
            status: 'paid'
          });

        if (response.status === 200) {
          alert('Tạo order và thanh toán thành công!');
          navigate('/mobile-tables');
        } else {
          alert('Lỗi khi tạo order và thanh toán');
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Lỗi khi thanh toán');
    }
  };

  const mergeDuplicateItems = (items: any[]) => {
    const merged: { [key: string]: any } = {};
    
    items.forEach(item => {
      const key = item.food_item?.name || item.name;
      if (merged[key]) {
        merged[key].quantity += item.quantity || 1;
        merged[key].total_price += (item.unit_price || item.price) * (item.quantity || 1);
      } else {
        merged[key] = {
          name: key,
          quantity: item.quantity || 1,
          price: item.unit_price || item.price,
          total_price: (item.unit_price || item.price) * (item.quantity || 1)
        };
      }
    });
    
    return Object.values(merged);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar sx={{ minHeight: 56 }}>
          <IconButton color="inherit" onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Typography variant="h6">
              BÀN {selectedTable.area}{selectedTable.table_number}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              NV: {(() => {
                const employee = localStorage.getItem('pos_employee');
                const employeeData = employee ? JSON.parse(employee) : null;
                console.log('Employee data from localStorage:', employeeData);
                return employeeData?.full_name || employeeData?.fullname || 'Unknown';
              })()}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content - Layout theo HÌNH 5 */}
      <Box sx={{ flex: 1, p: 1 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Vé đã chọn - hiển thị tổng số vé từ order_buffet */}
            {selectedPackage && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  border: 1,
                  borderColor: 'grey.300',
                  borderRadius: 1
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedPackage.name}
                    </Typography>
                    {currentOrder && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Tổng vé: {(() => {
                          // Tính tổng số vé từ order_buffet
                          let totalTickets = 0;
                          if (currentOrder.items) {
                            const buffetItems = currentOrder.items.filter((item: any) => item.is_ticket === true || item.food_item_id === currentOrder.buffet_package_id);
                            totalTickets = buffetItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
                          }
                          return totalTickets;
                        })()} vé
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handlePackageQuantityChange(-1)}
                      disabled={packageQuantity <= 1}
                    >
                      <Remove />
                    </IconButton>
                    <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                      +{packageQuantity}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handlePackageQuantityChange(1)}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Hiển thị giá tiền vé */}
                <Box sx={{ mt: 1, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000' }}>
                    Giá vé: {selectedPackage.price.toLocaleString('vi-VN')} ₫ × {packageQuantity} = {(selectedPackage.price * packageQuantity).toLocaleString('vi-VN')} ₫
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Món đã chọn */}
            <Box sx={{ flex: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Món đã chọn
              </Typography>
              
              {selectedItems && selectedItems.length > 0 ? (
                <List dense sx={{ p: 0 }}>
                  {selectedItems.map((item) => {
                    const quantity = itemQuantities[item.id] || 0;
                    if (quantity === 0) return null;
                    
                    return (
                      <Box key={item.id}>
                        <ListItem 
                          sx={{ 
                            py: 0.5,
                            px: 0,
                            borderBottom: 1,
                            borderColor: 'grey.200'
                          }}
                        >
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.food_item.name}
                              </Typography>
                              {(item.special_instructions || itemNotesState[item.id]) && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                  Ghi chú: {item.special_instructions || itemNotesState[item.id]}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleItemQuantityChange(item.id, -1)}
                          >
                            <Remove />
                          </IconButton>
                          <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                            x{quantity}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleItemQuantityChange(item.id, 1)}
                          >
                            <Add />
                          </IconButton>
                        </Box>
                      </ListItem>
                      
                      {/* Trường nhập note cho món */}
                      <Box sx={{ px: 2, pb: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Ghi chú cho món này..."
                          value={itemNotesState[item.id] || item.special_instructions || ''}
                          onChange={(e) => handleUpdateItemNote(item.id, e.target.value)}
                          sx={{ 
                            width: '100%',
                            '& .MuiInputBase-input': {
                              fontSize: '0.8rem',
                              padding: '8px 12px'
                            }
                          }}
                          variant="outlined"
                          multiline
                          maxRows={2}
                        />
                      </Box>
                    </Box>
                  );
                  })}
                </List>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100px'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có món nào được chọn
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Tổng tiền */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 1,
              bgcolor: 'grey.100',
              borderRadius: 1,
              mb: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Tổng: {calculateTotal().toLocaleString('vi-VN')} ₫
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Footer - Nút hành động */}
      <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handlePlaceOrder}
          sx={{ flex: 1 }}
        >
          ĐẶT ORDER
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handlePayment}
          sx={{ flex: 1 }}
        >
          THANH TOÁN
        </Button>
      </Box>
    </Box>
  );
};

export default MobileBillPage;
