@echo off
title System Status Check
color 0E

echo.
echo ========================================
echo    SYSTEM STATUS CHECK
echo ========================================
echo.

echo [1/3] Checking Backend Server...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend Server: RUNNING (http://localhost:8000)
) else (
    echo ❌ Backend Server: NOT RUNNING
)

echo.
echo [2/3] Checking Frontend App...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend App: RUNNING (http://localhost:3000)
) else (
    echo ❌ Frontend App: NOT RUNNING
)

echo.
echo [3/3] Checking Database Data...
curl -s http://localhost:8000/tables >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Database: CONNECTED with data
) else (
    echo ❌ Database: CONNECTION FAILED
)

echo.
echo ========================================
echo    QUICK ACCESS LINKS
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🍽️ Restaurant POS: http://localhost:3000/restaurant-pos
echo 📊 Backend API: http://localhost:8000
echo 🔍 Health Check: http://localhost:8000/health
echo.
echo 📋 Login Credentials:
echo    Username: admin
echo    Password: admin123
echo.

echo Press any key to open the application...
pause >nul
start http://localhost:3000

