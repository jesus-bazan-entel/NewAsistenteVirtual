# ============================================
# Frontend - React SPA served by Nginx
# ============================================
# Multi-stage build: Node for building, Nginx for serving
#
# Build:  docker compose -f docker/docker-compose.yml build frontend
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ../docker/nginx/prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
