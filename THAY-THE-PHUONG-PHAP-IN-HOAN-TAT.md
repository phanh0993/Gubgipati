# ✅ HOÀN TẤT THAY THẾ PHƯƠNG PHÁP IN BILL

**Ngày:** 31/10/2025  
**Trạng thái:** ✅ Hoàn thành 100%

---

## 🎯 YÊU CẦU

Thay thế phương pháp in cũ bằng phương pháp mới từ `/test-printer` (tạo ảnh PNG → Gửi server in ESC/POS) cho TẤT CẢ trang:
- POS Desktop (PC)
- POS Mobile
- Thanh toán
- Order details

---

## ✅ ĐÃ HOÀN THÀNH

### 1️⃣ Tạo Helper Function (Dùng chung)

**File mới:** `src/utils/billImageGenerator.ts`

**Chức năng:**
- ✅ `generateBillImage(billData)` - Tạo ảnh PNG từ data
- ✅ `sendBillToPrinter(image, printer)` - Gửi ảnh tới server in
- ✅ `downloadBillImage(image)` - Download ảnh bill
- ✅ `printBill(billData)` - All-in-one: Tạo + Gửi + Trả kết quả

**Format bill chuẩn:**
```
GUBGIPATI
HOA DON THANH TOAN
================================
Thoi gian: 31/10/2025 14:30:25
Don hang: ORD-123
Bàn 11 - Khu A
NV: Lộc Phúc Anh
================================
Vé Buffet 169K
  x2 = 338,000d
Vú heo nướng
  x2 = 0d
  nướng chín
Soju + Tiger
  x1 = 95,000d
================================
TONG CONG: 433,000d
================================
Cam on quy khach!
```

---

### 2️⃣ Thay thế phương pháp in - POS Desktop (Main Webapp)

#### `src/pages/BuffetTableSelection.tsx`

**Function:** `handlePrintBill()`

**Thay đổi:**
- ❌ Xóa: `invoicePrintAPI.processInvoicePrint()` (cũ)
- ✅ Dùng: `printBill()` từ `billImageGenerator`

**Logic:**
1. Thu thập items (vé buffet + món ăn)
2. Tạo billData object
3. Gọi `printBill()` → Tạo ảnh PNG → Gửi server
4. Hiển thị alert kết quả

---

#### `src/pages/SimpleBuffetPOS.tsx`

**Function:** `handlePrintBill()`

**Thay đổi:**
- ❌ Xóa: `invoicePrintAPI.processInvoicePrint()` (cũ)
- ✅ Dùng: `printBill()` từ `billImageGenerator`

**Logic:**
1. Thu thập orderItems
2. Tạo billData với buffet package info
3. Gọi `printBill()` → In qua server
4. Alert kết quả

---

### 3️⃣ Thay thế phương pháp in - POS Mobile

#### `src/pages/MobileOrderDetailsPage.tsx`

**Function:** `handlePrint()`

**Thay đổi:**
- ❌ Xóa: `invoicePrintAPI.processInvoicePrint()` (cũ)
- ✅ Dùng: `printBill()` từ `billImageGenerator`

**Logic:**
1. Map food_items từ order
2. Tạo billData với order info
3. Gọi `printBill()` → In qua server
4. Fallback `window.print()` nếu server lỗi

---

### 4️⃣ Thay thế phương pháp in - POS Desktop App (Riêng)

#### `pos-app/src/pages/TableSelection.tsx`

**Function:** `handlePrintBill()`

**Thay đổi:**
- ❌ Xóa: `apiFetch('/api/print-order')` (cũ)
- ✅ Dùng: Inline tạo canvas + gửi server

**Logic:**
1. Thu thập items từ orderDetails
2. Tạo canvas, vẽ bill
3. Convert canvas → base64
4. POST `http://localhost:9977/print/image`
5. Alert kết quả

---

## 📊 SO SÁNH PHƯƠNG PHÁP

### ❌ Phương pháp CŨ:

```javascript
// Gọi API backend hoặc invoicePrintAPI
const { invoicePrintAPI } = await import('../services/api');
await invoicePrintAPI.processInvoicePrint(orderData, items, false);

// Vấn đề:
// - Phụ thuộc backend API phức tạp
// - Nhiều logic xử lý template
// - Không rõ ràng cách in
// - Khó debug
```

### ✅ Phương pháp MỚI:

```javascript
// Import helper
const { printBill } = await import('../utils/billImageGenerator');

// Chuẩn bị data
const billData = {
  orderNumber: 'ORD-123',
  tableName: 'Bàn 11',
  area: 'Khu A',
  items: [...],
  totalAmount: 433000
};

// In (1 dòng!)
const result = await printBill(billData, 'POS-80C');

// Ưu điểm:
// ✅ Đơn giản, 1 function duy nhất
// ✅ Tạo ảnh PNG trực quan
// ✅ Gửi ESC/POS RAW qua server
// ✅ Dễ debug (có file PNG debug)
// ✅ Không phụ thuộc backend phức tạp
```

---

## 🔄 FLOW IN BILL MỚI

