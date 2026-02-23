# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo for a VoIP call testing and monitoring system. Manages SIM gateways, test matrices, and automated call scenarios via Asterisk PBX.

- **backend/** — Rust 1.77 REST + WebSocket API (Axum 0.7, SQLx 0.7, PostgreSQL)
- **frontend/** — React 18 SPA (TypeScript 5.5, Vite 5, Tailwind 3.4, Zustand 4)
- **docker/** — Container configs (Asterisk PBX, Nginx, dev tooling)
- **scripts/** — Migration utilities (MySQL → PostgreSQL)

## Default Credentials

| User | Password |
|------|----------|
| demo@entel.com | demo123 |

Created by the seed migration (`backend/migrations/20260222000099_seed_initial_data.sql`).

## Commands

### Rust Backend (backend/)

```bash
cd backend
cargo run                # Start server on port 3000
cargo build --release    # Release build
cargo check              # Fast type-check without building
cargo test               # Run tests
```

Requires PostgreSQL running with the `DATABASE_URL` from `.env`.

### React Frontend (frontend/)

```bash
cd frontend
npm install
npm run dev              # Vite dev server on port 5173 (proxies /api → :3000)
npm run build            # TypeScript check + production build to dist/
npm run preview          # Preview production build
```

### Docker — Production (Asterisk only)

```bash
# PostgreSQL, Backend, and Frontend run natively on the server.
# Only Asterisk PBX is containerized.
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml logs -f
docker compose -f docker/docker-compose.yml exec asterisk asterisk -rvvv
```

### Docker — Full Dev Stack

```bash
# Adds: cargo-watch, Vite HMR, pgAdmin, MailHog
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```

### Offline Deployment

```bash
# Build and export all images for air-gapped servers
bash docker/scripts/build-and-export.sh

# On target server — import and start
bash docker/scripts/import-and-deploy.sh
```

### Access URLs

| Service | Docker Dev | Local Dev |
|---------|-----------|-----------|
| Frontend | http://localhost | http://localhost:5173 |
| Backend API | http://localhost:3000 | http://localhost:3000 |
| Health Check | http://localhost:3000/api/health | http://localhost:3000/api/health |
| WebSocket | ws://localhost:3000/ws | ws://localhost:3000/ws |
| pgAdmin (dev) | http://localhost:5050 | — |
| MailHog (dev) | http://localhost:8025 | — |

## Architecture

### Communication Flow

```
Browser → Nginx (Port 80) ─┬─ /api/* ──→ Rust API (Port 3000) → PostgreSQL
                            ├─ /ws/* ───→ Rust API (WebSocket)
                            └─ /* ──────→ React SPA (static)
                                          Rust API → Asterisk PBX (AMI :5038)
```

In local dev, Vite proxies `/api` and `/ws` to `localhost:3000` directly.

### backend/ (Rust)

**Entry point**: `src/main.rs` — loads config, runs SQLx migrations, connects to Asterisk (non-blocking), starts Axum server.

**Key directories**:
- `src/models/` — 24 model files; structs for DB rows, create/update DTOs, and response types
- `src/routes/` — 16 route files aggregated in `src/routes/mod.rs`, base path `/api/`
- `src/services/` — Business logic: ejecucion, email (lettre), PDF (printpdf), FTP (ssh2)
- `src/asterisk/` — AMI client (`ami.rs`), config generation (`config_gen.rs`), event handlers
- `src/auth/` — JWT handlers, middleware extractor, bcrypt password verification
- `src/scheduler/` — `pruebas_job.rs` (10s interval, executes scheduled tests)
- `src/ws/` — WebSocket upgrade handler; broadcasts AMI events to connected clients
- `src/config.rs` — Env-based config struct
- `src/db.rs` — PgPool initialization (max 20 connections)
- `src/error.rs` — `AppError` enum with HTTP status mapping
- `migrations/` — 24 SQL migration files + 1 seed data migration

**Shared state** (`Arc<AppState>`):
- `PgPool` — database connection pool
- `Config` — environment configuration
- `broadcast::Sender<String>` — WebSocket event channel
- `Arc<RwLock<Option<Arc<AmiClient>>>>` — Asterisk AMI connection

**API response pattern**:
```json
{ "estado": true, "data": ... }
{ "estado": false, "error": "message" }
```

**Authentication**: JWT (HS256) via `Authorization: Bearer <token>` header. Login returns token + user data with navigation menu built from profile permissions. Token claims: `{sub, correo, id_perfil, exp}`. Configurable expiration (default 24h). LDAP fallback supported.

### frontend/ (React)

**Entry point**: `src/main.tsx` → `src/App.tsx` (BrowserRouter with route definitions).

**Key directories**:
- `src/api/` — Axios client with auth interceptor + typed API modules (auth, config-general, config-avanzada, pruebas)
- `src/stores/` — Zustand stores: `authStore` (token/user, persisted to localStorage), `callStore` (real-time AMI events)
- `src/hooks/` — `useAuth`, `useCrud<T>` (generic fetch with polling), `useWebSocket` (auto-reconnect)
- `src/pages/` — Route-level page components organized by module
- `src/components/ui/` — Button, Card, DataTable, Modal, Toast
- `src/components/forms/` — TextInput, SelectInput
- `src/components/layout/` — AppLayout, Header, Sidebar
- `src/components/pruebas/` — MatrizEditor, EscenarioStatus

**Route protection**: `ProtectedRoute` wrapper checks `authStore.isAuthenticated`, redirects to `/` if false.

**Styling**: Dark theme with glass-morphism. Brand colors: `entel-orange` (#ff6b35), `entel-amber` (#f7931e), `entel-dark` (#0a0a0f). Fonts: Outfit (sans), JetBrains Mono (mono).

## API Endpoints

All routes under `/api/`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/login` | Login (correo, clave) → JWT + menu |
| GET/POST | `/usuarios` | User CRUD |
| GET/POST | `/perfiles` | Profile CRUD (with submodule assignments) |
| GET | `/modulos` | Navigation modules with submodules |
| GET | `/sedes` | Location list |
| GET/POST | `/tecnologias` | Technology CRUD |
| GET/POST | `/operadores-telefonicos` | Carrier CRUD |
| GET/POST | `/equipos` | Equipment CRUD (with nested channels) |
| GET/PUT | `/canales` | Channel management |
| GET/POST | `/numeros-externos` | External number CRUD |
| GET/POST | `/matrices` | Test matrix CRUD |
| GET/POST | `/pruebas` | Test definition CRUD |
| POST | `/pruebas/ejecutar/c2c` | Execute channel-to-channel test |
| POST | `/pruebas/ejecutar/matriz` | Execute matrix test |
| POST | `/pruebas/:id/ejecutar` | Execute specific test |
| GET | `/pruebas/:id/ultima-ejecucion` | Get last execution |
| GET | `/ejecuciones` | List executions |
| GET | `/ejecuciones/:id` | Execution details |
| GET | `/ejecuciones/:id/escenarios` | Scenarios for execution |
| GET | `/ejecuciones/:id/pdf` | Download PDF report |
| POST | `/ejecuciones/:id/reenviar` | Resend report email |
| GET/POST | `/registro-clave` | DISA key registrations |
| GET/POST | `/ldap-config` | LDAP settings |
| GET/PUT | `/asterisk-config` | Asterisk AMI config |
| POST | `/asterisk-config/test` | Test AMI connection |
| POST | `/asterisk-config/reconnect` | Force reconnect |
| POST | `/asterisk-config/sync` | Sync configs to Asterisk |
| GET | `/asterisk-config/status` | AMI connection status |

## Frontend Routes

| Path | Page |
|------|------|
| `/` | Login |
| `/principal` | Dashboard |
| `/configuracion-general/usuarios` | User management |
| `/configuracion-general/perfiles` | Profile/role management |
| `/configuracion-general/ldap` | LDAP configuration |
| `/configuracion-avanzada/tecnologias` | Technologies |
| `/configuracion-avanzada/operadores-telefonicos` | Carriers/operators |
| `/configuracion-avanzada/equipos` | Equipment & channels |
| `/configuracion-avanzada/numeros-externos` | External numbers |
| `/configuracion-avanzada/asterisk` | Asterisk AMI config |
| `/generador-pruebas/matrices` | Test matrices |
| `/generador-pruebas/matrices/:id` | Matrix detail editor |
| `/generador-pruebas/lanzador-pruebas` | Test launcher |
| `/reportes/reporte-pruebas` | Test execution reports |

## Database

PostgreSQL database `asistente_virtual`. Schema managed by SQLx migrations in `backend/migrations/`.

**Tables (25)**:
- **Auth/Config**: usuarios, perfiles, modulos, submodulos, perfiles_submodulos, sedes, ldap_config, credenciales_api, asterisk_config
- **VoIP Config**: tecnologias, operadores_telefonicos, tecnologias_operadores, equipos, canales, numeros_externos
- **Testing**: matrices, matriz_canal_destino, pruebas, ejecuciones, escenarios, errores
- **DISA**: registros_claves, canales_claves

**Key associations**:
- `usuarios` → belongsTo `perfiles`
- `perfiles` ↔ `submodulos` (many-to-many via `perfiles_submodulos`)
- `modulos` → hasMany `submodulos`
- `pruebas` → belongsTo `matrices`, belongsTo `usuarios`, hasMany `ejecuciones`
- `ejecuciones` → hasMany `escenarios`
- `matrices` → hasMany `matriz_canal_destino`
- `equipos` → hasMany `canales`, belongsTo `sedes`
- `canales` → belongsTo `tecnologias_operadores`
- `tecnologias` ↔ `operadores_telefonicos` (many-to-many via `tecnologias_operadores`)
- `registros_claves` ↔ `canales` (many-to-many via `canales_claves`)
- `escenarios` → belongsTo `canales` (origen/destino), belongsTo `numeros_externos`, belongsTo `errores`

**Execution status values**: `PENDIENTE`, `CREADO`, `FINALIZADO`
**Channel call states**: `LIBRE`, `SALIENTE`, `ENTRANTE`
**Estado flags**: `A` (active), `D` (disabled)

## Configuration

### Backend (backend/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://platform:platform123@localhost:5432/asistente_virtual` | PostgreSQL connection |
| `PORT` | `3000` | API server port |
| `JWT_SECRET` | — | HS256 signing key |
| `JWT_EXPIRATION_HOURS` | `24` | Token lifetime |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `ASTERISK_HOST` | `localhost` | AMI host |
| `ASTERISK_PORT` | `5038` | AMI port |
| `ASTERISK_USER` | `admin` | AMI username |
| `ASTERISK_PASSWORD` | `admin` | AMI password |
| `ASTERISK_ENV` | `local` | `local` (write files) or `docker` (upload via SFTP) |
| `SMTP_HOST` | `localhost` | SMTP server |
| `SMTP_PORT` | `25` | SMTP port |
| `FTP_HOST` | — | SFTP host for Asterisk config upload |
| `FTP_USER` | — | SFTP username |
| `FTP_PWD` | — | SFTP password |
| `LDAP_HOST` | — | LDAP server (optional) |
| `LDAP_BIND_DN` | — | LDAP bind DN |
| `LDAP_BASE_DN` | — | LDAP base DN |
| `LDAP_BASE_USER` | — | LDAP base user |
| `LDAP_TIMEOUT` | `5000` | LDAP timeout (ms) |
| `RUST_LOG` | `info` | Tracing filter level |

### Docker (docker/.env)

Same variables as above, plus:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `asistente_virtual` | PostgreSQL database name |
| `POSTGRES_USER` | `platform` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `platform123` | PostgreSQL password |

## Docker

### Production (docker/docker-compose.yml)

Only Asterisk PBX is containerized. PostgreSQL, backend, and frontend run natively.

- **asterisk** — Debian Bullseye with legacy chan_sip. Host network mode (ports 5060 SIP, 5038 AMI). Mounts dynamic monitoreo configs from `docker/data/asterisk/`.

### Development Overlay (docker/docker-compose.dev.yml)

Adds containerized versions of all services:

| Service | Container | Port | Notes |
|---------|-----------|------|-------|
| backend | av-backend-dev | 3000 | cargo-watch live reload |
| frontend | av-frontend-dev | 80 | Nginx proxying to Vite |
| frontend-dev | av-vite-dev | 5173 | Vite HMR |
| pgadmin | av-pgadmin | 5050 | admin@asistente.local / admin |
| mailhog | av-mailhog | 1025/8025 | SMTP capture + web UI |

Network: custom bridge `entel-network` (172.28.0.0/16).

### Nginx (docker/nginx/)

- `dev.conf` — Proxies `/api/` and `/ws/` to backend:3000, everything else to Vite dev server
- `prod.conf` — Serves React static files, proxies API/WS, gzip compression, 1-year static asset cache

### Asterisk (docker/asterisk/)

- Built on Debian Bullseye (legacy chan_sip support, PJSIP disabled)
- `entrypoint.sh` auto-generates `manager.conf` from env vars
- Static configs: `sip.conf`, `extensions.conf`, `modules.conf`
- Dynamic configs (generated by backend): `sip.monitoreo.conf`, `extensions.monitoreo.conf`
- Mounted from `docker/data/asterisk/`
