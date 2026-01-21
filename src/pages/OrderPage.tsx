import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Person,
  Payment,
  Close,
} from '@mui/icons-material';
import { customersAPI, employeesAPI, invoicesAPI } from '../services/api';
import { Customer, Employee } from '../types';
import { formatCurrency } from '../utils/formatters';

interface OrderItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

const OrderPage: React.FC = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    fullname: '',
    phone: '',
    email: '',
    address: '',
  });
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    fullname: '',
    email: '',
    phone: '',
  });
  const [notes, setNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersResponse, employeesResponse] = await Promise.all([
        customersAPI.getAll({ search: '', limit: 100, offset: 0 }),
        employeesAPI.getAll(),
      ]);
      setCustomers(customersResponse.data.customers);
      setEmployees(employeesResponse.data.employees);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
    }
    
    setOrderItems(updatedItems);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const discount = (subtotal * discountPercent) / 100;
  const tax = (subtotal - discount) * 0.1; // 10% VAT
  const total = subtotal - discount + tax;

  const handleCreateInvoice = async () => {
    if (!selectedCustomer || !selectedEmployee) {
      alert('Vui lòng chọn khách hàng và nhân viên');
      return;
    }

    if (orderItems.length === 0) {
      alert('Vui lòng thêm ít nhất một món');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        customer_id: selectedCustomer.id,
        employee_id: selectedEmployee.id,
        items: orderItems.map(item => ({
          service_id: 1, // Dummy service ID for custom items
          quantity: item.quantity,
          unit_price: item.price,
        })),
        subtotal,
        discount,
        tax,
        total,
        notes,
        payment_status: 'pending',
      };

      await invoicesAPI.create(invoiceData);
      alert('Tạo hóa đơn thành công!');
      
      // Reset form
      setOrderItems([]);
      setSelectedCustomer(null);
      setSelectedEmployee(null);
      setNotes('');
      setDiscountPercent(0);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Lỗi khi tạo hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.fullname || !newCustomer.phone) {
      alert('Vui lòng nhập tên và số điện thoại');
      return;
    }

    try {
      const response = await customersAPI.create(newCustomer);
      const customer = response.data.customer;
      setCustomers([...customers, customer]);
      setSelectedCustomer(customer);
      setOpenCustomerDialog(false);
      setNewCustomer({ fullname: '', phone: '', email: '', address: '' });
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Lỗi khi thêm khách hàng');
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.fullname || !newEmployee.email) {
      alert('Vui lòng nhập tên và email');
      return;
    }

    try {
      const response = await employeesAPI.create(newEmployee);
      const employee = response.data.employee;
      setEmployees([...employees, employee]);
      setSelectedEmployee(employee);
      setOpenEmployeeDialog(false);
      setNewEmployee({ fullname: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Lỗi khi thêm nhân viên');
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
      <Typography variant="h4" gutterBottom>
        Tạo Hóa Đơn
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Customer Selection */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Khách Hàng
            </Typography>
            {selectedCustomer ? (
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {selectedCustomer.fullname}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer.phone}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedCustomer(null)}
                  startIcon={<Close />}
                >
                  Thay đổi
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Person />}
                onClick={() => setOpenCustomerDialog(true)}
                fullWidth
              >
                Chọn khách hàng
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Employee Selection */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Nhân Viên
            </Typography>
            {selectedEmployee ? (
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {selectedEmployee.fullname}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEmployee.email}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedEmployee(null)}
                  startIcon={<Close />}
                >
                  Thay đổi
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Person />}
                onClick={() => setOpenEmployeeDialog(true)}
                fullWidth
              >
                Chọn nhân viên
              </Button>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Order Items */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Món Ăn</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={addOrderItem}
          >
            Thêm Món
          </Button>
        </Box>

        <List>
          {orderItems.map((item, index) => (
            <ListItem key={index} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, width: '100%', alignItems: 'center' }}>
                <TextField
                  label="Tên món"
                  value={item.description}
                  onChange={(e) => updateOrderItem(index, 'description', e.target.value)}
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Số lượng"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  sx={{ width: 120 }}
                />
                <TextField
                  label="Giá"
                  type="number"
                  value={item.price}
                  onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                  sx={{ width: 120 }}
                />
                <Typography variant="body1" sx={{ minWidth: 100, textAlign: 'right' }}>
                  {formatCurrency(item.total)}
                </Typography>
                <IconButton
                  color="error"
                  onClick={() => removeOrderItem(index)}
                >
                  <Delete />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>

        {orderItems.length === 0 && (
          <Alert severity="info">
            Chưa có món nào. Nhấn "Thêm Món" để bắt đầu.
          </Alert>
        )}
      </Paper>

      {/* Order Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tổng Kết
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Tạm tính:</Typography>
          <Typography>{formatCurrency(subtotal)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Giảm giá ({discountPercent}%):</Typography>
          <Typography>-{formatCurrency(discount)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>VAT (10%):</Typography>
          <Typography>{formatCurrency(tax)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <Typography variant="h6">Tổng cộng:</Typography>
          <Typography variant="h6" color="primary">
            {formatCurrency(total)}
          </Typography>
        </Box>
      </Paper>

      {/* Notes and Discount */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Ghi chú"
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Giảm giá (%)"
          type="number"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
          sx={{ width: 150 }}
        />
      </Box>

      {/* Create Invoice Button */}
      <Button
        variant="contained"
        size="large"
        startIcon={<Payment />}
        onClick={handleCreateInvoice}
        disabled={!selectedCustomer || !selectedEmployee || orderItems.length === 0}
        sx={{ width: '100%' }}
      >
        Tạo Hóa Đơn
      </Button>

      {/* Add Customer Dialog */}
      <Dialog open={openCustomerDialog} onClose={() => setOpenCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Khách Hàng Mới</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tên khách hàng"
            value={newCustomer.fullname}
            onChange={(e) => setNewCustomer({ ...newCustomer, fullname: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Số điện thoại"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Địa chỉ"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomerDialog(false)}>Hủy</Button>
          <Button onClick={handleAddCustomer} variant="contained">
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={openEmployeeDialog} onClose={() => setOpenEmployeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Nhân Viên Mới</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tên nhân viên"
            value={newEmployee.fullname}
            onChange={(e) => setNewEmployee({ ...newEmployee, fullname: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Số điện thoại"
            value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmployeeDialog(false)}>Hủy</Button>
          <Button onClick={handleAddEmployee} variant="contained">
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderPage;