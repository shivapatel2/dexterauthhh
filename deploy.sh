#!/bin/bash
set -e
echo "=== AuthLX Production Deploy ==="

# Check env files exist
if [ ! -f "./authlx-backend/.env.production" ]; then
  echo "ERROR: authlx-backend/.env.production missing. Copy from .env.production.example and fill values."
  exit 1
fi
if [ ! -f "./authlx-local/.env.production" ]; then
  echo "WARN: authlx-local/.env.production missing - using default VITE_API_URL. Create one for production."
fi

# Load frontend env for docker build arg
if [ -f "./authlx-local/.env.production" ]; then
  export $(grep -v '^#' ./authlx-local/.env.production | xargs)
fi

echo "[1/4] Building backend + frontend images..."
docker compose build --no-cache

echo "[2/4] Starting services..."
docker compose up -d

echo "[3/4] Waiting for backend health..."
for i in {1..30}; do
  if curl -sf http://localhost:3000/health > /dev/null; then
    echo "Backend healthy!"
    break
  fi
  echo "  waiting... ($i/30)"
  sleep 2
done

echo "[4/4] Checking status..."
docker compose ps
curl -sf http://localhost:3000/health | head -c 500; echo
echo "Frontend: http://localhost:80"
echo "Backend:  http://localhost:3000/health"
echo "=== Deploy complete ==="
