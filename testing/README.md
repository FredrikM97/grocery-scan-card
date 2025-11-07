# Testing Directory

This directory contains all Home Assistant testing environment files.

## Structure

```
testing/
├── config/               # Home Assistant configuration
│   ├── configuration.yaml # Main HA config
│   ├── .storage/         # HA storage files (dashboards, shopping list)
│   ├── www/             # Static files (barcode card)
│   └── ...              # Other HA files
└── hass_venv/           # Python virtual environment (if not using Docker)
```

## Usage

All Home Assistant testing is isolated in this directory:

- **Docker Mode**: Configuration mounted to container
- **Pip Mode**: Virtual environment in `hass_venv/`
- **Card Files**: Built card copied to `config/www/`
- **Storage**: Dashboard and shopping list data in `config/.storage/`

## Commands

From the root directory:
```bash
# Setup testing environment (one-time)
npm run setup

# Build card
npm run build

# Watch for changes during development
npm run watch
```

From the testing directory:
```bash
# Setup Home Assistant testing environment
./dev-setup.sh

# Start Home Assistant
./start-hass.sh

# Stop Home Assistant  
./stop-hass.sh
```

## Benefits

- **Clean Separation**: Testing files don't clutter main codebase
- **Isolated Environment**: Home Assistant data separate from source code
- **Easy Cleanup**: Delete `testing/` directory to start fresh
- **Development Focus**: Main directory contains only source code

## Python Version

The Docker container uses Python 3.12 automatically. For pip installation, the setup script installs Python 3.12 to avoid deprecation warnings.