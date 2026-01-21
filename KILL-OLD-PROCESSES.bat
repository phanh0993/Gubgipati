@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     GUBGIPATI - ĐÓNG CÁC PROCESS CŨ                  ║
echo ║     Kill processes đang chiếm port 3000 và 9977      ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 🔍 Đang kiểm tra các port đang sử dụng...
echo.

:: Kill process trên port 3000 (React Webapp)
echo [1/2] 🔴 Kiểm tra port 3000 (React Webapp)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    set pid=%%a
    if defined pid (
        echo       Tìm thấy process PID: %%a đang chiếm port 3000
        taskkill /PID %%a /F >nul 2>&1
        if errorlevel 1 (
            echo       ⚠️  Không thể kill PID %%a (có thể đã đóng)
        ) else (
            echo       ✅ Đã kill process PID: %%a
        )
    )
)
echo.

:: Kill process trên port 9977 (Printer Server)
echo [2/2] 🔴 Kiểm tra port 9977 (Printer Server)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9977') do (
    set pid=%%a
    if defined pid (
        echo       Tìm thấy process PID: %%a đang chiếm port 9977
        taskkill /PID %%a /F >nul 2>&1
        if errorlevel 1 (
            echo       ⚠️  Không thể kill PID %%a (có thể đã đóng)
        ) else (
            echo       ✅ Đã kill process PID: %%a
        )
    )
)
echo.

:: Kill process trên port 8000 (Backend API - nếu có)
echo [3/3] 🔴 Kiểm tra port 8000 (Backend API)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    set pid=%%a
    if defined pid (
        echo       Tìm thấy process PID: %%a đang chiếm port 8000
        taskkill /PID %%a /F >nul 2>&1
        if errorlevel 1 (
            echo       ⚠️  Không thể kill PID %%a (có thể đã đóng)
        ) else (
            echo       ✅ Đã kill process PID: %%a
        )
    )
)
echo.

:: Kill tất cả node.exe process (tùy chọn - cẩn thận!)
echo [4/4] 🔴 Kill tất cả Node.js processes (tùy chọn)...
echo       ⚠️  Bạn có muốn kill TẤT CẢ node.exe processes không?
choice /C YN /N /M "       Nhấn Y (Có) hoặc N (Không): "
if errorlevel 2 goto skip_node_kill
if errorlevel 1 goto do_node_kill

:do_node_kill
echo       Đang kill tất cả node.exe...
taskkill /IM node.exe /F >nul 2>&1
if errorlevel 1 (
    echo       ℹ️  Không có node.exe nào đang chạy
) else (
    echo       ✅ Đã kill tất cả node.exe processes
)
goto end_node_kill

:skip_node_kill
echo       ⏭️  Bỏ qua kill node.exe

:end_node_kill
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo ✅ Hoàn tất! Các port đã được giải phóng.
echo.
echo 💡 Bây giờ bạn có thể chạy:
echo    - START-FULL-SYSTEM.bat (để khởi động lại hệ thống)
echo    - npm start (để chạy webapp)
echo.
pause

