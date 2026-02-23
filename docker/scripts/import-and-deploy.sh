#!/usr/bin/env bash
# ============================================
# Import and Deploy - Offline Deployment Installer
# ============================================
# Loads Docker images from tar files and starts
# all services using docker compose.
#
# Usage:
#   ./import-and-deploy.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Run from the extracted deployment directory
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/images"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"

echo "============================================"
echo "AsistenteVirtual - Import & Deploy"
echo "============================================"
echo ""

# ------------------------------------------
# Pre-flight checks
# ------------------------------------------
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "ERROR: Docker daemon is not running. Please start Docker."
    exit 1
fi

if [ ! -d "$IMAGES_DIR" ]; then
    echo "ERROR: images/ directory not found. Are you in the deployment directory?"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: docker-compose.yml not found."
    exit 1
fi

# ------------------------------------------
# Step 1: Load Docker images
# ------------------------------------------
echo "[1/3] Loading Docker images from tar files..."

for tar_file in "$IMAGES_DIR"/*.tar; do
    filename="$(basename "$tar_file")"
    echo "  Loading $filename..."
    docker load -i "$tar_file"
done

echo "  All images loaded."
echo ""

# ------------------------------------------
# Step 2: Verify environment file
# ------------------------------------------
echo "[2/3] Checking environment configuration..."

if [ ! -f "$ENV_FILE" ]; then
    echo "  WARNING: .env file not found. Creating from defaults."
    echo "  IMPORTANT: Edit .env before running in production!"
    cp "$SCRIPT_DIR/.env.example" "$ENV_FILE" 2>/dev/null || true
fi

echo "  Environment file: $ENV_FILE"
echo ""

# ------------------------------------------
# Step 3: Start services
# ------------------------------------------
echo "[3/3] Starting services..."

cd "$SCRIPT_DIR"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo ""
echo "============================================"
echo "Deployment complete!"
echo "============================================"
echo ""
echo "Services:"
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Access:"
echo "  Frontend:   http://localhost"
echo "  Backend:    http://localhost:3000/api/health"
echo "  PostgreSQL: localhost:5432"
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f $COMPOSE_FILE logs -f"
echo "  Stop:         docker compose -f $COMPOSE_FILE down"
echo "  Restart:      docker compose -f $COMPOSE_FILE restart"
echo "============================================"
