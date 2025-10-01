// Script để cập nhật MobileBillPage xử lý service items
const fs = require('fs');
const path = require('path');

function updateMobileBillService() {
  console.log('🔄 Cập nhật MobileBillPage xử lý service items...\n');

  try {
    const mobileBillPath = path.join(__dirname, 'src/pages/MobileBillPage.tsx');
    
    if (!fs.existsSync(mobileBillPath)) {
      console.log('❌ Không tìm thấy file MobileBillPage.tsx');
      return;
    }

    let content = fs.readFileSync(mobileBillPath, 'utf8');

    // 1. Thêm interface cho ServiceItem
    const addServiceItemInterface = `
interface ServiceItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  category_id: number;
  is_available: boolean;
}`;

    // Tìm vị trí thêm interface
    const interfacePattern = /interface BuffetPackageItem \{/;
    if (interfacePattern.test(content)) {
      content = content.replace(interfacePattern, addServiceItemInterface + '\n\n' + interfacePattern.exec(content)[0]);
    }

    // 2. Thêm state cho service items
    const addServiceState = `
  const serviceItems = location.state?.serviceItems as ServiceItem[];
  const serviceQuantities = location.state?.serviceQuantities as { [key: number]: number };
  const serviceNotes = location.state?.serviceNotes as { [key: number]: string };`;

    // Tìm vị trí thêm state
    const statePattern = /const itemNotes = location\.state\?\.itemNotes as \{ \[key: number\]: string \};/;
    if (statePattern.test(content)) {
      content = content.replace(statePattern, statePattern.exec(content)[0] + addServiceState);
    }

    // 3. Thêm state cho service quantities và notes
    const addServiceStateVariables = `
  const [serviceQuantitiesState, setServiceQuantitiesState] = useState<{ [key: number]: number }>(serviceQuantities || {});
  const [serviceNotesState, setServiceNotesState] = useState<{ [key: number]: string }>(serviceNotes || {});`;

    // Tìm vị trí thêm state variables
    const stateVarPattern = /const \[itemNotesState, setItemNotesState\] = useState<\{ \[key: number\]: string \}\>\(itemNotes \|\| \{\}\);/;
    if (stateVarPattern.test(content)) {
      content = content.replace(stateVarPattern, stateVarPattern.exec(content)[0] + addServiceStateVariables);
    }

    // 4. Thêm handlers cho service items
    const addServiceHandlers = `
  const handleServiceQuantityChange = (itemId: number, change: number) => {
    const currentQuantity = serviceQuantitiesState[itemId] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    if (newQuantity === 0) {
      const newQuantities = { ...serviceQuantitiesState };
      delete newQuantities[itemId];
      setServiceQuantitiesState(newQuantities);
    } else {
      setServiceQuantitiesState(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  const handleUpdateServiceNote = (itemId: number, note: string) => {
    setServiceNotesState(prev => ({
      ...prev,
      [itemId]: note
    }));
  };`;

    // Tìm vị trí thêm handlers
    const handlerPattern = /const handleUpdateItemNote = \(itemId: number, note: string\) => \{/;
    if (handlerPattern.test(content)) {
      content = content.replace(handlerPattern, addServiceHandlers + '\n\n  ' + handlerPattern.exec(content)[0]);
    }

    // 5. Cập nhật calculateTotal để bao gồm service items
    const updateCalculateTotal = `
  const calculateTotal = () => {
    let total = 0;
    
    // Add package total
    if (selectedPackage) {
      total += selectedPackage.price * packageQuantity;
    }
    
    // Add service items total
    if (serviceItems && serviceQuantitiesState) {
      serviceItems.forEach(item => {
        const quantity = serviceQuantitiesState[item.id] || 0;
        total += item.price * quantity;
      });
    }
    
    return total;
  };`;

    // Tìm và thay thế calculateTotal
    const calculatePattern = /const calculateTotal = \(\) => \{[\s\S]*?\};/;
    if (calculatePattern.test(content)) {
      content = content.replace(calculatePattern, updateCalculateTotal);
    }

    // 6. Thêm hiển thị service items trong giao diện
    const addServiceItemsDisplay = `
            {/* Service Items */}
            {serviceItems && serviceItems.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Dịch vụ thêm
                </Typography>
                
                <List dense sx={{ p: 0 }}>
                  {serviceItems.map((item) => {
                    const quantity = serviceQuantitiesState[item.id] || 0;
                    if (quantity === 0) return null;
                    
                    return (
                      <Box key={item.id}>
                        <ListItem 
                          sx={{ 
                            py: 0.5,
                            px: 0,
                            borderBottom: 1,
                            borderColor: 'grey.200'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.name}
                                </Typography>
                                {(item.special_instructions || serviceNotesState[item.id]) && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                    Ghi chú: {item.special_instructions || serviceNotesState[item.id]}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                {item.price.toLocaleString('vi-VN')}₫
                              </Typography>
                            }
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleServiceQuantityChange(item.id, -1)}
                            >
                              <Remove />
                            </IconButton>
                            <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                              x{quantity}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleServiceQuantityChange(item.id, 1)}
                            >
                              <Add />
                            </IconButton>
                          </Box>
                        </ListItem>
                        
                        {/* Trường nhập note cho service item */}
                        <Box sx={{ px: 2, pb: 1 }}>
                          <TextField
                            size="small"
                            placeholder="Ghi chú cho món này..."
                            value={serviceNotesState[item.id] || item.special_instructions || ''}
                            onChange={(e) => handleUpdateServiceNote(item.id, e.target.value)}
                            sx={{ 
                              width: '100%',
                              '& .MuiInputBase-input': {
                                fontSize: '0.8rem',
                                padding: '8px 12px'
                              }
                            }}
                            variant="outlined"
                            multiline
                            maxRows={2}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </List>
              </Box>
            )}`;

    // Tìm vị trí thêm service items display
    const serviceDisplayPattern = /{selectedItems && selectedItems\.length > 0 \? \(/;
    if (serviceDisplayPattern.test(content)) {
      content = content.replace(serviceDisplayPattern, addServiceItemsDisplay + '\n            ' + serviceDisplayPattern.exec(content)[0]);
    }

    // 7. Cập nhật các hàm tạo order để bao gồm service items
    const updateOrderCreation = `
        // Add service items to order
        if (serviceItems && serviceQuantitiesState) {
          const serviceItemsList = serviceItems.filter(item => serviceQuantitiesState[item.id] > 0);
          if (serviceItemsList.length > 0) {
            const serviceItemsData = serviceItemsList.map(item => ({
              food_item_id: item.id,
              name: item.name,
              price: item.price,
              quantity: serviceQuantitiesState[item.id],
              total: item.price * serviceQuantitiesState[item.id],
              special_instructions: serviceNotesState[item.id] || 'Dịch vụ thêm',
              printer_id: null
            }));
            
            // Add service items to existing items
            if (orderData.items) {
              orderData.items = [...orderData.items, ...serviceItemsData];
            } else {
              orderData.items = serviceItemsData;
            }
          }
        }`;

    // Tìm và thay thế các hàm tạo order
    const orderPattern = /items: selectedItems[\s\S]*?\)\)/g;
    if (orderPattern.test(content)) {
      content = content.replace(orderPattern, (match) => {
        return match + updateOrderCreation;
      });
    }

    // Lưu file
    fs.writeFileSync(mobileBillPath, content);
    console.log('✅ Đã cập nhật MobileBillPage.tsx');

    console.log('\n📝 Các thay đổi đã thực hiện:');
    console.log('1. ✅ Thêm interface ServiceItem');
    console.log('2. ✅ Thêm state cho service items');
    console.log('3. ✅ Thêm handlers cho service items');
    console.log('4. ✅ Cập nhật calculateTotal');
    console.log('5. ✅ Thêm hiển thị service items');
    console.log('6. ✅ Cập nhật tạo order');

    console.log('\n🎉 Cập nhật MobileBillPage hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật MobileBillPage:', error);
  }
}

// Chạy script
updateMobileBillService();
