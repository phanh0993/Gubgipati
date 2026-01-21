@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════════════╗
echo ║     KILL PORTS TỰ ĐỘNG - 3000, 9977, 8000           ║
echo ╚════════════════════════════════════════════════════════╝
echo.

:: Kill port 3000
echo 🔴 Kill port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1

:: Kill port 9977
echo 🔴 Kill port 9977...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9977') do taskkill /PID %%a /F >nul 2>&1

:: Kill port 8000
echo 🔴 Kill port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /PID %%a /F >nul 2>&1

echo.
echo ✅ Xong! Tất cả ports đã được giải phóng.
timeout /t 2 /nobreak >nul

