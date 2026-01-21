#!/bin/bash

echo "🏗️  Building July Spa application..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies and build
echo "📦 Installing client dependencies..."
cd client
npm install

echo "🔨 Building React application..."
npm run build

echo "✅ Build completed successfully!"
