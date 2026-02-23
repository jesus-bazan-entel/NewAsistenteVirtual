#!/usr/bin/env bash
# ============================================
# Build and Export - Offline Deployment Builder
# ============================================
# Builds all Docker images and packages them into
# a single tar.gz archive for offline deployment.
#
# Usage:
#   ./docker/scripts/build-and-export.sh [output_dir]
#
# Output:
#   <output_dir>/asistente-virtual-deploy-<date>.tar.gz
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker"
OUTPUT_DIR="${1:-$PROJECT_ROOT/docker-export}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
EXPORT_NAME="asistente-virtual-deploy-${TIMESTAMP}"
WORK_DIR="$OUTPUT_DIR/$EXPORT_NAME"

echo "============================================"
echo "AsistenteVirtual - Build & Export"
echo "============================================"
echo "Project root: $PROJECT_ROOT"
echo "Output dir:   $OUTPUT_DIR"
echo ""

# ------------------------------------------
# Step 1: Build all Docker images
# ------------------------------------------
echo "[1/5] Building Docker images..."

docker compose -f "$DOCKER_DIR/docker-compose.yml" build \
    --no-cache \
    postgres 2>/dev/null || true  # postgres uses a pre-built image

docker compose -f "$DOCKER_DIR/docker-compose.yml" build backend
echo "  - backend: OK"

docker compose -f "$DOCKER_DIR/docker-compose.yml" build frontend
echo "  - frontend: OK"

docker compose -f "$DOCKER_DIR/docker-compose.yml" build asterisk
echo "  - asterisk: OK"

# ------------------------------------------
# Step 2: Create export directory
# ------------------------------------------
echo "[2/5] Creating export directory..."
mkdir -p "$WORK_DIR/images"

# ------------------------------------------
# Step 3: Save images to tar files
# ------------------------------------------
echo "[3/5] Saving Docker images to tar files..."

# Save the built images
docker save postgres:16-alpine -o "$WORK_DIR/images/postgres.tar"
echo "  - postgres.tar: OK"

docker save "$(docker compose -f "$DOCKER_DIR/docker-compose.yml" images backend -q 2>/dev/null || echo 'docker-backend')" \
    -o "$WORK_DIR/images/backend.tar" 2>/dev/null || \
    docker save docker-backend -o "$WORK_DIR/images/backend.tar"
echo "  - backend.tar: OK"

docker save "$(docker compose -f "$DOCKER_DIR/docker-compose.yml" images frontend -q 2>/dev/null || echo 'docker-frontend')" \
    -o "$WORK_DIR/images/frontend.tar" 2>/dev/null || \
    docker save docker-frontend -o "$WORK_DIR/images/frontend.tar"
echo "  - frontend.tar: OK"

docker save "$(docker compose -f "$DOCKER_DIR/docker-compose.yml" images asterisk -q 2>/dev/null || echo 'docker-asterisk')" \
    -o "$WORK_DIR/images/asterisk.tar" 2>/dev/null || \
    docker save docker-asterisk -o "$WORK_DIR/images/asterisk.tar"
echo "  - asterisk.tar: OK"

# ------------------------------------------
# Step 4: Copy compose and config files
# ------------------------------------------
echo "[4/5] Copying configuration files..."

cp "$DOCKER_DIR/docker-compose.yml" "$WORK_DIR/"
cp "$DOCKER_DIR/.env.example" "$WORK_DIR/.env"
cp "$DOCKER_DIR/scripts/import-and-deploy.sh" "$WORK_DIR/"
chmod +x "$WORK_DIR/import-and-deploy.sh"

echo "  - docker-compose.yml: OK"
echo "  - .env: OK"
echo "  - import-and-deploy.sh: OK"

# ------------------------------------------
# Step 5: Package everything into tar.gz
# ------------------------------------------
echo "[5/5] Packaging into tar.gz..."

cd "$OUTPUT_DIR"
tar -czf "${EXPORT_NAME}.tar.gz" "$EXPORT_NAME"
rm -rf "$WORK_DIR"

ARCHIVE_PATH="$OUTPUT_DIR/${EXPORT_NAME}.tar.gz"
ARCHIVE_SIZE=$(du -sh "$ARCHIVE_PATH" | cut -f1)

echo ""
echo "============================================"
echo "Export complete!"
echo "============================================"
echo "Archive: $ARCHIVE_PATH"
echo "Size:    $ARCHIVE_SIZE"
echo ""
echo "To deploy on the target server:"
echo "  1. Copy ${EXPORT_NAME}.tar.gz to the server"
echo "  2. tar -xzf ${EXPORT_NAME}.tar.gz"
echo "  3. cd ${EXPORT_NAME}"
echo "  4. Edit .env with your settings"
echo "  5. ./import-and-deploy.sh"
echo "============================================"
