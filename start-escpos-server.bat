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
node windows-printer-server/escpos-raw-server.js

pause
