@echo off
chcp 65001 >nul
cls

:: Chuyen den thu muc chua script nay
cd /d "%~dp0"

echo ============================================================
echo   CAP NHAT DANH SACH MAY IN LEN DATABASE
echo ============================================================
echo.
echo Thu muc du an: %CD%
echo.

echo Dang cap nhat danh sach may in...
echo.

node update-printers-database.js

echo.
echo ============================================================
echo.
pause
