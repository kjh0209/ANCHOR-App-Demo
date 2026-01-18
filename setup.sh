#!/bin/bash

echo "🚀 Anchor Pickup Guidance - Mobile App Setup"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if models/best.pt exists
if [ ! -f "models/best.pt" ]; then
    echo "❌ YOLO model file not found!"
    echo "Please place your trained model at: models/best.pt"
    exit 1
fi

echo "✅ Docker installed"
echo "✅ Docker Compose installed"
echo "✅ YOLO model found"
echo ""

# Start backend services
echo "📦 Starting backend services (MySQL + API + ML)..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
if docker-compose ps | grep -q "Up"; then
    echo "✅ Backend services are running!"
    echo ""
    echo "🌐 Services:"
    echo "  - Backend API: http://localhost:3001"
    echo "  - ML Service: http://localhost:8000"
    echo "  - MySQL: localhost:3306"
    echo ""
    echo "📱 Next steps for mobile app:"
    echo "  1. cd apps/mobile"
    echo "  2. npm install"
    echo "  3. npm start"
    echo "  4. Press 'a' for Android emulator"
    echo ""
    echo "📦 To build APK:"
    echo "  1. npm install -g eas-cli"
    echo "  2. eas login"
    echo "  3. eas build --platform android --profile preview"
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
