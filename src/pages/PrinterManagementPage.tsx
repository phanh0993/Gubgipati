import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Print,
  PrintDisabled,
  Restaurant,
  LocalPizza,
  Coffee,
  Icecream,
} from '@mui/icons-material';

interface Printer {
  id: number;
  name: string;
  location: string;
  ip_address: string;
  is_active: boolean;
  printer_type: 'kitchen' | 'bar' | 'dessert' | 'general';
}

interface FoodItem {
  id: number;
  name: string;
  category: string;
  printer_id?: number;
}

interface BuffetPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

interface BuffetPackageItem {
  id: number;
  package_id: number;
  food_item_id: number;
  is_unlimited: boolean;
  max_quantity: number | null;
  food_item: {
    id: number;
    name: string;
    price: number;
    description: string;
    printer_id?: number;
  };
}

const PrinterManagementPage: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [buffetPackages, setBuffetPackages] = useState<BuffetPackage[]>([]);
  const [buffetPackageItems, setBuffetPackageItems] = useState<BuffetPackageItem[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<BuffetPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    location: '',
    ip_address: '',
    printer_type: 'kitchen' as const,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Sử dụng dữ liệu mẫu cho buffet packages
      const mockPackages: BuffetPackage[] = [
        {
          id: 1,
          name: 'VÉ 199K',
          description: 'Buffet 199K - Thời gian: 90 phút',
          price: 199000,
          duration_minutes: 90,
          is_active: true
        },
        {
          id: 2,
          name: 'VÉ 229K',
          description: 'Buffet 229K - Thời gian: 120 phút',
          price: 229000,
          duration_minutes: 120,
          is_active: true
        },
        {
          id: 3,
          name: 'VÉ 169K',
          description: 'Buffet 169K - Thời gian: 60 phút',
          price: 169000,
          duration_minutes: 60,
          is_active: true
        }
      ];
      setBuffetPackages(mockPackages);

      const [printersResponse, foodResponse] = await Promise.all([
        fetch('/api/printers'),
        fetch('/api/food-items'),
      ]);

      if (printersResponse.ok) {
        const printersData = await printersResponse.json();
        setPrinters(printersData);
      }

      if (foodResponse.ok) {
        const foodData = await foodResponse.json();
        setFoodItems(foodData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuffetPackageItems = (packageId: number) => {
    // Sử dụng dữ liệu mẫu cho buffet package items
    const mockPackageItems: BuffetPackageItem[] = [
      {
        id: 1,
        package_id: packageId,
        food_item_id: 1,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 1,
          name: 'Cá basa giấy bạc',
          price: 0,
          description: 'Cá basa nướng giấy bạc',
          printer_id: 1
        }
      },
      {
        id: 2,
        package_id: packageId,
        food_item_id: 2,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 2,
          name: 'Sò điệp mỡ hành',
          price: 0,
          description: 'Sò điệp xào mỡ hành',
          printer_id: 1
        }
      },
      {
        id: 3,
        package_id: packageId,
        food_item_id: 3,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 3,
          name: 'Phô mai que',
          price: 0,
          description: 'Phô mai que chiên giòn',
          printer_id: 2
        }
      },
      {
        id: 4,
        package_id: packageId,
        food_item_id: 4,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 4,
          name: 'Ba chỉ bò',
          price: 0,
          description: 'Ba chỉ bò tươi',
          printer_id: 1
        }
      },
      {
        id: 5,
        package_id: packageId,
        food_item_id: 5,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 5,
          name: 'Thân lưng bò',
          price: 0,
          description: 'Thân lưng bò tươi',
          printer_id: 1
        }
      },
      {
        id: 6,
        package_id: packageId,
        food_item_id: 6,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 6,
          name: 'Bắp hoa bò',
          price: 0,
          description: 'Bắp hoa bò tươi',
          printer_id: 1
        }
      },
      {
        id: 7,
        package_id: packageId,
        food_item_id: 7,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 7,
          name: 'Bò cuốn nấm kim châm',
          price: 0,
          description: 'Bò cuốn nấm kim châm',
          printer_id: 1
        }
      },
      {
        id: 8,
        package_id: packageId,
        food_item_id: 8,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 8,
          name: 'Ba chỉ heo',
          price: 0,
          description: 'Ba chỉ heo tươi',
          printer_id: 1
        }
      },
      {
        id: 9,
        package_id: packageId,
        food_item_id: 9,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 9,
          name: 'Da heo',
          price: 0,
          description: 'Da heo nướng',
          printer_id: 1
        }
      },
      {
        id: 10,
        package_id: packageId,
        food_item_id: 10,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 10,
          name: 'Chân gà rút xương',
          price: 0,
          description: 'Chân gà rút xương',
          printer_id: 1
        }
      },
      {
        id: 11,
        package_id: packageId,
        food_item_id: 11,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 11,
          name: 'Cánh gà',
          price: 0,
          description: 'Cánh gà tươi',
          printer_id: 1
        }
      },
      {
        id: 12,
        package_id: packageId,
        food_item_id: 12,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 12,
          name: 'Tôm',
          price: 0,
          description: 'Tôm tươi',
          printer_id: 1
        }
      },
      {
        id: 13,
        package_id: packageId,
        food_item_id: 13,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 13,
          name: 'Bạch tuộc',
          price: 0,
          description: 'Bạch tuộc tươi',
          printer_id: 1
        }
      },
      {
        id: 14,
        package_id: packageId,
        food_item_id: 14,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 14,
          name: 'Soup rong biển',
          price: 0,
          description: 'Soup rong biển',
          printer_id: 3
        }
      },
      {
        id: 15,
        package_id: packageId,
        food_item_id: 15,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 15,
          name: 'Soup kim chi',
          price: 0,
          description: 'Soup kim chi',
          printer_id: 3
        }
      },
      {
        id: 16,
        package_id: packageId,
        food_item_id: 16,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 16,
          name: 'Cơm trộn',
          price: 0,
          description: 'Cơm trộn bibimbap',
          printer_id: 2
        }
      },
      {
        id: 17,
        package_id: packageId,
        food_item_id: 17,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 17,
          name: 'Miến trộn',
          price: 0,
          description: 'Miến trộn japchae',
          printer_id: 2
        }
      },
      {
        id: 18,
        package_id: packageId,
        food_item_id: 18,
        is_unlimited: true,
        max_quantity: null,
        food_item: {
          id: 18,
          name: 'Mì trộn cay sốt phô mai',
          price: 0,
          description: 'Mì trộn cay sốt phô mai',
          printer_id: 2
        }
      }
    ];
    setBuffetPackageItems(mockPackageItems);
  };

  const handleCreatePrinter = async () => {
    try {
      const response = await fetch('/api/printers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrinter),
      });

      if (response.ok) {
        const printer = await response.json();
        setPrinters([...printers, printer]);
        setOpenDialog(false);
        setNewPrinter({
          name: '',
          location: '',
          ip_address: '',
          printer_type: 'kitchen',
          is_active: true,
        });
        alert('Thêm máy in thành công!');
      } else {
        alert('Lỗi khi thêm máy in');
      }
    } catch (error) {
      console.error('Error creating printer:', error);
      alert('Lỗi khi thêm máy in');
    }
  };

  const handleUpdatePrinter = async () => {
    if (!editingPrinter) return;

    try {
      const response = await fetch(`/api/printers/${editingPrinter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPrinter),
      });

      if (response.ok) {
        const updatedPrinter = await response.json();
        setPrinters(printers.map(p => p.id === editingPrinter.id ? updatedPrinter : p));
        setOpenDialog(false);
        setEditingPrinter(null);
        alert('Cập nhật máy in thành công!');
      } else {
        alert('Lỗi khi cập nhật máy in');
      }
    } catch (error) {
      console.error('Error updating printer:', error);
      alert('Lỗi khi cập nhật máy in');
    }
  };

  const handleDeletePrinter = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa máy in này?')) return;

    try {
      const response = await fetch(`/api/printers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPrinters(printers.filter(p => p.id !== id));
        alert('Xóa máy in thành công!');
      } else {
        alert('Lỗi khi xóa máy in');
      }
    } catch (error) {
      console.error('Error deleting printer:', error);
      alert('Lỗi khi xóa máy in');
    }
  };

  const handleAssignFoodToPrinter = async (foodItemId: number, printerId: number) => {
    try {
      const response = await fetch(`/api/food-items/${foodItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printer_id: printerId }),
      });

      if (response.ok) {
        setFoodItems(foodItems.map(item => 
          item.id === foodItemId ? { ...item, printer_id: printerId } : item
        ));
        alert('Phân loại món ăn thành công!');
      } else {
        alert('Lỗi khi phân loại món ăn');
      }
    } catch (error) {
      console.error('Error assigning food to printer:', error);
      alert('Lỗi khi phân loại món ăn');
    }
  };

  const handleUpdateBuffetItemPrinter = async (foodItemId: number, printerId: number) => {
    try {
      // Cập nhật printer cho món buffet
      setBuffetPackageItems(prev => 
        prev.map(item => 
          item.food_item_id === foodItemId 
            ? { 
                ...item, 
                food_item: { 
                  ...item.food_item, 
                  printer_id: printerId 
                } 
              }
            : item
        )
      );
      
      // Cũng cập nhật trong danh sách food items nếu có
      setFoodItems(prev => 
        prev.map(item => 
          item.id === foodItemId 
            ? { ...item, printer_id: printerId }
            : item
        )
      );
      
      alert('Phân loại món buffet thành công!');
    } catch (error) {
      console.error('Error updating buffet item printer:', error);
      alert('Lỗi khi phân loại món buffet');
    }
  };

  const getPrinterIcon = (type: string) => {
    switch (type) {
      case 'kitchen': return <Restaurant />;
      case 'bar': return <Coffee />;
      case 'dessert': return <Icecream />;
      default: return <Print />;
    }
  };

  const getPrinterTypeText = (type: string) => {
    switch (type) {
      case 'kitchen': return 'Bếp';
      case 'bar': return 'Bar';
      case 'dessert': return 'Tráng miệng';
      default: return 'Chung';
    }
  };

  const getPrinterTypeColor = (type: string) => {
    switch (type) {
      case 'kitchen': return 'error';
      case 'bar': return 'info';
      case 'dessert': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Quản Lý Máy In
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Thêm Máy In
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Printers List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Danh Sách Máy In
            </Typography>
            <Grid container spacing={2}>
              {printers.map((printer) => (
                <Grid item xs={12} sm={6} key={printer.id}>
                  <Card sx={{ 
                    border: 1, 
                    borderColor: printer.is_active ? 'success.main' : 'error.main',
                    opacity: printer.is_active ? 1 : 0.7
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getPrinterIcon(printer.printer_type)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {printer.name}
                        </Typography>
                        <Chip
                          label={getPrinterTypeText(printer.printer_type)}
                          color={getPrinterTypeColor(printer.printer_type) as any}
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Vị trí: {printer.location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        IP: {printer.ip_address}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip
                          label={printer.is_active ? 'Hoạt động' : 'Tạm dừng'}
                          color={printer.is_active ? 'success' : 'error'}
                          size="small"
                        />
                        <Box sx={{ ml: 'auto' }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingPrinter(printer);
                              setOpenDialog(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePrinter(printer.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Buffet Package Selection */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chọn Gói Buffet
            </Typography>
            <Grid container spacing={2}>
              {buffetPackages.map((pkg) => (
                <Grid item xs={12} sm={6} key={pkg.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: 2,
                      borderColor: selectedPackage?.id === pkg.id ? 'primary.main' : 'grey.300',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main'
                      },
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      fetchBuffetPackageItems(pkg.id);
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">{pkg.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pkg.description}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {pkg.price.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Buffet Food Items Assignment */}
        {selectedPackage && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Món Ăn Buffet - {selectedPackage.name}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên Món</TableCell>
                      <TableCell>Máy In</TableCell>
                      <TableCell>Thao Tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {buffetPackageItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.food_item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.food_item.description}
                            </Typography>
                            {item.is_unlimited && (
                              <Chip label="Gọi thoải mái" size="small" color="success" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={item.food_item.printer_id || ''}
                              onChange={(e) => handleUpdateBuffetItemPrinter(item.food_item.id, Number(e.target.value))}
                            >
                              <MenuItem value="">Chưa chọn</MenuItem>
                              {printers.map((printer) => (
                                <MenuItem key={printer.id} value={printer.id}>
                                  {printer.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateBuffetItemPrinter(item.food_item.id, item.food_item.printer_id || 0)}
                          >
                            <Print />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Food Items Assignment */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Phân Loại Món Ăn Thường
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên Món</TableCell>
                    <TableCell>Danh Mục</TableCell>
                    <TableCell>Máy In</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {foodItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={item.printer_id || ''}
                            onChange={(e) => handleAssignFoodToPrinter(item.id, parseInt(e.target.value as string))}
                          >
                            <MenuItem value="">Chọn máy in</MenuItem>
                            {printers.map((printer) => (
                              <MenuItem key={printer.id} value={printer.id}>
                                {printer.name} ({getPrinterTypeText(printer.printer_type)})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Printer Dialog */}
      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setEditingPrinter(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPrinter ? 'Chỉnh Sửa Máy In' : 'Thêm Máy In Mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên máy in"
                value={editingPrinter?.name || newPrinter.name}
                onChange={(e) => {
                  if (editingPrinter) {
                    setEditingPrinter({ ...editingPrinter, name: e.target.value });
                  } else {
                    setNewPrinter({ ...newPrinter, name: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vị trí"
                value={editingPrinter?.location || newPrinter.location}
                onChange={(e) => {
                  if (editingPrinter) {
                    setEditingPrinter({ ...editingPrinter, location: e.target.value });
                  } else {
                    setNewPrinter({ ...newPrinter, location: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ IP"
                value={editingPrinter?.ip_address || newPrinter.ip_address}
                onChange={(e) => {
                  if (editingPrinter) {
                    setEditingPrinter({ ...editingPrinter, ip_address: e.target.value });
                  } else {
                    setNewPrinter({ ...newPrinter, ip_address: e.target.value });
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Loại máy in</InputLabel>
                <Select
                  value={editingPrinter?.printer_type || newPrinter.printer_type}
                  onChange={(e) => {
                    if (editingPrinter) {
                      setEditingPrinter({ ...editingPrinter, printer_type: e.target.value as any });
                    } else {
                      setNewPrinter({ ...newPrinter, printer_type: e.target.value as any });
                    }
                  }}
                >
                  <MenuItem value="kitchen">Bếp</MenuItem>
                  <MenuItem value="bar">Bar</MenuItem>
                  <MenuItem value="dessert">Tráng miệng</MenuItem>
                  <MenuItem value="general">Chung</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingPrinter?.is_active ?? newPrinter.is_active}
                    onChange={(e) => {
                      if (editingPrinter) {
                        setEditingPrinter({ ...editingPrinter, is_active: e.target.checked });
                      } else {
                        setNewPrinter({ ...newPrinter, is_active: e.target.checked });
                      }
                    }}
                  />
                }
                label="Hoạt động"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingPrinter(null);
          }}>
            Hủy
          </Button>
          <Button
            onClick={editingPrinter ? handleUpdatePrinter : handleCreatePrinter}
            variant="contained"
          >
            {editingPrinter ? 'Cập Nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrinterManagementPage;
