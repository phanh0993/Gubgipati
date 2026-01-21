@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║  XÓA TASK TỰ ĐỘNG KHỞI ĐỘNG                          ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo ⚠️  Script này sẽ XÓA task tự động chạy khi khởi động.
echo.
pause
echo.

schtasks /delete /tn "Gubgipati Auto Start" /f

if %errorlevel% equ 0 (
    echo.
    echo ✅ Đã xóa task "Gubgipati Auto Start"
    echo.
    echo 💡 Từ giờ sẽ không tự động chạy khi khởi động nữa.
    echo    Muốn chạy lại phải double-click START-FINAL.bat thủ công.
    echo.
) else (
    echo.
    echo ⚠️  Task không tồn tại hoặc đã bị xóa.
    echo.
)
pause

