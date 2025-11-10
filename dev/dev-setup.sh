#!/bin/bash

# Home Assistant Development Helper Script
# Automatic setup for testing the Barcode Card

set -e  # Exit on any error

echo "🏠 Home Assistant Barcode Card Development Setup"
echo "============================================="

# Create testing directory structure (already in testing dir)
echo "📁 Setting up testing environment..."
mkdir -p ./config

# Check if Docker is available for Home Assistant Container
if command -v docker &> /dev/null; then
    echo "🐳 Using Home Assistant Docker Container (Python 3.13)..."
    USE_DOCKER=true
else
    echo "🏠 Installing Home Assistant Core via pip..."
    USE_DOCKER=false
    
    # Ensure we have Python 3.13 for Home Assistant compatibility
    sudo apt update
    sudo apt install -y python3.13 python3.13-venv python3.13-dev python3-pip build-essential libffi-dev libssl-dev curl
    
    # Create a clean virtual environment for Home Assistant with Python 3.13
    if [ -d "./hass_venv" ]; then
        rm -rf ./hass_venv
    fi
    
    python3.13 -m venv ./hass_venv
    source ./hass_venv/bin/activate
    
    # Upgrade pip and install Home Assistant Core (minimal)
    pip install --upgrade pip wheel setuptools
    echo "⬇️  Installing Home Assistant Core..."
    pip install homeassistant
fi

# Function to check if Home Assistant is running
check_hass_running() {
  curl -s -f http://localhost:8124 > /dev/null 2>&1
}

# Function to wait for Home Assistant to start
wait_for_hass() {
    echo "⏳ Waiting for Home Assistant to start..."
    local count=0
    while ! check_hass_running && [ $count -lt 30 ]; do
        sleep 2
        count=$((count + 1))
        echo "   Checking... (attempt $count/30)"
    done
    
    if check_hass_running; then
        echo "✅ Home Assistant is running!"
        return 0
    else
        echo "❌ Home Assistant failed to start within 60 seconds"
        return 1
    fi
}

# Kill any existing Home Assistant processes and clean up containers
echo "🛑 Stopping any existing Home Assistant processes..."
pkill -f "hass" 2>/dev/null || true

# Clean up any existing Docker containers
if command -v docker &> /dev/null; then
    echo "🧹 Cleaning up existing Home Assistant containers..."
    docker stop homeassistant-dev 2>/dev/null || true
    docker rm -f homeassistant-dev 2>/dev/null || true
fi

sleep 2

# Build the card first
echo "📦 Building Barcode Card..."
cd .. && npm run build && cd testing
mkdir -p ./config/www && cp ../dist/barcode-card.js ./config/www/

# Ensure config directory is set up properly
echo "⚙️  Setting up Home Assistant configuration..."
mkdir -p ./config/www
mkdir -p ./config/.storage

echo "🚀 Starting Home Assistant..."

if [ "$USE_DOCKER" = true ]; then
    # Use Docker container (includes Python 3.12)
    echo "📦 Starting Home Assistant Docker container..."
  docker run -d \
        --name homeassistant-dev \
        --privileged \
        --restart=unless-stopped \
        -e TZ=UTC \
        -v $(pwd)/config:/config \
    -p 8124:8123 \
        ghcr.io/home-assistant/home-assistant:stable
    
    HASS_PID=$(docker ps -q --filter "name=homeassistant-dev")
    echo "docker-$HASS_PID" > ./config/.hass_pid
else
    # Use pip installation with Python 3.12
    echo "🚀 Starting Home Assistant Core..."
    source ./hass_venv/bin/activate
    cd ./config
    
    # Start Home Assistant with proper module path
    nohup python3.13 -m homeassistant --config . > hass.log 2>&1 &
    HASS_PID=$!
    cd ..
    echo $HASS_PID > ./config/.hass_pid
fi

# Wait for Home Assistant to start
  if wait_for_hass; then
    echo ""
    echo "🎉 Setup Complete!"
    echo "================================"
  echo "🌐 Home Assistant: http://localhost:8124"
    echo "📁 Card location: ./config/www/barcode-card.js"
    echo "� The Barcode Card is pre-configured on the dashboard!"
    echo ""
    echo "🔧 Development Commands:"
    echo "  npm run dev            # Auto-rebuild card on changes"
    echo "  npm run build          # Manual rebuild"
    if [ "$USE_DOCKER" = true ]; then
        echo "  docker stop homeassistant-dev  # Stop Home Assistant"
        echo "  docker start homeassistant-dev # Start Home Assistant"
        echo "  docker logs -f homeassistant-dev # View logs"
    else
        echo "  pkill -f homeassistant # Stop Home Assistant"
        echo "  npm run setup          # Restart everything"
    fi
    echo ""
    echo "📝 Dashboard already configured with:"
    echo "type: custom:barcode-card"
    echo "title: Shopping List Barcode"
    echo "enable_camera: true"
    echo ""
  echo "💡 The card should be visible immediately at http://localhost:8124"
else
    echo "❌ Failed to start Home Assistant. Check ./config/hass.log for errors."
    exit 1
fi