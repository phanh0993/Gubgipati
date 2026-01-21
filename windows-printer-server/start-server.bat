@echo off
chcp 65001 >nul
cls

:: Chuyển đến thư mục chứa script này
cd /d "%~dp0"

echo ╔════════════════════════════════════════════╗
echo ║  ESC/POS PRINTER SERVER - WINDOWS         ║
echo ╚════════════════════════════════════════════╝
echo.
echo 📁 Thư mục: %CD%
echo 🚀 Đang khởi động server in...
echo.

node printer-server.js

pause
