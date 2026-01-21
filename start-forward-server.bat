@echo off
echo ==== Khởi động ESC/POS Forward Server ====
cd /d "%~dp0"
escpos-forward-server.exe
pause
