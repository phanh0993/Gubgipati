# Hướng dẫn Setup Máy in Đơn giản

## ✅ Giải pháp: Quét máy in Windows trực tiếp từ Web App

Web app giờ đã có thể **quét máy in Windows trực tiếp** mà không cần setup phức tạp.

## 🚀 Cách sử dụng siêu đơn giản:

### Bước 1: Chạy Restaurant API Server
```bash
node restaurant-api-server.js
```

### Bước 2: Mở web app và test
```bash
# Mở browser: http://localhost:3000/printer-management
# Bấm nút "Quét máy in"
```

### Bước 3: Test thủ công (optional)
```bash
node test-direct-windows-print.js
```

## ✅ Những gì đã được cập nhật:

### 1. **Restaurant API Server** (`restaurant-api-server.js`)
- ✅ **GET /api/printers**: Quét máy in Windows trực tiếp bằng PowerShell
- ✅ **POST /api/printers**: Test in trực tiếp tới máy in Windows
- ✅ **Fallback**: Nếu PowerShell lỗi, trả về database printers

### 2. **Printer Service** (`src/services/printerService.ts`)
- ✅ **Ưu tiên Restaurant API** trước khi thử Printer Agent
- ✅ **Fallback**: Nếu Restaurant API lỗi, thử Printer Agent
- ✅ **Error handling**: Trả về mảng rỗng thay vì crash

### 3. **Print Order Integration**
- ✅ **Dual mode**: Thử Printer Agent trước, fallback sang Windows direct print
- ✅ **Async printing**: Không đợi kết quả, tránh lag UI

## 🔍 Cách hoạt động:

```
Web App → Restaurant API → PowerShell → Windows Printers
```

**Không cần:**
- ❌ Printer Agent riêng biệt
- ❌ Cài đặt Node.js trên Windows
- ❌ Cấu hình Firewall
- ❌ Setup phức tạp

**Chỉ cần:**
- ✅ Restaurant API Server chạy
- ✅ Máy in đã cài driver trên Windows
- ✅ PowerShell hoạt động (mặc định Windows)

## 📋 Test nhanh:

### 1. Test quét máy in:
```bash
curl http://localhost:8001/api/printers
```

### 2. Test in:
```bash
curl -X POST http://localhost:8001/api/printers \
  -H "Content-Type: application/json" \
  -d '{
    "printerName": "Your Printer Name",
    "content": "Test print content",
    "title": "Test"
  }'
```

### 3. Test từ web app:
- Mở `http://localhost:3000/printer-management`
- Bấm "Quét máy in"
- Xem danh sách máy in hiện ra

## 🎯 Kết quả mong đợi:

### ✅ Thành công:
```
🔍 Scanning Windows printers...
✅ Found 2 Windows printers:
   - HP LaserJet Pro (HP Universal Printing PS) - ready
   - Canon PIXMA (Canon IJ Printer Driver) - ready
```

### ⚠️ Nếu lỗi:
- Máy in chưa cài driver → Cài driver máy in
- PowerShell bị disable → Enable PowerShell execution policy
- Không có máy in → Thêm máy in trong Windows

## 💡 Ưu điểm:

1. **Đơn giản**: Chỉ cần chạy Restaurant API Server
2. **Tự động**: Web app tự quét máy in Windows
3. **Fallback**: Có nhiều lớp backup nếu lỗi
4. **Không lag**: In async không ảnh hưởng UI
5. **Cross-platform**: Hoạt động trên mọi Windows

## 🚀 Bước tiếp theo:

Sau khi test thành công:
1. **Cấu hình printer mappings** trong web app
2. **Test in từ order** thật
3. **Tùy chỉnh nội dung in** theo nhu cầu

---

**🎉 Giờ chỉ cần chạy `node restaurant-api-server.js` là có thể quét và in máy in Windows rồi!**