```
[Nút "In Bill" / "Thanh toán"]
         ↓
Thu thập data order (items, table, staff...)
         ↓
Tạo billData object
         ↓
printBill(billData) → billImageGenerator.ts
         ↓
generateBillImage() → Canvas HTML5
         ↓
Vẽ bill lên canvas (text, lines...)
         ↓
canvas.toDataURL() → Base64 PNG
         ↓
sendBillToPrinter() → POST localhost:9977/print/image
         ↓
[Printer Server] → printer-server.js
         ↓
Giải mã base64 → PNG buffer
         ↓
convertPNGToESCPOS() → Bitmap
         ↓
Gửi qua TCP/IP → 192.168.0.3:9100
         ↓
[Máy in POS-80C] → In ra giấy
         ↓
Trả kết quả về webapp
         ↓
Alert thành công/thất bại
```

---

## 📁 FILES ĐÃ THAY ĐỔI

### Main Webapp (src/):
1. **src/utils/billImageGenerator.ts** (Mới tạo)
   - Helper functions tạo & in bill
   
2. **src/pages/BuffetTableSelection.tsx**
   - Function: `handlePrintBill()`
   - ~60 dòng thay đổi
   
3. **src/pages/SimpleBuffetPOS.tsx**
   - Function: `handlePrintBill()`
   - ~50 dòng thay đổi
   
4. **src/pages/MobileOrderDetailsPage.tsx**
   - Function: `handlePrint()`
   - ~45 dòng thay đổi

### POS Desktop App (pos-app/):
5. **pos-app/src/pages/TableSelection.tsx**
   - Function: `handlePrintBill()`
   - ~95 dòng thay đổi (inline canvas code)

---

## ✅ CHECKLIST HOÀN TẤT

- [x] Tạo helper function `billImageGenerator.ts`
- [x] Sửa BuffetTableSelection.tsx (POS Desktop)
- [x] Sửa SimpleBuffetPOS.tsx (POS Desktop)
- [x] Sửa MobileOrderDetailsPage.tsx (Mobile)
- [x] Sửa pos-app TableSelection.tsx (POS App riêng)
- [x] Không có linter errors
- [x] Code DRY, sạch, dễ maintain
- [x] Log chi tiết để debug
- [x] Fallback window.print() nếu server lỗi

---

## 🧪 CÁCH TEST

### Bước 1: Restart React

```bash
# Stop React (Ctrl+C trong CMD)
# Start lại
npm start
```

### Bước 2: Đảm bảo Printer Server chạy

```bash
cd windows-printer-server
node printer-server.js
```

Hoặc:
```bash
printer-server-new.exe
```

### Bước 3: Đăng nhập

http://localhost:3000  
Username: `admin` / Password: `admin123`

### Bước 4: Test từng trang

#### Test 1: POS Desktop - BuffetTableSelection
1. Vào: `/buffet-tables`
2. Chọn bàn → Order món
3. Click "In Bill"
4. Kiểm tra: Log console, máy in

#### Test 2: POS Desktop - SimpleBuffetPOS
1. Vào: `/buffet-menu` (nếu đã chọn bàn)
2. Chọn vé, thêm món
3. Click "In Bill"
4. Kiểm tra: Log console, máy in

#### Test 3: POS Mobile - Order Details
1. Vào: `/mobile-login` → Login
2. Vào: `/mobile-tables` → Chọn bàn
3. Vào: `/mobile-invoices` → Chọn order
4. Click nút "In"
5. Kiểm tra: Log console, máy in

#### Test 4: POS App (Riêng) - TableSelection
1. Chạy pos-app: `cd pos-app && npm start`
2. Login
3. Chọn bàn → Xem order
4. Click "In Bill"
5. Kiểm tra: Log console, máy in

---

## 🔍 KIỂM TRA LOG

### Console log mẫu (thành công):
```
🖨️ [PRINT BILL] Bắt đầu in bill...
📄 Bill data: {orderNumber: "ORD-123", tableName: "Bàn 11", ...}
📤 Gửi lệnh in tới server printer...
✅ In bill thành công: {success: true, message: "Đã in..."}
```

### Printer Server log mẫu:
```
=== [PRINTER SERVER] Nhận request in bill ===
📄 Thông tin bill: {printer_name: "POS-80C", ...}
✅ Đã decode PNG buffer: 45678 bytes
💾 Đã lưu file debug: bill_1234567890.png
🔄 Đang convert PNG sang ESC/POS bitmap...
✅ Convert xong: 87654 bytes ESC/POS command
🖨️  Kết nối tới máy in 192.168.0.3:9100...
✅ Hoàn tất in bill (234ms)
```

---

## 🎉 KẾT LUẬN

**ĐÃ THAY THẾ HOÀN TẤT PHƯƠNG PHÁP IN!**

✅ **Tất cả 5 files** đã được sửa  
✅ **Phương pháp thống nhất**: Tạo ảnh PNG → Server ESC/POS  
✅ **Helper function** dùng chung, DRY  
✅ **Logic giữ nguyên** (thu thập data order như cũ)  
✅ **Chỉ thay logic in** (từ API/template sang PNG/ESC/POS)  
✅ **Không có linter errors**  
✅ **Fallback** window.print() nếu server lỗi  

**RESTART REACT VÀ TEST NGAY!** 🚀

---

**Files:**
- Main: 4 files
- POS App: 1 file
- Helper: 1 file
- **Tổng: 6 files thay đổi**

**Phương pháp:** ESC/POS RAW qua ảnh PNG  
**Server:** localhost:9977  
**Máy in:** POS-80C (192.168.0.3:9100)

