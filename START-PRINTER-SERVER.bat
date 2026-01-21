@echo off
chcp 65001 >nul
cls

:: Chuyen den thu muc chua script nay
cd /d "%~dp0"

echo ============================================================
echo   KHOI DONG PRINTER SERVER
echo ============================================================
echo.
echo Thu muc du an: %CD%
echo.

:: Kill process cu neu co
echo Dang kill printer server cu (port 9000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9000') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Da don dep!
echo.

:: Khoi dong Printer Server
echo Khoi dong Printer Server...
start "Printer Server (Port 9000)" cmd /k "cd /d %CD%\windows-printer-server && node printer-server.js"
timeout /t 3 /nobreak >nul
echo.

echo ============================================================
echo PRINTER SERVER DA KHOI DONG!
echo.
echo Kiem tra:
echo    http://localhost:9000/health
echo.
echo May in: 192.168.0.3:9100 (POS-80C)
echo.
echo LUU Y:
echo    - Dam bao may in POS-80C da bat
echo    - IP may in: 192.168.0.3
echo    - Port may in: 9100
echo.
pause
