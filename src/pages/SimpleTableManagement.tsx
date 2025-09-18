import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  area: string;
  capacity: number;
  status: 'empty' | 'busy';
  created_at: string;
  updated_at: string;
}

const SimpleTableManagement: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    table_number: '',
    table_name: '',
    area: 'A',
    capacity: 4
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areas = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8001/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data);
        setError(null);
      } else {
        setError('Lỗi khi tải danh sách bàn');
      }
    } catch (error) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        table_number: table.table_number,
        table_name: table.table_name,
        area: table.area,
        capacity: table.capacity
      });
    } else {
      setEditingTable(null);
      setFormData({
        table_number: '',
        table_name: '',
        area: 'A',
        capacity: 4
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTable(null);
    setFormData({
      table_number: '',
      table_name: '',
      area: 'A',
      capacity: 4
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = editingTable 
        ? `http://localhost:8001/api/tables/${editingTable.id}`
        : 'http://localhost:8001/api/tables';
      
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
        setError(errorData.error || 'Có lỗi xảy ra khi lưu bàn');
      }
    } catch (error) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8001/api/tables/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchTables();
        } else {
          setError('Lỗi khi xóa bàn');
        }
      } catch (error) {
        setError('Lỗi kết nối server');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'empty' ? 'success' : 'error';
  };

  const getStatusText = (status: string) => {
    return status === 'empty' ? 'Trống' : 'Kín';
  };

  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.area]) {
      acc[table.area] = [];
    }
    acc[table.area].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

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
          disabled={loading}
        >
          Thêm Bàn
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && !tables.length && (
        <Typography>Đang tải...</Typography>
      )}

      {Object.entries(groupedTables).map(([area, areaTables]) => (
        <Box key={area} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, color: 'primary.main' }}>
            Khu {area} ({areaTables.length} bàn)
          </Typography>
          <Grid container spacing={2}>
            {areaTables.map((table) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">{table.table_name}</Typography>
                      <Chip
                        label={getStatusText(table.status)}
                        color={getStatusColor(table.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Số bàn: {table.table_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Sức chứa: {table.capacity} người
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(table)}
                        disabled={loading}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(table.id)}
                        disabled={loading}
                      >
                        Xóa
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm" 
        fullWidth
        disablePortal
      >
        <DialogTitle>
          {editingTable ? 'Sửa Bàn' : 'Thêm Bàn Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Số bàn"
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Tên bàn"
              value={formData.table_name}
              onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Khu vực</InputLabel>
              <Select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                label="Khu vực"
              >
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>
                    Khu {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Sức chứa"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })}
              fullWidth
              inputProps={{ min: 1, max: 20 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Hủy
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading || !formData.table_number || !formData.table_name}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleTableManagement;

