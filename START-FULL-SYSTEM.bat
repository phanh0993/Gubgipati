@echo off
chcp 65001 >nul
cls

:: Chuyển đến thư mục chứa script này
cd /d "%~dp0"

echo ╔════════════════════════════════════════════════════════╗
echo ║     GUBGIPATI - HỆ THỐNG QUẢN LÝ NHÀ HÀNG            ║
echo ║     Khởi động đầy đủ: Webapp + Printer Server       ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📁 Thư mục dự án: %CD%
echo.
echo 📌 Hệ thống sẽ khởi động:
echo    1. Printer Server (localhost:9000) - In bill ESC/POS
echo    2. React Webapp (localhost:3000) - Giao diện quản lý
echo.
echo ⏳ Đang khởi động...
echo.

:: Khởi động Printer Server trong cửa sổ mới
echo [1/2] 🖨️  Khởi động Printer Server...
start "Printer Server (Port 9000)" cmd /k "cd /d %CD%\windows-printer-server && node printer-server.js"
timeout /t 3 /nobreak >nul

:: Khởi động React Webapp
echo [2/2] 🌐 Khởi động React Webapp...
start "React Webapp (Port 3000)" cmd /k "cd /d %CD% && npm start"

echo.
echo ✅ Hệ thống đang khởi động!
echo.
echo 📡 Truy cập:
echo    - Webapp: http://localhost:3000
echo    - Printer API: http://localhost:9000
echo.
echo 🔐 Đăng nhập mặc định:
echo    - Username: admin
echo    - Password: admin123
echo.
echo 💡 Lưu ý:
echo    - Đảm bảo máy in POS-80C đã bật (IP: 192.168.0.3)
echo    - Kết nối database Supabase qua .env
echo.
pause

