@echo off
echo Building Windows Printer Server...

REM Cài đặt dependencies
echo Installing dependencies...
npm install

REM Build exe
echo Building executable...
npx pkg server.js --targets node18-win-x64 --output printer-server.exe

REM Tạo thư mục dist
if not exist dist mkdir dist

REM Copy files
copy printer-server.exe dist\
copy README.md dist\
copy package.json dist\

echo Build completed!
echo Executable: dist/printer-server.exe
pause
