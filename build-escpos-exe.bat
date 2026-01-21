@echo off
echo Building ESC/POS Test Server as executable...
echo.

REM Check if pkg is installed
where pkg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing pkg globally...
    npm install -g pkg
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install pkg
        echo Please install Node.js and npm first
        pause
        exit /b 1
    )
)

echo Building executable...
pkg escpos-test-server.js --targets node18-win-x64 --output escpos-test-server.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo 📁 File created: escpos-test-server.exe
    echo.
    echo 🚀 To run: Double-click escpos-test-server.exe
    echo 📡 Server will run on port 9978
    echo.
) else (
    echo.
    echo ❌ Build failed!
    echo Please check the error messages above
    echo.
)

pause
