# 🚀 HƯỚNG DẪN CHẠY NGẦM VÀ KHỞI ĐỘNG CÙNG WINDOWS

## 📋 Tổng quan

Đã tạo các file để chạy hệ thống SAPO ngầm (ẩn cửa sổ CMD) và khởi động cùng Windows.

## 🎯 Các file đã tạo

### 1. **START-FINAL-HIDDEN.bat**
- File BAT chạy ngầm (không hiện cửa sổ CMD)
- Sử dụng `start /B` để chạy background
- Ghi log vào file `system-startup.log`

### 2. **START-FINAL-HIDDEN.vbs**
- File VBScript wrapper để chạy BAT ngầm
- Double-click để khởi động hệ thống (không hiện cửa sổ)
- Hiển thị thông báo popup khi khởi động xong

### 3. **SETUP-AUTO-START.vbs**
- Script thiết lập khởi động cùng Windows
- Tạo shortcut trong Startup folder
- Chạy 1 lần để thiết lập

### 4. **REMOVE-AUTO-START.vbs**
- Script xóa khởi động cùng Windows
- Xóa shortcut trong Startup folder

## 🚀 Cách sử dụng

### Khởi động hệ thống ngầm (1 lần)

**Cách 1: Double-click vào file**
- `START-FINAL-HIDDEN.vbs` - Chạy ngầm, hiện thông báo

**Cách 2: Chạy trực tiếp BAT**
- `START-FINAL-HIDDEN.bat` - Chạy ngầm hoàn toàn

### Thiết lập khởi động cùng Windows

1. **Double-click vào file:** `SETUP-AUTO-START.vbs`
2. Xác nhận thông báo thành công
3. Từ lần đăng nhập Windows tiếp theo, hệ thống sẽ tự động khởi động

### Tắt khởi động cùng Windows

1. **Double-click vào file:** `REMOVE-AUTO-START.vbs`
2. Hoặc xóa thủ công shortcut trong Startup folder:
   - Nhấn `Win + R`
   - Gõ: `shell:startup`
   - Xóa file: `SAPO - Auto Start.lnk`

## 📁 File log

Tất cả log được ghi vào:
- `system-startup.log` - Log tổng quát khởi động
- `backend.log` - Log Backend API
- `printer-server.log` - Log Printer Server
- `react-app.log` - Log React App

## ⚙️ So sánh với START-FINAL.bat

| Tính năng | START-FINAL.bat | START-FINAL-HIDDEN.bat |
|-----------|----------------|------------------------|
| Hiện cửa sổ CMD | ✅ Có | ❌ Không |
| Chạy ngầm | ❌ Không | ✅ Có |
| Ghi log | ❌ Không | ✅ Có |
| Thông báo popup | ❌ Không | ✅ Có (qua VBS) |

## 🔧 Kiểm tra hệ thống đang chạy

### Kiểm tra port:
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :9977
netstat -ano | findstr :8000
```

### Kiểm tra process:
```cmd
tasklist | findstr node.exe
```

### Xem log:
- Mở file `system-startup.log` để xem log khởi động
- Mở file `backend.log`, `printer-server.log`, `react-app.log` để xem log chi tiết

## 🛑 Dừng hệ thống

### Cách 1: Sử dụng Task Manager
1. Mở Task Manager (Ctrl + Shift + Esc)
2. Tìm các process `node.exe`
3. End Task

### Cách 2: Sử dụng Command Prompt
```cmd
taskkill /F /IM node.exe
```

### Cách 3: Kill theo port
```cmd
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /PID %a /F
for /f "tokens=5" %a in ('netstat -ano ^| findstr :9977') do taskkill /PID %a /F
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8000') do taskkill /PID %a /F
```

## ⚠️ Lưu ý

1. **Lần đầu chạy**: Có thể mất 30-60 giây để React compile
2. **Khởi động cùng Windows**: Chỉ hoạt động sau khi đăng nhập Windows
3. **Log files**: Các file log sẽ tăng dần theo thời gian, có thể xóa định kỳ
4. **Quyền Admin**: Không cần quyền Admin để chạy

## 🎉 Hoàn tất!

Bây giờ bạn có thể:
- ✅ Chạy hệ thống ngầm (không hiện cửa sổ CMD)
- ✅ Thiết lập khởi động cùng Windows
- ✅ Xem log để kiểm tra trạng thái

---

**Chúc bạn sử dụng hệ thống thành công! 🚀**













