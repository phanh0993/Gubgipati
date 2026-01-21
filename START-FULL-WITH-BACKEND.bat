@echo off
chcp 65001 >nul
cls

:: Chuyển đến thư mục chứa script này
cd /d "%~dp0"

echo ╔════════════════════════════════════════════════════════╗
echo ║     GUBGIPATI - KHỞI ĐỘNG ĐẦY ĐỦ (FULL SYSTEM)      ║
echo ║     Backend API + Printer Server + React Webapp      ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📁 Thư mục dự án: %CD%
echo.

:: Bước 0: Kill processes cũ
echo [Bước 0/4] 🧹 Dọn dẹp processes cũ...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F >nul 2>&1

timeout /t 2 /nobreak >nul
echo    ✅ Đã dọn dẹp xong!
echo.

:: Bước 1: Khởi động Backend API (Port 8000)
echo [Bước 1/4] 🔧 Khởi động Backend API...
start "Backend API (Port 8000)" cmd /k "cd /d %CD% && node simple-backend-server.js"
timeout /t 3 /nobreak >nul
echo    ✅ Backend API đang chạy tại http://localhost:8000
echo.

:: Bước 2: Khởi động Printer Server (Port 9000)
echo [Bước 2/4] 🖨️  Khởi động Printer Server...
start "Printer Server (Port 9000)" cmd /k "cd /d %CD%\windows-printer-server && node printer-server.js"
timeout /t 3 /nobreak >nul
echo    ✅ Printer Server đang chạy tại http://localhost:9000
echo.

:: Bước 3: Khởi động React Webapp (Port 3000)
echo [Bước 3/4] 🌐 Khởi động React Webapp...
start "React Webapp (Port 3000)" cmd /k "cd /d %CD% && npm start"
echo    ⏳ Đang compile React... (chờ 30-60 giây)
echo.

:: Bước 4: Hoàn tất
echo [Bước 4/4] ✅ HOÀN TẤT KHỞI ĐỘNG!
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo 🎉 HỆ THỐNG ĐÃ KHỞI ĐỘNG ĐẦY ĐỦ!
echo.
echo 📡 Các service đang chạy:
echo    1. Backend API:    http://localhost:8000
echo    2. Printer Server: http://localhost:9000
echo    3. React Webapp:   http://localhost:3000 (chờ compile)
echo.
echo ⏰ Chờ thêm 30-60 giây để React compile xong
echo    Xem cửa sổ "React Webapp" để biết khi nào "Compiled successfully!"
echo.
echo 📱 Sau đó truy cập:
echo    👉 http://localhost:3000
echo.
echo 🔐 Đăng nhập mặc định:
echo    - Username: admin
echo    - Password: admin123
echo.
echo 💡 Lưu ý:
echo    - Tất cả 3 cửa sổ CMD phải giữ mở
echo    - Đảm bảo file .env đã tồn tại
echo    - Máy in POS-80C: IP 192.168.0.3 (nếu cần in bill)
echo.
echo 🎯 Kiểm tra Backend API:
echo    Mở browser: http://localhost:8000/health
echo    Phải thấy: {"status":"OK",...}
echo.
pause

