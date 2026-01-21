import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  TextField,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  TableRestaurant,
  Logout,
  AccessTime,
  Receipt,
  Refresh,
  TrendingUp,
  Visibility,
  Close,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { getTimeElapsed, formatVietnamDateTime } from '../utils/timeUtils';
import { formatFoodItemName } from '../utils/formatters';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Table {
  id: number;
  table_name: string;
  area: string;
  table_number: string;
  capacity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  order_number: string;
  table_id: number;
  status: string;
  buffet_start_time: string;
  buffet_duration_minutes: number;
  created_at: string;
  table_name: string;
  area: string;
  total_amount?: number;
}

const BuffetTableSelection: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const canEdit = user?.role === 'manager' || user?.role === 'admin';
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('A');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingQuantities, setEditingQuantities] = useState<any>({});
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  // Doanh thu states
  const [dailyRevenue, setDailyRevenue] = useState<number>(0);
  const [dailyInvoiceCount, setDailyInvoiceCount] = useState<number>(0);
  const [dailyInvoices, setDailyInvoices] = useState<any[]>([]);
  const [loadingRevenue, setLoadingRevenue] = useState<boolean>(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any>(null);
  const [invoiceDetailDialogOpen, setInvoiceDetailDialogOpen] = useState<boolean>(false);

  // Đồ hết states
  const [allFoodItems, setAllFoodItems] = useState<any[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingFoodItems, setLoadingFoodItems] = useState<boolean>(false);

  useEffect(() => {
    const employee = localStorage.getItem('pos_employee');
    if (employee) {
      setCurrentEmployee(JSON.parse(employee));
    }
    fetchData();
    fetchDailyRevenue();
    loadOutOfStockItems(); // Load danh sách món đã hết từ localStorage
    fetchAllFoodItems(); // Load danh sách tất cả món
    
    // Auto-refresh every 5 seconds để cập nhật real-time
    const interval = setInterval(() => {
      fetchData(true); // Hiển thị indicator khi auto-refresh
      if (activeTab === 2) { // Chỉ refresh doanh thu khi đang ở tab DOANH THU
        fetchDailyRevenue();
      }
    }, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async (showIndicator = false) => {
    try {
      if (showIndicator) {
        setIsRefreshing(true);
      }
      
      const { tableAPI, orderAPI } = await import('../services/api');
      const [tablesRes, ordersRes] = await Promise.all([
        tableAPI.getTables(),
        orderAPI.getOrders()
      ]);

      const tablesData = tablesRes.data;
      const ordersData = ordersRes.data;

      console.log('Tables data:', tablesData);
      console.log('Orders data:', ordersData);

      // Đảm bảo tablesData là array
      if (Array.isArray(tablesData)) {
        setTables(tablesData);
      } else {
        console.error('Tables data is not an array:', tablesData);
        setTables([]);
      }

      // Lọc chỉ lấy orders buffet và chưa thanh toán
      if (Array.isArray(ordersData)) {
        const buffetOrders = ordersData.filter(order => 
          order.order_type === 'buffet' && order.status === 'pending'
        );
        
        // Map table info to orders
        const ordersWithTableInfo = buffetOrders.map(order => {
          const table = tablesData.find(t => t.id === order.table_id);
          return {
            ...order,
            table_name: table?.table_name || `Bàn ${order.table_id}`,
            area: table?.area || 'Unknown'
          };
        });
        
        setOrders(ordersWithTableInfo);
        console.log('Buffet orders with table info:', ordersWithTableInfo);
      } else {
        console.error('Orders data is not an array:', ordersData);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTables([]);
      setOrders([]);
    } finally {
      if (showIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  const getTableStatus = (table: Table) => {
    const hasUnpaidOrder = orders.some(order => 
      order.table_id === table.id && order.status === 'pending'
    );
    return hasUnpaidOrder ? 'busy' : 'empty';
  };

  const getTableOrder = (table: Table) => {
    return orders.find(order => 
      order.table_id === table.id && order.status === 'pending'
    );
  };

  // Function gộp món trùng nhau
  const mergeDuplicateItems = (items: any[]) => {
    if (!items || items.length === 0) return [];
    
    const mergedItems: { [key: string]: any } = {};
    
    items.forEach(item => {
      const key = `${item.food_item_id || item.id || item.name}-${Number(item.price || 0)}`;
      if (mergedItems[key]) {
        // Nếu đã có món này, cộng dồn số lượng
        mergedItems[key].quantity += item.quantity || 1;
      } else {
        // Nếu chưa có, tạo mới
        mergedItems[key] = {
          ...item,
          quantity: item.quantity || 1
        };
      }
    });
    
    return Object.values(mergedItems);
  };

  const getStatusText = (table: Table) => {
    const status = getTableStatus(table);
    switch (status) {
      case 'empty': return 'Trống';
      case 'busy': return 'Có khách';
      default: return status;
    }
  };

  const getStatusColor = (table: Table) => {
    const status = getTableStatus(table);
    switch (status) {
      case 'empty': return 'success';
      case 'busy': return 'error';
      default: return 'default';
    }
  };

  // Fetch doanh thu trong ngày
  const fetchDailyRevenue = async () => {
    try {
      setLoadingRevenue(true);
      
      // Lấy ngày hôm nay (theo múi giờ Việt Nam) - giống với Dashboard
      const now = dayjs().tz('Asia/Ho_Chi_Minh');
      const todayStr = now.format('YYYY-MM-DD');
      
      console.log('📊 [DOANH THU] Fetching revenue for today:', todayStr);
      
      // Lấy tất cả invoices đã thanh toán, sau đó filter theo ngày (invoice_date hoặc created_at)
      // Không join với orders vì không có foreign key relationship
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          employees (
            id,
            fullname
          )
        `)
        .eq('payment_status', 'paid')
        .order('invoice_date', { ascending: false });
      
      if (invoicesError) {
        console.error('❌ [DOANH THU] Error fetching invoices:', invoicesError);
        setDailyRevenue(0);
        setDailyInvoiceCount(0);
        setDailyInvoices([]);
        return;
      }
      
      console.log('📊 [DOANH THU] Total paid invoices:', allInvoices?.length || 0);
      
      // Filter invoices theo ngày hôm nay (theo múi giờ Việt Nam) - giống với Dashboard
      const invoicesData = allInvoices?.filter((inv: any) => {
        // Ưu tiên dùng invoice_date, fallback về created_at nếu không có
        const dateToCheck = inv.invoice_date || inv.created_at;
        if (!dateToCheck) return false;
        
        const invDate = dayjs(dateToCheck).tz('Asia/Ho_Chi_Minh');
        const invDateStr = invDate.format('YYYY-MM-DD');
        const isToday = invDateStr === todayStr;
        
        if (isToday) {
          console.log('✅ [DOANH THU] Found invoice for today:', inv.invoice_number, 'Date:', invDateStr, 'Amount:', inv.total_amount);
        }
        
        return isToday;
      }) || [];
      
      console.log('📊 [DOANH THU] Invoices for today:', invoicesData.length);
      
      // Tính tổng doanh thu
      const revenue = invoicesData?.reduce((sum: number, inv: any) => {
        return sum + (Number(inv.total_amount) || 0);
      }, 0) || 0;
      
      console.log('📊 [DOANH THU] Total revenue:', revenue);
      
      // Map invoices với thông tin đầy đủ
      const invoicesWithDetails = invoicesData?.map((inv: any) => {
        const employee = Array.isArray(inv.employees) ? inv.employees[0] : inv.employees || inv.employee;
        
        // Lấy thông tin từ invoice (có thể có customer_name, notes chứa thông tin bàn)
        let tableName = 'N/A';
        let area = 'N/A';
        
        // Thử parse thông tin bàn từ notes nếu có
        if (inv.notes) {
          const notesMatch = inv.notes.match(/Bàn\s+(\w+)\s*-\s*(\w+)/i);
          if (notesMatch) {
            area = notesMatch[2] || 'N/A';
            tableName = `Bàn ${notesMatch[1]}`;
          }
        }
        
        return {
          ...inv,
          order_number: inv.invoice_number || `INV-${inv.id}`,
          table_name: tableName,
          area: area,
          employee_name: employee?.fullname || inv.customer_name || 'N/A'
        };
      }) || [];
      
      setDailyRevenue(revenue);
      setDailyInvoiceCount(invoicesData?.length || 0);
      setDailyInvoices(invoicesWithDetails);
      
    } catch (error) {
      console.error('❌ [DOANH THU] Error fetching daily revenue:', error);
      setDailyRevenue(0);
      setDailyInvoiceCount(0);
      setDailyInvoices([]);
    } finally {
      setLoadingRevenue(false);
    }
  };

  // Xem chi tiết hóa đơn
  const handleViewInvoiceDetail = async (invoiceId: number) => {
    try {
      const { invoicesAPI } = await import('../services/api');
      const response = await invoicesAPI.getById(invoiceId);
      setSelectedInvoiceDetail(response.data);
      setInvoiceDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching invoice detail:', error);
      alert('Không thể tải chi tiết hóa đơn');
    }
  };

  // Load danh sách món đã hết từ localStorage (theo ngày)
  const loadOutOfStockItems = () => {
    const today = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
    const storageKey = `outOfStockItems_${today}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const items = JSON.parse(stored);
        setOutOfStockItems(new Set(items));
      } catch (e) {
        console.error('Error loading out of stock items:', e);
      }
    }
  };

  // Lưu danh sách món đã hết vào localStorage (theo ngày)
  const saveOutOfStockItems = (items: Set<number>) => {
    const today = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
    const storageKey = `outOfStockItems_${today}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(items)));
  };

  // Fetch tất cả món ăn
  const fetchAllFoodItems = async () => {
    try {
      setLoadingFoodItems(true);
      const { buffetAPI } = await import('../services/api');
      const response = await buffetAPI.getFoodItems();
      setAllFoodItems(response.data || []);
    } catch (error) {
      console.error('Error fetching food items:', error);
    } finally {
      setLoadingFoodItems(false);
    }
  };

  // Đánh dấu món đã hết
  const markItemOutOfStock = (itemId: number) => {
    const newSet = new Set(outOfStockItems);
    newSet.add(itemId);
    setOutOfStockItems(newSet);
    saveOutOfStockItems(newSet);
  };

  // Bỏ đánh dấu món đã hết
  const unmarkItemOutOfStock = (itemId: number) => {
    const newSet = new Set(outOfStockItems);
    newSet.delete(itemId);
    setOutOfStockItems(newSet);
    saveOutOfStockItems(newSet);
  };

  // Filter món theo search term
  const filteredFoodItems = allFoodItems.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return item.name?.toLowerCase().includes(searchLower) || 
           item.description?.toLowerCase().includes(searchLower);
  });

  const handleSelectTable = (table: Table) => {
    // Chuyển đến trang chọn thực đơn buffet
    navigate('/buffet-menu', { 
      state: { 
        selectedTable: table,
        currentOrder: getTableOrder(table)
      } 
    });
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
    setShowOrderDialog(true);
  };

  const handleQuantityChange = (type: 'buffet' | 'item', newQuantity: number, itemIndex?: number) => {
    if (!orderDetails) return;
    
    console.log('🔍 Quantity change:', { type, newQuantity, itemIndex, currentQuantities: editingQuantities });
    
    const newQuantities = { ...editingQuantities };
    
    if (type === 'buffet') {
      newQuantities.buffet_quantity = Math.max(0, newQuantity);
    } else if (type === 'item' && itemIndex !== undefined) {
      newQuantities[`item_${itemIndex}`] = Math.max(0, newQuantity);
    }
    
    console.log('🔍 New quantities:', newQuantities);
    setEditingQuantities(newQuantities);
  };

  const handleSaveChanges = async () => {
    if (!selectedOrder || !orderDetails) return;
    
    try {
      // Tính toán tổng tiền mới
      const newBuffetQuantity = editingQuantities.buffet_quantity !== undefined 
        ? editingQuantities.buffet_quantity 
        : (orderDetails.buffet_quantity || 0);
      const buffetTotal = (orderDetails.buffet_package_price || 0) * newBuffetQuantity;
      
      let itemsTotal = 0;
      const items = mergeDuplicateItems(orderDetails.items);
      
      // Cập nhật từng món ăn riêng lẻ (thay thế, không cộng dồn)
      const { orderAPI } = await import('../services/api');
      
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const newQuantity = editingQuantities[`item_${index}`] !== undefined 
          ? editingQuantities[`item_${index}`] 
          : (item.quantity || 0);
        
        if (newQuantity !== item.quantity) {
          // Cập nhật số lượng món ăn (thay thế hoàn toàn)
          await orderAPI.updateOrderItemQuantity(selectedOrder.id, item.food_item_id, newQuantity);
        }
        
        const itemTotal = (item.price || 0) * newQuantity;
        itemsTotal += itemTotal;
      }
      
      const newSubtotal = buffetTotal + itemsTotal;
      const newTax = 0; // Bỏ thuế
      
      // Áp dụng discount từ order
      const orderDiscountType = orderDetails.discount_type || discountType || 'percent';
      const orderDiscountValue = orderDetails.discount_value !== undefined ? orderDetails.discount_value : discountValue;
      const discountAmount = orderDiscountType === 'percent' 
        ? (newSubtotal * orderDiscountValue / 100)
        : orderDiscountValue;
      const newTotal = Math.max(0, newSubtotal + newTax - discountAmount);
      
      // Cập nhật thông tin tổng của order (giữ nguyên discount_type và discount_value)
      await orderAPI.updateOrder(selectedOrder.id, {
        buffet_quantity: newBuffetQuantity,
        subtotal: newSubtotal,
        tax_amount: newTax,
        total_amount: newTotal,
        discount_type: orderDiscountType,
        discount_value: orderDiscountValue
      });

      alert('Cập nhật thành công!');
      setEditingQuantities({});
      // Cập nhật lại orderDetails với dữ liệu mới
      await fetchOrderDetails(selectedOrder.id);
      fetchData();
      setShowOrderDialog(false);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Lỗi khi cập nhật order');
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const { orderAPI } = await import('../services/api');
      const res = await orderAPI.getOrderById(orderId);
      console.log('🔍 Order details from API:', res.data);
      console.log('🔍 Items in order details:', res.data?.items);
      setOrderDetails(res.data);
      
      // Load discount từ order
      if (res.data) {
        const orderDiscountType = res.data.discount_type || 'percent';
        const orderDiscountValue = res.data.discount_value || 0;
        setDiscountType(orderDiscountType);
        setDiscountValue(orderDiscountValue);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder || !orderDetails || paymentLoading) return;
    
    try {
      setPaymentLoading(true);
      const { orderAPI, invoicesAPI } = await import('../services/api');
      
      // Helper: timeout wrapper to avoid long-hanging requests
      const withTimeout = async <T,>(p: Promise<T>, ms = 8000): Promise<T> => {
        return await Promise.race<T>([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)) as Promise<T>
        ]);
      };
      
      // Tính toán giảm giá từ order (hoặc từ state nếu chưa có trong order)
      const subtotal = orderDetails.total_amount || 0;
      const orderDiscountType = orderDetails.discount_type || discountType || 'percent';
      const orderDiscountValue = orderDetails.discount_value !== undefined ? orderDetails.discount_value : discountValue;
      const discountAmount = orderDiscountType === 'percent' 
        ? (subtotal * orderDiscountValue / 100)
        : orderDiscountValue;
      const finalTotal = Math.max(0, subtotal - discountAmount);
      
      // 1. Tạo invoice trước để ghi nhận doanh thu
      // Ưu tiên dùng currentEmployee từ localStorage (người đang đăng nhập) thay vì orderDetails.employee_id (có thể là người order cũ)
      const invoiceData = {
        customer_id: orderDetails.customer_id || undefined,
        employee_id: currentEmployee?.id || orderDetails.employee_id || 14,
        items: [
          {
            service_id: 1, // Dummy service ID for buffet orders
            quantity: 1,
            unit_price: finalTotal, // Dùng tổng sau giảm giá
          }
        ],
        discount_amount: discountAmount, // Ghi nhận số tiền giảm
        tax_amount: 0, // Bỏ thuế
        payment_method: 'cash',
        notes: `Buffet Order: ${orderDetails.order_number} - Table: ${orderDetails.table_name} (${orderDetails.area})${orderDiscountValue > 0 ? ` - Giảm giá: ${orderDiscountType === 'percent' ? `${orderDiscountValue}%` : `${discountAmount.toLocaleString('vi-VN')} ₫`}` : ''}`
      };
      
      const invoiceResponse = await withTimeout(invoicesAPI.create(invoiceData), 12000);
      
      if (invoiceResponse.status === 200) {
        // 2. Cập nhật order status thành paid sau khi tạo invoice thành công
        try {
          await withTimeout(orderAPI.updateOrder(selectedOrder.id, { status: 'paid' }), 8000);
        } catch (e) {
          console.warn('Update order status timeout/failed, continue:', e);
        }
        
        // 3. In hóa đơn THANH TOÁN (chỉ món có giá > 0 + vé)
        try {
          // ✅ Tính tổng vé từ order_buffet (tổng tất cả các lần order) - Tối ưu: query song song với import
          const [buffetTicketsResult, printBillModule] = await Promise.all([
            selectedOrder.id && orderDetails.buffet_package_id
              ? supabase
                  .from('order_buffet')
                  .select('quantity')
                  .eq('order_id', selectedOrder.id)
              : Promise.resolve({ data: null, error: null }),
            import('../utils/billImageGenerator')
          ]);
          
          const { printBill } = printBillModule;
          
          let totalBuffetQuantity = 0;
          if (buffetTicketsResult.data && buffetTicketsResult.data.length > 0) {
            totalBuffetQuantity = buffetTicketsResult.data.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
            console.log(`🎫 [PAYMENT] Order ${selectedOrder.id}: Found ${buffetTicketsResult.data.length} ticket rows, total quantity: ${totalBuffetQuantity}`);
          } else {
            totalBuffetQuantity = orderDetails.buffet_quantity || 0;
            console.log(`⚠️ [PAYMENT] No tickets in order_buffet, using orderDetails.buffet_quantity: ${totalBuffetQuantity}`);
          }
          
          // Tạo danh sách items (chỉ món có giá > 0)
          const items: Array<{name: string; quantity: number; price: number; note: string}> = [];
          
          // Thêm món dịch vụ (chỉ món có tiền > 0)
          if (orderDetails.order_items && orderDetails.order_items.length > 0) {
            orderDetails.order_items.forEach((item: any) => {
              const itemPrice = item.unit_price || item.price || 0;
              if (itemPrice > 0) {
                items.push({
                  name: item.name || item.food_item?.name || item.food_items?.name || 'Món không xác định',
                  quantity: item.quantity,
                  price: itemPrice,
                  note: item.special_instructions || ''
                });
              }
            });
          }
          
          // Tạo bill data cho THANH TOÁN (với giảm giá)
          const paymentBillData = {
            orderNumber: selectedOrder.order_number,
            tableName: orderDetails.table_name || `Bàn ${selectedOrder.table_id}`,
            area: orderDetails.area || selectedOrder.area,
            staffName: orderDetails.employee_name || currentEmployee?.fullname,
            customerName: 'Khách lẻ',
            items,
            buffetPackageName: orderDetails.buffet_package_name,
            buffetQuantity: totalBuffetQuantity, // ✅ Dùng tổng vé từ order_buffet
            buffetPrice: orderDetails.buffet_package_price,
            totalAmount: finalTotal, // Dùng tổng sau giảm giá
            createdAt: selectedOrder.created_at,
            discountAmount: discountAmount, // Thêm thông tin giảm giá
            discountType: orderDiscountType,
            discountValue: orderDiscountValue
          };
          
          console.log('💰 [PAYMENT] Bill data:', paymentBillData);
          
          // In bill THANH TOÁN (isPayment = true)
          const result = await printBill(paymentBillData, 'POS-80C', true, false);
          
          if (result.success) {
            console.log('✅ Payment bill printed');
          } else {
            console.error('❌ Payment bill failed:', result.message);
            // Hiển thị cảnh báo nhưng không chặn quá trình thanh toán
            alert(`⚠️ Cảnh báo: ${result.message}\n\nThanh toán vẫn được ghi nhận, nhưng bill chưa được in.`);
          }
        } catch (printError: any) {
          console.error('❌ Payment invoice print failed:', printError);
          // Hiển thị cảnh báo nhưng không chặn quá trình thanh toán
          alert(`⚠️ Cảnh báo: Lỗi in bill - ${printError?.message || 'Không thể kết nối đến Printer Server'}\n\nThanh toán vẫn được ghi nhận, nhưng bill chưa được in.`);
        }
        
        alert('✅ Thanh toán thành công! Hóa đơn đã được ghi nhận vào doanh thu.');
        setShowOrderDialog(false);
        // KHÔNG reset discount vì đã lưu vào order
        fetchData(); // Reload all data
      } else {
        alert('Lỗi khi tạo hóa đơn doanh thu');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Lỗi khi thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePrintBill = async () => {
    if (!selectedOrder || !orderDetails) return;
    
    try {
      console.log('🖨️ [PRINT BILL] Bắt đầu in bill...');
      
      // ✅ Tính tổng vé từ order_buffet (tổng tất cả các lần order) - Tối ưu: query song song với import
      const [buffetTicketsResult, printBillModule] = await Promise.all([
        selectedOrder.id && orderDetails.buffet_package_id
          ? supabase
              .from('order_buffet')
              .select('quantity')
              .eq('order_id', selectedOrder.id)
          : Promise.resolve({ data: null, error: null }),
        import('../utils/billImageGenerator')
      ]);
      
      const { printBill } = printBillModule;
      
      let totalBuffetQuantity = 0;
      if (buffetTicketsResult.data && buffetTicketsResult.data.length > 0) {
        totalBuffetQuantity = buffetTicketsResult.data.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
        console.log(`🎫 [PRINT BILL] Order ${selectedOrder.id}: Found ${buffetTicketsResult.data.length} ticket rows, total quantity: ${totalBuffetQuantity}`);
      } else {
        totalBuffetQuantity = orderDetails.buffet_quantity || 0;
        console.log(`⚠️ [PRINT BILL] No tickets in order_buffet, using orderDetails.buffet_quantity: ${totalBuffetQuantity}`);
      }
      
      // Tạo danh sách items (CHỈ món ăn, KHÔNG bao gồm vé)
      const items: Array<{name: string; quantity: number; price: number; note: string}> = [];
      
      // Thêm món ăn từ order_items
      if (orderDetails.order_items && orderDetails.order_items.length > 0) {
        orderDetails.order_items.forEach((item: any) => {
          items.push({
            name: item.name || item.food_item?.name || item.food_items?.name || 'Món không xác định',
            quantity: item.quantity,
            price: item.unit_price || item.price || 0,
            note: item.special_instructions || ''
          });
        });
      }
      
      // Tính toán giảm giá từ order
      const subtotal = selectedOrder.total_amount || 0;
      const orderDiscountType = orderDetails.discount_type || discountType || 'percent';
      const orderDiscountValue = orderDetails.discount_value !== undefined ? orderDetails.discount_value : discountValue;
      const discountAmount = orderDiscountType === 'percent' 
        ? (subtotal * orderDiscountValue / 100)
        : orderDiscountValue;
      const finalTotal = Math.max(0, subtotal - discountAmount);
      
      // Tạo bill data
      const billData = {
        orderNumber: selectedOrder.order_number,
        tableName: orderDetails.table_name || `Bàn ${selectedOrder.table_id}`,
        area: orderDetails.area || selectedOrder.area,
        staffName: orderDetails.employee_name || currentEmployee?.fullname,
        customerName: 'Khách lẻ',
        items,
        buffetPackageName: orderDetails.buffet_package_name,
        buffetQuantity: totalBuffetQuantity, // ✅ Dùng tổng vé từ order_buffet
        buffetPrice: orderDetails.buffet_package_price,
        totalAmount: finalTotal, // Dùng tổng sau giảm giá
        createdAt: selectedOrder.created_at,
        discountAmount: discountAmount,
        discountType: orderDiscountType,
        discountValue: orderDiscountValue
      };
      
      console.log('📄 Bill data:', billData);
      
      // In bill qua helper function (PHIẾU KIỂM ĐỒ - full món)
      const result = await printBill(billData, 'POS-80C', false, false, true); // isCheckBill = true
      
      if (result.success) {
        alert('✅ In phiếu kiểm đồ thành công!');
      } else {
        alert(`⚠️ ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error printing bill:', error);
      alert('Lỗi khi in hóa đơn');
    }
  };

  const handlePrintTemporaryBill = async () => {
    if (!selectedOrder || !orderDetails) return;
    
    try {
      console.log('🖨️ [PRINT TEMPORARY BILL] Bắt đầu in bill tạm tính...');
      
      // ✅ Tính tổng vé từ order_buffet (tổng tất cả các lần order) - Tối ưu: query song song với import
      const [buffetTicketsResult, printBillModule] = await Promise.all([
        selectedOrder.id && orderDetails.buffet_package_id
          ? supabase
              .from('order_buffet')
              .select('quantity')
              .eq('order_id', selectedOrder.id)
          : Promise.resolve({ data: null, error: null }),
        import('../utils/billImageGenerator')
      ]);
      
      const { printBill } = printBillModule;
      
      let totalBuffetQuantity = 0;
      if (buffetTicketsResult.data && buffetTicketsResult.data.length > 0) {
        totalBuffetQuantity = buffetTicketsResult.data.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
        console.log(`🎫 [PRINT TEMPORARY BILL] Order ${selectedOrder.id}: Found ${buffetTicketsResult.data.length} ticket rows, total quantity: ${totalBuffetQuantity}`);
      } else {
        totalBuffetQuantity = orderDetails.buffet_quantity || 0;
        console.log(`⚠️ [PRINT TEMPORARY BILL] No tickets in order_buffet, using orderDetails.buffet_quantity: ${totalBuffetQuantity}`);
      }
      
      // Tạo danh sách items (chỉ món có giá > 0, giống như thanh toán)
      const items: Array<{name: string; quantity: number; price: number; note: string}> = [];
      
      // Thêm món dịch vụ (chỉ món có tiền > 0)
      if (orderDetails.order_items && orderDetails.order_items.length > 0) {
        orderDetails.order_items.forEach((item: any) => {
          const itemPrice = item.unit_price || item.price || 0;
          if (itemPrice > 0) {
            items.push({
              name: item.name || item.food_item?.name || item.food_items?.name || 'Món không xác định',
              quantity: item.quantity,
              price: itemPrice,
              note: item.special_instructions || ''
            });
          }
        });
      }
      
      // Tính toán giảm giá từ order
      const subtotal = selectedOrder.total_amount || 0;
      const orderDiscountType = orderDetails.discount_type || discountType || 'percent';
      const orderDiscountValue = orderDetails.discount_value !== undefined ? orderDetails.discount_value : discountValue;
      const discountAmount = orderDiscountType === 'percent' 
        ? (subtotal * orderDiscountValue / 100)
        : orderDiscountValue;
      const finalTotal = Math.max(0, subtotal - discountAmount);
      
      // Tạo bill data cho TẠM TÍNH (giống thanh toán nhưng không ghi nhận)
      const temporaryBillData = {
        orderNumber: selectedOrder.order_number,
        tableName: orderDetails.table_name || `Bàn ${selectedOrder.table_id}`,
        area: orderDetails.area || selectedOrder.area,
        staffName: orderDetails.employee_name || currentEmployee?.fullname,
        customerName: 'Khách lẻ',
        items,
        buffetPackageName: orderDetails.buffet_package_name,
        buffetQuantity: totalBuffetQuantity, // ✅ Dùng tổng vé từ order_buffet
        buffetPrice: orderDetails.buffet_package_price,
        totalAmount: finalTotal, // Dùng tổng sau giảm giá
        createdAt: selectedOrder.created_at,
        discountAmount: discountAmount,
        discountType: orderDiscountType,
        discountValue: orderDiscountValue
      };
      
      console.log('📄 Temporary bill data:', temporaryBillData);
      
      // In bill TẠM TÍNH (isPayment = false để hiển thị "HÓA ĐƠN TẠM TÍNH", không ghi nhận)
      const result = await printBill(temporaryBillData, 'POS-80C', false, false);
      
      if (result.success) {
        alert('✅ In bill tạm tính thành công! (Chưa ghi nhận thanh toán)');
      } else {
        alert(`⚠️ ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error printing temporary bill:', error);
      alert('Lỗi khi in bill tạm tính');
    }
  };

  const handleLogout = () => {
    // Xóa tất cả thông tin đăng nhập
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_employee');
    localStorage.removeItem('spa_token');
    localStorage.removeItem('spa_user');
    localStorage.removeItem('spa_token_expiry');
    localStorage.removeItem('spa_remember');
    navigate('/pos-login');
  };

  const areas = ['A', 'B', 'C', 'D'];
  const filteredTables = tables.filter(table => table.area === selectedArea);
  const busyTables = filteredTables.filter(table => getTableStatus(table) === 'busy');
  const emptyTables = filteredTables.filter(table => getTableStatus(table) === 'empty');

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
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

      <Box sx={{ p: 3 }}>
        {/* Thống kê */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="primary">
                Tổng số đơn: {orders.filter(o => o.status !== 'paid').length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Bàn trống: {emptyTables.length}/{filteredTables.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => {
            setActiveTab(newValue);
            if (newValue === 2) {
              // Khi chuyển sang tab DOANH THU, fetch lại dữ liệu
              fetchDailyRevenue();
            } else if (newValue === 3) {
              // Khi chuyển sang tab ĐỒ HẾT, fetch lại danh sách món
              fetchAllFoodItems();
            }
          }}>
            <Tab label="Chọn Bàn" icon={<TableRestaurant />} />
            <Tab label="Danh Sách Hóa Đơn" icon={<Receipt />} />
            <Tab label="Doanh Thu" icon={<TrendingUp />} />
            <Tab label="Đồ Hết" icon={<Block />} />
          </Tabs>
        </Paper>

        {/* Tab Chọn Bàn */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Danh sách khu */}
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chọn Khu
                  </Typography>
                  <List>
                    {areas.map((area) => (
                      <ListItem
                        key={area}
                        button
                        selected={selectedArea === area}
                        onClick={() => setSelectedArea(area)}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: selectedArea === area ? 'primary.light' : 'transparent',
                          color: selectedArea === area ? 'white' : 'inherit'
                        }}
                      >
                        <ListItemText 
                          primary={`KHU ${area}`}
                          secondary={`${tables.filter(t => t.area === area && getTableStatus(t) === 'empty').length} bàn trống`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Lưới bàn */}
            <Grid item xs={9}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    KHU {selectedArea} - Chọn Bàn
                  </Typography>
                  <Grid container spacing={2}>
                    {filteredTables.map((table) => {
                      const tableOrder = getTableOrder(table);
                      const isBusy = getTableStatus(table) === 'busy';
                      
                      return (
                        <Grid item xs={4} key={table.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              border: 2,
                              borderColor: isBusy ? 'error.main' : 'success.main',
                              height: '200px', // Chiều cao cố định cho tất cả thẻ
                              display: 'flex',
                              flexDirection: 'column',
                              '&:hover': {
                                boxShadow: 4,
                                transform: 'scale(1.02)'
                              },
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleSelectTable(table)}
                          >
                            <CardContent sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              {/* Phần trên: Icon và thông tin bàn */}
                              <Box>
                                <TableRestaurant 
                                  sx={{ 
                                    fontSize: 40, 
                                    color: isBusy ? 'error.main' : 'success.main', 
                                    mb: 1 
                                  }} 
                                />
                                <Typography variant="h6">
                                  Bàn {table.table_number}
                                </Typography>
                              </Box>
                              
                              {/* Phần giữa: Thông tin order hoặc placeholder */}
                              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isBusy && tableOrder ? (
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Chip
                                      icon={<AccessTime />}
                                      label={getTimeElapsed(tableOrder.buffet_start_time || tableOrder.created_at)}
                                      color="error"
                                      size="small"
                                    />
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                      Đã order: {tableOrder.order_number}
                                    </Typography>
                                  </Box>
                                ) : (
                                  // Placeholder để giữ chiều cao đồng nhất
                                  <Box sx={{ height: '40px' }} />
                                )}
                              </Box>
                              
                              {/* Phần dưới: Status chip */}
                              <Box>
                                <Chip
                                  label={getStatusText(table)}
                                  color={getStatusColor(table) as any}
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab Danh Sách Hóa Đơn */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Danh Sách Hóa Đơn Buffet
              </Typography>
              <List>
                {orders.filter(o => o.status !== 'paid').map((order) => (
                  <ListItem
                    key={order.id}
                    button
                    onClick={() => handleSelectOrder(order)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      primary={order.order_number}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Bàn: {order.table_name} - Khu {order.area}
                          </Typography>
                          <Typography variant="body2">
                            Thời gian: {getTimeElapsed(order.buffet_start_time || order.created_at)}
                          </Typography>
                          <Typography variant="body2">
                            Tổng: {order.total_amount ? order.total_amount.toLocaleString('vi-VN') : '0'} ₫
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={order.status === 'pending' ? 'Chờ xử lý' : 'Đang xử lý'}
                      color={order.status === 'pending' ? 'warning' : 'info'}
                      size="small"
                    />
                  </ListItem>
                ))}
                {orders.filter(o => o.status !== 'paid').length === 0 && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Chưa có hóa đơn nào
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Tab Doanh Thu */}
        {activeTab === 2 && (
          <Box>
            {/* Thống kê doanh thu */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6" color="text.secondary">
                          Doanh Thu Hôm Nay
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {loadingRevenue ? (
                            <CircularProgress size={24} />
                          ) : (
                            `${dailyRevenue.toLocaleString('vi-VN')} ₫`
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Receipt sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6" color="text.secondary">
                          Số Hóa Đơn
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {loadingRevenue ? (
                            <CircularProgress size={24} />
                          ) : (
                            dailyInvoiceCount
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Danh sách hóa đơn đã thanh toán */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Danh Sách Hóa Đơn Đã Thanh Toán Hôm Nay
                  </Typography>
                  <IconButton onClick={fetchDailyRevenue} disabled={loadingRevenue}>
                    <Refresh />
                  </IconButton>
                </Box>
                
                {loadingRevenue ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Đang tải dữ liệu...
                    </Typography>
                  </Box>
                ) : dailyInvoices.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Chưa có hóa đơn nào được thanh toán hôm nay
                  </Typography>
                ) : (
                  <List>
                    {dailyInvoices.map((invoice) => (
                      <ListItem
                        key={invoice.id}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6">
                                {invoice.invoice_number || `INV-${invoice.id}`}
                              </Typography>
                              <Chip
                                label="Đã thanh toán"
                                color="success"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Bàn: {invoice.table_name} - Khu {invoice.area}
                              </Typography>
                              <Typography variant="body2">
                                Nhân viên: {invoice.employee_name}
                              </Typography>
                              <Typography variant="body2">
                                Thời gian: {formatVietnamDateTime(invoice.created_at)}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', mt: 0.5 }}>
                                Tổng: {Number(invoice.total_amount || 0).toLocaleString('vi-VN')} ₫
                              </Typography>
                            </Box>
                          }
                        />
                        <IconButton
                          color="primary"
                          onClick={() => handleViewInvoiceDetail(invoice.id)}
                          sx={{ ml: 2 }}
                        >
                          <Visibility />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab Đồ Hết */}
        {activeTab === 3 && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Block color="error" />
                  Quản Lý Món Đã Hết
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Danh sách món đã hết sẽ tự động reset khi sang ngày mới
                </Typography>

                {/* Ô tìm kiếm */}
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm món ăn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 1 }}>🔍</Box>
                  }}
                />

                {loadingFoodItems ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {filteredFoodItems.map((item) => {
                      const isOutOfStock = outOfStockItems.has(item.id);
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                          <Card
                            sx={{
                              opacity: isOutOfStock ? 0.5 : 1,
                              bgcolor: isOutOfStock ? 'grey.100' : 'background.paper',
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: isOutOfStock ? 'grey.200' : 'action.hover'
                              }
                            }}
                            onClick={() => {
                              if (isOutOfStock) {
                                unmarkItemOutOfStock(item.id);
                              } else {
                                markItemOutOfStock(item.id);
                              }
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: 'bold',
                                    textDecoration: isOutOfStock ? 'line-through' : 'none',
                                    color: isOutOfStock ? 'text.secondary' : 'text.primary'
                                  }}
                                >
                                  {item.name}
                                </Typography>
                                {isOutOfStock ? (
                                  <Block color="error" fontSize="small" />
                                ) : (
                                  <CheckCircle color="success" fontSize="small" />
                                )}
                              </Box>
                              {item.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {item.description}
                                </Typography>
                              )}
                              <Typography variant="body2" color="primary" fontWeight="bold">
                                {Number(item.price || 0).toLocaleString('vi-VN')} ₫
                              </Typography>
                              <Chip
                                label={isOutOfStock ? 'Đã hết' : 'Còn hàng'}
                                color={isOutOfStock ? 'error' : 'success'}
                                size="small"
                                sx={{ mt: 1 }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {filteredFoodItems.length === 0 && !loadingFoodItems && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {searchTerm ? 'Không tìm thấy món nào' : 'Chưa có món nào'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Dialog Chi Tiết Hóa Đơn */}
      <Dialog
        open={showOrderDialog}
        onClose={() => {
          setShowOrderDialog(false);
          setDiscountValue(0);
          setDiscountType('percent');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi Tiết Hóa Đơn - {selectedOrder?.order_number}
        </DialogTitle>
        <DialogContent>
          {orderDetails && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông Tin Bàn
              </Typography>
              <Typography variant="body2">
                Bàn: {orderDetails?.table_name || selectedOrder?.table_name || 'N/A'} - Khu {orderDetails?.area || selectedOrder?.area || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Thời gian: {orderDetails ? getTimeElapsed(orderDetails.buffet_start_time || orderDetails.created_at) : (selectedOrder ? getTimeElapsed(selectedOrder.buffet_start_time || selectedOrder.created_at) : '')}
              </Typography>
              <Typography variant="body2">
                Nhân viên order: {orderDetails?.employee_name || 'Chưa xác định'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thời gian tạo: {orderDetails ? formatVietnamDateTime(orderDetails.created_at) : (selectedOrder ? formatVietnamDateTime(selectedOrder.created_at) : '')}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Hiển thị thông tin vé buffet */}
              {/* Hiển thị vé như item trong danh sách bên dưới, bỏ ô chỉnh vé riêng để tránh lệch */}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Món Đã Order
              </Typography>
              {(() => {
                console.log('🔍 Rendering items:', orderDetails.items);
                console.log('🔍 Items length:', orderDetails.items?.length);
                
                if (!orderDetails.items || orderDetails.items.length === 0) {
                  return <Typography color="text.secondary">Chưa có món nào</Typography>;
                }

                // Tách vé buffet và món ăn
                const buffetItems = orderDetails.items.filter((item: any) => item.is_ticket === true || item.food_item_id === orderDetails.buffet_package_id);
                const foodItems = orderDetails.items.filter((item: any) => !item.is_ticket && item.food_item_id !== orderDetails.buffet_package_id);

                return (
                  <>
                    {/* Hiển thị vé buffet ở đầu với điều chỉnh số lượng */}
                    {buffetItems.length > 0 && (
                      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#000' }}>
                          Vé buffet:
                        </Typography>
                        {buffetItems.map((item: any, index: number) => {
                          const ticketPrice = orderDetails.buffet_package_price || 0;
                          const ticketCount = item.quantity || 1;
                          return (
                            <Box key={`buffet-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: '#000', // Đổi từ xanh về đen
                                  flex: 1
                                }}
                              >
                                VÉ {Math.round(ticketPrice / 1000)}K
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    // Giảm số lượng vé
                                    const newQuantity = Math.max(0, ticketCount - 1);
                                    if (newQuantity === 0) {
                                      // Xóa dòng vé này
                                      console.log('Xóa vé buffet');
                                    } else {
                                      // Cập nhật số lượng
                                      console.log('Giảm số lượng vé:', newQuantity);
                                    }
                                  }}
                                  sx={{ minWidth: '32px', height: '32px' }}
                                >
                                  -
                                </Button>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 'bold', 
                                    color: '#000',
                                    minWidth: '40px',
                                    textAlign: 'center'
                                  }}
                                >
                                  {ticketCount}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    // Tăng số lượng vé
                                    const newQuantity = ticketCount + 1;
                                    console.log('Tăng số lượng vé:', newQuantity);
                                  }}
                                  sx={{ minWidth: '32px', height: '32px' }}
                                >
                                  +
                                </Button>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Hiển thị món ăn */}
                    {foodItems.length > 0 && (
                      <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Món ăn:
                        </Typography>
                        <List dense>
                          {mergeDuplicateItems(foodItems).map((item: any, index: number) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={formatFoodItemName(item.name)}
                                secondary={`Giá: ${item.price.toLocaleString('vi-VN')} ₫`}
                              />
                              <TextField
                                type="number"
                                value={editingQuantities[`item_${index}`] !== undefined ? editingQuantities[`item_${index}`] : item.quantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange('item', parseInt(e.target.value) || 0, index)}
                                inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                sx={{ width: '80px' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </>
                );
              })()}
              
              <Divider sx={{ my: 2 }} />
              
              {/* Ô nhập giảm giá */}
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Giảm giá:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <Button
                    variant={discountType === 'percent' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={async () => {
                      setDiscountType('percent');
                      setDiscountValue(0);
                      
                      // Lưu discount vào order
                      if (selectedOrder) {
                        try {
                          const { orderAPI } = await import('../services/api');
                          await orderAPI.updateOrder(selectedOrder.id, {
                            discount_type: 'percent',
                            discount_value: 0
                          });
                        } catch (error) {
                          console.error('❌ Lỗi lưu discount:', error);
                        }
                      }
                    }}
                  >
                    %
                  </Button>
                  <Button
                    variant={discountType === 'amount' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={async () => {
                      setDiscountType('amount');
                      setDiscountValue(0);
                      
                      // Lưu discount vào order
                      if (selectedOrder) {
                        try {
                          const { orderAPI } = await import('../services/api');
                          await orderAPI.updateOrder(selectedOrder.id, {
                            discount_type: 'amount',
                            discount_value: 0
                          });
                        } catch (error) {
                          console.error('❌ Lỗi lưu discount:', error);
                        }
                      }
                    }}
                  >
                    Số tiền
                  </Button>
                </Box>
                <TextField
                  type="number"
                  label={discountType === 'percent' ? 'Giảm giá (%)' : 'Giảm giá (₫)'}
                  value={discountValue}
                  onChange={async (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    let finalVal = 0;
                    if (discountType === 'percent') {
                      finalVal = Math.min(100, Math.max(0, val));
                    } else {
                      finalVal = Math.max(0, val);
                    }
                    setDiscountValue(finalVal);
                    
                    // Lưu discount vào order ngay lập tức
                    if (selectedOrder) {
                      try {
                        const { orderAPI } = await import('../services/api');
                        await orderAPI.updateOrder(selectedOrder.id, {
                          discount_type: discountType,
                          discount_value: finalVal
                        });
                        console.log('✅ Đã lưu discount vào order:', { discountType, discountValue: finalVal });
                      } catch (error) {
                        console.error('❌ Lỗi lưu discount:', error);
                      }
                    }
                  }}
                  fullWidth
                  size="small"
                  inputProps={{ 
                    min: 0, 
                    max: discountType === 'percent' ? 100 : undefined,
                    step: discountType === 'percent' ? 1 : 1000
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">
                    Tổng tạm tính:
                  </Typography>
                  <Typography variant="body1">
                    {(() => {
                      const subtotal = orderDetails.total_amount || 0;
                      return subtotal.toLocaleString('vi-VN');
                    })()} ₫
                  </Typography>
                </Box>
                {(() => {
                  // Lấy discount từ order hoặc state
                  const orderDiscountType = orderDetails.discount_type || discountType || 'percent';
                  const orderDiscountValue = orderDetails.discount_value !== undefined ? orderDetails.discount_value : discountValue;
                  const subtotal = orderDetails.total_amount || 0;
                  const discount = orderDiscountType === 'percent' 
                    ? (subtotal * orderDiscountValue / 100)
                    : orderDiscountValue;
                  
                  if (orderDiscountValue > 0) {
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" color="error">
                          Giảm giá ({orderDiscountType === 'percent' ? `${orderDiscountValue}%` : `${orderDiscountValue.toLocaleString('vi-VN')} ₫`}):
                        </Typography>
                        <Typography variant="body1" color="error">
                          -{discount.toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Tổng thanh toán:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {(() => {
                      const orderDiscountType = orderDetails.discount_type || discountType || 'percent';
                      const orderDiscountValue = orderDetails.discount_value !== undefined ? orderDetails.discount_value : discountValue;
                      const subtotal = orderDetails.total_amount || 0;
                      const discount = orderDiscountType === 'percent' 
                        ? (subtotal * orderDiscountValue / 100)
                        : orderDiscountValue;
                      const finalTotal = Math.max(0, subtotal - discount);
                      return finalTotal.toLocaleString('vi-VN');
                    })()} ₫
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOrderDialog(false)}>
            Đóng
          </Button>
          <Button onClick={handleSaveChanges} variant="outlined" color="primary" disabled={!canEdit}>
            Lưu thay đổi
          </Button>
          <Button onClick={handlePrintBill} variant="outlined" color="info">
            In Bill
          </Button>
          <Button 
            onClick={handlePrintTemporaryBill} 
            variant="outlined" 
            color="warning"
          >
            Tạm Tính
          </Button>
          <Button 
            onClick={handlePayment} 
            variant="contained" 
            color="success"
            disabled={paymentLoading}
          >
            {paymentLoading ? 'Đang xử lý...' : 'Thanh Toán'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Chi Tiết Hóa Đơn Doanh Thu */}
      <Dialog 
        open={invoiceDetailDialogOpen} 
        onClose={() => setInvoiceDetailDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Chi Tiết Hóa Đơn - {selectedInvoiceDetail?.invoice?.invoice_number || 'N/A'}
            </Typography>
            <IconButton onClick={() => setInvoiceDetailDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoiceDetail && selectedInvoiceDetail.invoice ? (
            <Box>
              {/* Thông tin hóa đơn */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {selectedInvoiceDetail.invoice.invoice_number}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Khách hàng:</strong> {selectedInvoiceDetail.invoice.customer_name || 'Khách lẻ'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Nhân viên:</strong> {selectedInvoiceDetail.invoice.employee_name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Ngày tạo:</strong> {formatVietnamDateTime(selectedInvoiceDetail.invoice.created_at || selectedInvoiceDetail.invoice.invoice_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Phương thức TT:</strong> {selectedInvoiceDetail.invoice.payment_method || 'Tiền mặt'}
                    </Typography>
                  </Grid>
                  {selectedInvoiceDetail.invoice.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Ghi chú:</strong> {selectedInvoiceDetail.invoice.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Danh sách items */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Chi Tiết Dịch Vụ
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Tên dịch vụ</strong></TableCell>
                      <TableCell align="right"><strong>Số lượng</strong></TableCell>
                      <TableCell align="right"><strong>Đơn giá</strong></TableCell>
                      <TableCell align="right"><strong>Thành tiền</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoiceDetail.items && selectedInvoiceDetail.items.length > 0 ? (
                      selectedInvoiceDetail.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.service_name || item.name || `Dịch vụ ${item.service_id || index + 1}`}</TableCell>
                          <TableCell align="right">{item.quantity || 1}</TableCell>
                          <TableCell align="right">{Number(item.unit_price || 0).toLocaleString('vi-VN')} ₫</TableCell>
                          <TableCell align="right">
                            <strong>{Number(item.total_price || item.unit_price || 0).toLocaleString('vi-VN')} ₫</strong>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Không có chi tiết dịch vụ
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Tổng tiền */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  {selectedInvoiceDetail.invoice.discount_amount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">Tổng tạm tính:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">
                          {(Number(selectedInvoiceDetail.invoice.total_amount || 0) + Number(selectedInvoiceDetail.invoice.discount_amount || 0)).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Giảm giá:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="error">
                          -{Number(selectedInvoiceDetail.invoice.discount_amount || 0).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={6}>
                    <Typography variant="h6"><strong>Tổng thanh toán:</strong></Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="success.main">
                      <strong>{Number(selectedInvoiceDetail.invoice.total_amount || 0).toLocaleString('vi-VN')} ₫</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Đang tải chi tiết hóa đơn...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDetailDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BuffetTableSelection;
