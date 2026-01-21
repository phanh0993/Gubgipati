@echo off
echo Starting ESC/POS RAW Test Server...
echo.
echo This server provides endpoints to test ESC/POS RAW printing
echo without Windows driver margins.
echo.
echo Server will run on port 9978
echo Health check: http://localhost:9978/health
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Or add Node.js to your system PATH
    echo.
    echo Alternative: Run this command manually:
    echo   node windows-printer-server/escpos-raw-server.js
    echo.
    pause
    exit /b 1
)

echo Node.js found, starting server...
node windows-printer-server/escpos-raw-server.js

pause
