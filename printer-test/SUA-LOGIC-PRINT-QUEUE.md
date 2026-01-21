# ✅ ĐÃ SỬA LOGIC PRINT QUEUE

## 📋 Vấn đề

- ❌ Order trên điện thoại qua 192.168.1.17 không thấy phiếu item món ăn được in ra
- ❌ PrintQueuePoller chạy trên cả mobile và PC
- ❌ Items trong queue có thể không có food_item_id đúng format

## ✅ Đã sửa

### 1. PrintQueuePoller chỉ chạy trên PC ✅

**File:** `src/components/PrintQueuePoller.tsx`

**Thay đổi:**
- Thêm hàm `isPCDevice()` để kiểm tra xem có phải đang chạy trên PC (localhost) không
- PrintQueuePoller chỉ chạy khi `hostname === 'localhost' || hostname === '127.0.0.1'`
- Nếu là mobile (192.168.1.17), PrintQueuePoller sẽ không chạy

**Code:**
```typescript
const isPCDevice = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

useEffect(() => {
  // Chỉ chạy trên PC (localhost), không chạy trên mobile
  if (!isPCDevice()) {
    console.log('📱 Mobile device detected - Print Queue Poller disabled');
    return;
  }
  
  console.log('🔄 Print Queue Poller started (polling every 3s) - PC mode');
  // ... polling logic
}, []);
```

**Kết quả:**
- ✅ PrintQueuePoller chỉ chạy trên PC (localhost)
- ✅ Không chạy trên mobile (192.168.1.17)
- ✅ Tiết kiệm tài nguyên trên mobile

---

### 2. Cải thiện logic tìm food_item_id trong PrintQueuePoller ✅

**File:** `src/components/PrintQueuePoller.tsx`

**Thay đổi:**
- Cải thiện logic lấy `food_item_id` từ item (có thể là `item.food_item_id`, `item.id`, hoặc `item.food_item?.id`)
- Thêm log chi tiết để debug
- Thêm warning nếu item không có food_item_id

**Code:**
```typescript
for (const item of items) {
  // Lấy food_item_id từ item (có thể là item.food_item_id hoặc item.id)
  const foodItemId = item.food_item_id || item.id || item.food_item?.id;
  
  if (!foodItemId) {
    console.warn(`⚠️ Món "${item.name || 'Unknown'}" không có food_item_id, skip`);
    console.warn('   Item data:', item);
    continue;
  }
  
  // Tìm printer cho món này
  const itemMappings = mappings.filter((m: any) => 
    m.food_item_id === foodItemId
  );
  
  if (itemMappings.length === 0) {
    console.log(`⚠️ Món "${item.name || 'Unknown'}" (ID: ${foodItemId}) không có mapping, skip`);
    continue;
  }
  
  console.log(`✅ Tìm thấy ${itemMappings.length} mapping cho món "${item.name}" (ID: ${foodItemId})`);
  // ... in logic
}
```

**Kết quả:**
- ✅ Tìm được food_item_id từ nhiều format khác nhau
- ✅ Log chi tiết để debug
- ✅ Xử lý tốt hơn các trường hợp edge case

---

### 3. Chuẩn hóa items trước khi thêm vào queue ✅

**File:** `src/services/api.ts`

**Thay đổi:**
- Chuẩn hóa items trước khi gửi vào queue
- Đảm bảo items có đầy đủ thông tin: `name`, `food_item_id`, `quantity`, `price`
- Thêm log để debug

**Code:**
```typescript
if (isMobileDevice()) {
  console.log('📱 Mobile device → Thêm vào print queue');
  console.log('📋 Items to queue:', items.map((item: any) => ({
    name: item.name || item.food_item?.name,
    food_item_id: item.food_item_id || item.id || item.food_item?.id,
    quantity: item.quantity
  })));
  
  // Chuẩn hóa items để đảm bảo có food_item_id
  const normalizedItems = items.map((item: any) => ({
    name: item.name || item.food_item?.name || 'Unknown',
    food_item_id: item.food_item_id || item.id || item.food_item?.id,
    quantity: item.quantity || 1,
    price: item.price || item.unit_price || 0,
    special_instructions: item.special_instructions || item.note || ''
  }));
  
  const result = await sendPrintJobViaQueue(
    orderId,
    normalizedItems,
    orderData.table_name,
    orderData.zone_name,
    orderData.staff_name
  );
  // ...
}
```

**Kết quả:**
- ✅ Items được chuẩn hóa trước khi vào queue
- ✅ Đảm bảo có đầy đủ thông tin cần thiết
- ✅ Dễ debug hơn với log chi tiết

---

## 🔄 Cơ chế hoạt động

### Flow khi order từ mobile:

1. **Mobile (192.168.1.17):**
   - User order món ăn
   - `createOrder()` được gọi
   - `processPrintJobs()` được gọi
   - Check `isMobileDevice()` → true
   - Chuẩn hóa items
   - Gọi `sendPrintJobViaQueue()`
   - `addToQueue()` thêm vào `mobile_print_queue`
   - ✅ Lệnh in đã được thêm vào queue

2. **PC (localhost):**
   - `PrintQueuePoller` chạy mỗi 3 giây
   - Check `isPCDevice()` → true
   - Poll `mobile_print_queue` với status = 'pending'
   - Tìm thấy lệnh in mới
   - Lấy `map_printer` từ database
   - Với mỗi item, tìm printer mapping
   - In vào máy in tương ứng
   - Xóa job khỏi queue
   - ✅ Phiếu in đã được in ra

---

## 📊 Checklist

- [x] PrintQueuePoller chỉ chạy trên PC (localhost)
- [x] Cải thiện logic tìm food_item_id
- [x] Chuẩn hóa items trước khi vào queue
- [x] Thêm log chi tiết để debug
- [x] Không có lỗi linter

---

## 🧪 Test

### Test trên Mobile (192.168.1.17):
1. Order món ăn từ mobile
2. Check console log:
   - ✅ "📱 Mobile device → Thêm vào print queue"
   - ✅ "✅ Đã thêm vào queue, PC sẽ xử lý"
3. Check database `mobile_print_queue`:
   - ✅ Có record mới với status = 'pending'
   - ✅ Items có đầy đủ thông tin

### Test trên PC (localhost):
1. Mở trang bất kỳ trên PC
2. Check console log:
   - ✅ "🔄 Print Queue Poller started (polling every 3s) - PC mode"
   - ✅ "📥 [QUEUE] Tìm thấy X lệnh in"
   - ✅ "✅ In thành công: [món] → [máy in]"
3. Check máy in:
   - ✅ Phiếu in được in ra đúng máy

---

## 📝 Lưu ý

1. **PrintQueuePoller:**
   - Chỉ chạy trên PC (localhost hoặc 127.0.0.1)
   - Poll mỗi 3 giây
   - Tự động xử lý và xóa job sau khi in

2. **Items trong queue:**
   - Phải có `food_item_id` để tìm printer mapping
   - Phải có `name` để hiển thị
   - Phải có `quantity` để in số lượng

3. **Map printer:**
   - Phải có dữ liệu trong bảng `map_printer`
   - Món không có mapping sẽ không được in

4. **Debug:**
   - Check console log trên cả mobile và PC
   - Check database `mobile_print_queue`
   - Check bảng `map_printer`

---

**Đã hoàn tất sửa logic print queue! ✅**















