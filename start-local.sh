#!/bin/bash

echo "🚀 Starting JULY SPA Management System..."
echo

echo "📋 Checking environment files..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy content from local-env.txt to .env"
    exit 1
fi

if [ ! -f server/.env ]; then
    echo "❌ server/.env file not found!"
    echo "Please copy content from server-env.txt to server/.env"
    exit 1
fi

echo "✅ Environment files found"
echo

echo "🗄️ Setting up database..."
node setup-database.js
if [ $? -ne 0 ]; then
    echo "❌ Database setup failed!"
    exit 1
fi

echo
echo "🎉 Starting application..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo
echo "Press Ctrl+C to stop"
echo

npm run dev

