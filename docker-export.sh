#!/bin/bash
# ============================================
# Script para exportar imagenes Docker
# Para transportar a servidores sin internet
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

EXPORT_DIR="docker-export"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "============================================"
echo " Exportador de Imagenes Docker"
echo "============================================"
echo ""

# Crear directorio de exportacion
mkdir -p $EXPORT_DIR

# Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "Docker Compose no encontrado"
    exit 1
fi

# Construir imagenes si no existen
log_info "Construyendo imagenes..."
$COMPOSE_CMD build

# Obtener nombres de las imagenes
BACKEND_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "asistentevirtual.*backend|entel.*backend" | head -1)
FRONTEND_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "asistentevirtual.*frontend|entel.*frontend" | head -1)

# Si no se encontraron, usar nombres por defecto
if [ -z "$BACKEND_IMAGE" ]; then
    BACKEND_IMAGE="asistentevirtual-backend:latest"
fi
if [ -z "$FRONTEND_IMAGE" ]; then
    FRONTEND_IMAGE="asistentevirtual-frontend:latest"
fi

log_info "Imagenes a exportar:"
echo "  - Backend:  $BACKEND_IMAGE"
echo "  - Frontend: $FRONTEND_IMAGE"
echo "  - MySQL:    mysql:8.0"
echo ""

# Exportar imagenes
log_info "Exportando imagen del backend..."
docker save $BACKEND_IMAGE | gzip > "$EXPORT_DIR/backend_${TIMESTAMP}.tar.gz"
log_success "Backend exportado: $EXPORT_DIR/backend_${TIMESTAMP}.tar.gz"

log_info "Exportando imagen del frontend..."
docker save $FRONTEND_IMAGE | gzip > "$EXPORT_DIR/frontend_${TIMESTAMP}.tar.gz"
log_success "Frontend exportado: $EXPORT_DIR/frontend_${TIMESTAMP}.tar.gz"

log_info "Exportando imagen de MySQL..."
docker pull mysql:8.0
docker save mysql:8.0 | gzip > "$EXPORT_DIR/mysql_8.0.tar.gz"
log_success "MySQL exportado: $EXPORT_DIR/mysql_8.0.tar.gz"

# Copiar archivos de configuracion
log_info "Copiando archivos de configuracion..."
cp .env.docker "$EXPORT_DIR/.env.example" 2>/dev/null || cp .env.example "$EXPORT_DIR/.env.example" 2>/dev/null || true
cp docker-deploy.sh "$EXPORT_DIR/"
cp -r docker/ "$EXPORT_DIR/" 2>/dev/null || true

# Generar docker-compose.yml para despliegue offline (image: en vez de build:)
log_info "Generando docker-compose.yml para despliegue offline..."
awk -v backend="$BACKEND_IMAGE" -v frontend="$FRONTEND_IMAGE" '
    /^[[:space:]]*build:/ { in_build=1; next }
    in_build && /^[[:space:]]*(context|dockerfile):/ { next }
    in_build { in_build=0 }
    /container_name: entel-backend/ && !backend_done {
        print "    image: " backend; backend_done=1
    }
    /container_name: entel-frontend/ && !frontend_done {
        print "    image: " frontend; frontend_done=1
    }
    { print }
' docker-compose.yml > "$EXPORT_DIR/docker-compose.yml"
log_success "docker-compose.yml generado con image: en vez de build:"

# Crear script de importacion
cat > "$EXPORT_DIR/docker-import.sh" << 'EOF'
#!/bin/bash
# Script para importar imagenes en el servidor destino

set -e

echo "============================================"
echo " Importador de Imagenes Docker"
echo "============================================"

# Importar imagenes
echo "Importando MySQL..."
gunzip -c mysql_8.0.tar.gz | docker load

echo "Importando Backend..."
gunzip -c backend_*.tar.gz | docker load

echo "Importando Frontend..."
gunzip -c frontend_*.tar.gz | docker load

echo ""
echo "Imagenes importadas correctamente!"
echo ""
echo "Proximos pasos:"
echo "  1. cp .env.example .env"
echo "  2. nano .env  # Editar variables"
echo "  3. docker-compose up -d"
echo ""
EOF
chmod +x "$EXPORT_DIR/docker-import.sh"

# Calcular tamano total
TOTAL_SIZE=$(du -sh "$EXPORT_DIR" | cut -f1)

echo ""
echo "============================================"
log_success "Exportacion completada!"
echo "============================================"
echo ""
echo "Directorio: $EXPORT_DIR"
echo "Tamano total: $TOTAL_SIZE"
echo ""
echo "Contenido:"
ls -lh "$EXPORT_DIR"
echo ""
echo "Para transferir al servidor destino:"
echo "  scp -r $EXPORT_DIR usuario@servidor:/ruta/destino/"
echo ""
echo "En el servidor destino:"
echo "  cd /ruta/destino/$EXPORT_DIR"
echo "  ./docker-import.sh"
echo "  cp .env.example .env"
echo "  nano .env"
echo "  docker-compose up -d"
echo ""
