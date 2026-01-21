@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     TẠO SHORTCUT TRÊN DESKTOP - SAPO                  ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: Lấy đường dẫn thư mục hiện tại
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=SAPO - NEW.lnk"
set "SHORTCUT_PATH=%DESKTOP%\%SHORTCUT_NAME%"

echo Đang tạo shortcut trên desktop...
echo Đường dẫn: %SHORTCUT_PATH%
echo.

:: Tạo shortcut bằng PowerShell
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'wscript.exe'; $Shortcut.Arguments = '\"%SCRIPT_DIR%START-FINAL-HIDDEN.vbs\"'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'Khởi động hệ thống SAPO'; $Shortcut.IconLocation = 'wscript.exe,0'; $Shortcut.Save()"

if exist "%SHORTCUT_PATH%" (
    echo ✅ Đã tạo shortcut thành công!
    echo    Tên: %SHORTCUT_NAME%
    echo    Vị trí: %DESKTOP%
    echo.
    echo 💡 Double-click vào shortcut để khởi động hệ thống
) else (
    echo ❌ Lỗi: Không thể tạo shortcut
)

echo.
pause







