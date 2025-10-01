// Script để cập nhật giao diện mobile thêm mode "Dịch vụ"
const fs = require('fs');
const path = require('path');

function updateMobileServiceMode() {
  console.log('🔄 Cập nhật giao diện mobile thêm mode "Dịch vụ"...\n');

  try {
    const mobileMenuPath = path.join(__dirname, 'src/pages/MobileMenuPage.tsx');
    
    if (!fs.existsSync(mobileMenuPath)) {
      console.log('❌ Không tìm thấy file MobileMenuPage.tsx');
      return;
    }

    let content = fs.readFileSync(mobileMenuPath, 'utf8');

    // 1. Thêm state cho mode
    const addServiceState = `
  const [serviceMode, setServiceMode] = useState(false);
  const [serviceItems, setServiceItems] = useState([]);
  const [serviceQuantities, setServiceQuantities] = useState<{ [key: number]: number }>({});
  const [serviceNotes, setServiceNotes] = useState<{ [key: number]: string }>({});`;

    // Tìm vị trí thêm state
    const statePattern = /const \[itemNotes, setItemNotes\] = useState<\{ \[key: number\]: string \}\>\(\{\}\);/;
    if (statePattern.test(content)) {
      content = content.replace(statePattern, statePattern.exec(content)[0] + addServiceState);
    }

    // 2. Thêm hàm fetch service items
    const addFetchServiceItems = `
  const fetchServiceItems = async () => {
    try {
      const { foodAPI } = await import('../services/api');
      const response = await foodAPI.getItems();
      const serviceItemsData = response.data.filter(item => item.price > 0);
      setServiceItems(serviceItemsData);
    } catch (error) {
      console.error('Error fetching service items:', error);
    }
  };`;

    // Tìm vị trí thêm hàm
    const fetchPattern = /const fetchPackages = async \(\) => \{/;
    if (fetchPattern.test(content)) {
      content = content.replace(fetchPattern, addFetchServiceItems + '\n\n  ' + fetchPattern.exec(content)[0]);
    }

    // 3. Thêm hàm xử lý service items
    const addServiceHandlers = `
  const handleServiceItemSelect = (itemId: number) => {
    const isSelected = serviceQuantities[itemId] > 0;
    if (isSelected) {
      const newQuantities = { ...serviceQuantities };
      delete newQuantities[itemId];
      setServiceQuantities(newQuantities);
    } else {
      setServiceQuantities(prev => ({
        ...prev,
        [itemId]: 1
      }));
    }
  };

  const handleServiceQuantityChange = (itemId: number, change: number) => {
    const currentQuantity = serviceQuantities[itemId] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    if (newQuantity === 0) {
      const newQuantities = { ...serviceQuantities };
      delete newQuantities[itemId];
      setServiceQuantities(newQuantities);
    } else {
      setServiceQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  const handleUpdateServiceNote = (itemId: number, note: string) => {
    setServiceNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };`;

    // Tìm vị trí thêm handlers
    const handlerPattern = /const handleUpdateItemNote = \(itemId: number, note: string\) => \{/;
    if (handlerPattern.test(content)) {
      content = content.replace(handlerPattern, addServiceHandlers + '\n\n  ' + handlerPattern.exec(content)[0]);
    }

    // 4. Thêm useEffect để fetch service items
    const addServiceUseEffect = `
  useEffect(() => {
    if (serviceMode) {
      fetchServiceItems();
    }
  }, [serviceMode]);`;

    // Tìm vị trí thêm useEffect
    const useEffectPattern = /useEffect\(\(\) => \{/;
    if (useEffectPattern.test(content)) {
      content = content.replace(useEffectPattern, addServiceUseEffect + '\n\n  ' + useEffectPattern.exec(content)[0]);
    }

    // 5. Thêm tab "Dịch vụ" vào giao diện
    const addServiceTab = `
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant={!serviceMode ? 'contained' : 'outlined'}
                onClick={() => setServiceMode(false)}
                size="small"
                sx={{ flex: 1 }}
              >
                Buffet
              </Button>
              <Button
                variant={serviceMode ? 'contained' : 'outlined'}
                onClick={() => setServiceMode(true)}
                size="small"
                sx={{ flex: 1 }}
              >
                Dịch vụ
              </Button>
            </Box>`;

    // Tìm vị trí thêm tab
    const tabPattern = /<Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>/;
    if (tabPattern.test(content)) {
      content = content.replace(tabPattern, addServiceTab + '\n            ' + tabPattern.exec(content)[0]);
    }

    // 6. Thêm hiển thị service items
    const addServiceItemsDisplay = `
            {serviceMode ? (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
                rowGap: 1.5,
                p: 0.5
              }}>
                {serviceItems.map((item) => {
                  const isSelected = serviceQuantities[item.id] > 0;
                  const currentNote = serviceNotes[item.id] || '';
                  return (
                    <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Card
                        onClick={() => handleServiceItemSelect(item.id)}
                        sx={{
                          cursor: 'pointer',
                          border: 2,
                          borderColor: isSelected ? 'primary.main' : 'grey.300',
                          height: isSelected ? 'auto' : '120px',
                          minHeight: '120px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          bgcolor: isSelected ? 'primary.light' : 'white',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, p: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.7rem',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              lineHeight: 1.2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              color: isSelected ? 'primary.main' : 'text.primary'
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.6rem',
                              color: isSelected ? 'primary.main' : 'text.secondary',
                              fontWeight: 'bold'
                            }}
                          >
                            {item.price.toLocaleString('vi-VN')}₫
                          </Typography>
                          {currentNote && (
                            <Chip
                              label="Có ghi chú"
                              size="small"
                              sx={{
                                fontSize: '0.5rem',
                                height: '14px',
                                backgroundColor: 'success.light',
                                color: 'success.contrastText'
                              }}
                            />
                          )}
                        </Box>
                      </Card>
                      
                      {isSelected && (
                        <Box sx={{ mt: 1, width: '100%' }}>
                          <TextField
                            size="small"
                            placeholder="Ghi chú cho món này..."
                            value={currentNote}
                            onChange={(e) => handleUpdateServiceNote(item.id, e.target.value)}
                            sx={{ 
                              width: '100%',
                              '& .MuiInputBase-input': {
                                fontSize: '0.75rem',
                                padding: '6px 8px',
                                minHeight: '18px'
                              },
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '6px',
                                backgroundColor: '#f5f5f5'
                              }
                            }}
                            variant="outlined"
                            multiline
                            maxRows={2}
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ) : (`;`;

    // Tìm vị trí thêm service items display
    const serviceDisplayPattern = /{packageItems\.map\(\(item\) => \{/;
    if (serviceDisplayPattern.test(content)) {
      content = content.replace(serviceDisplayPattern, addServiceItemsDisplay + '\n              ' + serviceDisplayPattern.exec(content)[0]);
    }

    // 7. Thêm đóng ngoặc cho service mode
    const addServiceClose = `
            )}`;

    // Tìm vị trí thêm đóng ngoặc
    const closePattern = /}\)\}/;
    if (closePattern.test(content)) {
      content = content.replace(closePattern, addServiceClose + '\n              ' + closePattern.exec(content)[0]);
    }

    // 8. Cập nhật handleViewOrder để bao gồm service items
    const updateViewOrder = `
    const serviceItemsList = serviceItems.filter(item => serviceQuantities[item.id] > 0);
    const orderData = {
      selectedTable,
      currentOrder,
      selectedPackage,
      packageQuantity,
      selectedItems: selectedItemsList,
      orderItems,
      itemNotes,
      serviceItems: serviceItemsList,
      serviceQuantities,
      serviceNotes: serviceNotes
    };`;

    // Tìm và thay thế handleViewOrder
    const viewOrderPattern = /const orderData = \{[\s\S]*?\};/;
    if (viewOrderPattern.test(content)) {
      content = content.replace(viewOrderPattern, updateViewOrder);
    }

    // Lưu file
    fs.writeFileSync(mobileMenuPath, content);
    console.log('✅ Đã cập nhật MobileMenuPage.tsx');

    console.log('\n📝 Các thay đổi đã thực hiện:');
    console.log('1. ✅ Thêm state cho service mode');
    console.log('2. ✅ Thêm hàm fetch service items');
    console.log('3. ✅ Thêm handlers cho service items');
    console.log('4. ✅ Thêm tab "Dịch vụ"');
    console.log('5. ✅ Thêm hiển thị service items');
    console.log('6. ✅ Cập nhật handleViewOrder');

    console.log('\n🎉 Cập nhật giao diện mobile hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật giao diện:', error);
  }
}

// Chạy script
updateMobileServiceMode();
