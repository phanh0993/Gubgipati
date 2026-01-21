# 🚀 HƯỚNG DẪN CHẠY LOCAL ĐẦY ĐỦ - GUBGIPATI SYSTEM

## 📋 TỔNG QUAN

Hệ thống gồm 3 phần chính:
1. **Main Webapp** (React) - Quản lý tổng hợp, POS Desktop PC, Mobile POS
2. **POS Desktop App** (React riêng) - Ứng dụng POS riêng cho Desktop (tùy chọn)
3. **Printer Server** (Node.js) - Server in bill qua ESC/POS

### Database: **Supabase Cloud** (không cần setup local database)

---

## ⚙️ YÊU CẦU HỆ THỐNG

- **Node.js**: v18+ 
- **npm** hoặc **yarn**
- **Máy in POS-80C**: IP `192.168.0.3`, Port `9100` (nếu cần in bill)
- **Windows**: Để chạy Printer Server

---

## 🎯 PHẦN 1: MAIN WEBAPP (Chính)

### Cấu trúc:
```
src/
├── pages/
│   ├── BuffetTableSelection.tsx    # POS Desktop - Chọn bàn
│   ├── SimpleBuffetPOS.tsx         # POS Desktop - Order
│   ├── MobileTablesPage.tsx        # POS Mobile - Chọn bàn
│   ├── MobileMenuPage.tsx          # POS Mobile - Menu
│   ├── MobileBillPage.tsx          # POS Mobile - Bill
│   ├── TestPrinterPage.tsx         # Test in bill
│   └── ... (các trang quản lý khác)
├── services/
│   ├── supabaseClient.ts           # ✅ Kết nối Supabase
│   └── api.ts                      # API service
└── ...
```

### Bước 1: Cài đặt

```bash
# Trong thư mục gốc
npm install
```

### Bước 2: Kiểm tra .env

File `.env` (đã có sẵn):
```env
REACT_APP_SUPABASE_URL=https://rmqzggfwvhsoiijlsxwy.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Không cần sửa gì**, đã cấu hình sẵn kết nối Supabase cloud.

### Bước 3: Chạy Webapp

```bash
npm start
```

**Truy cập:** http://localhost:3000

### Các trang quan trọng:

#### POS Desktop (Trong Main Webapp):
- `/buffet-tables` - Chọn bàn (POS Desktop)
- `/buffet-menu` - Order món (POS Desktop)
- `/pos-login` - Đăng nhập POS Desktop

#### POS Mobile:
- `/mobile-login` - Đăng nhập Mobile
- `/mobile-tables` - Chọn bàn Mobile
- `/mobile-menu` - Menu Mobile
- `/mobile-bill` - Bill Mobile

#### Quản lý:
- `/dashboard` - Dashboard
- `/tables` - Quản lý bàn
- `/food` - Quản lý món ăn
- `/printers` - Quản lý máy in
- `/test-printer` - **Test in bill** ⭐

### Đăng nhập:
```
Username: admin
Password: admin123
```

---

## 🎯 PHẦN 2: POS DESKTOP APP (Riêng biệt - Tùy chọn)

> ⚠️ **Lưu ý**: Đây là app POS riêng biệt, có thể bỏ qua nếu chỉ dùng POS trong Main Webapp.

### Cấu trúc:
```
pos-app/
├── src/
│   ├── pages/
│   │   ├── TableSelection.tsx     # Chọn bàn
│   │   ├── BuffetPOS.tsx          # Order món
│   │   └── LoginPage.tsx          # Đăng nhập
│   ├── config/
│   │   └── api.ts                 # ✅ Config API local
│   └── ...
└── package.json
```

### Bước 1: Cài đặt

```bash
cd pos-app
npm install
```

### Bước 2: Tạo .env (nếu chưa có)

File `pos-app/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

### Bước 3: Chạy POS App

```bash
# Trong thư mục pos-app
npm start
```

**Truy cập:** http://localhost:3001 (port khác với main webapp)

---

## 🎯 PHẦN 3: PRINTER SERVER (In Bill)

### Cấu trúc:
```
windows-printer-server/
├── printer-server.js              # Main server
├── printer-server-new.exe         # File .exe build sẵn
├── config/
│   └── api.ts                     # Config
├── package.json
└── HUONG-DAN.md
```

### Bước 1: Cài đặt (nếu chạy bằng Node.js)

```bash
cd windows-printer-server
npm install
```

### Bước 2: Chạy Server

**Cách 1: Chạy file .exe (Đơn giản nhất)**
```bash
# Double-click hoặc:
printer-server-new.exe
```

**Cách 2: Chạy bằng Node.js**
```bash
node printer-server.js
```

**Cách 3: Dùng batch file**
```bash
start-server.bat
```

**Server khởi động tại:** http://localhost:9977

### Kiểm tra:
```
Mở browser: http://localhost:9977
→ Nên thấy JSON response:
{
  "status": "running",
  "service": "ESC/POS Printer Server",
  "printer": "192.168.0.3:9100"
}
```

---

## 🚀 KHỞI ĐỘNG TỰ ĐỘNG TẤT CẢ

### Cách 1: Script tự động (Windows)

```bash
# Double-click file này
START-FULL-SYSTEM.bat
```

Script sẽ tự động mở:
1. Printer Server (Port 9977)
2. Main Webapp (Port 3000)

### Cách 2: Chạy thủ công từng phần

**Terminal 1 - Printer Server:**
```bash
cd windows-printer-server
node printer-server.js
```

**Terminal 2 - Main Webapp:**
```bash
npm start
```

