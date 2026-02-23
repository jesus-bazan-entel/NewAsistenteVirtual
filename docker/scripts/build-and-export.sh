#!/usr/bin/env bash
# ============================================
# Build and Export - Offline Deployment Builder
# ============================================
# Builds all Docker images, dumps PostgreSQL data, and packages
# everything into a single self-contained tar.gz archive.
#
# Usage:
#   ./docker/scripts/build-and-export.sh [output_dir]
#
# Output:
#   <output_dir>/asistente-virtual-deploy-<date>.tar.gz
#
# Prerequisites:
#   - Docker and Docker Compose
#   - PostgreSQL client (pg_dump) if dumping from local DB
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker"
OUTPUT_DIR="${1:-$PROJECT_ROOT/docker-export}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
EXPORT_NAME="asistente-virtual-deploy-${TIMESTAMP}"
WORK_DIR="$OUTPUT_DIR/$EXPORT_NAME"

# Image names (must match docker-compose.yml)
IMG_POSTGRES="postgres:16-alpine"
IMG_BACKEND="av-backend:latest"
IMG_FRONTEND="av-frontend:latest"
IMG_ASTERISK="av-asterisk:latest"

echo "============================================"
echo "AsistenteVirtual - Build & Export"
echo "============================================"
echo "Project root: $PROJECT_ROOT"
echo "Output dir:   $OUTPUT_DIR"
echo ""

# ------------------------------------------
# Step 1: Build all Docker images
# ------------------------------------------
echo "[1/6] Building Docker images..."

# Pull postgres base image
docker pull "$IMG_POSTGRES"
echo "  - postgres (pulled): OK"

# Build backend
docker compose -f "$DOCKER_DIR/docker-compose.yml" build backend
echo "  - backend: OK"

# Build frontend (needs project root context)
docker compose -f "$DOCKER_DIR/docker-compose.yml" build frontend
echo "  - frontend: OK"

# Build asterisk
docker compose -f "$DOCKER_DIR/docker-compose.yml" build asterisk
echo "  - asterisk: OK"

echo ""

# ------------------------------------------
# Step 2: Dump PostgreSQL database
# ------------------------------------------
echo "[2/6] Dumping PostgreSQL database..."

mkdir -p "$WORK_DIR/data/db"

# Try to get DATABASE_URL from backend/.env
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    DB_URL=$(grep -E '^DATABASE_URL=' "$BACKEND_ENV" | cut -d'=' -f2-)
fi

# Parse DATABASE_URL or use defaults
DB_URL="${DB_URL:-postgres://platform:platform123@localhost:5432/asistente_virtual}"

