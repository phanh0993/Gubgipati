# 🚀 HƯỚNG DẪN KHỞI ĐỘNG HỆ THỐNG SAPO

## 📋 Tổng quan

Hệ thống SAPO bao gồm 2 thành phần chính:
1. **React App** (Frontend) - Chạy trên port 3000
2. **Printer Server** - Chạy trên port 9977

## 🎯 Cách sử dụng

### Cách 1: Sử dụng Shortcut (Khuyến nghị)

1. Tìm shortcut **"SAPO - NEW"** trên Desktop
2. Double-click vào shortcut
3. Hệ thống sẽ tự động khởi động tất cả services (chạy ngầm)
4. Đợi vài giây để hệ thống khởi động hoàn tất
5. Truy cập: **http://localhost:3000**

### Cách 2: Sử dụng PowerShell Script

1. Mở PowerShell tại thư mục dự án
2. Chạy lệnh:
   ```powershell
   powershell -ExecutionPolicy Bypass -File start-system.ps1
   ```

## 🛑 Dừng hệ thống

### Cách 1: Sử dụng PowerShell Script

1. Mở PowerShell tại thư mục dự án
2. Chạy lệnh:
   ```powershell
   powershell -ExecutionPolicy Bypass -File stop-system.ps1
   ```

### Cách 2: Dừng thủ công

1. Mở Task Manager (Ctrl + Shift + Esc)
2. Tìm các process:
   - `node.exe` (React App và Printer Server)
   - `npm.exe` (nếu có)
3. End Task các process này

## 📁 Các file quan trọng

- **start-system.ps1** - Script khởi động hệ thống
- **stop-system.ps1** - Script dừng hệ thống
- **system.log** - File log hệ thống
- **react-app.log** - File log React App
- **printer-server.log** - File log Printer Server

## ⚠️ Lưu ý

1. **Lần đầu chạy**: Nếu chưa cài đặt dependencies, script sẽ tự động chạy `npm install`
2. **Port đã được sử dụng**: Nếu port 3000 hoặc 9977 đã được sử dụng, script sẽ báo cảnh báo
3. **Chạy ngầm**: Tất cả services chạy ngầm, không hiện cửa sổ CMD
4. **Log files**: Tất cả log được ghi vào các file tương ứng trong thư mục dự án

## 🔧 Xử lý lỗi

### Lỗi: "Execution Policy"

Nếu gặp lỗi về Execution Policy, chạy lệnh sau trong PowerShell (Run as Administrator):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Lỗi: Port đã được sử dụng

1. Kiểm tra process đang sử dụng port:
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :9977
   ```
2. Dừng process đó hoặc chạy `stop-system.ps1`

### Lỗi: Không tìm thấy node_modules

Script sẽ tự động chạy `npm install` nếu thiếu node_modules.

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra các file log:
- `system.log` - Log tổng quát
- `react-app.log` - Log React App
- `printer-server.log` - Log Printer Server
- `react-app-error.log` - Lỗi React App
- `printer-server-error.log` - Lỗi Printer Server

---

**Chúc bạn sử dụng hệ thống thành công! 🎉**














