# HƯỚNG DẪN KHỞI ĐỘNG HỆ THỐNG SAPO

## 📋 Tổng quan

Hệ thống SAPO bao gồm 3 services chính:
1. **Backend API** (port 8000) - Xử lý đăng nhập
2. **Printer Server** (port 9000) - Xử lý in bill
3. **React Webapp** (port 3000) - Giao diện người dùng

## 🚀 Các cách khởi động

### 1. Khởi động với cửa sổ CMD hiển thị

**File:** `START-FINAL.bat`

- Double-click vào file `START-FINAL.bat`
- Các cửa sổ CMD sẽ hiển thị để theo dõi log
- Phù hợp cho việc debug hoặc kiểm tra lỗi

**Lưu ý:** 
- Chờ 30-60 giây để React compile xong
- Khi thấy "Compiled successfully!" mới truy cập webapp

### 2. Khởi động chạy ngầm (không hiện CMD)

**File:** `START-FINAL-HIDDEN.vbs`

- Double-click vào file `START-FINAL-HIDDEN.vbs`
- Hệ thống sẽ chạy ngầm, không hiện cửa sổ CMD
- Phù hợp cho việc sử dụng hàng ngày

**Lưu ý:**
- Log được ghi vào các file:
  - `backend.log` - Log của Backend API
  - `printer-server.log` - Log của Printer Server
  - `react-app.log` - Log của React Webapp
  - `system-startup.log` - Log khởi động hệ thống

### 3. Tạo shortcut trên Desktop

**File:** `CREATE-SHORTCUT.bat` hoặc `CREATE-SHORTCUT.ps1`

- Chạy file `CREATE-SHORTCUT.bat` (hoặc `.ps1`)
- Shortcut "SAPO - NEW" sẽ được tạo trên Desktop
- Double-click vào shortcut để khởi động hệ thống

### 4. Khởi động cùng Windows

**File:** `SETUP-AUTO-START.vbs`

- Chạy file `SETUP-AUTO-START.vbs`
- Hệ thống sẽ tự động khởi động khi đăng nhập Windows
- Shortcut được tạo trong Startup folder

**Để tắt tự động khởi động:**
- Xóa shortcut "SAPO - Auto Start.lnk" trong Startup folder
- Hoặc chạy file `REMOVE-AUTO-START.vbs` (nếu có)

## 🌐 Truy cập hệ thống

Sau khi khởi động thành công:

1. **React Webapp:** http://localhost:3000
   - Sẽ tự động chuyển đến `/pos-login`

2. **Backend API:** http://localhost:8000
   - Health check: http://localhost:8000/health

3. **Printer Server:** http://localhost:9000
   - Chỉ dùng nội bộ, không cần truy cập trực tiếp

## 🔐 Thông tin đăng nhập

- **Username:** `admin`
- **Password:** `admin123`

## ⚠️ Lưu ý quan trọng

1. **Port đã sử dụng:**
   - Port 3000: React Webapp
   - Port 8000: Backend API
   - Port 9000: Printer Server

2. **Nếu port bị chiếm:**
   - Script sẽ tự động kill process cũ
   - Nếu vẫn lỗi, kiểm tra xem có ứng dụng khác đang dùng port không

3. **Thời gian khởi động:**
   - Backend API: ~3 giây
   - Printer Server: ~3 giây
   - React Webapp: 30-60 giây (compile lần đầu)

4. **Kiểm tra log:**
   - Nếu chạy ngầm, xem log trong các file `.log`
   - Nếu chạy với CMD, xem trực tiếp trong cửa sổ

## 🛠️ Troubleshooting

### Lỗi: Port đã được sử dụng

**Giải pháp:**
```batch
# Kill process trên port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Tương tự cho port 8000 và 9000
```

### Lỗi: React không compile

**Giải pháp:**
- Kiểm tra `react-app.log` để xem lỗi chi tiết
- Đảm bảo đã cài đặt dependencies: `npm install`
- Xóa `node_modules` và cài lại nếu cần

### Lỗi: Backend không khởi động

**Giải pháp:**
- Kiểm tra `backend.log` để xem lỗi chi tiết
- Đảm bảo file `.env` có đầy đủ thông tin Supabase
- Kiểm tra kết nối internet

## 📝 File cấu hình

- `.env` - Cấu hình Supabase và các biến môi trường
- `package.json` - Dependencies và scripts
- `simple-backend-server.js` - Backend API server
- `windows-printer-server/printer-server.js` - Printer server

## 🎯 Tóm tắt

1. **Khởi động nhanh:** Double-click `START-FINAL-HIDDEN.vbs`
2. **Tạo shortcut:** Chạy `CREATE-SHORTCUT.bat`
3. **Tự động khởi động:** Chạy `SETUP-AUTO-START.vbs`
4. **Truy cập:** http://localhost:3000
5. **Đăng nhập:** admin / admin123

---

**Chúc bạn sử dụng tốt! 🎉**


