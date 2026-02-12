#!/bin/bash
# ============================================
# Script de instalacion de Docker
# Compatible con RHEL/CentOS y Debian/Ubuntu
# ============================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "============================================"
echo " Instalador de Docker"
echo "============================================"
echo ""

# Detectar sistema operativo
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
    else
        OS="unknown"
    fi
    log_info "Sistema detectado: $OS $VERSION"
}

# Verificar si es root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Este script debe ejecutarse como root"
        echo "Ejecuta: sudo $0"
        exit 1
    fi
}

# Instalar en RHEL/CentOS/Fedora
install_rhel() {
    log_info "Instalando Docker en RHEL/CentOS/Fedora..."

    # Eliminar versiones antiguas
    yum remove -y docker docker-client docker-client-latest \
        docker-common docker-latest docker-latest-logrotate \
        docker-logrotate docker-engine 2>/dev/null || true

    # Instalar dependencias
    yum install -y yum-utils device-mapper-persistent-data lvm2

    # Agregar repositorio de Docker
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

    # Instalar Docker
    yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Iniciar y habilitar Docker
    systemctl start docker
    systemctl enable docker

    log_success "Docker instalado correctamente en RHEL/CentOS"
}

# Instalar en Debian/Ubuntu
install_debian() {
    log_info "Instalando Docker en Debian/Ubuntu..."

    # Actualizar e instalar dependencias
    apt-get update
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Agregar clave GPG oficial de Docker
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Agregar repositorio
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Instalar Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Iniciar y habilitar Docker
    systemctl start docker
    systemctl enable docker

    log_success "Docker instalado correctamente en Debian/Ubuntu"
}

# Agregar usuario al grupo docker
add_user_to_docker_group() {
    if [ -n "$SUDO_USER" ]; then
        log_info "Agregando usuario $SUDO_USER al grupo docker..."
        usermod -aG docker $SUDO_USER
        log_success "Usuario agregado al grupo docker"
        log_warn "Cierra sesion y vuelve a iniciar para aplicar los cambios"
    fi
}

# Verificar instalacion
verify_installation() {
    log_info "Verificando instalacion..."

    if docker --version &> /dev/null; then
        log_success "Docker: $(docker --version)"
    else
        log_error "Docker no se instalo correctamente"
        exit 1
    fi

    if docker compose version &> /dev/null; then
        log_success "Docker Compose: $(docker compose version)"
    else
        log_warn "Docker Compose plugin no disponible, intentando instalar docker-compose standalone..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
            -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose: $(docker-compose --version)"
    fi

    echo ""
    log_info "Probando Docker..."
    docker run --rm hello-world
    log_success "Docker funciona correctamente!"
}

# Main
main() {
    check_root
    detect_os

    case $OS in
        rhel|centos|fedora|rocky|almalinux)
            install_rhel
            ;;
        debian|ubuntu|linuxmint)
            install_debian
            ;;
        *)
            log_error "Sistema operativo no soportado: $OS"
            log_info "Sistemas soportados: RHEL, CentOS, Fedora, Rocky, AlmaLinux, Debian, Ubuntu"
            exit 1
            ;;
    esac

    add_user_to_docker_group
    verify_installation

    echo ""
    echo "============================================"
    log_success "Instalacion completada!"
    echo "============================================"
    echo ""
    echo "Proximos pasos:"
    echo "  1. Cierra sesion y vuelve a iniciar"
    echo "  2. cd $(dirname "$(readlink -f "$0")")"
    echo "  3. cp .env.example .env"
    echo "  4. nano .env  # Editar variables"
    echo "  5. ./docker-deploy.sh deploy"
    echo ""
}

main "$@"
