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
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  TableRestaurant,
  Logout,
  AccessTime,
  Receipt
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Table, BuffetOrder } from '../types';

const TableSelection: React.FC = () => {
  const navigate = useNavigate();
  const { employee, logout } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<BuffetOrder[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('A');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<BuffetOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch('http://localhost:8001/api/tables'),
        fetch('http://localhost:8000/api/orders')
      ]);

      const tablesData = await tablesRes.json();
      const ordersData = await ordersRes.json();

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
        setOrders(buffetOrders);
        console.log('Buffet orders:', buffetOrders);
      } else {
        console.error('Orders data is not an array:', ordersData);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTables([]);
      setOrders([]);
    }
  };

  const handleSelectTable = (table: Table) => {
    // Chuyển đến trang chọn thực đơn buffet
    navigate('/pos', { 
      state: { 
        selectedTable: table,
        currentOrder: getTableOrder(table)
      } 
    });
  };

  const handleViewOrder = async (order: BuffetOrder) => {
    setSelectedOrder(order);
    try {
      const response = await fetch(`http://localhost:8000/api/orders/${order.id}/details`);
      if (response.ok) {
        const details = await response.json();
        setOrderDetails(details);
        setShowOrderDialog(true);
      } else {
        console.error('Error fetching order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      });

      if (response.ok) {
        // Tự động in bill sau khi thanh toán
        await handlePrintBill();
        
        alert('Thanh toán thành công! Hóa đơn đã được ghi nhận vào doanh thu và in bill.');
        setShowOrderDialog(false);
        fetchData(); // Reload all data
      } else {
        alert('Lỗi khi thanh toán');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Lỗi khi thanh toán');
    }
  };

  const handlePrintBill = async () => {
    if (!selectedOrder || !orderDetails) return;
    
    try {
      const printData = {
        printer_id: 1,
        order_number: orderDetails.order_number,
        table_name: orderDetails.table_name,
        area: orderDetails.area,
        items: orderDetails.items || [],
        subtotal: orderDetails.subtotal,
        tax_amount: orderDetails.tax_amount,
        total_amount: orderDetails.total_amount,
        buffet_package: orderDetails.buffet_package_name,
        buffet_duration: orderDetails.buffet_duration_minutes,
        buffet_quantity: orderDetails.buffet_quantity
      };

      const response = await fetch('http://localhost:8000/api/print-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      });

      if (response.ok) {
        console.log('Bill printed successfully');
      } else {
        console.error('Error printing bill');
      }
    } catch (error) {
      console.error('Error printing bill:', error);
    }
  };

  // Function gộp món trùng nhau
  const mergeDuplicateItems = (items: any[]) => {
    if (!items || items.length === 0) return [];
    
    const mergedItems: { [key: string]: any } = {};
    
    items.forEach(item => {
      const key = item.name;
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

  const filteredTables = tables.filter(table => table.area === selectedArea);
  const busyTables = tables.filter(table => getTableStatus(table) === 'busy');

  const areas = [...new Set(tables.map(table => table.area))].sort();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <TableRestaurant sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            JULY POS - Quản Lý Bàn
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {employee?.fullname} ({employee?.role})
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Danh Sách Bàn" />
          <Tab label="Bàn Có Order" />
        </Tabs>
      </Box>

      {/* Area Selection */}
      <Box sx={{ p: 2, bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Khu vực: {selectedArea}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {areas.map(area => (
            <Chip
              key={area}
              label={`Khu ${area}`}
              onClick={() => setSelectedArea(area)}
              color={selectedArea === area ? 'primary' : 'default'}
              variant={selectedArea === area ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        {activeTab === 0 ? (
          // Tab 1: Danh sách bàn
          <Grid container spacing={2}>
            {filteredTables.map((table) => {
              const tableOrder = getTableOrder(table);
              const status = getTableStatus(table);
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: 2,
                      borderColor: status === 'busy' ? 'error.main' : 'success.main',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                    onClick={() => handleSelectTable(table)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" component="div" gutterBottom>
                        {table.area}{table.table_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {table.table_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Sức chứa: {table.capacity} người
                      </Typography>
                      
                      <Chip
                        label={status === 'busy' ? 'Có khách' : 'Trống'}
                        color={status === 'busy' ? 'error' : 'success'}
                        sx={{ mt: 1 }}
                      />
                      
                      {tableOrder && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="caption" display="block">
                            Order: {tableOrder.id}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Tổng: {tableOrder.total_amount?.toLocaleString()}₫
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(tableOrder);
                            }}
                            sx={{ mt: 1 }}
                          >
                            Xem chi tiết
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          // Tab 2: Bàn có order
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Bàn Có Order Chưa Thanh Toán ({busyTables.length})
            </Typography>
            <List>
              {busyTables.map((table) => {
                const tableOrder = getTableOrder(table);
                if (!tableOrder) return null;
                
                return (
                  <React.Fragment key={table.id}>
                    <ListItem
                      sx={{
                        border: 1,
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'white',
                        '&:hover': {
                          bgcolor: 'grey.50'
                        }
                      }}
                    >
                      <ListItemText
                        primary={`Bàn ${table.area}${table.table_number} - ${table.table_name}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Order: {tableOrder.id} | Tổng: {tableOrder.total_amount?.toLocaleString()}₫
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                              {new Date(tableOrder.created_at).toLocaleString('vi-VN')}
                            </Typography>
                          </Box>
                        }
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleViewOrder(tableOrder)}
                        startIcon={<Receipt />}
                      >
                        Xem & Thanh toán
                      </Button>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>

      {/* Order Details Dialog */}
      <Dialog
        open={showOrderDialog}
        onClose={() => setShowOrderDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Chi tiết Order - Bàn {selectedOrder?.area}{selectedOrder?.table_number}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {orderDetails && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Loại Vé Buffet
              </Typography>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="h6">
                  {orderDetails.buffet_package_name || 'Buffet Package'} × {orderDetails.buffet_quantity || 0}
                </Typography>
                <Typography variant="body2">
                  Thành tiền: {((orderDetails.buffet_package_price || 0) * (orderDetails.buffet_quantity || 0)).toLocaleString('vi-VN')} ₫
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Món Đã Order
              </Typography>
              {orderDetails.items && orderDetails.items.length > 0 ? (
                <List dense>
                  {mergeDuplicateItems(orderDetails.items).map((item: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={item.name}
                        secondary={`Số lượng: ${item.quantity} - Giá: ${item.price.toLocaleString('vi-VN')} ₫`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Chưa có món nào</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Tổng cộng: {orderDetails.total_amount?.toLocaleString('vi-VN')} ₫
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOrderDialog(false)}>
            Đóng
          </Button>
          <Button onClick={handlePrintBill} variant="outlined" color="info">
            In Bill
          </Button>
          <Button onClick={handlePayment} variant="contained" color="success">
            Thanh Toán
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableSelection;

