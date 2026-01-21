@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    CAP NHAT DANH SACH BAN MOI
echo ========================================
echo.

echo Dang chay script cap nhat ban...
node update-tables-list.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    CAP NHAT THANH CONG!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo    CO LOI XAY RA!
    echo ========================================
)

echo.
pause
















