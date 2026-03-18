#!/bin/bash
set -e

COMPOSE_FILE="docker-compose.homelab.yml"
API_CONTAINER="review-ratings-api-1"

echo "==============================="
echo "  ReviewBD Deployment Script"
echo "==============================="

# Step 1: Pull latest code
echo ""
echo "[1/4] Pulling latest code from origin/main..."
git pull origin main

# Step 2: Build and restart containers
echo ""
echo "[2/4] Building and restarting containers..."
docker compose -f "$COMPOSE_FILE" up --build -d

# Step 3: Wait for API container to be healthy
echo ""
echo "[3/4] Waiting for API container to be ready..."
RETRIES=20
until docker exec "$API_CONTAINER" echo "ok" &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -eq 0 ]; then
    echo "ERROR: API container did not start in time."
    exit 1
  fi
  echo "  Waiting... ($RETRIES retries left)"
  sleep 3
done
echo "  API container is ready."

# Step 4: Run database migrations
echo ""
echo "[4/4] Applying database migrations..."
docker compose -f "$COMPOSE_FILE" exec api npx prisma migrate deploy

# Done
echo ""
echo "==============================="
echo "  Deployment complete!"
echo "==============================="
docker compose -f "$COMPOSE_FILE" ps
