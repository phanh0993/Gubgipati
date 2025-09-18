@echo off
echo Starting JULY Restaurant Management System...

echo.
echo 1. Checking for .env files...
if not exist .env (
    echo Creating .env from local-env.txt...
    copy local-env.txt .env
) else (
    echo .env already exists.
)

if not exist server\.env (
    echo Creating server\.env from server-env.txt...
    copy server-env.txt server\.env
) else (
    echo server\.env already exists.
)

echo.
echo 2. Installing Node.js dependencies (if not already installed)...
call npm install

echo.
echo 3. Setting up restaurant database...
node restaurant-database-setup.js

echo.
echo 4. Starting restaurant development servers...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo Restaurant POS: http://localhost:3000/restaurant-pos
echo.
echo Default admin login:
echo Username: admin
echo Password: admin123
echo.
call npm run dev

echo.
echo Setup complete. Press any key to exit.
pause

