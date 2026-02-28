#!/bin/sh
set -e

echo "[start.sh] Running database migrations..."
node /app/migrate.mjs || echo "[start.sh] Migration warning, continuing..."

echo "[start.sh] Starting server..."
exec node dist/index.js
