import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  CircularProgress,
  CardMedia,
  CardActionArea
} from '@mui/material';
import { Add, Edit, Delete, Restaurant, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BuffetPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: string;
  image_url?: string;
}

interface BuffetPackageItem {
  id: number;
  package_id: number;
  food_item_id: number;
  is_unlimited: boolean;
  max_quantity?: number;
  food_item: FoodItem;
}

const BuffetFoodManagement: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<BuffetPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<BuffetPackage | null>(null);
  const [packageItems, setPackageItems] = useState<BuffetPackageItem[]>([]);
  const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddPackageDialog, setShowAddPackageDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: 0,
    duration_minutes: 90
  });
  const [newItem, setNewItem] = useState({
    food_item_id: 0,
    is_unlimited: true,
    max_quantity: null as number | null
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch buffet packages
      const packagesResponse = await fetch('/api/buffet-packages');
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);
        if (packagesData.length > 0) {
          setSelectedPackage(packagesData[0]);
          await fetchPackageItems(packagesData[0].id);
        }
      }

      // Fetch all food items
      const foodItemsResponse = await fetch('/api/food-items');
      if (foodItemsResponse.ok) {
        const foodItemsData = await foodItemsResponse.json();
        setAllFoodItems(foodItemsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  const handleSelectPackage = (pkg: BuffetPackage) => {
    setSelectedPackage(pkg);
    fetchPackageItems(pkg.id);
  };

  const handleAddPackage = () => {
    setNewPackage({
      name: '',
      description: '',
      price: 0,
      duration_minutes: 90
    });
    setShowAddPackageDialog(true);
  };

  const handleSaveNewPackage = () => {
    // Trong thực tế sẽ gọi API để tạo package
    const newPkg: BuffetPackage = {
      id: Date.now(),
      name: newPackage.name,
      description: newPackage.description,
      price: newPackage.price,
      duration_minutes: newPackage.duration_minutes,
      is_active: true
    };
    setPackages([...packages, newPkg]);
    setShowAddPackageDialog(false);
  };

  const handleAddItem = () => {
    setNewItem({
      food_item_id: 0,
      is_unlimited: true,
      max_quantity: null
    });
    setShowAddItemDialog(true);
  };

  const handleSaveItem = async () => {
    if (!selectedPackage || newItem.food_item_id === 0) return;
    
    try {
      const response = await fetch('/api/buffet-package-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          food_item_id: newItem.food_item_id,
          is_unlimited: newItem.is_unlimited,
          max_quantity: newItem.max_quantity
        }),
      });

      if (response.ok) {
        await fetchPackageItems(selectedPackage.id);
        setShowAddItemDialog(false);
        setNewItem({
          food_item_id: 0,
          is_unlimited: true,
          max_quantity: null
        });
      } else {
        alert('Lỗi khi thêm món vào gói');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Lỗi khi thêm món vào gói');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/buffet-package-items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPackageItems(selectedPackage!.id);
      } else {
        alert('Lỗi khi xóa món khỏi gói');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Lỗi khi xóa món khỏi gói');
    }
  };

  const handleSavePackageItems = async () => {
    if (!selectedPackage) return;
    
    try {
      // Refresh package items from database
      await fetchPackageItems(selectedPackage.id);
      alert('Đã lưu danh sách món ăn cho gói ' + selectedPackage.name);
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Lỗi khi lưu danh sách món ăn');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Quản Lý Món Ăn Buffet
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel: Buffet Packages */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Gói Buffet</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddPackage}
                  size="small"
                >
                  Thêm Gói
                </Button>
              </Box>
              <List>
                {packages.map((pkg) => (
                  <ListItem
                    key={pkg.id}
                    button
                    selected={selectedPackage?.id === pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    sx={{
                      border: 1,
                      borderColor: selectedPackage?.id === pkg.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: selectedPackage?.id === pkg.id ? 'primary.light' : 'background.paper'
                    }}
                  >
                    <ListItemText
                      primary={pkg.name}
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" component="span">
                            {pkg.price.toLocaleString('vi-VN')}₫ - {pkg.duration_minutes} phút
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel: Food Items in Selected Package */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Món Trong Gói {selectedPackage?.name || 'Chưa chọn gói'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddItem}
                  disabled={!selectedPackage}
                  size="small"
                >
                  Thêm Món
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSavePackageItems}
                  startIcon={<Edit />}
                  disabled={!selectedPackage}
                  size="small"
                >
                  Lưu
                </Button>
              </Box>
              
              {selectedPackage ? (
                <Grid container spacing={1}>
                  {packageItems.map((item) => (
                    <Grid item xs={6} sm={4} key={item.id}>
                      <Card 
                        sx={{ 
                          position: 'relative',
                          border: 1,
                          borderColor: 'divider',
                          '&:hover': { 
                            borderColor: 'primary.main',
                            boxShadow: 2
                          }
                        }}
                      >
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
                          <Typography variant="caption" color="text.secondary">
                            {item.food_item.price.toLocaleString('vi-VN')}₫
                          </Typography>
                        </CardContent>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                          size="small"
                          sx={{ 
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'white',
                            '&:hover': { bgcolor: 'grey.100' }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  Vui lòng chọn một gói buffet để xem danh sách món ăn
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Package Dialog */}
      <Dialog open={showAddPackageDialog} onClose={() => setShowAddPackageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Gói Buffet Mới</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tên gói"
            value={newPackage.name}
            onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Mô tả"
            value={newPackage.description}
            onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Giá (₫)"
            type="number"
            value={newPackage.price}
            onChange={(e) => setNewPackage({ ...newPackage, price: parseInt(e.target.value) || 0 })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Thời gian (phút)"
            type="number"
            value={newPackage.duration_minutes}
            onChange={(e) => setNewPackage({ ...newPackage, duration_minutes: parseInt(e.target.value) || 90 })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPackageDialog(false)}>Hủy</Button>
          <Button onClick={handleSaveNewPackage} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onClose={() => setShowAddItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Món Vào Gói</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Chọn món ăn</InputLabel>
            <Select
              value={newItem.food_item_id}
              onChange={(e) => setNewItem({ ...newItem, food_item_id: e.target.value as number })}
            >
              {allFoodItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} - {item.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Loại</InputLabel>
            <Select
              value={newItem.is_unlimited ? 'unlimited' : 'limited'}
              onChange={(e) => setNewItem({ 
                ...newItem, 
                is_unlimited: e.target.value === 'unlimited' 
              })}
            >
              <MenuItem value="unlimited">Gọi thoải mái</MenuItem>
              <MenuItem value="limited">Có giới hạn</MenuItem>
            </Select>
          </FormControl>
          {!newItem.is_unlimited && (
            <TextField
              fullWidth
              label="Số lượng tối đa"
              type="number"
              value={newItem.max_quantity || ''}
              onChange={(e) => setNewItem({ 
                ...newItem, 
                max_quantity: parseInt(e.target.value) || null 
              })}
              margin="normal"
            />
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Hình ảnh món ăn
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ marginBottom: 16 }}
            />
            {imagePreview && (
              <Box sx={{ mt: 1 }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    width: '100%', 
                    maxWidth: 200, 
                    height: 120, 
                    objectFit: 'cover',
                    borderRadius: 8
                  }} 
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddItemDialog(false)}>Hủy</Button>
          <Button onClick={handleSaveItem} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BuffetFoodManagement;