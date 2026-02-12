#!/bin/bash
# ============================================
# Script para importar imagenes y desplegar
# Sistema de Monitoreo VoIP
# ============================================
# Uso: bash docker-import.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo " Sistema de Monitoreo VoIP"
echo " Importador de Imagenes Docker"
echo "============================================"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker no esta instalado. Instalalo primero."
    exit 1
fi

# Detectar Docker Compose
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    log_error "Docker Compose no esta instalado."
    exit 1
fi

# ==========================================
# Paso 1: Importar imagenes
# ==========================================
log_info "Importando imagenes Docker..."

if ls mysql_8.0.tar.gz 1>/dev/null 2>&1; then
    log_info "Importando MySQL 8.0..."
    gunzip -c mysql_8.0.tar.gz | docker load
    log_success "MySQL importado"
else
    log_warn "mysql_8.0.tar.gz no encontrado, se descargara al iniciar (requiere internet)"
fi

ASTERISK_TAR=$(ls -t asterisk_*.tar.gz 2>/dev/null | head -1)
if [ -n "$ASTERISK_TAR" ]; then
    log_info "Importando Asterisk ($ASTERISK_TAR)..."
    gunzip -c "$ASTERISK_TAR" | docker load
    log_success "Asterisk importado"
else
    log_warn "No se encontro asterisk_*.tar.gz (Asterisk no estara disponible)"
fi

BACKEND_TAR=$(ls -t backend_*.tar.gz 2>/dev/null | head -1)
if [ -n "$BACKEND_TAR" ]; then
    log_info "Importando Backend ($BACKEND_TAR)..."
    gunzip -c "$BACKEND_TAR" | docker load
    log_success "Backend importado"
else
    log_error "No se encontro backend_*.tar.gz"
    exit 1
fi

FRONTEND_TAR=$(ls -t frontend_*.tar.gz 2>/dev/null | head -1)
if [ -n "$FRONTEND_TAR" ]; then
    log_info "Importando Frontend ($FRONTEND_TAR)..."
    gunzip -c "$FRONTEND_TAR" | docker load
    log_success "Frontend importado"
else
    log_error "No se encontro frontend_*.tar.gz"
    exit 1
fi

echo ""
log_info "Imagenes disponibles:"
docker images --format '  {{.Repository}}:{{.Tag}}  ({{.Size}})' | grep -E 'asistentevirtual|mysql|asterisk'
echo ""

# ==========================================
# Paso 2: Configurar .env
# ==========================================
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_success "Archivo .env creado desde .env.example"
        log_warn "Revisa y ajusta las variables en .env antes de continuar"
        echo ""
        echo "  Editar: nano .env"
        echo ""
        read -p "Presiona Enter cuando hayas terminado de editar .env (o Enter para continuar con valores por defecto)... "
    else
        log_error "No se encontro .env ni .env.example"
        exit 1
    fi
fi

# ==========================================
# Paso 3: Iniciar servicios
# ==========================================
log_info "Iniciando servicios..."
$COMPOSE_CMD up -d
echo ""

# Esperar a que MySQL este listo
log_info "Esperando a que MySQL este listo..."
RETRIES=30
until docker exec entel-mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -eq 0 ]; then
        log_error "MySQL no respondio a tiempo"
        exit 1
    fi
    sleep 2
done
log_success "MySQL listo"

# ==========================================
# Paso 4: Restaurar backup de BD (opcional)
# ==========================================
if [ -f "db_entel_backup.sql" ]; then
    echo ""
    read -p "Se encontro db_entel_backup.sql. Deseas restaurar la base de datos? (s/N): " RESTORE_DB
    if [ "$RESTORE_DB" = "s" ] || [ "$RESTORE_DB" = "S" ]; then
        source .env 2>/dev/null || true
        DB_PASS="${DB_PASSWORD:-}"
        # Unescape $$ to $ for shell usage
        DB_PASS=$(echo "$DB_PASS" | sed 's/\$\$/\$/g')

        log_info "Restaurando base de datos desde backup..."
        docker exec -i entel-mysql mysql -u root -p"$DB_PASS" db_entel < db_entel_backup.sql
        log_success "Base de datos restaurada"

        log_info "Reiniciando backend..."
        $COMPOSE_CMD restart backend
    fi
fi

# ==========================================
# Paso 5: Mostrar estado
# ==========================================
echo ""
log_info "Esperando que los servicios esten listos..."
sleep 10
echo ""
$COMPOSE_CMD ps
echo ""

source .env 2>/dev/null || true
FRONTEND_PORT=${FRONTEND_PORT:-80}
BACKEND_PORT=${BACKEND_PORT:-8082}

echo "============================================"
echo " Despliegue completado!"
echo "============================================"
echo ""
echo "  Frontend:    http://localhost:${FRONTEND_PORT}"
echo "  Backend API: http://localhost:${BACKEND_PORT}/api/health"
echo "  Asterisk:    localhost:5060 (SIP) / localhost:5038 (AMI)"
echo "  MySQL:       localhost:3306"
echo ""
echo "  Comandos utiles:"
echo "    $COMPOSE_CMD logs -f        Ver logs"
echo "    $COMPOSE_CMD ps             Estado"
echo "    $COMPOSE_CMD restart        Reiniciar"
echo "    $COMPOSE_CMD down           Detener"
echo ""
