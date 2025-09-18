import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  TableRestaurant,
  AccessTime,
  Receipt
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

const MobileInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await fetch('http://localhost:8000/api/orders');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const filteredOrders = ordersData.filter((order: Order) => 
          order.status === 'pending' && order.order_type === 'buffet'
        );
        
        // Map items to food_items for compatibility
        const mappedOrders = filteredOrders.map((order: any) => {
          if (order.items) {
            order.food_items = order.items.map((item: any) => ({
              food_item: {
                name: item.name,
                price: item.price
              },
              quantity: item.quantity,
              price: item.price
            }));
          }
          
          // Keep existing buffet package info from database
          // No need to override with hardcoded values
          
          return order;
        });
        
        setOrders(mappedOrders);
      }

      // Fetch tables
      const tablesResponse = await fetch('http://localhost:8001/api/tables');
      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json();
        setTables(tablesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const getTableInfo = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    return table ? {
      table_name: table.table_name,
      area: table.area
    } : {
      table_name: `Bàn ${tableId}`,
      area: 'Unknown'
    };
  };

  const calculateTotalAmount = (order: Order) => {
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

  // Group orders by table_id
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.table_id]) {
      acc[order.table_id] = {
        table_id: order.table_id,
        table_name: order.table_name || `Bàn ${order.table_id}`,
        area: order.area || 'N/A',
        buffet_start_time: order.buffet_start_time || order.created_at,
        total_amount: 0,
        order_ids: [],
        orders: []
      };
    }
    acc[order.table_id].order_ids.push(order.id);
    acc[order.table_id].orders.push(order);
    // Sum the total_amount for the grouped order
    acc[order.table_id].total_amount += calculateTotalAmount(order);
    return acc;
  }, {} as Record<number, any>);

  const sortedGroupedOrders = Object.values(groupedOrders).sort((a, b) => {
    return new Date(b.buffet_start_time).getTime() - new Date(a.buffet_start_time).getTime();
  });

  const handleOrderClick = (order: Order) => {
    // Navigate to order details
    navigate(`/mobile-order-details/${order.id}`);
  };

  const handleBack = () => {
    navigate('/mobile-tables');
  };

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
            DANH SÁCH HÓA ĐƠN
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Danh Sách Hóa Đơn Buffet
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Đang tải...</Typography>
          </Box>
        ) : sortedGroupedOrders.length > 0 ? (
          <List>
            {sortedGroupedOrders.map((group) => {
              return (
                <Card
                  key={group.table_id}
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleOrderClick(group.orders[0])}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {group.orders[0].order_number}
                      </Typography>
                      <Chip
                        icon={<Receipt />}
                        label={`${group.total_amount.toLocaleString('vi-VN')} ₫`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Bàn: {group.table_name} - Khu {group.area}
                      </Typography>
                      <Chip
                        icon={<AccessTime />}
                        label={getTimeElapsed(group.buffet_start_time)}
                        color="error"
                        size="small"
                      />
                    </Box>
                    
                    {group.orders[0].employee_name && (
                      <Typography variant="caption" color="text.secondary">
                        Nhân viên: {group.orders[0].employee_name}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TableRestaurant sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Chưa có hóa đơn nào
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tất cả bàn đều trống
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MobileInvoicesPage;
