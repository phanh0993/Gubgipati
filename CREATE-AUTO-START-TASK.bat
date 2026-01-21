@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║  TẠO TASK TỰ ĐỘNG CHẠY KHI WINDOWS KHỞI ĐỘNG        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📋 Script này sẽ tạo Task Scheduler để tự động chạy
echo    START-FINAL.bat khi Windows khởi động.
echo.
pause
echo.

:: Lấy đường dẫn thư mục hiện tại
set CURRENT_DIR=%~dp0
set BAT_FILE=%CURRENT_DIR%START-FINAL.bat

echo 🔧 Đang tạo scheduled task...
echo    File: %BAT_FILE%
echo.

:: Tạo task với quyền admin
schtasks /create /tn "Gubgipati Auto Start" /tr "\"%BAT_FILE%\"" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
    echo.
    echo ═══════════════════════════════════════════════════════
    echo ✅ THÀNH CÔNG!
    echo.
    echo 📌 Task "Gubgipati Auto Start" đã được tạo
    echo.
    echo 🔄 Khi nào chạy:
    echo    - Mỗi khi đăng nhập Windows
    echo    - Chạy với quyền cao nhất (Administrator)
    echo.
    echo 🛠️  Quản lý task:
    echo    1. Mở Task Scheduler (taskschd.msc)
    echo    2. Tìm "Gubgipati Auto Start"
    echo    3. Có thể Enable/Disable/Delete
    echo.
    echo 💡 Hoặc xóa task bằng lệnh:
    echo    schtasks /delete /tn "Gubgipati Auto Start" /f
    echo.
    echo ═══════════════════════════════════════════════════════
) else (
    echo.
    echo ❌ LỖI! Không tạo được task.
    echo 💡 Hãy chạy file này với quyền Administrator
    echo    (Chuột phải → Run as administrator)
    echo.
)
echo.
pause

