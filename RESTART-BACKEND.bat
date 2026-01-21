@echo off
chcp 65001 >nul
cls

:: Chuyen den thu muc chua script nay
cd /d "%~dp0"

echo ============================================================
echo   RESTART BACKEND SERVER
echo ============================================================
echo.
echo Thu muc du an: %CD%
echo.

echo Dang kill backend cu (port 8000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Da kill xong!
echo.

echo Khoi dong backend moi...
start "Backend API (Port 8000)" cmd /k "cd /d %CD% && node simple-backend-server.js"
timeout /t 3 /nobreak >nul
echo.

echo ============================================================
echo Backend da restart!
echo.
echo Kiem tra: http://localhost:8000/health
echo Thu login lai tai: http://localhost:3000
echo.
echo    Username: admin
echo    Password: admin123
echo.
pause