# Extract components from URL: postgres://user:pass@host:port/dbname
DB_USER=$(echo "$DB_URL" | sed -n 's|postgres://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|postgres://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DB_URL" | sed -n 's|postgres://[^@]*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|postgres://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|postgres://[^/]*/\(.*\)|\1|p')

export PGPASSWORD="$DB_PASS"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-acl --clean --if-exists \
    -f "$WORK_DIR/data/db/dump.sql" 2>/dev/null; then
    DUMP_SIZE=$(du -sh "$WORK_DIR/data/db/dump.sql" | cut -f1)
    echo "  - dump.sql: OK ($DUMP_SIZE)"
else
    echo "  - WARNING: Could not dump database. Deploy will use empty DB with migrations."
    rm -f "$WORK_DIR/data/db/dump.sql"
fi

unset PGPASSWORD
echo ""

# ------------------------------------------
# Step 3: Create export directory structure
# ------------------------------------------
echo "[3/6] Creating export directory..."

mkdir -p "$WORK_DIR/images"
mkdir -p "$WORK_DIR/data/asterisk"
mkdir -p "$WORK_DIR/ssl"

# ------------------------------------------
# Step 4: Save Docker images to tar files
# ------------------------------------------
echo "[4/6] Saving Docker images to tar files..."

docker save "$IMG_POSTGRES" -o "$WORK_DIR/images/postgres.tar"
echo "  - postgres.tar: OK"

docker save "$IMG_BACKEND" -o "$WORK_DIR/images/backend.tar"
echo "  - backend.tar: OK"

docker save "$IMG_FRONTEND" -o "$WORK_DIR/images/frontend.tar"
echo "  - frontend.tar: OK"

docker save "$IMG_ASTERISK" -o "$WORK_DIR/images/asterisk.tar"
echo "  - asterisk.tar: OK"

echo ""

# ------------------------------------------
# Step 5: Copy configuration files
# ------------------------------------------
echo "[5/6] Copying configuration files..."

# Generate deploy-only docker-compose.yml (image: only, no build:)
cat > "$WORK_DIR/docker-compose.yml" << 'COMPOSE_EOF'
# ============================================
# Docker Compose - AsistenteVirtual (Deploy)
# ============================================
# Generated for offline deployment. Uses pre-built images.
# ============================================

services:
  postgres:
    image: postgres:16-alpine
    container_name: av-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-asistente_virtual}
      POSTGRES_USER: ${POSTGRES_USER:-platform}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-platform123}
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-platform} -d ${POSTGRES_DB:-asistente_virtual}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - app-network

  backend:
    image: av-backend:latest
    container_name: av-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER:-platform}:${POSTGRES_PASSWORD:-platform123}@postgres:5432/${POSTGRES_DB:-asistente_virtual}
      PORT: ${PORT:-3000}
      JWT_SECRET: ${JWT_SECRET:-change-this-to-a-random-secret-in-production}
      JWT_EXPIRATION_HOURS: ${JWT_EXPIRATION_HOURS:-24}
      FRONTEND_URL: ${FRONTEND_URL:-https://localhost}
      ASTERISK_HOST: ${ASTERISK_HOST:-host.docker.internal}
      ASTERISK_PORT: ${ASTERISK_PORT:-5038}
      ASTERISK_USER: ${ASTERISK_USER:-admin}
      ASTERISK_PASSWORD: ${ASTERISK_PASSWORD:-admin}
      ASTERISK_ENV: ${ASTERISK_ENV:-docker}
      SMTP_HOST: ${SMTP_HOST:-localhost}
      SMTP_PORT: ${SMTP_PORT:-25}
      FTP_HOST: ${FTP_HOST:-}
      FTP_USER: ${FTP_USER:-}
      FTP_PWD: ${FTP_PWD:-}
      LDAP_HOST: ${LDAP_HOST:-}
      LDAP_BIND_DN: ${LDAP_BIND_DN:-}
      LDAP_BASE_DN: ${LDAP_BASE_DN:-}
      LDAP_BASE_USER: ${LDAP_BASE_USER:-}
      LDAP_TIMEOUT: ${LDAP_TIMEOUT:-5000}
      RUST_LOG: ${RUST_LOG:-info}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - app-network

  frontend:
    image: av-frontend:latest
    container_name: av-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost/api/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - app-network

  asterisk:
    image: av-asterisk:latest
    container_name: av-asterisk
    restart: unless-stopped
    network_mode: host
    environment:
      AMI_USER: ${ASTERISK_USER:-admin}
      AMI_SECRET: ${ASTERISK_PASSWORD:-admin}
      AMI_PERMIT: "0.0.0.0/0.0.0.0"
    volumes:
      - ./data/asterisk/sip.monitoreo.conf:/etc/asterisk/sip.monitoreo.conf
      - ./data/asterisk/extensions.monitoreo.conf:/etc/asterisk/extensions.monitoreo.conf
    healthcheck:
      test: ["CMD", "asterisk", "-rx", "core show version"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  pg-data:
    driver: local

networks:
  app-network:
    driver: bridge
COMPOSE_EOF
echo "  - docker-compose.yml (deploy): OK"

# Copy Asterisk dynamic configs
if [ -f "$DOCKER_DIR/data/asterisk/sip.monitoreo.conf" ]; then
    cp "$DOCKER_DIR/data/asterisk/sip.monitoreo.conf" "$WORK_DIR/data/asterisk/"
else
    touch "$WORK_DIR/data/asterisk/sip.monitoreo.conf"
fi

if [ -f "$DOCKER_DIR/data/asterisk/extensions.monitoreo.conf" ]; then
    cp "$DOCKER_DIR/data/asterisk/extensions.monitoreo.conf" "$WORK_DIR/data/asterisk/"
else
    touch "$WORK_DIR/data/asterisk/extensions.monitoreo.conf"
fi
echo "  - asterisk configs: OK"

# Copy .env with deploy defaults
if [ -f "$DOCKER_DIR/.env" ]; then
    cp "$DOCKER_DIR/.env" "$WORK_DIR/.env"
else
    cp "$DOCKER_DIR/.env.example" "$WORK_DIR/.env"
fi

# Override ASTERISK_HOST for deploy (host network mode)
sed -i 's|^ASTERISK_HOST=.*|ASTERISK_HOST=172.17.0.1|' "$WORK_DIR/.env"
# Override FRONTEND_URL for deploy
sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=https://localhost|' "$WORK_DIR/.env"
echo "  - .env: OK"

# Copy deploy script
cp "$SCRIPT_DIR/deploy.sh" "$WORK_DIR/deploy.sh"
chmod +x "$WORK_DIR/deploy.sh"
echo "  - deploy.sh: OK"

echo ""

# ------------------------------------------
# Step 6: Package everything into tar.gz
# ------------------------------------------
echo "[6/6] Packaging into tar.gz..."

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
echo "  2. cd /opt && tar -xzf ${EXPORT_NAME}.tar.gz"
echo "  3. cd ${EXPORT_NAME}"
echo "  4. (Optional) Edit .env with your settings"
echo "  5. sudo bash deploy.sh"
echo "============================================"
