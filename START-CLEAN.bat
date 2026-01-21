@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     GUBGIPATI - KHỞI ĐỘNG SẠCH (CLEAN START)        ║
echo ║     Tự động kill processes cũ và khởi động lại      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: Bước 1: Kill các process cũ
echo [Bước 1/3] 🧹 Dọn dẹp processes cũ...
echo.

echo    🔴 Kill port 3000 (React Webapp)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 echo       ✅ Đã kill PID %%a
)

echo    🔴 Kill port 9977 (Printer Server)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9977') do (
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 echo       ✅ Đã kill PID %%a
)

echo    🔴 Kill port 8000 (Backend API)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 echo       ✅ Đã kill PID %%a
)

timeout /t 2 /nobreak >nul
echo.
echo    ✅ Hoàn tất dọn dẹp!
echo.

:: Bước 2: Khởi động Printer Server
echo [Bước 2/3] 🖨️  Khởi động Printer Server...
start "Printer Server (Port 9977)" cmd /k "cd windows-printer-server && node printer-server.js"
timeout /t 3 /nobreak >nul
echo    ✅ Printer Server đang chạy tại http://localhost:9977
echo.

:: Bước 3: Khởi động React Webapp
echo [Bước 3/3] 🌐 Khởi động React Webapp...
start "React Webapp (Port 3000)" cmd /k "npm start"
echo    ⏳ Đang compile React... (chờ 30-60 giây)
echo.

echo ═══════════════════════════════════════════════════════
echo.
echo ✅ HỆ THỐNG ĐANG KHỞI ĐỘNG!
echo.
echo 📡 Truy cập sau 30-60 giây:
echo    - Webapp: http://localhost:3000
echo    - Printer API: http://localhost:9977
echo.
echo 🔐 Đăng nhập mặc định:
echo    - Username: admin
echo    - Password: admin123
echo.
echo 💡 Lưu ý:
echo    - Chờ thấy "Compiled successfully!" trong cửa sổ React
echo    - Đảm bảo máy in POS-80C đã bật (IP: 192.168.0.3)
echo    - Kết nối database Supabase qua .env
echo.
echo 🎉 Chúc bạn sử dụng tốt!
echo.
pause

