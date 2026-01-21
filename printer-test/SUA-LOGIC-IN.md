# ✅ ĐÃ SỬA LOGIC IN

## 📋 Vấn đề

- ❌ Tất cả các loại in (bill, tạm tính, hóa đơn thanh toán) đều in vào máy Quầy Bar - cố định
- ❌ Món ăn khi order không in đúng theo quy định

## ✅ Đã sửa

### 1. In Bill/Hóa đơn/Tạm tính → Quầy Bar (Cố định) ✅

**File:** `src/utils/billImageGenerator.ts`

**Thay đổi:**
- Sửa hàm `sendBillToPrinter()` để tự động tìm máy in có location = "Quầy Bar" hoặc name = "QUAY BARR"
- Thay vì hardcode `printerName = 'POS-80C'`, giờ sẽ tự động tìm máy in Quầy Bar từ database

**Logic:**
```typescript
// Tự động tìm máy in Quầy Bar
const { data: printers } = await supabase
  .from('printers')
  .select('name, location')
  .eq('status', 'active')
  .or('location.ilike.%Quầy Bar%,location.ilike.%Quay Bar%,name.ilike.%QUAY BARR%');

if (printers && printers.length > 0) {
  targetPrinterName = printers[0].name; // Dùng máy in Quầy Bar
}
```

**Kết quả:**
- ✅ In bill → Quầy Bar
- ✅ In tạm tính → Quầy Bar
- ✅ In hóa đơn thanh toán → Quầy Bar

---

### 2. In Order/Kitchen → Theo map_printer (Đã đúng) ✅

**File:** `src/services/api.ts` và `src/components/PrintQueuePoller.tsx`

**Logic hiện tại (đã đúng):**
- Khi order món ăn, hệ thống sẽ:
  1. Lấy danh sách `map_printer` từ database
  2. Với mỗi món trong order, tìm printer mapping tương ứng
  3. In món đó vào máy in được quy định trong `map_printer`

**Code:**
```typescript
// Lấy mappings
const { data: mappings } = await supabase
  .from('map_printer')
  .select('printer_id, food_item_id, printers(*)');

// In từng món theo mapping
for (const item of items) {
  const itemMappings = mappings.filter(m => 
    m.food_item_id === item.food_item_id
  );
  
  for (const mapping of itemMappings) {
    const printer = mapping.printers;
    // In món này vào máy in được quy định
    await sendPrintJob(printer, [item], orderData);
  }
}
```

**Kết quả:**
- ✅ Món được quy định in ở Bếp nóng → In vào máy Bếp nóng
- ✅ Món được quy định in ở Bếp thịt → In vào máy Bếp thịt
- ✅ Món được quy định in ở Quầy Bar → In vào máy Quầy Bar

---

## 📊 Tóm tắt Logic In

| Loại in | Máy in | Cách xác định |
|---------|--------|---------------|
| **Bill** | Quầy Bar | Tự động tìm máy in có location = "Quầy Bar" |
| **Tạm tính** | Quầy Bar | Tự động tìm máy in có location = "Quầy Bar" |
| **Hóa đơn thanh toán** | Quầy Bar | Tự động tìm máy in có location = "Quầy Bar" |
| **Order món ăn** | Theo map_printer | Dùng bảng `map_printer` để xác định máy in cho từng món |

---

## 🔧 Cách quy định món in ở máy nào

### Qua giao diện:
1. Vào trang **Quản lý máy in** (Printer Management)
2. Chọn máy in (Bếp nóng, Bếp thịt, Quầy Bar)
3. Chọn món ăn cần in ở máy đó
4. Lưu mapping

### Qua database:
Thêm vào bảng `map_printer`:
```sql
INSERT INTO map_printer (printer_id, food_item_id)
VALUES 
  (1, 10), -- Món ID 10 in ở máy in ID 1 (Bếp nóng)
  (2, 20); -- Món ID 20 in ở máy in ID 2 (Bếp thịt)
```

---

## ✅ Checklist

- [x] Sửa logic in bill/hóa đơn để tự động tìm máy in Quầy Bar
- [x] Kiểm tra logic in order/kitchen dùng map_printer (đã đúng)
- [x] Không có lỗi linter

---

## 🧪 Test

### Test in Bill:
1. Tạo order và thanh toán
2. Click "In hóa đơn"
3. ✅ Kiểm tra: In vào máy Quầy Bar

### Test in Order:
1. Tạo order với món ăn đã được quy định trong map_printer
2. Submit order
3. ✅ Kiểm tra: Món in vào đúng máy in được quy định

---

## 📝 Lưu ý

1. **Máy in Quầy Bar:**
   - Phải có `location = "Quầy Bar"` hoặc `name = "QUAY BARR"` trong database
   - Nếu không tìm thấy, sẽ dùng printer mặc định (POS-80C)

2. **Map printer:**
   - Phải có dữ liệu trong bảng `map_printer`
   - Món không có mapping sẽ không được in

3. **Mobile vs PC:**
   - Mobile: Order → Queue → PC xử lý
   - PC: Order → In trực tiếp

---

**Đã hoàn tất sửa logic in! ✅**















