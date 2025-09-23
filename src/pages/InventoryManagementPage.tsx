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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
// Revert: remove direct Supabase calls from this page to avoid affecting global API behavior

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  supplier: string;
  is_active: boolean;
}

interface InventoryTransaction {
  id: number;
  ingredient_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit: string;
  reason: string;
  notes: string;
  created_at: string;
}

const InventoryManagementPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    current_stock: 0,
    min_stock: 0,
    cost_per_unit: 0,
    supplier: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    ingredient_id: 0,
    transaction_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchIngredients();
    fetchTransactions();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients');
      if (response.ok) {
        const data = await response.json();
        setIngredients(data);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/inventory-transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Reverted: order items aggregation will be re-implemented later without affecting global API

  const handleOpenDialog = (ingredient?: Ingredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        unit: ingredient.unit,
        current_stock: ingredient.current_stock,
        min_stock: ingredient.min_stock,
        cost_per_unit: ingredient.cost_per_unit,
        supplier: ingredient.supplier
      });
    } else {
      setEditingIngredient(null);
      setFormData({
        name: '',
        unit: '',
        current_stock: 0,
        min_stock: 0,
        cost_per_unit: 0,
        supplier: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingIngredient(null);
  };

  const handleSaveIngredient = async () => {
    try {
      const url = editingIngredient ? `/api/ingredients/${editingIngredient.id}` : '/api/ingredients';
      const method = editingIngredient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchIngredients();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) {
      try {
        const response = await fetch(`/api/ingredients/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchIngredients();
        }
      } catch (error) {
        console.error('Error deleting ingredient:', error);
      }
    }
  };

  const handleTransaction = async () => {
    try {
      const response = await fetch('/api/inventory-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionForm),
      });

      if (response.ok) {
        await fetchIngredients();
        await fetchTransactions();
        setTransactionForm({
          ingredient_id: 0,
          transaction_type: 'in',
          quantity: 0,
          reason: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.current_stock <= 0) {
      return { status: 'out', color: 'error' as const, label: 'Hết hàng' };
    } else if (ingredient.current_stock <= ingredient.min_stock) {
      return { status: 'low', color: 'warning' as const, label: 'Sắp hết' };
    } else {
      return { status: 'good', color: 'success' as const, label: 'Đủ hàng' };
    }
  };

  const lowStockItems = ingredients.filter(ingredient => 
    ingredient.current_stock <= ingredient.min_stock
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản Lý Kho
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Nguyên Liệu
        </Button>
      </Box>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">Cảnh báo: {lowStockItems.length} nguyên liệu sắp hết hàng</Typography>
          {lowStockItems.map(item => (
            <Typography key={item.id} variant="body2">
              • {item.name}: {item.current_stock} {item.unit} (tối thiểu: {item.min_stock} {item.unit})
            </Typography>
          ))}
        </Alert>
      )}

      {/* Reverted temporary order items summary section */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Danh Sách Nguyên Liệu" />
          <Tab label="Giao Dịch Kho" />
          <Tab label="Báo Cáo Tồn Kho" />
        </Tabs>
      </Paper>

      {/* Ingredients Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {ingredients.map((ingredient) => {
            const stockStatus = getStockStatus(ingredient);
            return (
              <Grid item xs={12} sm={6} md={4} key={ingredient.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{ingredient.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ingredient.supplier}
                        </Typography>
                      </Box>
                      <Chip
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                        icon={stockStatus.status === 'out' ? <WarningIcon /> : undefined}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tồn kho hiện tại: <strong>{ingredient.current_stock} {ingredient.unit}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tồn kho tối thiểu: {ingredient.min_stock} {ingredient.unit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Giá: {ingredient.cost_per_unit.toLocaleString()} VNĐ/{ingredient.unit}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(ingredient)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteIngredient(ingredient.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Transactions Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Giao Dịch Kho
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Nguyên liệu"
                value={transactionForm.ingredient_id}
                onChange={(e) => setTransactionForm({ ...transactionForm, ingredient_id: parseInt(e.target.value) })}
                SelectProps={{ native: true }}
              >
                <option value={0}>Chọn nguyên liệu</option>
                {ingredients.map(ingredient => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                select
                label="Loại giao dịch"
                value={transactionForm.transaction_type}
                onChange={(e) => setTransactionForm({ ...transactionForm, transaction_type: e.target.value as any })}
                SelectProps={{ native: true }}
              >
                <option value="in">Nhập kho</option>
                <option value="out">Xuất kho</option>
                <option value="adjustment">Điều chỉnh</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Số lượng"
                type="number"
                value={transactionForm.quantity}
                onChange={(e) => setTransactionForm({ ...transactionForm, quantity: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Lý do"
                value={transactionForm.reason}
                onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleTransaction}
                disabled={!transactionForm.ingredient_id || !transactionForm.quantity}
                sx={{ height: '56px' }}
              >
                Thực hiện
              </Button>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Nguyên liệu</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Số lượng</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {ingredients.find(ing => ing.id === transaction.ingredient_id)?.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.transaction_type === 'in' ? 'Nhập' : transaction.transaction_type === 'out' ? 'Xuất' : 'Điều chỉnh'}
                        color={transaction.transaction_type === 'in' ? 'success' : transaction.transaction_type === 'out' ? 'error' : 'warning'}
                        size="small"
                        icon={transaction.transaction_type === 'in' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      />
                    </TableCell>
                    <TableCell>{transaction.quantity} {transaction.unit}</TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Reports Tab */}
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Báo Cáo Tồn Kho
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tổng giá trị tồn kho
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {ingredients.reduce((total, ingredient) => 
                      total + (ingredient.current_stock * ingredient.cost_per_unit), 0
                    ).toLocaleString()} VNĐ
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Số nguyên liệu sắp hết
                  </Typography>
                  <Typography variant="h4" color="warning">
                    {lowStockItems.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIngredient ? 'Chỉnh Sửa Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tên nguyên liệu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Đơn vị"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tồn kho hiện tại"
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tồn kho tối thiểu"
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Giá mua"
                type="number"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nhà cung cấp"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSaveIngredient} variant="contained">
            {editingIngredient ? 'Cập Nhật' : 'Thêm Mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryManagementPage;
