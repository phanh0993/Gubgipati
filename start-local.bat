@echo off

:: Chuyển đến thư mục chứa script này
cd /d "%~dp0"

echo 🚀 Starting JULY SPA Management System...
echo.
echo 📁 Thư mục dự án: %CD%
echo.

echo 📋 Checking environment files...
if not exist .env (
    echo ❌ .env file not found!
    echo Please copy content from local-env.txt to .env
    pause
    exit /b 1
)

if not exist server\.env (
    echo ❌ server\.env file not found!
    echo Please copy content from server-env.txt to server\.env
    pause
    exit /b 1
)

echo ✅ Environment files found
echo.

echo 🗄️ Setting up database...
node setup-database.js
if %errorlevel% neq 0 (
    echo ❌ Database setup failed!
    pause
    exit /b 1
)

echo.
echo 🎉 Starting application...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo.
echo Press Ctrl+C to stop
echo.

npm run dev

