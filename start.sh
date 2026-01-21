#!/bin/bash

echo "🚀 Starting Spa Management System..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

# Create database directory if it doesn't exist
mkdir -p database

# Seed sample data
echo "🌱 Seeding sample data..."
node server/seed-data.js

echo "✅ Setup completed!"
echo ""
echo "🎯 Starting development servers..."
echo "   - Backend API: http://localhost:5000"
echo "   - Frontend App: http://localhost:3000"
echo ""
echo "📋 Default admin account will be created during setup"
echo ""

# Start both servers
npm run dev
