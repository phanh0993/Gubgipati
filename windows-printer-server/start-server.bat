@echo off
echo Starting Windows Printer Server...
echo.
echo Server will run on: http://localhost:9977
echo Health check: http://localhost:9977/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Chạy server
node server.js

pause
