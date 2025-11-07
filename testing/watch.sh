#!/bin/bash
# Watch script for development - run from testing directory
echo "🔍 Watching for card changes..."
echo "💡 Files will be automatically copied to ./config/www/"

cd .. && npm run dev &
DEV_PID=$!

# Copy files when they change
while inotifywait -e modify ../dist/barcode-card.js 2>/dev/null; do
    if [ -f "config/www/barcode-card.js" ]; then
        cp ../dist/barcode-card.js config/www/
        echo "🔄 Card updated at $(date) - refresh browser"
    fi
done

# Cleanup on exit
kill $DEV_PID 2>/dev/null || true