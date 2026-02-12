# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing two interconnected projects for a VoIP call testing and monitoring system:

- **monitor_system/** - Node.js Express REST API backend (Sequelize 6, Express 4.17)
- **entel_frontend/** - Laravel 11 + Inertia.js + Vue 3 web frontend (PHP 8.4)

The frontend communicates with the backend via HTTP (Guzzle), and both share the same database (`db_entel`). The system integrates with Asterisk PBX for call origination and monitoring via AMI.

## Default Credentials

| User | Password |
|------|----------|
| demo@entel.com | demo123 |

Created automatically by the backend seeder (`app/seeders/initialData.js`) on first startup.

## Commands

### Docker (Recommended for full stack)

```bash
# Initial setup
cp .env.docker .env

# Start all services (MySQL, Backend, Frontend)
docker-compose up -d

# Development mode with hot-reload and dev tools (phpMyAdmin on :8080, MailHog on :8025)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose build && docker-compose up -d

# Shell into containers
docker-compose exec backend sh
docker-compose exec frontend bash

# Troubleshooting: check backend connectivity from frontend
docker-compose exec frontend curl http://backend:8082/api/health

# Troubleshooting: fix Laravel storage permissions
docker-compose exec frontend chown -R www-data:www-data /var/www/html/storage
docker-compose exec frontend chmod -R 775 /var/www/html/storage
```

### Node.js Backend (monitor_system/)

```bash
cd monitor_system
npm install
npm run dev        # Start server on port 8082 (uses SQLite by default, no DB setup needed)
npm run format     # Format code with js-beautify
```

No test runner is configured for the backend.

### Laravel Frontend (entel_frontend/)

```bash
cd entel_frontend
composer install
npm install && npm run build    # Build frontend assets (Vite + Vue 3)
npm run dev                     # Vite dev mode with HMR
php artisan serve               # Start server on port 8000
php artisan key:generate        # Generate APP_KEY (required for new installs)

# Testing
php artisan test                # PHPUnit (tests/Unit/, tests/Feature/)

# Cache management
php artisan cache:clear && php artisan config:clear
```

### Access URLs

| Service | Docker | Local Dev |
|---------|--------|-----------|
| Frontend | http://localhost | http://localhost:8000 |
| Backend API | http://localhost:8082 | http://localhost:8082 |
| Health Check | http://localhost:8082/api/health | http://localhost:8082/api/health |
| phpMyAdmin (dev) | http://localhost:8080 | - |
| MailHog (dev) | http://localhost:8025 | - |

## Architecture

### Communication Flow

```
Browser → Laravel Frontend (Port 80) → HTTP/Guzzle → Node.js API (Port 8082) → Database
                                                      ↓
                                                Asterisk PBX (AMI)
```

The frontend **never** talks to the database directly for business logic. All data flows through Laravel controllers that proxy HTTP requests to the Node.js API via `Http::get/post(env('API_URL') . 'endpoint')`.

### monitor_system (Node.js Backend)

**Entry Point**: `server.js` — loads env, initializes Asterisk service, syncs DB, runs seeders, mounts routes.

**Startup Flow**:
1. Initializes Asterisk AMI connection (non-blocking, app works without it)
2. Syncs database schema via Sequelize (auto-creates tables)
3. Runs `app/seeders/initialData.js` if no users exist (creates profiles, users, sedes, technologies, operators)
4. Starts Express server on PORT (default 8082)

**Key Directories**:
- `app/models/` — 21 Sequelize models; associations defined in `app/models/index.js`
- `app/controllers/` — 14 controllers, pattern: `{Entity}.controller.js`
- `app/routes/` — 14 route files aggregated in `app/routes/index.js`, base path `/api/`
- `app/services/` — Business logic: asterisk (AMI + config), ejecucion (test execution), ftp (SFTP), checker, log
- `app/seeders/` — Initial data (profiles, default user, sedes, technologies)
- `app/crons/` — `pruebasProgramadasJob.js` (scheduled test execution, disabled by default)
- `app/helpers/` and `app/functions/` — Utility functions (pagination, etc.)
- `app/templates/` — PDF and email templates
- `app/data/` — SQLite database storage (when using sqlite dialect)

**Controller Pattern**:
```javascript
exports.obtenerTodos = async (req, res) => {
    // ...
    res.json({ estado: true, data: results });
};
// Error: res.json({ estado: false, error: "message" });
```

**Authentication**: Dual-mode — LDAP (`app/config/ldap.js` + `AuthLdapController.js`) with bcrypt password fallback. Session tokens not used; the frontend manages sessions independently.

**Asterisk Integration**: AMI connection in `app/services/asterisk.server.service.js` for call origination (`peerToClient`, `clientToDialPlan`) and status monitoring.

### entel_frontend (Laravel 11 + Inertia.js + Vue 3)

**Single-Page App**: One Blade template (`resources/views/app.blade.php`) serves the entire app. Vue 3 pages are resolved via Inertia from `resources/js/Pages/`.

**Entry Point**: `resources/js/app.js` — creates Inertia app with Vue 3, auto-resolves pages from `Pages/` directory.

**Key Directories**:
- `app/Http/Controllers/` — 6 controllers that proxy all requests to the Node.js API
- `app/Http/Middleware/ValidarSesion.php` — checks `Session::has('logeado')` for protected routes
- `routes/web.php` — all routes with middleware groups
- `resources/js/Pages/` — Inertia Vue 3 pages (Auth/, ConfigGeneral/, ConfigAvanzada/, GeneradorPruebas/, Reportes/, Disa/)
- `resources/js/Components/` — reusable Vue components (Layout/, UI/, Forms/)

**Controller Pattern** (API proxy):
```php
public function getUsuarios() {
    $response = Http::get(env('API_URL') . 'usuarios')->throw()->json();
    return $response;
}
```

**Session Auth**: Login sets `Session::put('logeado', true)` and `Session::put('datos_usuario', $data)`. The `varificarSesion` middleware gate protects all non-public routes.

**Route Prefixes**:
- `/configuracion-general/` — Users, profiles, modules
- `/configuracion-avanzada/` — Technologies, operators, equipment, external numbers
- `/generador-pruebas/` — Test matrices, executions, launcher
- `/reportes/` — Test and DISA reports
- `/disa/` — DISA registry module

**Styling**: Tailwind CSS 3.3 with custom theme — brand colors `entel-orange` (#ff6b35), `entel-amber` (#f7931e), `entel-dark` (#0a0a0f); fonts Outfit and JetBrains Mono. See `tailwind.config.js`.

## Database

Both projects connect to database `db_entel`. The backend auto-creates schema via Sequelize sync.

**All Models** (21, defined in `monitor_system/app/models/`):
- **Auth/Config**: Usuarios, Perfiles, Modulos, Submodulos, PerfilSubmodulo, Sedes, LdapConfig, CredencialApi
- **Advanced Config**: Tecnologias, OperadorTelefonico, TecnologiaOperador, Equipos, Canales, Numeroexterno
- **Testing**: Pruebas, Matrices, MatrizCanalDestino, Ejecuciones, Escenarios, Errores
- **DISA**: RegistroClave, CanalClave

**Key Associations** (defined in `monitor_system/app/models/index.js`):
- `Usuarios` → belongsTo `Perfiles`
- `Perfiles` ↔ `Submodulos` (many-to-many via PerfilSubmodulo)
- `Modulos` → hasMany `Submodulos`
- `Pruebas` → belongsTo `Matrices`, belongsTo `Usuarios`, hasMany `Ejecuciones`
- `Ejecuciones` → hasMany `Escenarios`
- `Matrices` → hasMany `MatrizCanalDestino`
- `Equipos` → hasMany `Canales`, belongsTo `Sedes`
- `Canales` → belongsTo `TecnologiaOperador`
- `Tecnologias` ↔ `OperadorTelefonico` (many-to-many via TecnologiaOperador)
- `RegistroClave` ↔ `Canales` (many-to-many via CanalClave)
- `Escenarios` → belongsTo `Canal` (origen/destino), belongsTo `Numeroexterno`, belongsTo `Errores`

**Execution Status Values**: `PENDIENTE`, `CREADO`, `FINALIZADO`

## Docker

**Services** (docker-compose.yml):
- `mysql` (port 3306) — MySQL 8.0 with mysql_native_password auth
- `backend` (port 8082) — Node.js API, node:18-alpine, health check via wget
- `frontend` (port 80) — PHP 8.4-apache, health check via curl

**Dev Overlay** (docker-compose.dev.yml):
- `phpmyadmin` (port 8080) — database management
- `mailhog` (ports 1025/8025) — email testing
- Mounts source code as volumes (with node_modules/vendor excluded)

**Network**: Custom bridge `entel-network` (172.28.0.0/16). Services reference each other by container name (e.g., `http://backend:8082`).

**Frontend Entrypoint** (`docker-entrypoint.sh`): Auto-generates `.env`, waits for MySQL (30 retries), generates APP_KEY, clears caches, creates storage symlink, optionally runs migrations (`RUN_MIGRATIONS=true`), caches config/routes.

## Configuration

**Node.js Backend** (`monitor_system/.env`):
- `DB_DIALECT` — sqlite (default), mysql, mariadb, postgres
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — database connection
- `DB_SQLITE_PATH` — SQLite file path (default: `data/database.sqlite`)
- `ASTERISK_HOST`, `ASTERISK_PORT`, `ASTERISK_USER`, `ASTERISK_PASSWORD`, `ASTERISK_ENV` — Asterisk AMI
- `LDAP_HOST`, `LDAP_BIND_DN`, `LDAP_BASE_DN`, `LDAP_BASE_USER`, `LDAP_TIMEOUT` — LDAP auth
- `SMTP_HOST`, `SMTP_PORT` — email
- `FTP_HOST`, `FTP_USER`, `FTP_PWD` — SFTP access

**Laravel Frontend** (`entel_frontend/.env`):
- `API_URL` — Node.js backend URL (e.g., `http://localhost:8082/api/` or `http://backend:8082/api/` in Docker)
- `DB_*` — database connection (same as backend)
- `APP_KEY` — Laravel application key (generate with `php artisan key:generate`)
