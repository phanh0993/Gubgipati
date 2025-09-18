import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, List, ListItem, ListItemText, Card, CardContent,
  Divider, IconButton, Alert, Grid, CardMedia, CardActionArea
} from '@mui/material';
import { Add, Remove, ArrowBack, Restaurant, Logout } from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';
import { Table, BuffetPackage, BuffetPackageItem, OrderItem, BuffetOrder } from '../types';

interface OrderItemWithQuantity extends OrderItem {
  quantity: number;
}

const BuffetPOS: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { employee, logout } = useAuth();
  const selectedTable = location.state?.selectedTable as Table;

  // States
  const [selectedPackage, setSelectedPackage] = useState<BuffetPackage | null>(null);
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [packageItems, setPackageItems] = useState<BuffetPackageItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemWithQuantity[]>([]);
  const [currentOrder, setCurrentOrder] = useState<BuffetOrder | null>(null);

  // Fetch data from API
  const [packages, setPackages] = useState<BuffetPackage[]>([]);

  // Load packages on component mount
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/buffet-packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  useEffect(() => {
    const loadTableData = async () => {
      if (selectedTable) {
        try {
          // Kiểm tra xem bàn đã có order chưa từ database
          const response = await fetch(`/api/orders?table_id=${selectedTable.id}`);
          if (response.ok) {
            const orders = await response.json();
            const existingOrder = orders.find((order: any) => 
              order.table_id === selectedTable.id && 
              order.order_type === 'buffet' && 
              order.status !== 'paid'
            );
            
            if (existingOrder) {
              // Convert existingOrder to match local BuffetOrder interface
              const convertedOrder: BuffetOrder = {
                id: existingOrder.id.toString(),
                table_id: existingOrder.table_id,
                table_name: selectedTable.table_name,
                table_number: selectedTable.table_number,
                area: selectedTable.area,
                buffet_package_id: existingOrder.buffet_package_id,
                buffet_package_name: existingOrder.buffet_package_name || 'Buffet Package',
                buffet_quantity: existingOrder.buffet_quantity || 0,
                buffet_price: existingOrder.buffet_package_price || 0,
                items: existingOrder.items ? existingOrder.items.map((item: any) => ({
                  id: item.food_item_id,
                  food_item_id: item.food_item_id,
                  quantity: item.quantity || 1,
                  food_item: {
                    id: item.food_item_id,
                    name: item.name,
                    price: item.price,
                    description: '',
                    image_url: ''
                  }
                })) : [],
                total_amount: existingOrder.total_amount,
                status: existingOrder.status,
                created_at: existingOrder.created_at,
                employee_id: existingOrder.employee_id,
                employee_name: existingOrder.employee_name
              };
              
              setCurrentOrder(convertedOrder);
              
              // Tìm gói vé đã order từ danh sách packages
              const existingPackage = packages.find(pkg => pkg.id === existingOrder.buffet_package_id);
              if (existingPackage) {
                setSelectedPackage(existingPackage);
              } else {
                // Fallback nếu không tìm thấy package
                setSelectedPackage({
                  id: existingOrder.buffet_package_id,
                  name: existingOrder.buffet_package_name || 'Buffet Package',
                  description: '',
                  price: existingOrder.buffet_package_price || 0,
                  duration_minutes: 90,
                  is_active: true
                });
              }
              
              setPackageQuantity(0); // Số lượng vé = 0 cho order tiếp theo
              await fetchPackageItems(existingOrder.buffet_package_id);
              setOrderItems([]); // Reset món đã chọn về 0 để tránh nhầm lẫn
            } else {
              // Load default package items if no existing order
              if (packages.length > 0) {
                await fetchPackageItems(packages[0].id);
              }
            }
          }
        } catch (error) {
          console.error('Error loading existing order:', error);
          // Load default package items if error
          if (packages.length > 0) {
            await fetchPackageItems(packages[0].id);
          }
        }
      }
    };

    loadTableData();
  }, [selectedTable, packages]);

  const handleSelectPackage = async (pkg: BuffetPackage) => {
    if (currentOrder && currentOrder.buffet_package_id !== pkg.id) {
      alert('Bàn này đã order loại vé khác. Chỉ có thể thêm vé cùng loại!');
      return;
    }

    setSelectedPackage(pkg);
    setPackageQuantity(currentOrder ? 0 : 1);

    // Load items for selected package from API
    await fetchPackageItems(pkg.id);
  };

  const fetchPackageItems = async (packageId: number) => {
    try {
      const response = await fetch(`/api/buffet-package-items?package_id=${packageId}`);
      if (response.ok) {
        const data = await response.json();
        setPackageItems(data);
      }
    } catch (error) {
      console.error('Error fetching package items:', error);
    }
  };

  const handleAddItem = (item: BuffetPackageItem) => {
    const existingItem = orderItems.find(i => i.food_item_id === item.food_item_id);
    if (existingItem) {
      setOrderItems(prev => 
        prev.map(i => 
          i.food_item_id === item.food_item_id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setOrderItems(prev => [...prev, { 
        id: item.food_item_id,
        food_item_id: item.food_item_id,
        quantity: 1,
        food_item: item.food_item
      }]);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setOrderItems(prev => 
      prev.map(item => 
        item.food_item_id === itemId 
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    const packageTotal = (selectedPackage?.price || 0) * packageQuantity;
    const itemsTotal = orderItems.reduce((sum, item) => sum + (item.food_item.price * (item.quantity || 1)), 0);
    const subtotal = packageTotal + itemsTotal;
    const tax_amount = subtotal * 0.1;
    const total_amount = subtotal + tax_amount;
    return total_amount;
  };

  const handleCreateOrder = async () => {
    if (!selectedPackage || !selectedTable) return;

    try {
      // Tính toán tổng tiền cho order mới
      const packageTotal = selectedPackage.price * packageQuantity;
      const itemsTotal = orderItems.reduce((sum, item) => sum + (item.food_item.price * item.quantity), 0);
      const newSubtotal = packageTotal + itemsTotal;
      const newTax_amount = newSubtotal * 0.1;
      const newTotal_amount = newSubtotal + newTax_amount;

      if (currentOrder) {
        // Gộp vào order cũ - tính toán đúng tổng tiền
        const currentSubtotal = currentOrder.total_amount / 1.1; // Lấy subtotal cũ (trước thuế)
        const newCombinedSubtotal = currentSubtotal + newSubtotal;
        const newCombinedTax = newCombinedSubtotal * 0.1;
        const newCombinedTotal = newCombinedSubtotal + newCombinedTax;
        
        // Chỉ gửi items mới, API sẽ tự gộp với items cũ
        const updatedOrderData = {
          buffet_quantity: packageQuantity, // Chỉ gửi số lượng vé mới, API sẽ tự gộp
          subtotal: newCombinedSubtotal,
          tax_amount: newCombinedTax,
          total_amount: newCombinedTotal,
          items: orderItems.map(item => ({
            food_item_id: item.food_item_id,
            name: item.food_item.name,
            price: item.food_item.price,
            quantity: item.quantity,
            total: item.food_item.price * item.quantity,
            special_instructions: 'Gọi thoải mái',
            printer_id: null
          }))
        };

        const response = await fetch(`/api/orders/${currentOrder.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedOrderData),
        });

        if (response.ok) {
          const updatedOrder = await response.json();
          console.log('✅ Order updated in database:', updatedOrder);
          
          // Cập nhật currentOrder - API đã gộp items rồi, chỉ cần fetch lại
          const convertedOrder: BuffetOrder = {
            ...currentOrder,
            buffet_quantity: updatedOrder.buffet_quantity,
            total_amount: updatedOrder.total_amount,
            items: updatedOrder.items || currentOrder.items
          };
          
          setCurrentOrder(convertedOrder);
          alert('Đã thêm món vào order hiện tại!');
        } else {
          const errorData = await response.json();
          console.error('Error updating order:', errorData);
          alert(`Lỗi khi cập nhật order: ${errorData.message || 'Unknown error'}`);
        }
      } else {
        // Tạo order mới
        const orderData = {
          order_type: 'buffet',
          table_id: selectedTable.id,
          customer_id: null,
          employee_id: employee?.id || 14,
          subtotal: newSubtotal,
          tax_amount: newTax_amount,
          total_amount: newTotal_amount,
          buffet_package_id: selectedPackage.id,
          buffet_duration_minutes: 90,
          buffet_start_time: new Date().toISOString(),
          buffet_quantity: packageQuantity,
          notes: `Buffet ${selectedPackage.name} x${packageQuantity} - ${selectedTable.area}${selectedTable.table_number}`,
          items: orderItems.map(item => ({
            food_item_id: item.food_item_id,
            name: item.food_item.name,
            price: parseFloat(item.food_item.price.toString()),
            quantity: item.quantity,
            total: parseFloat(item.food_item.price.toString()) * item.quantity,
            special_instructions: 'Gọi thoải mái',
            printer_id: null
          }))
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          const newOrder = await response.json();
          console.log('✅ Order created in database:', newOrder);
          
          // Cập nhật currentOrder để hiển thị
          const convertedOrder: BuffetOrder = {
            id: newOrder.id.toString(),
            table_id: newOrder.table_id,
            table_name: selectedTable.table_name,
            table_number: selectedTable.table_number,
            area: selectedTable.area,
            buffet_package_id: newOrder.buffet_package_id,
            buffet_package_name: selectedPackage.name,
            buffet_quantity: newOrder.buffet_quantity,
            buffet_price: selectedPackage.price,
            items: orderItems.map(item => ({
              id: item.food_item_id,
              food_item_id: item.food_item_id,
              quantity: item.quantity,
              food_item: item.food_item
            })),
            total_amount: newOrder.total_amount,
            status: newOrder.status,
            created_at: newOrder.created_at,
            employee_id: newOrder.employee_id,
            employee_name: employee?.fullname || 'Nhân viên POS'
          };
          
          setCurrentOrder(convertedOrder);
          alert('Order thành công! Hóa đơn đã được lưu vào database.');
        } else {
          const errorData = await response.json();
          console.error('Error creating order:', errorData);
          alert(`Lỗi khi tạo order: ${errorData.message || 'Unknown error'}`);
        }
      }
      
      // Reset form
      setOrderItems([]);
      setPackageQuantity(currentOrder ? 0 : 1); // Nếu đã có order thì set về 0, nếu chưa thì set về 1
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Lỗi khi tạo order');
    }
  };

  if (!selectedTable) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Không tìm thấy thông tin bàn
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/tables')}
        >
          Quay lại chọn bàn
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton color="inherit" onClick={() => navigate('/tables')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Buffet POS - Bàn {selectedTable.area}{selectedTable.table_number}
        </Typography>
        <Typography variant="body2" sx={{ mr: 2 }}>
          {employee?.fullname} ({employee?.role})
        </Typography>
        <IconButton color="inherit" onClick={logout}>
          <Logout />
        </IconButton>
      </Box>

      {/* Alert nếu có order cũ */}
      {currentOrder && (
        <Alert severity="info" sx={{ m: 2, mb: 0 }}>
          Bàn này đã có order trước đó. Số lượng vé = 0: Chỉ thêm món ăn.
        </Alert>
      )}

      {/* Main Content - 3 cột */}
      <Box sx={{ display: 'flex', flex: 1, gap: 1, p: 1, height: 'calc(100vh - 80px)' }}>
        {/* Cột trái: Tùy chọn (Gói vé) - 25% */}
        <Box sx={{ width: '25%', minWidth: '200px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                Tùy chọn
              </Typography>
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {packages.map((pkg) => (
                  <ListItem
                    key={pkg.id}
                    button
                    selected={selectedPackage?.id === pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    sx={{ 
                      border: 1, 
                      borderColor: selectedPackage?.id === pkg.id ? 'primary.main' : 'grey.300', 
                      mb: 1, 
                      borderRadius: 1,
                      bgcolor: selectedPackage?.id === pkg.id ? 'primary.light' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedPackage?.id === pkg.id ? 'primary.light' : 'grey.100'
                      }
                    }}
                  >
                    <ListItemText
                      primary={pkg.name}
                      secondary={`${pkg.price.toLocaleString()}₫`}
                      primaryTypographyProps={{ fontWeight: 'bold', textAlign: 'center' }}
                      secondaryTypographyProps={{ textAlign: 'center' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Cột giữa: Khách lẻ (Món ăn) - 50% */}
        <Box sx={{ width: '50%', minWidth: '400px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                Khách lẻ
              </Typography>
              {selectedPackage ? (
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <Grid container spacing={1}>
                    {packageItems.map((item) => (
                      <Grid item xs={6} sm={4} key={item.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: 1,
                            borderColor: 'grey.300',
                            '&:hover': { 
                              borderColor: 'primary.main',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => handleAddItem(item)}
                        >
                          <CardActionArea>
                            <CardMedia
                              component="img"
                              height="80"
                              image={item.food_item.image_url || `https://via.placeholder.com/150x80/4CAF50/FFFFFF?text=${encodeURIComponent(item.food_item.name)}`}
                              alt={item.food_item.name}
                              sx={{ objectFit: 'cover' }}
                            />
                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                              <Typography variant="body2" fontWeight="bold" noWrap>
                                {item.food_item.name}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" variant="h6">
                    Vui lòng chọn gói vé trước
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Cột phải: Hóa đơn - 25% */}
        <Box sx={{ width: '25%', minWidth: '200px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                HÓA ĐƠN
              </Typography>
              
              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold" textAlign="center">
                  Bàn {selectedTable.area}{selectedTable.table_number}
                </Typography>
              </Box>
              
              {selectedPackage && (
                <Box sx={{ mb: 2, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold" textAlign="center">
                    {selectedPackage.name} × {packageQuantity}
                  </Typography>
                  <Typography variant="caption" display="block" textAlign="center">
                    {selectedPackage.price.toLocaleString()}₫ × {packageQuantity} = {(selectedPackage.price * packageQuantity).toLocaleString()}₫
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, justifyContent: 'center' }}>
                    <Button
                      size="small"
                      onClick={() => setPackageQuantity(Math.max(1, packageQuantity - 1))}
                      disabled={packageQuantity <= 1}
                    >
                      <Remove />
                    </Button>
                    <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                      {packageQuantity}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setPackageQuantity(Math.min(selectedTable.capacity, packageQuantity + 1))}
                      disabled={packageQuantity >= selectedTable.capacity}
                    >
                      <Add />
                    </Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Món đã chọn:
                </Typography>
                <List dense>
                  {orderItems.map((item) => (
                    <ListItem key={item.food_item_id} sx={{ py: 0.5, px: 0 }}>
                      <ListItemText
                        primary={item.food_item.name}
                        secondary={
                          <Box component="span">
                            <Typography variant="caption" component="span">
                              0₫ × {item.quantity} = 0₫
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Button
                          size="small"
                          onClick={() => handleRemoveItem(item.food_item_id)}
                          disabled={item.quantity <= 0}
                          sx={{ minWidth: 24, height: 24, p: 0 }}
                        >
                          <Remove fontSize="small" />
                        </Button>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center', fontSize: '0.75rem' }}>
                          {item.quantity}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => handleAddItem(item)}
                          sx={{ minWidth: 24, height: 24, p: 0 }}
                        >
                          <Add fontSize="small" />
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" textAlign="center" fontWeight="bold">
                  Tổng: {calculateTotal().toLocaleString()}₫
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleCreateOrder}
                  disabled={!selectedPackage || (packageQuantity < 1 && orderItems.length === 0)}
                  sx={{ fontWeight: 'bold' }}
                >
                  Đặt Order
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={() => navigate('/tables')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Thanh Toán
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default BuffetPOS;

