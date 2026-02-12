#!/bin/bash
set -e

echo "=========================================="
echo "Iniciando contenedor Laravel..."
echo "=========================================="

# Crear archivo .env si no existe (requerido por Laravel)
if [ ! -f ".env" ]; then
    echo "Creando archivo .env desde variables de entorno..."
    cat > .env <<EOF
APP_NAME="${APP_NAME:-Entel}"
APP_ENV=${APP_ENV:-production}
APP_KEY=
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}

LOG_CHANNEL=${LOG_CHANNEL:-stderr}
LOG_LEVEL=${LOG_LEVEL:-warning}

DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-db_entel}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-}

API_URL=${API_URL:-http://backend:8082/api/}

SESSION_DRIVER=${SESSION_DRIVER:-file}
SESSION_LIFETIME=${SESSION_LIFETIME:-120}

CACHE_DRIVER=${CACHE_DRIVER:-file}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-sync}
EOF
    chown www-data:www-data .env
fi

# Esperar a que MySQL este disponible
if [ -n "$DB_HOST" ]; then
    echo "Esperando conexion a MySQL ($DB_HOST:$DB_PORT)..."
    max_tries=30
    counter=0
    until php -r "new PDO('mysql:host=$DB_HOST;port=${DB_PORT:-3306}', '$DB_USERNAME', '$DB_PASSWORD');" 2>/dev/null; do
        counter=$((counter + 1))
        if [ $counter -gt $max_tries ]; then
            echo "ERROR: No se pudo conectar a MySQL despues de $max_tries intentos"
            exit 1
        fi
        echo "Intento $counter/$max_tries - MySQL no disponible, reintentando en 2s..."
        sleep 2
    done
    echo "Conexion a MySQL establecida!"
fi

# Generar APP_KEY si no existe
if [ -z "$APP_KEY" ]; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
fi

# Limpiar caches anteriores
echo "Limpiando caches..."
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

# Crear enlace simbolico de storage
if [ ! -L "public/storage" ]; then
    echo "Creando enlace simbolico de storage..."
    php artisan storage:link 2>/dev/null || true
fi

# Ejecutar migraciones si se especifica
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Ejecutando migraciones..."
    php artisan migrate --force
fi

# Cachear configuracion para produccion
echo "Cacheando configuracion para produccion..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimizar autoloader
echo "Optimizando autoloader..."
composer dump-autoload --optimize --no-dev 2>/dev/null || true

echo "=========================================="
echo "Laravel listo! Iniciando Apache..."
echo "=========================================="

# Ejecutar comando pasado
exec "$@"
