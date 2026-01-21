@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════════════
echo 🔄 ĐỔI IP PC VỀ DHCP (Tự động)
echo ═══════════════════════════════════════════════════════════
echo.
echo ⚠️  Script này sẽ đổi IP PC về chế độ tự động (DHCP)
echo    Bạn cần chạy với quyền Administrator!
echo.
pause

echo.
echo 🔍 Đang kiểm tra adapter mạng...
netsh interface show interface
echo.

set /p ADAPTER="Nhập tên adapter (ví dụ: Ethernet hoặc Wi-Fi): "

echo.
echo 📝 Đang đổi IP về DHCP...
echo.

netsh interface ip set address "%ADAPTER%" dhcp
netsh interface ip set dns "%ADAPTER%" dhcp

if %errorlevel% equ 0 (
    echo.
    echo ✅ Đã đổi IP về DHCP thành công!
    echo.
    echo 🔍 Đang kiểm tra IP mới...
    ipconfig | findstr /i "IPv4"
) else (
    echo.
    echo ❌ Lỗi khi đổi IP!
    echo    Vui lòng chạy lại với quyền Administrator.
)

echo.
pause















