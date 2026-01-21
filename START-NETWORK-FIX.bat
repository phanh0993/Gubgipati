@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     GUBGIPATI - KHỞI ĐỘNG CHO MẠNG (NETWORK)        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: Kill processes cũ
echo [0/4] 🧹 Dọn dẹp...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9977') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo    ✅ Xong!
echo.

:: Tạo file .env.local tạm thời
echo [1/4] ⚙️  Cấu hình network mode...
(
echo DANGEROUSLY_DISABLE_HOST_CHECK=true
echo REACT_APP_API_URL=http://localhost:8000
echo REACT_APP_SUPABASE_URL=%REACT_APP_SUPABASE_URL%
echo REACT_APP_SUPABASE_ANON_KEY=%REACT_APP_SUPABASE_ANON_KEY%
) > .env.local
echo    ✅ Đã tạo .env.local
echo.

:: Khởi động Backend
echo [2/4] 🔧 Backend API...
start "Backend API" cmd /k "node simple-backend-server.js"
timeout /t 3 /nobreak >nul
echo    ✅ http://localhost:8000
echo.

:: Khởi động Printer
echo [3/4] 🖨️  Printer Server...
start "Printer Server" cmd /k "cd windows-printer-server && node printer-server.js"
timeout /t 3 /nobreak >nul
echo    ✅ http://localhost:9977
echo.

:: Tìm IP
echo [4/4] 🔍 Tìm IP máy này...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo    📡 IP: %IP%
echo.

:: Khởi động React
echo 🌐 Khởi động React...
start "React - Network" cmd /k "npm start"
echo.

echo ═══════════════════════════════════════════════════════
echo.
echo ✅ ĐÃ KHỞI ĐỘNG!
echo.
echo 📡 Truy cập:
echo    - Máy này: http://localhost:3000
echo    - Máy khác: http://%IP%:3000
echo.
echo 📱 Trên điện thoại:
echo    http://%IP%:3000/mobile-login
echo.
echo ⚠️  Nếu không truy cập được:
echo    1. Tắt firewall Windows
echo    2. Đảm bảo cùng WiFi
echo    3. Ping %IP% từ điện thoại
echo.
pause

