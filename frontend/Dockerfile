# ============================================
# Frontend - React SPA served by Nginx
# ============================================
# Multi-stage build: Node for building, Nginx for serving
# Build context must be repository root (..) to access docker/nginx/prod.conf
#
# Build:  docker compose -f docker/docker-compose.yml build frontend
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
RUN apk add --no-cache curl openssl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/prod.conf /etc/nginx/conf.d/default.conf
# Generate a default self-signed cert (overridden at deploy time via volume mount)
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/server.key \
      -out /etc/nginx/ssl/server.crt \
      -subj "/C=CL/ST=Santiago/L=Santiago/O=AsistenteVirtual/CN=localhost"
EXPOSE 80 443
