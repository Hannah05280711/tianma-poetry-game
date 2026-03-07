#!/bin/sh
set -e

echo "[start.sh] Running database migrations..."
node /app/migrate.mjs || echo "[start.sh] Migration warning, continuing..."

echo "[start.sh] Syncing V2 data..."
node /app/scripts/sync-v2-data.mjs || echo "[start.sh] V2 data sync warning, continuing..."

echo "[start.sh] Starting server..."
exec node dist/index.js
