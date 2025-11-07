#!/bin/bash

echo "Setting up Shopping List Barcode Card development environment..."

# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js dependencies
npm install

# Install TypeScript globally for better development experience
npm install -g typescript

# Install Home Assistant for testing
echo "Installing Home Assistant for testing..."
pip install --upgrade pip
pip install homeassistant

# Create Home Assistant configuration for testing
echo "Setting up Home Assistant test configuration..."
mkdir -p ./config/www

# Create basic Home Assistant configuration
cat > ./config/configuration.yaml << 'EOF'
# Basic Home Assistant Configuration for Frontend Testing
default_config:

# Enable frontend
frontend:
  themes: !include_dir_merge_named themes

# HTTP configuration for development
http:
  server_host: 0.0.0.0
  server_port: 8123
  cors_allowed_origins:
    - http://localhost:3000
    - http://localhost:5173

# Shopping List integration
shopping_list:

# Lovelace configuration
lovelace:
  mode: storage
  resources:
    - url: /local/barcode-card.js
      type: module

logger:
  default: warning
  logs:
    homeassistant.core: info
    homeassistant.components.shopping_list: debug
EOF

# Create themes directory
mkdir -p ./config/themes

# Create a script to start Home Assistant
cat > ./config/start-hass.sh << 'EOF'
#!/bin/bash
echo "Starting Home Assistant for development..."
echo "Home Assistant will be available at: http://localhost:8123"
echo "Make sure to copy your built card to ./config/www/barcode-card.js"
echo ""
cd "$(dirname "$0")/../config"
hass --config .
EOF

chmod +x ./config/start-hass.sh

echo "Development environment setup complete!"
echo ""
echo "Available commands:"
echo "  - npm run dev          # Start Vite development server"
echo "  - npm run build        # Build the TypeScript card for production"
echo "  - npm run type-check   # Run TypeScript type checking"
echo "  - npm test             # Run frontend tests with Vitest"
echo "  - npm run lint         # Lint TypeScript code"
echo "  - npm run lint:fix     # Lint and auto-fix TypeScript code"
echo ""
echo "Home Assistant testing:"
echo "  - ./config/start-hass.sh          # Start Home Assistant (http://localhost:8123)"
echo "  - npm run build:hass              # Build and copy card to Home Assistant"
echo ""
echo "Development workflow:"
echo "  1. Run 'npm run build:hass' to build and copy your card"
echo "  2. Start Home Assistant: './config/start-hass.sh'"
echo "  3. Add the card to your dashboard in Home Assistant"
echo "  or"
echo "  - Run './dev-setup.sh' to do everything in one command"