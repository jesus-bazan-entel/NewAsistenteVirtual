# ============================================
# Backend Node.js - Multi-stage build
# Compatible con RHEL/Debian (imagen Alpine)
# ============================================

# Stage 1: Builder - Instalar dependencias
FROM node:18-alpine AS builder

# Instalar dependencias de compilacion para modulos nativos
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Copiar archivos de dependencias primero (mejor cache)
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para compilacion)
RUN npm install

# ============================================
# Stage 2: Imagen de produccion
# ============================================
FROM node:18-alpine AS production

# Instalar dependencias de runtime necesarias
RUN apk add --no-cache \
    tini \
    wget \
    curl \
    tzdata \
    && cp /usr/share/zoneinfo/America/Lima /etc/localtime \
    && echo "America/Lima" > /etc/timezone

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copiar node_modules desde builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar codigo de la aplicacion
COPY --chown=nodejs:nodejs . .

# Crear directorios necesarios
RUN mkdir -p /app/data /app/logs \
    && chown -R nodejs:nodejs /app/data /app/logs

# Limpiar archivos innecesarios
RUN rm -rf \
    .git \
    .gitignore \
    *.md \
    .env.example \
    tests \
    coverage

# Cambiar a usuario no-root
USER nodejs

# Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=8082 \
    TZ=America/Lima

# Exponer puerto
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:8082/api/health || exit 1

# Usar tini como init system para manejo correcto de senales
ENTRYPOINT ["/sbin/tini", "--"]

# Comando de inicio
CMD ["node", "server.js"]
