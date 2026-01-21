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
import { formatFoodItemName } from '../utils/formatters';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Utility function để check món có đang hết không
const isItemOutOfStock = (itemId: number): boolean => {
  try {
    const today = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
    const storageKey = `outOfStockItems_${today}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const items = JSON.parse(stored);
      const isOut = Array.isArray(items) && items.includes(itemId);
      
      // Debug log để kiểm tra
      if (isOut) {
        console.log(`🔍 [CHECK] Item ID ${itemId} is OUT OF STOCK. Storage key: ${storageKey}, Items:`, items);
      }
      
      return isOut;
    }
  } catch (e) {
    console.error('❌ Error checking out of stock:', e);
  }
  return false;
};

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
    category?: string;
    category_id?: number;
    type?: string;
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
  const [serviceMode, setServiceMode] = useState(false);
  const [serviceItems, setServiceItems] = useState<any[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(existingOrder || null);
  // Lấy state từ location nếu quay lại từ /mobile-bill
  const selectedItemsFromBill = location.state?.selectedItemsFromBill as BuffetPackageItem[] | undefined;
  const selectedItemsStateFromBill = location.state?.selectedItemsState as { [key: number]: boolean } | undefined;
  const orderItemsStateFromBill = location.state?.orderItemsState as { [key: number]: number } | undefined;
  const itemNotesStateFromBill = location.state?.itemNotesState as { [key: number]: string } | undefined;
  const selectedPackageFromBill = location.state?.selectedPackage as BuffetPackage | undefined;
  const packageQuantityFromBill = location.state?.packageQuantity as number | undefined;

  const [selectedItems, setSelectedItems] = useState<{ [key: number]: boolean }>(selectedItemsStateFromBill || {});
  const [orderItems, setOrderItems] = useState<{ [key: number]: number }>(orderItemsStateFromBill || {});
  const [itemNotes, setItemNotes] = useState<{ [key: number]: string }>(itemNotesStateFromBill || {});
  // Lưu danh sách items đầy đủ từ bill để có thể hiển thị lại
  const [savedSelectedItems, setSavedSelectedItems] = useState<BuffetPackageItem[]>(selectedItemsFromBill || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all'); // all hoặc tên type
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  // useEffect để khôi phục state khi quay lại từ /mobile-bill (chỉ chạy 1 lần)
  useEffect(() => {
    // Lấy thông tin nhân viên từ localStorage
    // Ưu tiên lấy từ mobile login, nếu không có thì lấy từ pos_employee
    const mobileEmployee = localStorage.getItem('mobile_employee');
    const posEmployee = localStorage.getItem('pos_employee');
    
    let employeeData = null;
    if (mobileEmployee) {
      try {
        employeeData = JSON.parse(mobileEmployee);
        console.log('✅ [Mobile] Loaded employee from mobile_employee:', employeeData);
      } catch (error) {
        console.error('Error parsing mobile employee data:', error);
      }
    } else if (posEmployee) {
      try {
        employeeData = JSON.parse(posEmployee);
        console.log('⚠️ [Mobile] Loaded employee from pos_employee (PC login):', employeeData);
      } catch (error) {
        console.error('Error parsing pos employee data:', error);
      }
    }
    
    if (employeeData) {
      setCurrentEmployee(employeeData);
      console.log('✅ [Mobile] Current employee set:', employeeData.fullname || employeeData.full_name);
    }
    
    fetchPackages();
    fetchServiceItems();
  }, []); // Chỉ chạy 1 lần khi mount

  // useEffect riêng để khôi phục state từ bill (chỉ chạy khi có state từ bill)
  useEffect(() => {
    // Khôi phục state nếu quay lại từ /mobile-bill
    // Quan trọng: Chỉ khôi phục khi có state từ bill, không reset state hiện tại
    if (selectedItemsStateFromBill) {
      setSelectedItems(selectedItemsStateFromBill);
    }
    if (orderItemsStateFromBill) {
      setOrderItems(orderItemsStateFromBill);
    }
    if (itemNotesStateFromBill) {
      setItemNotes(itemNotesStateFromBill);
    }
    if (selectedPackageFromBill) {
      setSelectedPackage(selectedPackageFromBill);
    }
    if (packageQuantityFromBill !== undefined) {
      setPackageQuantity(packageQuantityFromBill);
    }
    
    // Cập nhật savedSelectedItems: ưu tiên selectedItemsFromBill từ bill, merge với saved hiện tại
    if (selectedItemsFromBill && selectedItemsFromBill.length > 0) {
      // Nếu có selectedItemsFromBill, sử dụng nó làm base và merge với saved hiện tại
      setSavedSelectedItems(prev => {
        const merged = new Map<number, any>();
        const orderItemsFromBill = orderItemsStateFromBill || {};
        
        // 1. Thêm các món từ selectedItemsFromBill (từ bill, đầy đủ nhất)
        selectedItemsFromBill.forEach(item => {
          const id = (item as any).food_item_id || item.food_item?.id || item.id;
          if ((orderItemsFromBill[id] && orderItemsFromBill[id] > 0)) {
            merged.set(id, {
              ...item,
              food_item_id: id
            });
          }
        });
        
        // 2. Thêm các món từ prev (savedSelectedItems cũ) nếu chưa có
        prev.forEach(item => {
          const id = (item as any).food_item_id || item.food_item?.id || item.id;
          if (!merged.has(id) && (orderItemsFromBill[id] && orderItemsFromBill[id] > 0)) {
            merged.set(id, {
              ...item,
              food_item_id: id
            });
          }
        });
        
        return Array.from(merged.values());
      });
    } else if (orderItemsStateFromBill) {
      // Nếu không có selectedItemsFromBill nhưng có orderItemsStateFromBill
      // Cần tìm item objects từ packageItems/serviceItems
      setSavedSelectedItems(prev => {
        const merged = new Map<number, any>();
        
        // Giữ lại các món từ prev
        prev.forEach(item => {
          const id = (item as any).food_item_id || item.food_item?.id || item.id;
          if (orderItemsStateFromBill[id] && orderItemsStateFromBill[id] > 0) {
            merged.set(id, {
              ...item,
              food_item_id: id
            });
          }
        });
        
        return Array.from(merged.values());
      });
    }
  }, [selectedItemsFromBill, selectedItemsStateFromBill, orderItemsStateFromBill, itemNotesStateFromBill, selectedPackageFromBill, packageQuantityFromBill]); // Chỉ chạy khi có state từ bill

  // useEffect riêng để xử lý existingOrder
  useEffect(() => {
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

  // Tự động xóa các món đã hết khỏi order khi chúng bị đánh dấu hết
  // Và kiểm tra lại khi component mount hoặc khi localStorage thay đổi
  useEffect(() => {
    // Debug: Log localStorage để kiểm tra
    const today = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
    const storageKey = `outOfStockItems_${today}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const items = JSON.parse(stored);
        console.log(`📦 [DEBUG] Out of stock items trong localStorage (${storageKey}):`, items);
      } catch (e) {
        console.error('❌ [DEBUG] Lỗi parse localStorage:', e);
      }
    }
    
    const checkAndRemoveOutOfStock = () => {
      const outOfStockItemIds: number[] = [];
      
      // Kiểm tra tất cả các món trong orderItems
      Object.keys(orderItems).forEach(key => {
        const itemId = Number(key);
        if (orderItems[itemId] > 0 && isItemOutOfStock(itemId)) {
          outOfStockItemIds.push(itemId);
        }
      });
      
      // Nếu có món đã hết, xóa chúng khỏi order
      if (outOfStockItemIds.length > 0) {
        console.log('⚠️ Tự động xóa các món đã hết khỏi order:', outOfStockItemIds);
        
        setSelectedItems(prev => {
          const newSelectedItems = { ...prev };
          outOfStockItemIds.forEach(id => {
            delete newSelectedItems[id];
          });
          return newSelectedItems;
        });
        
        setOrderItems(prevOrder => {
          const newOrderItems = { ...prevOrder };
          outOfStockItemIds.forEach(id => {
            delete newOrderItems[id];
          });
          return newOrderItems;
        });
        
        setItemNotes(prevNotes => {
          const newNotes = { ...prevNotes };
          outOfStockItemIds.forEach(id => {
            delete newNotes[id];
          });
          return newNotes;
        });
        
        setSavedSelectedItems(prevSaved => prevSaved.filter(i => {
          const id = (i as any).food_item_id || i.food_item?.id || i.id;
          return !outOfStockItemIds.includes(id);
        }));
      }
    };
    
    // Chạy ngay lập tức
    checkAndRemoveOutOfStock();
    
    // Lắng nghe sự kiện storage để cập nhật khi có thay đổi từ tab khác
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('outOfStockItems_')) {
        console.log('📦 Storage changed, rechecking out of stock items');
        checkAndRemoveOutOfStock();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Polling để check mỗi 2 giây (fallback nếu storage event không hoạt động)
    const interval = setInterval(checkAndRemoveOutOfStock, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [orderItems]); // Chạy khi orderItems thay đổi

  const fetchPackages = async () => {
    try {
      const { buffetAPI } = await import('../services/api');
      const response = await buffetAPI.getPackages();
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchServiceItems = async () => {
    try {
      const { buffetAPI } = await import('../services/api');
      const response = await buffetAPI.getFoodItems();
      // Lấy tất cả món có type là các đầu mục dịch vụ
      const serviceTypes = ['COMBO', 'KHÔNG CỒN', 'CÓ CỒN', 'MÓN LẺ', 'VÉ TRẺ EM', 'UP VÉ'];
      const serviceItemsData = response.data.filter((item: any) => 
        serviceTypes.includes(item.type)
      );
      setServiceItems(serviceItemsData);
    } catch (error) {
      console.error('Error fetching service items:', error);
    }
  };

  const handleSelectPackage = async (pkg: BuffetPackage) => {
    // Nếu đã có order cũ (lần thứ 2 trở đi), không cho chọn VÉ khác
    if (currentOrder && currentOrder.buffet_package_id && currentOrder.buffet_package_id !== pkg.id) {
      alert('Không thể thay đổi loại VÉ từ lần order thứ 2 trở đi!');
      return;
    }
    
    // Kiểm tra xem có đang chọn lại cùng package không
    const isSamePackage = selectedPackage && selectedPackage.id === pkg.id;
    const hasExistingOrder = currentOrder && currentOrder.buffet_package_id === pkg.id;
    
    setSelectedPackage(pkg);
    setPackageQuantity(currentOrder ? 0 : 1);
    
    // Chỉ reset state khi:
    // 1. Chọn package mới (khác với package hiện tại)
    // 2. Và không có order cũ
    // 3. Và không có món đã chọn (để tránh mất món khi quay lại)
    if (!isSamePackage && !hasExistingOrder && Object.keys(selectedItems).length === 0 && Object.keys(orderItems).length === 0) {
      // Reset state chỉ khi thực sự cần (chọn package mới lần đầu, chưa có món nào)
      setSelectedItems({});
      setOrderItems({});
      setItemNotes({});
      setSavedSelectedItems([]);
    }
    // Nếu đã có món chọn hoặc đang chọn lại cùng package, giữ nguyên state
    
    try {
      const { buffetAPI } = await import('../services/api');
      const response = await buffetAPI.getPackageItems(pkg.id);
      setPackageItems(response.data);
    } catch (error) {
      console.error('Error fetching package items:', error);
    }
  };

  const handleSelectItem = (item: BuffetPackageItem) => {
    // Dùng food_item_id thống nhất để tránh conflict
    const foodItemId = item.food_item.id;
    
    // Kiểm tra món có đang hết không
    if (isItemOutOfStock(foodItemId)) {
      alert('Món này đã hết, không thể order!');
      // Xóa món khỏi order nếu đã có (đảm bảo không còn trong order)
      setSelectedItems(prev => {
        const newSelectedItems = { ...prev };
        delete newSelectedItems[foodItemId];
        return newSelectedItems;
      });
      setOrderItems(prevOrder => {
        const newOrderItems = { ...prevOrder };
        delete newOrderItems[foodItemId];
        return newOrderItems;
      });
      setItemNotes(prevNotes => {
        const newNotes = { ...prevNotes };
        delete newNotes[foodItemId];
        return newNotes;
      });
      setSavedSelectedItems(prevSaved => prevSaved.filter(i => {
        const id = (i as any).food_item_id || i.food_item?.id || i.id;
        return id !== foodItemId;
      }));
      return;
    }
    
    // Sử dụng functional update để đảm bảo lấy state mới nhất
    setSelectedItems(prev => {
      const isSelected = prev[foodItemId] || false;
      
      if (!isSelected) {
        // Thêm món vào order
        const newSelectedItems = {
          ...prev,
          [foodItemId]: true
        };
        
        // Cập nhật orderItems
        setOrderItems(prevOrder => ({
          ...prevOrder,
          [foodItemId]: 1
        }));
        
        // Cập nhật savedSelectedItems ngay lập tức để giữ lại khi quay lại
        setSavedSelectedItems(prevSaved => {
          const existing = prevSaved.find(i => {
            const id = (i as any).food_item_id || i.food_item?.id || i.id;
            return id === foodItemId;
          });
          if (!existing) {
            return [...prevSaved, {
              ...item,
              food_item_id: foodItemId
            }];
          }
          return prevSaved;
        });
        
        return newSelectedItems;
      } else {
        // Bỏ món khỏi order
        const newSelectedItems = { ...prev };
        delete newSelectedItems[foodItemId];
        
        // Cập nhật orderItems
        setOrderItems(prevOrder => {
          const newOrderItems = { ...prevOrder };
          delete newOrderItems[foodItemId];
          return newOrderItems;
        });
        
        // Xóa note nếu có
        setItemNotes(prevNotes => {
          const newNotes = { ...prevNotes };
          delete newNotes[foodItemId];
          return newNotes;
        });
        
        // Xóa khỏi savedSelectedItems
        setSavedSelectedItems(prevSaved => prevSaved.filter(i => {
          const id = (i as any).food_item_id || i.food_item?.id || i.id;
          return id !== foodItemId;
        }));
        
        return newSelectedItems;
      }
    });
  };

  const handleUpdateItemNote = (itemId: number, note: string) => {
    setItemNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  const handleServiceItemSelect = (item: any) => {
    // Dùng id của service item (chính là food_item_id)
    const foodItemId = item.id;
    
    // Kiểm tra món có đang hết không (check lại để đảm bảo)
    const checkOutOfStock = isItemOutOfStock(foodItemId);
    if (checkOutOfStock) {
      console.warn(`🚫 [BLOCKED] handleServiceItemSelect: Món ID ${foodItemId} (${item.name}) đã hết`);
      alert('Món này đã hết, không thể order!');
      // Xóa món khỏi order nếu đã có (đảm bảo không còn trong order)
      setSelectedItems(prev => {
        const newSelectedItems = { ...prev };
        delete newSelectedItems[foodItemId];
        return newSelectedItems;
      });
      setOrderItems(prevOrder => {
        const newOrderItems = { ...prevOrder };
        delete newOrderItems[foodItemId];
        return newOrderItems;
      });
      setItemNotes(prevNotes => {
        const newNotes = { ...prevNotes };
        delete newNotes[foodItemId];
        return newNotes;
      });
      setSavedSelectedItems(prevSaved => prevSaved.filter(i => {
        const id = (i as any).food_item_id || i.food_item?.id || i.id;
        return id !== foodItemId;
      }));
      return;
    }
    
    // Sử dụng functional update để đảm bảo lấy state mới nhất
    setSelectedItems(prev => {
      const isSelected = prev[foodItemId] || false;
      
      if (!isSelected) {
        // Thêm món vào order
        const newSelectedItems = {
          ...prev,
          [foodItemId]: true
        };
        
        // Cập nhật orderItems
        setOrderItems(prevOrder => ({
          ...prevOrder,
          [foodItemId]: 1
        }));
        
        // Cập nhật savedSelectedItems ngay lập tức để giữ lại khi quay lại
        setSavedSelectedItems(prevSaved => {
          const existing = prevSaved.find(i => {
            const id = (i as any).food_item_id || i.food_item?.id || i.id;
            return id === foodItemId;
          });
          if (!existing) {
            return [...prevSaved, {
              ...item,
              food_item_id: foodItemId
            }];
          }
          return prevSaved;
        });
        
        return newSelectedItems;
      } else {
        // Bỏ món khỏi order
        const newSelectedItems = { ...prev };
        delete newSelectedItems[foodItemId];
        
        // Cập nhật orderItems
        setOrderItems(prevOrder => {
          const newOrderItems = { ...prevOrder };
          delete newOrderItems[foodItemId];
          return newOrderItems;
        });
        
        // Xóa note nếu có
        setItemNotes(prevNotes => {
          const newNotes = { ...prevNotes };
          delete newNotes[foodItemId];
          return newNotes;
        });
        
        // Xóa khỏi savedSelectedItems
        setSavedSelectedItems(prevSaved => prevSaved.filter(i => {
          const id = (i as any).food_item_id || i.food_item?.id || i.id;
          return id !== foodItemId;
        }));
        
        return newSelectedItems;
      }
    });
  };

  const handleViewOrder = () => {
    // Lấy danh sách món đã chọn dựa trên food_item_id
    // Sử dụng orderItems làm nguồn sự thật (source of truth)
    const allSelectedItemsMap = new Map<number, any>(); // Dùng Map để tránh duplicate
    const filteredOrderItems: { [key: number]: number } = {};
    const filteredItemNotes: { [key: number]: string } = {};
    
    // Lấy tất cả food_item_id có trong orderItems (nguồn sự thật)
    // LỌC BỎ các món đã hết (out of stock)
    const allFoodItemIds = Object.keys(orderItems)
      .map(id => Number(id))
      .filter(id => orderItems[id] > 0 && !isItemOutOfStock(id)); // Thêm check isItemOutOfStock
    
    // Với mỗi food_item_id, tìm item object từ các nguồn
    allFoodItemIds.forEach(foodItemId => {
      let itemObject: any = null;
      
      // 1. Tìm trong savedSelectedItems trước (món đã chọn trước đó)
      const savedItem = savedSelectedItems.find(item => {
        const id = (item as any).food_item_id || item.food_item?.id || item.id;
        return id === foodItemId;
      });
      if (savedItem) {
        itemObject = savedItem;
      }
      
      // 2. Nếu không tìm thấy, tìm trong packageItems (buffet mode)
      if (!itemObject) {
        const packageItem = packageItems.find(item => item.food_item.id === foodItemId);
        if (packageItem) {
          itemObject = {
            ...packageItem,
            food_item_id: foodItemId
          };
        }
      }
      
      // 3. Nếu vẫn không tìm thấy, tìm trong serviceItems (service mode)
      if (!itemObject) {
        const serviceItem = serviceItems.find(item => item.id === foodItemId);
        if (serviceItem) {
          itemObject = {
            ...serviceItem,
            food_item_id: foodItemId
          };
        }
      }
      
      // 4. Nếu vẫn không tìm thấy, tạo object tạm từ savedSelectedItems hoặc từ thông tin có sẵn
      if (!itemObject) {
        // Thử tìm trong savedSelectedItems với id khác (fallback)
        const fallbackItem = savedSelectedItems.find(item => {
          const id = (item as any).food_item_id || item.food_item?.id || item.id;
          return id === foodItemId;
        });
        if (fallbackItem) {
          itemObject = {
            ...fallbackItem,
            food_item_id: foodItemId
          };
        } else {
          // Tạo object tạm
          itemObject = {
            id: foodItemId,
            food_item_id: foodItemId,
            food_item: {
              id: foodItemId,
              name: `Món ${foodItemId}`
            }
          };
        }
      }
      
      // Thêm vào Map
      if (itemObject) {
        allSelectedItemsMap.set(foodItemId, {
          ...itemObject,
          food_item_id: foodItemId
        });
        filteredOrderItems[foodItemId] = orderItems[foodItemId];
        if (itemNotes[foodItemId]) {
          filteredItemNotes[foodItemId] = itemNotes[foodItemId];
        }
      }
    });
    
    // Chuyển Map thành mảng
    const allSelectedItems = Array.from(allSelectedItemsMap.values());
    
    console.log('📋 handleViewOrder - Debug:', {
      allSelectedItemsCount: allSelectedItems.length,
      filteredOrderItems: filteredOrderItems,
      selectedItemsKeys: Object.keys(selectedItems).filter(key => selectedItems[Number(key)]),
      orderItemsKeys: Object.keys(orderItems).filter(key => orderItems[Number(key)] > 0)
    });
    
    // Cập nhật savedSelectedItems để lưu lại cho lần quay lại sau
    setSavedSelectedItems(allSelectedItems);
    
    const orderData = {
      selectedTable,
      currentOrder,
      selectedPackage,
      packageQuantity,
      selectedItems: allSelectedItems,
      orderItems: filteredOrderItems,
      itemNotes: filteredItemNotes,
      serviceMode: false
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

      {/* Main Content - Layout theo HÌNH 2 - Thêm pb cho nút fixed */}
      <Box sx={{ flex: 1, display: 'flex', p: 1, gap: 1, pb: '100px' }}>
        {/* Cột trái: Vé và thông tin */}
        <Box sx={{ width: '30%', minWidth: '100px' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 1, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {serviceMode ? 'Dịch vụ' : 'Buffet'}
                </Typography>
                <Button
                  variant={serviceMode ? 'outlined' : 'contained'}
                  size="small"
                  onClick={() => {
                    setServiceMode(!serviceMode);
                    if (!serviceMode) {
                      setSelectedServiceCategory('all'); // Reset khi chuyển sang serviceMode
                    }
                  }}
                  sx={{ 
                    minWidth: 80, 
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: serviceMode ? 'none' : 1,
                    '&:hover': {
                      boxShadow: 2
                    }
                  }}
                >
                  {serviceMode ? 'Buffet' : 'Dịch vụ'}
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {serviceMode ? (
                  // Hiển thị các đầu mục (type) khi serviceMode
                  (() => {
                    const serviceTypes = ['COMBO', 'KHÔNG CỒN', 'CÓ CỒN', 'MÓN LẺ', 'VÉ TRẺ EM', 'UP VÉ'];
                    return serviceTypes.map((type) => (
                      <ListItem
                        key={type}
                        button
                        selected={selectedServiceCategory === type}
                        onClick={() => setSelectedServiceCategory(type)}
                        sx={{
                          border: 1,
                          borderColor: selectedServiceCategory === type ? 'primary.main' : 'grey.300',
                          mb: 0.5,
                          borderRadius: 1,
                          backgroundColor: selectedServiceCategory === type ? 'primary.light' : 'white',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: selectedServiceCategory === type ? 'primary.light' : 'grey.50'
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center' }}>
                              {type}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ));
                  })()
                ) : (
                  packages.map((pkg) => (
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
                  ))
                )}
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
                  Nhân viên: {currentEmployee?.fullname || currentEmployee?.full_name || user?.fullname || 'Chưa xác định'}
                </Typography>
              </Box>
              
              {/* Filter Categories - Chỉ hiển thị khi mode Buffet */}
              {!serviceMode && selectedPackage && (
                <Box sx={{ mb: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['all', 'Bò', 'Heo', 'Gà', 'Hải sản', 'Món nóng', 'Lẩu', 'Tráng miệng'].map((category) => (
                    <Chip
                      key={category}
                      label={category === 'all' ? 'Tất cả' : category}
                      onClick={() => setSelectedCategory(category)}
                      color={selectedCategory === category ? 'primary' : 'default'}
                      variant={selectedCategory === category ? 'filled' : 'outlined'}
                      sx={{ 
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        height: '28px'
                      }}
                    />
                  ))}
                </Box>
              )}
              
              {(serviceMode || selectedPackage) ? (
                <Box sx={{ 
                  height: !serviceMode && selectedPackage ? 'calc(100% - 100px)' : 'calc(100% - 40px)', 
                  overflow: 'auto',
                  p: 0.5
                }}>
                  {(serviceMode ? serviceItems.filter((item) => {
                    // Filter theo đầu mục được chọn
                    if (selectedServiceCategory === 'all') return true;
                    return item.type === selectedServiceCategory;
                  }) : packageItems
                    .filter((item) => {
                      if (selectedCategory === 'all') return true;
                      // Map category to type
                      const categoryToTypeMap: { [key: string]: string } = {
                        'Bò': 'main',
                        'Heo': 'side',
                        'Gà': 'combo',
                        'Hải sản': 'topping',
                        'Món nóng': 'drink',
                        'Lẩu': 'lau',
                        'Tráng miệng': 'dessert'
                      };
                      const expectedType = categoryToTypeMap[selectedCategory];
                      const itemType = item.food_item?.type || '';
                      const itemCategory = item.food_item?.category || '';
                      return itemType === expectedType || itemCategory.toLowerCase().includes(selectedCategory.toLowerCase());
                    })
                  ).map((item) => {
                    // Dùng food_item_id thống nhất để check selection
                    const foodItemId = serviceMode ? item.id : item.food_item.id;
                    const isSelected = selectedItems[foodItemId] || false;
                    const currentNote = itemNotes[foodItemId] || '';
                    const isOutOfStock = isItemOutOfStock(foodItemId);
                    
                    // Debug log
                    if (isOutOfStock) {
                      console.log(`🚫 [OUT OF STOCK] Món ID ${foodItemId} (${serviceMode ? item.name : item.food_item.name}) đã hết`);
                    }
                    
                    return (
                      <Card
                        key={serviceMode ? item.id : item.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Double check để đảm bảo
                          const checkAgain = isItemOutOfStock(foodItemId);
                          if (checkAgain) {
                            console.warn(`⚠️ [BLOCKED] Cố gắng peek món đã hết: ID ${foodItemId}`);
                            alert('Món này đã hết, không thể order!');
                            return;
                          }
                          
                          serviceMode ? handleServiceItemSelect(item) : handleSelectItem(item);
                        }}
                        sx={{
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          border: 2,
                          borderColor: isSelected ? 'primary.main' : (isOutOfStock ? 'grey.400' : 'grey.300'),
                          mb: 1,
                          bgcolor: isSelected ? 'primary.light' : (isOutOfStock ? 'grey.100' : 'white'),
                          opacity: isOutOfStock ? 0.5 : 1,
                          pointerEvents: isOutOfStock ? 'none' : 'auto', // Disable pointer events khi hết
                          userSelect: 'none', // Prevent text selection
                          WebkitUserSelect: 'none',
                          '&:hover': {
                            borderColor: isOutOfStock ? 'grey.400' : 'primary.main',
                            boxShadow: isOutOfStock ? 0 : 2
                          },
                          '&:active': {
                            transform: isOutOfStock ? 'none' : 'scale(0.98)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: isOutOfStock ? 'grey.400' : (isSelected ? 'primary.main' : 'primary.light'),
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2
                            }}
                          >
                            <img
                              src={`https://via.placeholder.com/40x40/1976d2/FFFFFF?text=${encodeURIComponent((serviceMode ? item.name : item.food_item.name).charAt(0))}`}
                              alt={serviceMode ? item.name : item.food_item.name}
                              style={{ width: 40, height: 40, borderRadius: 4 }}
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: isSelected ? 'primary.main' : 'text.primary',
                                mb: 0.5
                              }}
                            >
                              {formatFoodItemName(serviceMode ? item.name : item.food_item.name)}
                            </Typography>
                            {serviceMode && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'primary.main',
                                  fontWeight: 'bold'
                                }}
                              >
                                {item.price.toLocaleString('vi-VN')}₫
                              </Typography>
                            )}
                            {currentNote && (
                              <Chip
                                label="Có ghi chú"
                                size="small"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: '16px',
                                  backgroundColor: 'success.light',
                                  color: 'success.contrastText',
                                  mt: 0.5
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        
                        {isSelected && (
                          <Box sx={{ px: 1.5, pb: 1.5 }}>
                            <TextField
                              size="small"
                              placeholder="Ghi chú cho món này..."
                              value={currentNote}
                              onChange={(e) => handleUpdateItemNote(foodItemId, e.target.value)}
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
                      </Card>
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

      {/* Footer - Nút Xem ORDER (FIXED tại bottom) */}
      <Box 
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'white',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          borderTop: '1px solid #e0e0e0'
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleViewOrder}
          disabled={Object.keys(orderItems).length === 0}
          fullWidth
          sx={{ 
            minHeight: 48,
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Xem ORDER ({Object.keys(orderItems).length} món)
        </Button>
      </Box>
    </Box>
  );
};

export default MobileMenuPage;
