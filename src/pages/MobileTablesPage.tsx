import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button
} from '@mui/material';
import {
  TableRestaurant,
  AccessTime,
  Logout,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getTimeElapsed } from '../utils/formatters';

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  capacity: number;
  status: string;
  area: string;
}

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
}


const MobileTablesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('A');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const areas = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    const employee = localStorage.getItem('pos_employee');
    if (employee) {
      const empData = JSON.parse(employee);
      setCurrentEmployee(empData);
      
      // Check if user has permission to access mobile POS
      if (empData.role && empData.role !== 'staff' && empData.role !== 'manager') {
        console.log('Access denied: Invalid role for mobile POS');
        navigate('/mobile-login');
        return;
      }
    } else {
      // No employee data, redirect to login
      navigate('/mobile-login');
      return;
    }
    
    fetchData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchData = async (showIndicator = false) => {
    try {
      if (showIndicator) {
        setIsRefreshing(true);
      }
      
      // Fetch tables and orders using API
      const { tableAPI, orderAPI } = await import('../services/api');
      const [tablesRes, ordersRes] = await Promise.all([
        tableAPI.getTables(),
        orderAPI.getOrders()
      ]);
      
      setTables(tablesRes.data);
      setOrders(ordersRes.data.filter((order: Order) => 
        order.status === 'pending' && order.order_type === 'buffet'
      ));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  const getTableStatus = (table: Table) => {
    const tableOrder = orders.find(order => order.table_id === table.id);
    return tableOrder ? 'busy' : 'empty';
  };

  const getTableOrder = (table: Table) => {
    return orders.find(order => order.table_id === table.id);
  };

  const getStatusText = (table: Table) => {
    const status = getTableStatus(table);
    return status === 'busy' ? 'Có khách' : 'Trống';
  };

  const getStatusColor = (table: Table) => {
    const status = getTableStatus(table);
    return status === 'busy' ? 'error' : 'success';
  };

  // getTimeElapsed is now imported from formatters

  const handleSelectTable = (table: Table) => {
    const tableOrder = getTableOrder(table);
    if (tableOrder) {
      // Bàn đã có order, chuyển đến mobile menu
      navigate('/mobile-menu', { 
        state: { 
          selectedTable: {
            id: table.id,
            table_number: table.table_number,
            table_name: table.table_name,
            area: table.area,
            capacity: table.capacity
          },
          existingOrder: tableOrder
        }
      });
    } else {
      // Bàn trống, chuyển đến mobile menu để tạo order mới
      navigate('/mobile-menu', { 
        state: { 
          selectedTable: {
            id: table.id,
            table_number: table.table_number,
            table_name: table.table_name,
            area: table.area,
            capacity: table.capacity
          }
        }
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_employee');
    navigate('/mobile-login');
  };


  const filteredTables = tables.filter(table => table.area === selectedArea);
  const emptyTables = filteredTables.filter(table => getTableStatus(table) === 'empty');

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar sx={{ minHeight: 56 }}>
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

      <Box sx={{ p: 2 }}>
        {/* Thống kê */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="body2" color="primary" sx={{ fontSize: '0.8rem' }}>
                Tổng số đơn: {orders.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="body2" color="success.main" sx={{ fontSize: '0.8rem' }}>
                Bàn trống: {emptyTables.length}/{filteredTables.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Layout theo HÌNH 1 */}
        <Box sx={{ display: 'flex', gap: 1, height: 'calc(100vh - 200px)' }}>
          {/* Cột trái: Danh sách khu */}
          <Box sx={{ width: '25%', minWidth: '80px' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1, height: '100%' }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                  Chọn Khu
                </Typography>
                <List sx={{ p: 0 }}>
                  {areas.map((area) => (
                    <ListItem
                      key={area}
                      button
                      selected={selectedArea === area}
                      onClick={() => setSelectedArea(area)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        minHeight: 40,
                        bgcolor: selectedArea === area ? 'primary.light' : 'transparent',
                        color: selectedArea === area ? 'white' : 'inherit',
                        '&:hover': {
                          bgcolor: selectedArea === area ? 'primary.light' : 'grey.100'
                        }
                      }}
                    >
                      <ListItemText 
                        primary={`KHU ${area}`}
                        primaryTypographyProps={{ 
                          fontSize: '0.8rem',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Cột phải: Lưới bàn */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1, height: '100%' }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                  KHU {selectedArea} - Chọn Bàn
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '10px 8px',
                  overflow: 'auto'
                }}>
                  {filteredTables.map((table) => {
                    const tableOrder = getTableOrder(table);
                    const isBusy = getTableStatus(table) === 'busy';
                    
                    return (
                      <Card
                        key={table.id}
                        sx={{
                          cursor: 'pointer',
                          border: 2,
                          borderColor: isBusy ? 'error.main' : 'success.main',
                          height: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleSelectTable(table)}
                      >
                        <TableRestaurant 
                          sx={{ 
                            fontSize: 20, 
                            color: isBusy ? 'error.main' : 'success.main', 
                            mb: 0.5 
                          }} 
                        />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                          {table.table_number}
                        </Typography>
                        {isBusy && tableOrder && (
                          <Chip
                            icon={<AccessTime />}
                            label={getTimeElapsed(tableOrder.buffet_start_time || tableOrder.created_at)}
                            color="error"
                            size="small"
                            sx={{ fontSize: '0.6rem', height: 16, mt: 0.5 }}
                          />
                        )}
                      </Card>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Footer - Button DANH SÁCH HÓA ĐƠN */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="contained"
            fullWidth
            sx={{ 
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
            onClick={() => navigate('/mobile-invoices')}
          >
            DANH SÁCH HÓA ĐƠN
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MobileTablesPage;
