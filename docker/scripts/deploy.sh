#!/usr/bin/env bash
# ============================================
# Deploy - Offline Deployment Installer
# ============================================
# Loads Docker images, generates SSL certificate, restores
# database dump, and starts all services.
#
# Usage:
#   sudo bash deploy.sh
#
# Prerequisites:
#   - Docker Engine 24+ and Docker Compose v2
#   - Run from the extracted deployment directory
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/images"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"
SSL_DIR="$SCRIPT_DIR/ssl"
DB_DUMP="$SCRIPT_DIR/data/db/dump.sql"

echo "============================================"
echo "AsistenteVirtual - Offline Deploy"
echo "============================================"
echo ""

# ------------------------------------------
# Pre-flight checks
# ------------------------------------------
echo "[Pre-flight] Checking requirements..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    echo "Install Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "ERROR: Docker daemon is not running. Start it with: systemctl start docker"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose v2 is required."
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

echo "  Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "  Compose: $(docker compose version --short)"
echo ""

# ------------------------------------------
# Step 1: Load Docker images
# ------------------------------------------
echo "[1/5] Loading Docker images..."

for tar_file in "$IMAGES_DIR"/*.tar; do
    filename="$(basename "$tar_file")"
    echo "  Loading $filename..."
    docker load -i "$tar_file"
done

echo "  All images loaded."
echo ""

# ------------------------------------------
# Step 2: Generate SSL certificate
# ------------------------------------------
echo "[2/5] Checking SSL certificate..."

mkdir -p "$SSL_DIR"

if [ -f "$SSL_DIR/server.crt" ] && [ -f "$SSL_DIR/server.key" ]; then
    echo "  SSL certificate already exists, skipping generation."
else
    echo "  Generating self-signed SSL certificate..."

    # Detect hostname/IP for the certificate
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
    SERVER_HOSTNAME=$(hostname -f 2>/dev/null || echo "localhost")

    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$SSL_DIR/server.key" \
        -out "$SSL_DIR/server.crt" \
        -subj "/C=CL/ST=Santiago/L=Santiago/O=AsistenteVirtual/CN=$SERVER_HOSTNAME" \
        -addext "subjectAltName=DNS:$SERVER_HOSTNAME,DNS:localhost,IP:$SERVER_IP,IP:127.0.0.1" \
        2>/dev/null

    chmod 644 "$SSL_DIR/server.crt"
    chmod 600 "$SSL_DIR/server.key"
    echo "  Certificate generated for: $SERVER_HOSTNAME ($SERVER_IP)"
fi

echo ""

# ------------------------------------------
# Step 3: Environment file
# ------------------------------------------
echo "[3/5] Checking environment configuration..."

if [ ! -f "$ENV_FILE" ]; then
    echo "  WARNING: .env file not found, creating from defaults."
    cat > "$ENV_FILE" << 'DEFAULT_ENV'
POSTGRES_DB=asistente_virtual
POSTGRES_USER=platform
POSTGRES_PASSWORD=platform123
PORT=3000
JWT_SECRET=change-this-to-a-random-secret-in-production
JWT_EXPIRATION_HOURS=24
FRONTEND_URL=https://localhost
ASTERISK_HOST=172.17.0.1
ASTERISK_PORT=5038
ASTERISK_USER=admin
ASTERISK_PASSWORD=admin
ASTERISK_ENV=docker
SMTP_HOST=localhost
SMTP_PORT=25
RUST_LOG=info
DEFAULT_ENV
fi

echo "  Environment file: $ENV_FILE"
echo ""

# ------------------------------------------
# Step 4: Start services
# ------------------------------------------
echo "[4/5] Starting services..."

cd "$SCRIPT_DIR"

# Stop existing services if running
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down 2>/dev/null || true

# Start all services
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo "  Services starting..."
echo ""

# ------------------------------------------
# Step 5: Restore database dump (first run only)
# ------------------------------------------
echo "[5/5] Checking database..."

# Wait for postgres to be healthy
echo "  Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U platform -d asistente_virtual 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "  ERROR: PostgreSQL did not become ready in time."
        exit 1
    fi
    sleep 2
done
echo "  PostgreSQL is ready."

# Check if database has data (check if usuarios table has rows)
HAS_DATA=$(docker compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U platform -d asistente_virtual -tAc \
    "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='usuarios');" 2>/dev/null || echo "f")

if [ "$HAS_DATA" = "t" ]; then
    echo "  Database already has tables (migrations ran). Checking for dump restore..."

    # Check if this is a fresh DB (just migrations, no custom data beyond seed)
    USER_COUNT=$(docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U platform -d asistente_virtual -tAc \
        "SELECT count(*) FROM usuarios;" 2>/dev/null || echo "0")

    if [ -f "$DB_DUMP" ] && [ "$USER_COUNT" -le "1" ]; then
        echo "  Restoring database dump (fresh install detected)..."
        docker compose -f "$COMPOSE_FILE" exec -T postgres \
            psql -U platform -d asistente_virtual < "$DB_DUMP" 2>/dev/null || true
        echo "  Database dump restored."
    else
        echo "  Database already has data, skipping dump restore."
    fi
else
    # No tables yet — backend migrations will create them on startup
    echo "  Waiting for backend to run migrations..."
    sleep 10

    if [ -f "$DB_DUMP" ]; then
        echo "  Restoring database dump..."
        # Wait a bit more for migrations
        sleep 5
        docker compose -f "$COMPOSE_FILE" exec -T postgres \
            psql -U platform -d asistente_virtual < "$DB_DUMP" 2>/dev/null || true
        echo "  Database dump restored."
    fi
fi

echo ""

# ------------------------------------------
# Wait for all services to be healthy
# ------------------------------------------
echo "Waiting for services to be healthy..."

TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTHY=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
        grep -c '"healthy"' || echo "0")
    TOTAL=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
        grep -c '"running"\|"healthy"' || echo "0")

    if [ "$TOTAL" -ge 4 ]; then
        break
    fi

    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo "  ($ELAPSED s) Waiting... ($TOTAL/4 services running)"
done

echo ""
echo "============================================"
echo "Deployment complete!"
echo "============================================"
echo ""

# Show service status
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "Access:"
echo "  HTTPS:       https://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost')"
echo "  HTTP:        http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost') (redirects to HTTPS)"
echo "  Health:      curl -k https://localhost/api/health"
echo ""
echo "Default login:"
echo "  User:     demo@entel.com"
echo "  Password: demo123"
echo ""
echo "Useful commands (run from $(pwd)):"
echo "  View logs:    docker compose logs -f"
echo "  Stop:         docker compose down"
echo "  Restart:      docker compose restart"
echo "  Asterisk CLI: docker compose exec asterisk asterisk -rvvv"
echo "============================================"
