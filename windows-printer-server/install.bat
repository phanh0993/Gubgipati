@echo off
echo ========================================
echo   Windows Printer Server Installer
echo ========================================
echo.

REM Tạo thư mục cài đặt
set INSTALL_DIR=%USERPROFILE%\PrinterServer
echo Creating installation directory: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copy files
echo Copying files...
copy printer-server.exe "%INSTALL_DIR%\"
copy README.md "%INSTALL_DIR%\"
copy package.json "%INSTALL_DIR%\"

REM Tạo desktop shortcut
echo Creating desktop shortcut...
set DESKTOP=%USERPROFILE%\Desktop
echo [InternetShortcut] > "%DESKTOP%\Printer Server.url"
echo URL=file:///%INSTALL_DIR%/printer-server.exe >> "%DESKTOP%\Printer Server.url"
echo IconFile=%INSTALL_DIR%/printer-server.exe >> "%DESKTOP%\Printer Server.url"
echo IconIndex=0 >> "%DESKTOP%\Printer Server.url"

REM Tạo start menu shortcut
echo Creating start menu shortcut...
set START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs
if not exist "%START_MENU%\Printer Server" mkdir "%START_MENU%\Printer Server"
copy printer-server.exe "%START_MENU%\Printer Server\"

echo.
echo ========================================
echo   Installation Completed!
echo ========================================
echo.
echo Files installed to: %INSTALL_DIR%
echo Desktop shortcut created
echo Start menu shortcut created
echo.
echo To start the server:
echo   1. Double-click "Printer Server" on desktop
echo   2. Or run: %INSTALL_DIR%\printer-server.exe
echo.
echo Server will run on: http://localhost:9977
echo.
pause
