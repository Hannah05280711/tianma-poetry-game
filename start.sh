#!/bin/sh
set -e

echo "[start.sh] Running database migrations..."
node /app/migrate.mjs || echo "[start.sh] Migration warning, continuing..."

echo "[start.sh] Running V2 data update..."
node /home/ubuntu/tianma-poetry-game/scripts/seed-v2-update.mjs || echo "[start.sh] V2 data update warning, continuing..."

echo "[start.sh] Starting server..."
exec node dist/index.js
