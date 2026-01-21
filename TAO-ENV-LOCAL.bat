@echo off
echo DANGEROUSLY_DISABLE_HOST_CHECK=true > .env.local
echo ✅ Đã tạo file .env.local
echo.
echo File nội dung:
type .env.local
echo.
pause

