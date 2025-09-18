@echo off
title JULY Restaurant Management System
color 0A

echo.
echo ========================================
echo    JULY RESTAURANT MANAGEMENT SYSTEM
echo ========================================
echo.

echo [1/4] Checking environment...
if not exist .env (
    echo Creating .env file...
    copy local-env.txt .env
) else (
    echo .env file exists ✓
)

if not exist server\.env (
    echo Creating server\.env file...
    copy server-env.txt server\.env
) else (
    echo server\.env file exists ✓
)

echo.
echo [2/4] Installing dependencies...
call npm install --silent

echo.
echo [3/4] Setting up database...
node restaurant-database-setup.js

echo.
echo [4/4] Starting servers...
echo.
echo 🚀 Backend Server: http://localhost:8000
echo 🌐 Frontend App: http://localhost:3000
echo 🍽️ Restaurant POS: http://localhost:3000/restaurant-pos
echo.
echo 📋 Default Login:
echo    Username: admin
echo    Password: admin123
echo.
echo ⚠️  Keep this window open while using the system
echo.

start "Backend Server" cmd /k "node restaurant-api-server.js"
timeout /t 3 /nobreak >nul
start "Frontend App" cmd /k "npm run client"

echo.
echo ✅ System started successfully!
echo Press any key to open the application...
pause >nul

start http://localhost:3000

