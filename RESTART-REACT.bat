@echo off
chcp 65001 >nul
cls

:: Chuyen den thu muc chua script nay
cd /d "%~dp0"

echo ============================================================
echo   RESTART REACT WEBAPP
echo ============================================================
echo.
echo Thu muc du an: %CD%
echo.

echo Dang kill React cu (port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 echo    Da kill process PID %%a
)
timeout /t 2 /nobreak >nul
echo.

echo Khoi dong React moi...
echo    Cho compile (30-60 giay)...
echo.
start "React Webapp (Port 3000)" cmd /k "cd /d %CD% && npm start"

echo ============================================================
echo React dang khoi dong!
echo.
echo Cho 30-60 giay de compile xong
echo    Xem cua so "React Webapp" cho log
echo.
echo Sau do vao: http://localhost:3000
echo Login: admin / admin123
echo.
echo Kiem tra console (F12) phai thay:
echo    USE_SUPABASE: true <- QUAN TRONG!
echo.
pause
