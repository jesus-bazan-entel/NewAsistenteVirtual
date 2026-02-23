# ============================================
# Backend - Rust/Axum API
# ============================================
# Multi-stage build for minimal production image
#
# Build:  docker compose -f docker/docker-compose.yml build backend
# Shell:  docker compose -f docker/docker-compose.yml exec backend sh
# ============================================

# Stage 1: Build
FROM rust:1.88-slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev libpq-dev && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock* ./
# Create dummy main.rs for dependency caching
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY . .
RUN touch src/main.rs && cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 libpq5 ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/asistente-virtual-backend /usr/local/bin/server
COPY --from=builder /app/migrations /app/migrations
WORKDIR /app
EXPOSE 3000
CMD ["server"]
