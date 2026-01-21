@echo off
chcp 65001 >nul

:: Chuyển đến thư mục chứa script này
cd /d "%~dp0"

:: Ghi log
echo [%date% %time%] Bắt đầu khởi động hệ thống... >> system-startup.log

:: Kill processes cũ
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo [%date% %time%] Đã dọn dẹp processes cũ >> system-startup.log

:: Khởi động Backend (chỉ cho login) - CHẠY NGẦM
start /B "" node simple-backend-server.js > backend.log 2>&1
timeout /t 3 /nobreak >nul
echo [%date% %time%] Backend API đã khởi động (port 8000) >> system-startup.log

:: Khởi động Printer Server - CHẠY NGẦM
cd /d "%~dp0windows-printer-server"
start /B "" node printer-server.js > ..\printer-server.log 2>&1
cd /d "%~dp0"
timeout /t 3 /nobreak >nul
echo [%date% %time%] Printer Server đã khởi động (port 9000) >> system-startup.log

:: Khởi động React Webapp - CHẠY NGẦM
cd /d "%~dp0"
start /B "" cmd /c "npm start > react-app.log 2>&1"
timeout /t 5 /nobreak >nul
echo [%date% %time%] React Webapp đã khởi động (port 3000) >> system-startup.log

echo [%date% %time%] Hệ thống đã khởi động đầy đủ! >> system-startup.log
