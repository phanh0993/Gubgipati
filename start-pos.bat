@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     GUBGIPATI - KHỞI ĐỘNG HOÀN CHỈNH (FINAL)        ║
echo ║     Backend + Printer + React (Supabase Direct)      ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: Kill processes cũ
echo [0/3] 🧹 Dọn dẹp processes cũ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9977') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo    ✅ Đã dọn dẹp!
echo.

:: Khởi động Backend (chỉ cho login)
echo [1/3] 🔧 Khởi động Backend API (chỉ xử lý login)...
start "Backend API - Login Only" cmd /k "node simple-backend-server.js"
timeout /t 3 /nobreak >nul
echo    ✅ Backend: http://localhost:8000
echo.

:: Khởi động Printer Server
echo [2/3] 🖨️  Khởi động Printer Server...
start "Printer Server" cmd /k "cd windows-printer-server && node printer-server.js"
timeout /t 3 /nobreak >nul
echo    ✅ Printer: http://localhost:9977
echo.

:: Khởi động React Webapp
echo [3/3] 🌐 Khởi động React Webapp...
echo    💡 Webapp sẽ dùng SUPABASE TRỰC TIẾP cho data
echo    💡 Backend API chỉ xử lý login
start "React Webapp - Supabase Direct" cmd /k "npm start"
echo    ⏳ Đang compile... (30-60 giây)
echo.

echo ═══════════════════════════════════════════════════════
echo.
echo ✅ HỆ THỐNG ĐÃ KHỞI ĐỘNG ĐẦY ĐỦ!
echo.
echo 📡 Services:
echo    1. Backend API:    http://localhost:8000 (Login only)
echo    2. Printer Server: http://localhost:9977 (In bill)
echo    3. React Webapp:   http://localhost:3000 (Chờ compile...)
echo.
echo 🗄️  Database:
echo    → Supabase Cloud (trực tiếp, không qua backend)
echo.
echo ⏰ QUAN TRỌNG:
echo    - Chờ 30-60 giây để React compile xong
echo    - Xem cửa sổ "React Webapp" cho log
echo    - Khi thấy "Compiled successfully!" mới vào webapp
echo.
echo 🌐 Truy cập:
echo    http://localhost:3000
echo.
echo 🔐 Đăng nhập:
echo    Username: admin
echo    Password: admin123
echo.
echo 🔍 Kiểm tra Console (F12):
echo    Phải thấy: USE_SUPABASE: true ✅
echo.
echo 🎉 Chúc bạn sử dụng tốt!
echo.
pause

