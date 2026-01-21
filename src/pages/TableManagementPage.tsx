import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableRestaurant as TableIcon
} from '@mui/icons-material';

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  capacity: number;
  area: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TableManagementPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('A');
  const [formData, setFormData] = useState({
    table_number: '',
    table_name: '',
    capacity: 4,
    area: 'A',
    status: 'empty'
  });

  const areas = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tables');
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        table_number: table.table_number,
        table_name: table.table_name,
        capacity: table.capacity,
        area: table.area,
        status: table.status
      });
    } else {
      setEditingTable(null);
      setFormData({
        table_number: '',
        table_name: '',
        capacity: 4,
        area: selectedArea,
        status: 'empty'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTable(null);
    setFormData({
      table_number: '',
      table_name: '',
      capacity: 4,
      area: 'A',
      status: 'empty'
    });
  };

  const handleSave = async () => {
    try {
      const url = editingTable 
        ? `http://localhost:8000/api/tables/${editingTable.id}`
        : 'http://localhost:8000/api/tables';
      
      const method = editingTable ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTables();
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        console.error('Error saving table:', errorData.error || 'Unknown error');
        alert(errorData.error || 'Có lỗi xảy ra khi lưu bàn');
      }
    } catch (error) {
      console.error('Error saving table:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/tables/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchTables();
        } else {
          console.error('Error deleting table');
        }
      } catch (error) {
        console.error('Error deleting table:', error);
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'empty': return 'Trống';
      case 'busy': return 'Có khách';
      case 'reserved': return 'Đã đặt';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return 'success';
      case 'busy': return 'error';
      case 'reserved': return 'warning';
      default: return 'default';
    }
  };

  const filteredTables = tables.filter(table => table.area === selectedArea);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản Lý Bàn
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Bàn Mới
        </Button>
      </Box>

      {/* Chọn khu vực */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Chọn Khu Vực
        </Typography>
        <Tabs
          value={selectedArea}
          onChange={(e, newValue) => setSelectedArea(newValue)}
          sx={{ mb: 2 }}
        >
          {areas.map((area) => (
            <Tab key={area} label={`Khu ${area}`} value={area} />
          ))}
        </Tabs>
        
        <Typography variant="body2" color="text.secondary">
          Khu {selectedArea}: {filteredTables.length} bàn
        </Typography>
      </Paper>

      {/* Danh sách bàn theo khu */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Danh Sách Bàn - Khu {selectedArea}
        </Typography>
        
        {filteredTables.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Chưa có bàn nào trong khu {selectedArea}
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredTables.map((table) => (
              <Grid item xs={12} sm={6} md={4} key={table.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TableIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {table.table_name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Số bàn: {table.table_number}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sức chứa: {table.capacity} chỗ
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Khu: {table.area}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip
                        label={getStatusText(table.status)}
                        color={getStatusColor(table.status) as any}
                        size="small"
                      />
                      
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(table)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(table.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Dialog thêm/sửa bàn */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        disablePortal
        keepMounted={false}
        aria-hidden={false}
      >
        <DialogTitle>
          {editingTable ? 'Sửa Bàn' : 'Thêm Bàn Mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Số bàn"
                value={formData.table_number}
                onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Tên bàn"
                value={formData.table_name}
                onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Sức chứa"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Khu vực</InputLabel>
                <Select
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                >
                  {areas.map((area) => (
                    <MenuItem key={area} value={area}>
                      Khu {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="empty">Trống</MenuItem>
                  <MenuItem value="busy">Có khách</MenuItem>
                  <MenuItem value="reserved">Đã đặt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTable ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableManagementPage;