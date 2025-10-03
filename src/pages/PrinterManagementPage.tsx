import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';

interface Printer {
  id: number;
  name: string;
  connection_type: 'usb' | 'ip';
  usb_port?: string;
  ip_address?: string;
  port_number?: number;
  driver_name?: string;
  status: 'active' | 'inactive' | 'error';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface FoodItem {
  id: number;
  name: string;
  price: number;
  type: 'buffet' | 'service';
  category_id?: number;
}

interface PrinterMapping {
  id: number;
  printer_id: number;
  food_item_id: number;
  food_item?: FoodItem;
}

interface PrintTemplate {
  id: number;
  printer_id: number;
  template_type: 'bill' | 'kitchen' | 'bar';
  template_name: string;
  template_content: string;
  is_active: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`printer-tabpanel-${index}`}
      aria-labelledby={`printer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PrinterManagementPage: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [printerMappings, setPrinterMappings] = useState<PrinterMapping[]>([]);
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openScanDialog, setOpenScanDialog] = useState(false);
  const [scannedPrinters, setScannedPrinters] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // States for management tab
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [selectedFoodItems, setSelectedFoodItems] = useState<number[]>([]);
  
  // States for template tab
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState('');

  // Form data for adding printer
  const [formData, setFormData] = useState({
    name: '',
    connection_type: 'usb' as 'usb' | 'ip',
    usb_port: '',
    ip_address: '',
    port_number: 9100,
    driver_name: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    console.log('PrinterManagementPage: useEffect - loading data...');
    loadPrinters();
    loadFoodItems();
    loadPrinterMappings();
    loadPrintTemplates();
  }, []);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('printers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrinters(data || []);
    } catch (error) {
      console.error('Error loading printers:', error);
      showSnackbar('Lỗi khi tải danh sách máy in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFoodItems = async () => {
    try {
      console.log('Loading food items...');
      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, price, type, category_id')
        .order('name', { ascending: true });

      if (error) throw error;
      console.log('Food items loaded:', data?.length || 0, 'items');
      setFoodItems(data || []);
    } catch (error) {
      console.error('Error loading food items:', error);
      showSnackbar('Lỗi khi tải danh sách món ăn', 'error');
    }
  };

  const loadPrinterMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('map_printer')
        .select(`
          *,
          food_item:food_items(id, name, price, type)
        `);

      if (error) throw error;
      setPrinterMappings(data || []);
    } catch (error) {
      console.error('Error loading printer mappings:', error);
      showSnackbar('Lỗi khi tải mapping máy in', 'error');
    }
  };

  const loadPrintTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('print_templates')
        .select('*')
        .order('printer_id', { ascending: true });

      if (error) throw error;
      setPrintTemplates(data || []);
    } catch (error) {
      console.error('Error loading print templates:', error);
      showSnackbar('Lỗi khi tải mẫu in', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleScanPrinters = async () => {
    try {
      setLoading(true);
      setOpenScanDialog(true);
      
      // Thử kết nối với Windows Printer Server trước
      const windowsServerUrl = 'http://localhost:9977';
      
      try {
        const response = await fetch(`${windowsServerUrl}/printers/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          setScannedPrinters(data.printers || []);
          showSnackbar(`Tìm thấy ${data.printers?.length || 0} máy in từ Windows server`, 'success');
          return;
        }
      } catch (windowsError) {
        console.log('Windows Printer Server not available, trying Vercel API');
      }

      // Fallback: Gọi API Vercel
      const response = await fetch('/api/printers/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setScannedPrinters(data.printers || []);
        showSnackbar(`Demo mode: ${data.printers?.length || 0} máy in mẫu`, 'success');
      } else {
        throw new Error('Failed to scan printers');
      }
    } catch (error) {
      console.error('Error scanning printers:', error);
      showSnackbar('Lỗi khi quét máy in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScannedPrinter = async (printer: any) => {
    try {
      const printerData = {
        name: printer.name,
        connection_type: printer.port?.includes('IP_') ? 'ip' : 'usb',
        usb_port: printer.port?.includes('IP_') ? null : printer.port,
        ip_address: printer.port?.includes('IP_') ? printer.port.replace('IP_', '') : null,
        port_number: printer.port?.includes('IP_') ? 9100 : null,
        driver_name: printer.driver,
        status: 'active',
        location: '',
        notes: 'Thêm từ quét tự động'
      };

      const { data, error } = await supabase
        .from('printers')
        .insert([printerData])
        .select()
        .single();

      if (error) throw error;

      setPrinters(prev => [data, ...prev]);
      setOpenScanDialog(false);
      showSnackbar('Đã thêm máy in thành công', 'success');
    } catch (error) {
      console.error('Error adding printer:', error);
      showSnackbar('Lỗi khi thêm máy in', 'error');
    }
  };

  const handleAddManualPrinter = async () => {
    try {
      if (!formData.name) {
        showSnackbar('Vui lòng nhập tên máy in', 'error');
        return;
      }

      if (formData.connection_type === 'usb' && !formData.usb_port) {
        showSnackbar('Vui lòng nhập USB port', 'error');
        return;
      }

      if (formData.connection_type === 'ip' && (!formData.ip_address || !formData.port_number)) {
        showSnackbar('Vui lòng nhập đầy đủ IP và port', 'error');
        return;
      }

      const printerData = {
        name: formData.name,
        connection_type: formData.connection_type,
        usb_port: formData.connection_type === 'usb' ? formData.usb_port : null,
        ip_address: formData.connection_type === 'ip' ? formData.ip_address : null,
        port_number: formData.connection_type === 'ip' ? formData.port_number : null,
        driver_name: formData.driver_name || null,
        status: 'active',
        location: formData.location || null,
        notes: formData.notes || null
      };

      const { data, error } = await supabase
        .from('printers')
        .insert([printerData])
        .select()
        .single();

      if (error) throw error;

      setPrinters(prev => [data, ...prev]);
      setOpenAddDialog(false);
      resetForm();
      showSnackbar('Đã thêm máy in thành công', 'success');
    } catch (error) {
      console.error('Error adding printer:', error);
      showSnackbar('Lỗi khi thêm máy in', 'error');
    }
  };

  const handleTestPrint = async (printer: Printer) => {
    try {
      setLoading(true);
      
      // Thử kết nối với Windows Printer Server trước
      const windowsServerUrl = 'http://localhost:9977';
      console.log('Trying to connect to Windows server:', windowsServerUrl);
      
      try {
        const response = await fetch(`${windowsServerUrl}/printers/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            printer_name: printer.name,
            content: 'TEST IN - Máy in hoạt động bình thường\nThời gian: ' + new Date().toLocaleString('vi-VN')
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Windows server response:', data);
          showSnackbar(`Đã in test thành công đến ${printer.name}`, 'success');
          return;
        } else {
          console.log('Windows server response not ok:', response.status);
        }
      } catch (windowsError) {
        console.log('Windows Printer Server not available, trying Vercel API', windowsError);
      }

      // Fallback: Gọi API Vercel
      const response = await fetch('/api/printers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printer_id: printer.id,
          content: 'TEST IN - Máy in hoạt động bình thường\nThời gian: ' + new Date().toLocaleString('vi-VN')
        })
      });

      if (response.ok) {
        showSnackbar(`Demo mode: Test in ${printer.name}`, 'success');
      } else {
        throw new Error('Test print failed');
      }
    } catch (error) {
      console.error('Error testing print:', error);
      showSnackbar('Lỗi khi test in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrinter = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa máy in này?')) return;

    try {
      const { error } = await supabase
        .from('printers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrinters(prev => prev.filter(p => p.id !== id));
      showSnackbar('Đã xóa máy in thành công', 'success');
    } catch (error) {
      console.error('Error deleting printer:', error);
      showSnackbar('Lỗi khi xóa máy in', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      connection_type: 'usb',
      usb_port: '',
      ip_address: '',
      port_number: 9100,
      driver_name: '',
      location: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'error': return <ErrorIcon />;
      default: return undefined;
    }
  };

  // Management tab functions
  const handleSelectPrinter = (printer: Printer) => {
    console.log('Selecting printer:', printer);
    setSelectedPrinter(printer);
    
    // Load existing mappings for this printer
    const existingMappings = printerMappings
      .filter(mapping => mapping.printer_id === printer.id)
      .map(mapping => mapping.food_item_id);
    
    console.log('Existing mappings for printer:', existingMappings);
    setSelectedFoodItems(existingMappings);
  };

  const handleToggleFoodItem = (foodItemId: number) => {
    setSelectedFoodItems(prev => 
      prev.includes(foodItemId)
        ? prev.filter(id => id !== foodItemId)
        : [...prev, foodItemId]
    );
  };

  const handleCancelSelection = () => {
    setSelectedPrinter(null);
    setSelectedFoodItems([]);
  };

  const handleSavePrinterMapping = async () => {
    if (!selectedPrinter) return;

    try {
      setLoading(true);

      // Delete existing mappings for this printer
      await supabase
        .from('map_printer')
        .delete()
        .eq('printer_id', selectedPrinter.id);

      // Insert new mappings
      if (selectedFoodItems.length > 0) {
        const mappings = selectedFoodItems.map(foodItemId => ({
          printer_id: selectedPrinter.id,
          food_item_id: foodItemId
        }));

        const { error } = await supabase
          .from('map_printer')
          .insert(mappings);

        if (error) throw error;
      }

      // Reload mappings
      await loadPrinterMappings();
      
      showSnackbar(`Đã lưu cấu hình cho máy in ${selectedPrinter.name}`, 'success');
      handleCancelSelection();
    } catch (error) {
      console.error('Error saving printer mapping:', error);
      showSnackbar('Lỗi khi lưu cấu hình', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Template tab functions
  const handleEditTemplate = (printer: Printer) => {
    const existingTemplate = printTemplates.find(
      template => template.printer_id === printer.id && template.template_type === 'kitchen'
    );

    if (existingTemplate) {
      setEditingTemplate(existingTemplate);
      setTemplateContent(existingTemplate.template_content);
    } else {
      // Create new template
      const newTemplate: PrintTemplate = {
        id: 0,
        printer_id: printer.id,
        template_type: 'kitchen',
        template_name: `Mẫu in ${printer.name}`,
        template_content: getDefaultTemplate(printer.location || 'kitchen'),
        is_active: true
      };
      setEditingTemplate(newTemplate);
      setTemplateContent(newTemplate.template_content);
    }
  };

  const getDefaultTemplate = (location: string) => {
    if (location === 'POS') {
      return `GUBGIPATI
4-6 Đường số 4, Khu Cán Bộ Giảng Viên
Cần Thơ, Phường Hưng Lợi, Quận Ninh Kiều
SĐT: 0969709033

HÓA ĐƠN TẠM TÍNH
--------------------------------
Tại bàn: {{table_name}}
Giờ vào: {{checkin_time}}
Giờ in: {{print_time}}
Khách hàng: {{customer_name}}

--------------------------------
{{items_list}}

--------------------------------
TỔNG TẠM TÍNH: {{total_amount}}đ
--------------------------------
Cảm ơn quý khách!

Wifi: Gubgipati
Pass: chucngonmieng`;
    } else {
      return `Số thẻ: {{card_number}}
{{print_time}} {{printer_location}}

(Bàn) {{table_info}}
Nhân viên: {{staff_name}}
* G/chú: {{notes}}

--------------------------------
Mặt hàng          Đ.vị SL
--------------------------------
{{items_list}}

--------------------------------`;
    }
  };

  const handleCancelTemplateEdit = () => {
    setEditingTemplate(null);
    setTemplateContent('');
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      setLoading(true);

      const templateData = {
        printer_id: editingTemplate.printer_id,
        template_type: editingTemplate.template_type,
        template_name: editingTemplate.template_name,
        template_content: templateContent,
        is_active: true
      };

      if (editingTemplate.id === 0) {
        // Create new template
        const { error } = await supabase
          .from('print_templates')
          .insert([templateData]);
        
        if (error) throw error;
      } else {
        // Update existing template
        const { error } = await supabase
          .from('print_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
      }

      // Reload templates
      await loadPrintTemplates();
      
      showSnackbar('Đã lưu mẫu in thành công', 'success');
      handleCancelTemplateEdit();
    } catch (error) {
      console.error('Error saving template:', error);
      showSnackbar('Lỗi khi lưu mẫu in', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quản Lý Máy In
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Danh sách" />
          <Tab label="Quản lý" />
          <Tab label="Mẫu in" />
        </Tabs>
      </Box>

      {/* Tab Danh sách */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Danh sách máy in</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleScanPrinters}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Quét máy in
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Thêm máy in
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên máy in</TableCell>
                <TableCell>Loại kết nối</TableCell>
                <TableCell>Thông tin kết nối</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Vị trí</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {printers.map((printer) => (
                <TableRow key={printer.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{printer.name}</Typography>
                      {printer.driver_name && (
                        <Typography variant="caption" color="text.secondary">
                          Driver: {printer.driver_name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={printer.connection_type.toUpperCase()}
                      color={printer.connection_type === 'usb' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {printer.connection_type === 'usb' ? (
                      <Typography variant="body2">{printer.usb_port}</Typography>
                    ) : (
                      <Typography variant="body2">
                        {printer.ip_address}:{printer.port_number}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      {...(getStatusIcon(printer.status) && { icon: getStatusIcon(printer.status) })}
                      label={printer.status}
                      color={getStatusColor(printer.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{printer.location || '-'}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleTestPrint(printer)}
                      disabled={loading}
                      color="primary"
                      title="Test in"
                    >
                      <PrintIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeletePrinter(printer.id)}
                      color="error"
                      title="Xóa"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {printers.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Chưa có máy in nào
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhấn "Thêm máy in" hoặc "Quét máy in" để bắt đầu
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Tab Quản lý */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Quản lý máy in
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Danh sách máy in */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Chọn máy in
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên máy in</TableCell>
                    <TableCell>Vị trí</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow 
                      key={printer.id}
                      hover
                      selected={selectedPrinter?.id === printer.id}
                      onClick={() => handleSelectPrinter(printer)}
                    >
                      <TableCell>{printer.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={printer.location || 'Chưa đặt'}
                          color={printer.location === 'POS' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleSelectPrinter(printer)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Danh sách món ăn */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Chọn món ăn cho {selectedPrinter?.name || 'máy in'}
            </Typography>
            {selectedPrinter && (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Chọn</TableCell>
                      <TableCell>Tên món</TableCell>
                      <TableCell>Loại</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {foodItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {loading ? 'Đang tải...' : 'Không có món ăn nào'}
                          </Typography>
                          {!loading && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Debug: foodItems.length = {foodItems.length}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      foodItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell padding="checkbox">
                            <input
                              type="checkbox"
                              checked={selectedFoodItems.includes(item.id)}
                              onChange={() => handleToggleFoodItem(item.id)}
                            />
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.type}
                              color={item.type === 'service' ? 'secondary' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>

        {selectedPrinter && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancelSelection}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleSavePrinterMapping}
              disabled={selectedFoodItems.length === 0}
            >
              Lưu cấu hình
            </Button>
          </Box>
        )}
      </TabPanel>

      {/* Tab Mẫu in */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Mẫu in
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Danh sách máy in */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Chọn máy in
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên máy in</TableCell>
                    <TableCell>Vị trí</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell>{printer.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={printer.location || 'Chưa đặt'}
                          color={printer.location === 'POS' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditTemplate(printer)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Editor template */}
          <Box sx={{ flex: 2 }}>
            {editingTemplate && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Chỉnh sửa mẫu in: {editingTemplate.template_name}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Nhập nội dung mẫu in..."
                  sx={{ fontFamily: 'monospace' }}
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelTemplateEdit}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveTemplate}
                  >
                    Lưu mẫu
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </TabPanel>

      {/* Dialog thêm máy in thủ công */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm máy in mới</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Tên máy in"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Loại kết nối</InputLabel>
              <Select
                value={formData.connection_type}
                onChange={(e) => setFormData({ ...formData, connection_type: e.target.value as 'usb' | 'ip' })}
              >
                <MenuItem value="usb">USB Port</MenuItem>
                <MenuItem value="ip">IP Address</MenuItem>
              </Select>
            </FormControl>

            {formData.connection_type === 'usb' ? (
              <TextField
                fullWidth
                label="USB Port"
                value={formData.usb_port}
                onChange={(e) => setFormData({ ...formData, usb_port: e.target.value })}
                margin="normal"
                required
                placeholder="VD: USB001, LPT1"
              />
            ) : (
              <>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  margin="normal"
                  required
                  placeholder="192.168.1.100"
                />
                <TextField
                  fullWidth
                  label="Port"
                  type="number"
                  value={formData.port_number}
                  onChange={(e) => setFormData({ ...formData, port_number: parseInt(e.target.value) })}
                  margin="normal"
                  required
                />
              </>
            )}

            <TextField
              fullWidth
              label="Driver"
              value={formData.driver_name}
              onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
              margin="normal"
              placeholder="Tên driver máy in"
            />

            <TextField
              fullWidth
              label="Vị trí"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              margin="normal"
              placeholder="VD: Bếp, Quầy bar"
            />

            <TextField
              fullWidth
              label="Ghi chú"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy</Button>
          <Button onClick={handleAddManualPrinter} variant="contained">
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog quét máy in */}
      <Dialog open={openScanDialog} onClose={() => setOpenScanDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Máy in đã quét được</DialogTitle>
        <DialogContent>
          {scannedPrinters.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên máy in</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scannedPrinters.map((printer, index) => (
                    <TableRow key={index}>
                      <TableCell>{printer.name}</TableCell>
                      <TableCell>{printer.driver}</TableCell>
                      <TableCell>{printer.port}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAddScannedPrinter(printer)}
                        >
                          Thêm
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Không tìm thấy máy in nào
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScanDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}
    </Box>
  );
};

export default PrinterManagementPage;