**Terminal 3 - POS Desktop App (tùy chọn):**
```bash
cd pos-app
npm start
```

---

## 📱 SƠ ĐỒ HOẠT ĐỘNG

```
┌─────────────────────────────────────────────────────────┐
│                    GUBGIPATI SYSTEM                     │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐
│  Main Webapp     │      │  POS Desktop App │
│  localhost:3000  │      │  localhost:3001  │
│                  │      │  (Tùy chọn)      │
│ - POS Desktop    │      │                  │
│ - POS Mobile     │      │ - TableSelection │
│ - Quản lý        │      │ - BuffetPOS      │
│ - Test Printer   │      │                  │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         │  Kết nối Supabase      │  Gọi API
         │  (Cloud Database)       │  localhost:8000
         ↓                         ↓
┌─────────────────────────────────────────┐
│         Supabase PostgreSQL             │
│  https://rmqzggfwvhsoiijlsxwy...        │
└─────────────────────────────────────────┘

         │
         │  Khi in bill
         ↓
┌─────────────────────────────────────────┐
│      Printer Server                     │
│      localhost:9977                     │
│                                         │
│  POST /print/image                      │
│  - Nhận ảnh PNG base64                  │
│  - Convert ESC/POS                      │
│  - In qua TCP/IP                        │
└───────────────┬─────────────────────────┘
                │
                ↓
        ┌──────────────┐
        │  POS-80C     │
        │  192.168.0.3 │
        │  Port 9100   │
        └──────────────┘
```

---

## 🔧 CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### ✅ Đã sửa để chạy local:

1. **src/pages/SimpleBuffetPOS.tsx**
   - ❌ Xóa: Hardcode Supabase URL
   - ✅ Dùng: `import { supabase } from '../services/supabaseClient'`

2. **src/pages/MobileBillPage.tsx**
   - ❌ Xóa: Hardcode Supabase URL
   - ✅ Dùng: `import { supabase } from '../services/supabaseClient'`

3. **pos-app/src/config/api.ts** (Mới tạo)
   - ✅ Config API base URL: `http://localhost:8000`
   - ✅ Helper function `apiFetch`

4. **pos-app/src/pages/TableSelection.tsx**
   - ❌ Xóa: `fetch('http://localhost:8000/...')`
   - ✅ Dùng: `apiFetch('/api/...')`

5. **pos-app/src/pages/BuffetPOS.tsx**
   - ❌ Xóa: `fetch('/api/...')` hardcode
   - ✅ Dùng: `apiFetch('/api/...')`

6. **pos-app/src/services/authService.ts**
   - ❌ Xóa: `const API_BASE_URL = 'http://localhost:8000'`
   - ✅ Dùng: `import { API_BASE_URL } from '../config/api'`

---

## 🐛 TROUBLESHOOTING

### ❌ Lỗi: "This site can't be reached" (localhost:3000)

**Nguyên nhân:** Webapp chưa chạy

**Giải pháp:**
```bash
npm start
```

---

### ❌ Lỗi: "Missing Supabase configuration"

**Nguyên nhân:** File `.env` không có hoặc sai

**Giải pháp:**
```bash
# Kiểm tra file .env có tồn tại không
cat .env

# Nếu không có, copy từ template
cp env.example .env
```

---

### ❌ Lỗi: "Lỗi kết nối server in" (Test Printer)

**Nguyên nhân:** Printer Server chưa chạy

**Giải pháp:**
```bash
cd windows-printer-server
node printer-server.js

# Hoặc
printer-server-new.exe
```

Kiểm tra: http://localhost:9977

---

### ❌ POS Desktop App gọi API lỗi

**Nguyên nhân:** Backend API chưa chạy (port 8000)

**Giải pháp:**

POS Desktop App cần backend API chạy ở port 8000. Nếu bạn chỉ dùng POS trong Main Webapp, có thể bỏ qua POS Desktop App.

Nếu cần chạy backend API:
```bash
# Kiểm tra xem có file backend server không
# Thường là local-server.js hoặc tương tự
node local-server.js
```

---

### ❌ Máy in không in

**Nguyên nhân:** IP máy in sai hoặc máy in chưa bật

**Giải pháp:**
1. Kiểm tra máy in:
```bash
ping 192.168.0.3
```

2. Nếu IP khác, sửa trong `windows-printer-server/printer-server.js`:
```javascript
const PRINTER_IP = '192.168.0.3';  // Đổi thành IP thật
```

---

## 📌 CHECKLIST HOÀN TẤT

### Trước khi bắt đầu:
- [ ] Node.js v18+ đã cài
- [ ] File `.env` đã có trong thư mục gốc
- [ ] `npm install` đã chạy thành công

### Khi chạy:
- [ ] Printer Server khởi động: http://localhost:9977
- [ ] Main Webapp khởi động: http://localhost:3000
- [ ] Đăng nhập được vào hệ thống
- [ ] POS Desktop trong webapp hoạt động
- [ ] POS Mobile trong webapp hoạt động
- [ ] Test printer in được bill (nếu có máy in)

---

## 🎉 HOÀN TẤT!

Hệ thống đã sẵn sàng chạy local với:
✅ Main Webapp (POS Desktop + Mobile + Quản lý)
✅ Kết nối Supabase Cloud (không cần local DB)
✅ Printer Server in bill qua ESC/POS
✅ POS Desktop App riêng (tùy chọn)

**Truy cập ngay:** http://localhost:3000

---

**Cập nhật:** 31/10/2025
**Version:** 2.0 - Local Development Ready

