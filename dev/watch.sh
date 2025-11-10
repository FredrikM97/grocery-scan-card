#!/bin/bash
cd .. && npm run dev &
DEV_PID=$!

while inotifywait -e modify ../dist/barcode-card.js 2>/dev/null; do
    if [ -f "config/www/barcode-card.js" ]; then
        cp ../dist/barcode-card.js config/www/
        echo "Card updated at $(date)"
    fi
done

kill $DEV_PID 2>/dev/null || true