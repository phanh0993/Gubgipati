import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as FoodIcon,
  LocalPizza as MainDishIcon,
  Fastfood as SideDishIcon,
  RestaurantMenu as ComboIcon,
  AddCircle as ToppingIcon,
  LocalDrink as DrinkIcon
} from '@mui/icons-material';

interface FoodCategory {
  id: number;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface FoodItem {
  id: number;
  name: string;
  description: string;
  category_id: number;
  type: 'main' | 'side' | 'combo' | 'topping' | 'drink';
  price: number;
  cost: number;
  preparation_time: number;
  is_available: boolean;
  image_url?: string;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
}

interface RecipeIngredient {
  id: number;
  food_item_id: number;
  ingredient_id: number;
  quantity: number;
  unit: string;
  ingredient_name?: string;
}

const FoodManagementPage: React.FC = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [loading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [selectedFoodForRecipe, setSelectedFoodForRecipe] = useState<FoodItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: 0,
    type: 'main' as 'main' | 'side' | 'combo' | 'topping' | 'drink',
    price: 0,
    cost: 0,
    preparation_time: 15,
    is_available: true,
    image_url: ''
  });

  const [recipeForm, setRecipeForm] = useState({
    ingredient_id: 0,
    quantity: 0,
    unit: ''
  });

  const typeIcons = {
    main: <MainDishIcon />,
    side: <SideDishIcon />,
    combo: <ComboIcon />,
    topping: <ToppingIcon />,
    drink: <DrinkIcon />
  };

  const typeLabels = {
    main: 'Món Chính',
    side: 'Món Phụ',
    combo: 'Combo',
    topping: 'Topping',
    drink: 'Đồ Uống'
  };

  const typeColors = {
    main: 'primary',
    side: 'secondary',
    combo: 'success',
    topping: 'warning',
    drink: 'info'
  } as const;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [foodResponse, categoriesResponse, ingredientsResponse] = await Promise.all([
        fetch('/api/food-items'),
        fetch('/api/food-categories'),
        fetch('/api/ingredients')
      ]);

      if (foodResponse.ok) {
        const foodData = await foodResponse.json();
        setFoodItems(foodData);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      if (ingredientsResponse.ok) {
        const ingredientsData = await ingredientsResponse.json();
        setIngredients(ingredientsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchRecipeIngredients = async (foodItemId: number) => {
    try {
      const response = await fetch(`/api/recipe-ingredients?food_item_id=${foodItemId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipeIngredients(data);
      }
    } catch (error) {
      console.error('Error fetching recipe ingredients:', error);
    }
  };

  const handleOpenDialog = (foodItem?: FoodItem) => {
    if (foodItem) {
      setEditingFood(foodItem);
      setFormData({
        name: foodItem.name,
        description: foodItem.description,
        category_id: foodItem.category_id,
        type: foodItem.type,
        price: foodItem.price,
        cost: foodItem.cost,
        preparation_time: foodItem.preparation_time,
        is_available: foodItem.is_available,
        image_url: foodItem.image_url || ''
      });
    } else {
      setEditingFood(null);
      setFormData({
        name: '',
        description: '',
        category_id: 0,
        type: 'main',
        price: 0,
        cost: 0,
        preparation_time: 15,
        is_available: true,
        image_url: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFood(null);
  };

  const handleOpenRecipeDialog = (foodItem: FoodItem) => {
    setSelectedFoodForRecipe(foodItem);
    setOpenRecipeDialog(true);
    fetchRecipeIngredients(foodItem.id);
  };

  const handleCloseRecipeDialog = () => {
    setOpenRecipeDialog(false);
    setSelectedFoodForRecipe(null);
    setRecipeIngredients([]);
  };

  const handleSaveFoodItem = async () => {
    try {
      const url = editingFood ? `/api/food-items/${editingFood.id}` : '/api/food-items';
      const method = editingFood ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error saving food item:', error);
    }
  };

  const handleDeleteFoodItem = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa món ăn này?')) {
      try {
        const response = await fetch(`/api/food-items/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchData();
        }
      } catch (error) {
        console.error('Error deleting food item:', error);
      }
    }
  };

  const handleAddRecipeIngredient = async () => {
    if (!selectedFoodForRecipe || !recipeForm.ingredient_id || !recipeForm.quantity) return;

    try {
      const response = await fetch('/api/recipe-ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food_item_id: selectedFoodForRecipe.id,
          ingredient_id: recipeForm.ingredient_id,
          quantity: recipeForm.quantity,
          unit: recipeForm.unit
        }),
      });

      if (response.ok) {
        await fetchRecipeIngredients(selectedFoodForRecipe.id);
        setRecipeForm({ ingredient_id: 0, quantity: 0, unit: '' });
      }
    } catch (error) {
      console.error('Error adding recipe ingredient:', error);
    }
  };

  const handleDeleteRecipeIngredient = async (id: number) => {
    try {
      const response = await fetch(`/api/recipe-ingredients/${id}`, {
        method: 'DELETE',
      });

      if (response.ok && selectedFoodForRecipe) {
        await fetchRecipeIngredients(selectedFoodForRecipe.id);
      }
    } catch (error) {
      console.error('Error deleting recipe ingredient:', error);
    }
  };

  const groupedFoodItems = foodItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản Lý Món Ăn
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Món Ăn
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Tất Cả Món Ăn" />
          <Tab label="Món Chính" />
          <Tab label="Món Phụ" />
          <Tab label="Combo" />
          <Tab label="Topping" />
          <Tab label="Đồ Uống" />
        </Tabs>
      </Paper>

      {/* Food Items Grid */}
      <Grid container spacing={3}>
        {Object.entries(groupedFoodItems).map(([type, items]) => {
          if (tabValue > 0 && type !== Object.keys(typeLabels)[tabValue - 1]) return null;
          
          return items.map((foodItem) => (
            <Grid item xs={12} sm={6} md={4} key={foodItem.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {typeIcons[foodItem.type]}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {foodItem.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={typeLabels[foodItem.type]}
                      color={typeColors[foodItem.type]}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {foodItem.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Giá bán:</strong> {foodItem.price.toLocaleString()} VNĐ
                    </Typography>
                    <Typography variant="body2">
                      <strong>Giá vốn:</strong> {foodItem.cost.toLocaleString()} VNĐ
                    </Typography>
                    <Typography variant="body2">
                      <strong>Thời gian chế biến:</strong> {foodItem.preparation_time} phút
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" component="span">
                        <strong>Trạng thái:</strong>
                      </Typography>
                      <Chip
                        label={foodItem.is_available ? 'Có sẵn' : 'Hết hàng'}
                        color={foodItem.is_available ? 'success' : 'error'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      onClick={() => handleOpenRecipeDialog(foodItem)}
                    >
                      Công thức
                    </Button>
                    <Box>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(foodItem)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteFoodItem(foodItem.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ));
        })}
      </Grid>

      {/* Add/Edit Food Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFood ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tên món ăn"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Loại món ăn</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value as string) })}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Thời gian chế biến (phút)"
                type="number"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) || 15 })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Giá bán (VNĐ)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Giá vốn (VNĐ)"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL hình ảnh"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  />
                }
                label="Có sẵn"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSaveFoodItem} variant="contained">
            {editingFood ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recipe Dialog */}
      <Dialog open={openRecipeDialog} onClose={handleCloseRecipeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Công Thức: {selectedFoodForRecipe?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Nguyên liệu</InputLabel>
                <Select
                  value={recipeForm.ingredient_id}
                  onChange={(e) => setRecipeForm({ ...recipeForm, ingredient_id: parseInt(e.target.value as string) })}
                >
                  {ingredients.map(ingredient => (
                    <MenuItem key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Số lượng"
                type="number"
                value={recipeForm.quantity}
                onChange={(e) => setRecipeForm({ ...recipeForm, quantity: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Đơn vị"
                value={recipeForm.unit}
                onChange={(e) => setRecipeForm({ ...recipeForm, unit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddRecipeIngredient}
                disabled={!recipeForm.ingredient_id || !recipeForm.quantity}
                sx={{ height: '56px' }}
              >
                Thêm
              </Button>
            </Grid>
          </Grid>

          <TableContainer sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nguyên liệu</TableCell>
                  <TableCell>Số lượng</TableCell>
                  <TableCell>Đơn vị</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recipeIngredients.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.ingredient_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRecipeIngredient(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecipeDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodManagementPage;
