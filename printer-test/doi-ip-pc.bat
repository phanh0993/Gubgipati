@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════════════
echo 🔧 ĐỔI IP PC ĐỂ KẾT NỐI MÁY IN
echo ═══════════════════════════════════════════════════════════
echo.
echo 📋 Thông tin máy in:
echo    IP: 192.168.2.234
echo    Subnet: 192.168.2.x
echo    Gateway: 192.168.2.1
echo.
echo 💻 PC hiện tại: 192.168.1.x
echo.
echo ⚠️  CẢNH BÁO: Script này sẽ đổi IP PC sang 192.168.2.100
echo    Bạn cần chạy với quyền Administrator!
echo.
pause

echo.
echo 🔍 Đang kiểm tra adapter mạng...
netsh interface show interface
echo.

set /p ADAPTER="Nhập tên adapter (ví dụ: Ethernet hoặc Wi-Fi): "

echo.
echo 📝 Đang đổi IP PC...
echo    IP mới: 192.168.2.100
echo    Subnet Mask: 255.255.255.0
echo    Gateway: 192.168.2.1
echo.

netsh interface ip set address "%ADAPTER%" static 192.168.2.100 255.255.255.0 192.168.2.1

if %errorlevel% equ 0 (
    echo.
    echo ✅ Đã đổi IP thành công!
    echo.
    echo 🔍 Đang kiểm tra IP mới...
    ipconfig | findstr /i "IPv4"
    echo.
    echo 🧪 Đang test ping máy in...
    ping -n 4 192.168.2.234
    echo.
    echo ✅ Hoàn tất! Bạn có thể test kết nối máy in.
) else (
    echo.
    echo ❌ Lỗi khi đổi IP!
    echo    Vui lòng chạy lại với quyền Administrator.
    echo    Click chuột phải vào file → Run as administrator
)

echo.
pause















