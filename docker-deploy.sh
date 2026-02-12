#!/bin/bash
# ============================================
# Script de despliegue Docker
# Sistema de Monitoreo VoIP
# ============================================
# Compatible con RHEL/CentOS, Debian/Ubuntu
# ============================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de log
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Banner
echo "============================================"
echo " Sistema de Monitoreo VoIP - Docker Deploy"
echo "============================================"
echo ""

# Verificar Docker
check_docker() {
    log_info "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker no esta instalado"
        echo ""
        echo "Para instalar Docker:"
        echo ""
        echo "  RHEL/CentOS:"
        echo "    sudo yum install -y docker"
        echo "    sudo systemctl start docker"
        echo "    sudo systemctl enable docker"
        echo ""
        echo "  Debian/Ubuntu:"
        echo "    sudo apt-get update"
        echo "    sudo apt-get install -y docker.io docker-compose"
        echo "    sudo systemctl start docker"
        echo "    sudo systemctl enable docker"
        echo ""
        exit 1
    fi
    log_success "Docker instalado: $(docker --version)"
}

# Verificar Docker Compose
check_docker_compose() {
    log_info "Verificando Docker Compose..."
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose instalado: $(docker-compose --version)"
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        log_success "Docker Compose (plugin) instalado: $(docker compose version)"
        COMPOSE_CMD="docker compose"
    else
        log_error "Docker Compose no esta instalado"
        exit 1
    fi
}

# Verificar archivo .env
check_env() {
    log_info "Verificando archivo .env..."
    if [ ! -f ".env" ]; then
        log_warn "Archivo .env no encontrado"
        if [ -f ".env.example" ]; then
            log_info "Creando .env desde .env.example..."
            cp .env.example .env
            log_success "Archivo .env creado. Por favor, edita las variables antes de continuar."
            echo ""
            echo "  nano .env"
            echo ""
            exit 0
        else
            log_error "No se encontro .env.example"
            exit 1
        fi
    fi
    log_success "Archivo .env encontrado"
}

# Construir imagenes
build_images() {
    log_info "Construyendo imagenes Docker..."
    $COMPOSE_CMD build --no-cache
    log_success "Imagenes construidas correctamente"
}

# Iniciar servicios
start_services() {
    log_info "Iniciando servicios..."
    $COMPOSE_CMD up -d
    log_success "Servicios iniciados"
}

# Mostrar estado
show_status() {
    echo ""
    log_info "Estado de los servicios:"
    echo ""
    $COMPOSE_CMD ps
    echo ""
}

# Mostrar URLs
show_urls() {
    source .env 2>/dev/null || true
    FRONTEND_PORT=${FRONTEND_PORT:-80}
    BACKEND_PORT=${BACKEND_PORT:-8082}

    echo ""
    echo "============================================"
    echo " Servicios disponibles:"
    echo "============================================"
    echo ""
    echo "  Frontend (Laravel):  http://localhost:${FRONTEND_PORT}"
    echo "  Backend API:         http://localhost:${BACKEND_PORT}/api"
    echo "  MySQL:               localhost:3306"
    echo ""
    echo "============================================"
    echo " Comandos utiles:"
    echo "============================================"
    echo ""
    echo "  Ver logs:            $COMPOSE_CMD logs -f"
    echo "  Ver logs frontend:   $COMPOSE_CMD logs -f frontend"
    echo "  Ver logs backend:    $COMPOSE_CMD logs -f backend"
    echo "  Ver logs mysql:      $COMPOSE_CMD logs -f mysql"
    echo "  Detener servicios:   $COMPOSE_CMD down"
    echo "  Reiniciar:           $COMPOSE_CMD restart"
    echo "  Estado:              $COMPOSE_CMD ps"
    echo ""
}

# Funcion principal
main() {
    case "${1:-deploy}" in
        deploy)
            check_docker
            check_docker_compose
            check_env
            build_images
            start_services
            show_status
            show_urls
            ;;
        build)
            check_docker
            check_docker_compose
            build_images
            ;;
        start)
            check_docker
            check_docker_compose
            start_services
            show_status
            show_urls
            ;;
        stop)
            check_docker_compose
            log_info "Deteniendo servicios..."
            $COMPOSE_CMD down
            log_success "Servicios detenidos"
            ;;
        restart)
            check_docker_compose
            log_info "Reiniciando servicios..."
            $COMPOSE_CMD restart
            show_status
            ;;
        logs)
            check_docker_compose
            $COMPOSE_CMD logs -f ${2:-}
            ;;
        status)
            check_docker_compose
            show_status
            ;;
        clean)
            check_docker_compose
            log_warn "Eliminando contenedores, volumenes e imagenes..."
            $COMPOSE_CMD down -v --rmi all
            log_success "Limpieza completada"
            ;;
        *)
            echo "Uso: $0 {deploy|build|start|stop|restart|logs|status|clean}"
            echo ""
            echo "Comandos:"
            echo "  deploy   - Construir e iniciar todos los servicios (default)"
            echo "  build    - Solo construir imagenes"
            echo "  start    - Iniciar servicios existentes"
            echo "  stop     - Detener todos los servicios"
            echo "  restart  - Reiniciar todos los servicios"
            echo "  logs     - Ver logs (opcional: nombre del servicio)"
            echo "  status   - Ver estado de los servicios"
            echo "  clean    - Eliminar todo (contenedores, volumenes, imagenes)"
            echo ""
            exit 1
            ;;
    esac
}

main "$@"
