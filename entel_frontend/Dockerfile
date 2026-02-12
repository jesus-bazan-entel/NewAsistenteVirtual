# ============================================
# Frontend Laravel - Multi-stage build
# Compatible con RHEL/Debian
# ============================================

# Stage 1: Instalar dependencias de Composer
FROM composer:2 AS composer-deps

WORKDIR /app

# Copiar composer.json
COPY composer.json ./

# Instalar dependencias (genera composer.lock si no existe)
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-reqs

# ============================================
# Stage 2: Compilar assets con Node.js/Vite
# ============================================
FROM node:18-alpine AS assets-builder

WORKDIR /app

# Copiar archivos de configuracion de npm
COPY package*.json ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Instalar dependencias de Node
RUN npm install --legacy-peer-deps

# Copiar recursos necesarios para el build
COPY resources ./resources
COPY public ./public

# Compilar assets para produccion
RUN npm run build

# ============================================
# Stage 3: Imagen de produccion
# ============================================
FROM php:8.4-apache AS production

# Argumentos de build
ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Lima

# Instalar extensiones PHP y dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    unzip \
    curl \
    wget \
    ca-certificates \
    tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mysqli \
        gd \
        zip \
        intl \
        opcache \
        mbstring \
        xml \
        curl \
        bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Configurar Apache
RUN a2enmod rewrite headers expires deflate

# Configurar DocumentRoot para Laravel
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Configurar Apache para permitir .htaccess
RUN echo '<Directory /var/www/html/public>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel

# Configurar PHP para produccion
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configuracion de PHP optimizada
RUN echo "memory_limit = 256M" >> "$PHP_INI_DIR/conf.d/custom.ini" \
    && echo "upload_max_filesize = 64M" >> "$PHP_INI_DIR/conf.d/custom.ini" \
    && echo "post_max_size = 64M" >> "$PHP_INI_DIR/conf.d/custom.ini" \
    && echo "max_execution_time = 300" >> "$PHP_INI_DIR/conf.d/custom.ini" \
    && echo "max_input_time = 300" >> "$PHP_INI_DIR/conf.d/custom.ini"

# Configuracion de OPcache para mejor rendimiento
RUN echo "opcache.enable=1" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.memory_consumption=128" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.interned_strings_buffer=8" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.max_accelerated_files=10000" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.revalidate_freq=0" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.validate_timestamps=0" >> "$PHP_INI_DIR/conf.d/opcache.ini" \
    && echo "opcache.save_comments=1" >> "$PHP_INI_DIR/conf.d/opcache.ini"

WORKDIR /var/www/html

# Copiar dependencias de Composer
COPY --from=composer-deps /app/vendor ./vendor

# Copiar assets compilados
COPY --from=assets-builder /app/public/build ./public/build

# Copiar codigo de la aplicacion
COPY . .

# Instalar autoloader optimizado de Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer dump-autoload --optimize --no-dev

# Crear directorios necesarios y establecer permisos
RUN mkdir -p storage/framework/{sessions,views,cache} \
    && mkdir -p storage/logs \
    && mkdir -p storage/app/public \
    && mkdir -p bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Limpiar archivos innecesarios
RUN rm -rf \
    .git \
    .gitignore \
    .gitattributes \
    tests \
    phpunit.xml \
    *.md \
    node_modules \
    .env.example \
    .env.local

# Variables de entorno por defecto
ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    TZ=America/Lima

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Script de inicio
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
