@echo off
chcp 65001 >nul
cls

:: Chuyen den thu muc chua script nay
cd /d "%~dp0"

echo ============================================================
echo   GUBGIPATI - KHOI DONG CHO MANG (NETWORK)
echo   Cho phep truy cap tu cac may khac cung WiFi
echo ============================================================
echo.
echo Thu muc du an: %CD%
echo.

:: Kill processes cu
echo [0/4] Don dep...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9977') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Xong!
echo.

:: Khoi dong Backend
echo [1/4] Khoi dong Backend API (Port 8000)...
start "Backend API" cmd /k "cd /d %CD% && node simple-backend-server.js"
timeout /t 3 /nobreak >nul
echo    http://localhost:8000
echo.

:: Khoi dong Printer Server
echo [2/4] Khoi dong Printer Server (Port 9977)...
start "Printer Server" cmd /k "cd /d %CD%\windows-printer-server && node printer-server.js"
timeout /t 3 /nobreak >nul
echo    http://localhost:9977
echo.

:: Tim IP may nay
echo [3/4] Tim IP may nay...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
set IP=%IP:~1%
echo    IP may nay: %IP%
echo.

:: Khoi dong React voi HOST=0.0.0.0
echo [4/4] Khoi dong React Webapp (Network mode)...
echo    Cho phep truy cap tu mang
start "React Webapp - Network" cmd /k "cd /d %CD% && set HOST=0.0.0.0 && npm start"
timeout /t 5 /nobreak >nul
echo.

echo ============================================================
echo.
echo HE THONG DA KHOI DONG!
echo.
echo Truy cap tu may nay:
echo    http://localhost:3000
echo.
echo Truy cap tu may KHAC cung WiFi:
echo    http://%IP%:3000
echo.
echo Tren dien thoai:
echo    1. Ket noi cung WiFi
echo    2. Mo browser
echo    3. Vao: http://%IP%:3000
echo.
echo Dang nhap:
echo    - PC: admin / admin123
echo    - Mobile: Dung tai khoan nhan vien
echo.
echo LUU Y:
echo    - Firewall Windows co the chan, can allow
echo    - May khac phai cung WiFi
echo    - Backend chi chay tren may nay (localhost:8000)
echo.
pause
