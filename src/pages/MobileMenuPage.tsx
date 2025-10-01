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
  Grid,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  TextField
} from '@mui/material';
import {
  TableRestaurant,
  ArrowBack,
  Restaurant
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
}

const MobileMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const selectedTable = location.state?.selectedTable as TableInfo;
  const existingOrder = location.state?.existingOrder as Order;

  const [packages, setPackages] = useState<BuffetPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<BuffetPackage | null>(null);
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [packageItems, setPackageItems] = useState<BuffetPackageItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(existingOrder || null);
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: boolean }>({});
  const [orderItems, setOrderItems] = useState<{ [key: number]: number }>({});
  const [itemNotes, setItemNotes] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchPackages();
    if (existingOrder) {
      setCurrentOrder(existingOrder);
      // Auto peek VÉ từ lần order thứ 2 trở đi
      if (existingOrder.buffet_package_id) {
        // Tìm gói vé đã order từ danh sách packages
        const existingPackage = packages.find(pkg => pkg.id === existingOrder.buffet_package_id);
        if (existingPackage) {
          setSelectedPackage(existingPackage);
          setPackageQuantity(0); // Số lượng vé = 0 cho order tiếp theo
        }
      }
    }
  }, [existingOrder, packages]);

  const fetchPackages = async () => {
    try {
      const { buffetAPI } = await import('../services/api');
      const response = await buffetAPI.getPackages();
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleSelectPackage = async (pkg: BuffetPackage) => {
    // Nếu đã có order cũ (lần thứ 2 trở đi), không cho chọn VÉ khác
    if (currentOrder && currentOrder.buffet_package_id && currentOrder.buffet_package_id !== pkg.id) {
      alert('Không thể thay đổi loại VÉ từ lần order thứ 2 trở đi!');
      return;
    }
    
    setSelectedPackage(pkg);
    setPackageQuantity(currentOrder ? 0 : 1); // Nếu có order cũ thì quantity = 0, nếu không thì = 1
    setSelectedItems({});
    setOrderItems({});
    try {
      const { buffetAPI } = await import('../services/api');
      const response = await buffetAPI.getPackageItems(pkg.id);
      setPackageItems(response.data);
    } catch (error) {
      console.error('Error fetching package items:', error);
    }
  };

  const handleSelectItem = (itemId: number) => {
    const isSelected = selectedItems[itemId] || false;
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !isSelected
    }));
    
    if (!isSelected) {
      // Thêm món vào order
      setOrderItems(prev => ({
        ...prev,
        [itemId]: 1
      }));
    } else {
      // Bỏ món khỏi order
      setOrderItems(prev => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });
    }
  };

  const handleUpdateItemNote = (itemId: number, note: string) => {
    setItemNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  const handleViewOrder = () => {
    const selectedItemsList = packageItems.filter(item => selectedItems[item.id]);
    const orderData = {
      selectedTable,
      currentOrder,
      selectedPackage,
      packageQuantity,
      selectedItems: selectedItemsList,
      orderItems,
      itemNotes
    };
    
    navigate('/mobile-bill', { state: orderData });
  };

  const handleBack = () => {
    navigate('/mobile-tables');
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar sx={{ minHeight: 56 }}>
          <IconButton color="inherit" onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            BÀN {selectedTable.area}{selectedTable.table_number}
          </Typography>
          <IconButton color="inherit">
            <Restaurant />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content - Layout theo HÌNH 2 */}
      <Box sx={{ flex: 1, display: 'flex', p: 1, gap: 1 }}>
        {/* Cột trái: Vé và thông tin */}
        <Box sx={{ width: '30%', minWidth: '100px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 1, height: '100%' }}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                Chọn Vé
              </Typography>
              <List sx={{ p: 0 }}>
                {packages.map((pkg) => (
                  <ListItem
                    key={pkg.id}
                    button
                    selected={selectedPackage?.id === pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    sx={{
                      border: 1,
                      borderColor: selectedPackage?.id === pkg.id ? 'primary.main' : 'grey.300',
                      mb: 0.5,
                      borderRadius: 1,
                      minHeight: 40,
                      bgcolor: selectedPackage?.id === pkg.id ? 'primary.light' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedPackage?.id === pkg.id ? 'primary.light' : 'grey.100'
                      }
                    }}
                  >
                    <ListItemText
                      primary={pkg.name}
                      secondary={`${pkg.price.toLocaleString()}₫`}
                      primaryTypographyProps={{ 
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                      secondaryTypographyProps={{ 
                        fontSize: '0.7rem',
                        textAlign: 'center'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Cột phải: Món ăn */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 1, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Nhân viên: {user?.fullname || 'Chưa xác định'}
                </Typography>
              </Box>
              
              {selectedPackage ? (
                <Box sx={{ 
                  height: 'calc(100% - 40px)', 
                  overflow: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1,
                  rowGap: 1.5,
                  p: 0.5
                }}>
                  {packageItems.map((item) => {
                    const isSelected = selectedItems[item.id] || false;
                    const currentNote = itemNotes[item.id] || '';
                    return (
                      <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Card
                          onClick={() => handleSelectItem(item.id)}
                          sx={{
                            cursor: 'pointer',
                            border: 2,
                            borderColor: isSelected ? 'primary.main' : 'grey.300',
                            height: isSelected ? 'auto' : '90px',
                            minHeight: '90px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: isSelected ? 'primary.light' : 'white',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: 2
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 35,
                              height: 35,
                              bgcolor: isSelected ? 'primary.main' : 'primary.light',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 0.5
                            }}
                          >
                            <img
                              src={`https://via.placeholder.com/35x35/1976d2/FFFFFF?text=${encodeURIComponent(item.food_item.name.charAt(0))}`}
                              alt={item.food_item.name}
                              style={{ width: 35, height: 35, borderRadius: 4 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.65rem',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                px: 0.5,
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                color: isSelected ? 'primary.main' : 'text.primary'
                              }}
                            >
                              {item.food_item.name}
                            </Typography>
                            {currentNote && (
                              <Chip
                                label="Có ghi chú"
                                size="small"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: '16px',
                                  backgroundColor: 'success.light',
                                  color: 'success.contrastText'
                                }}
                              />
                            )}
                          </Box>
                        </Card>
                        
                        {isSelected && (
                          <Box sx={{ mt: 1, width: '100%' }}>
                            <TextField
                              size="small"
                              placeholder="Ghi chú cho món này..."
                              value={currentNote}
                              onChange={(e) => handleUpdateItemNote(item.id, e.target.value)}
                              sx={{ 
                                width: '100%',
                                '& .MuiInputBase-input': {
                                  fontSize: '0.8rem',
                                  padding: '8px 12px',
                                  minHeight: '20px'
                                },
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
                                  backgroundColor: '#f5f5f5'
                                }
                              }}
                              variant="outlined"
                              multiline
                              maxRows={2}
                            />
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ 
                  height: 'calc(100% - 40px)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Chọn vé để xem món ăn
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Footer - Nút Xem ORDER */}
      <Box sx={{ p: 1, textAlign: 'right' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleViewOrder}
          disabled={!selectedPackage && Object.keys(orderItems).length === 0}
          sx={{ minWidth: 120 }}
        >
          Xem ORDER
        </Button>
      </Box>
    </Box>
  );
};

export default MobileMenuPage;
