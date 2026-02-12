# Guía de Despliegue con Docker

Sistema de Monitoreo VoIP - Entel

## Requisitos

- Docker 20.10+
- Docker Compose 2.0+

## Inicio Rápido

### 1. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.docker .env

# Editar con tus valores
nano .env
```

### 2. Construir las imágenes

```bash
docker-compose build
```

### 3. Iniciar los servicios

```bash
docker-compose up -d
```

### 4. Verificar estado

```bash
docker-compose ps
docker-compose logs -f
```

## Acceso a la Aplicación

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8082 |
| Health Check | http://localhost:8082/api/health |

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f frontend
docker-compose logs -f backend

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (datos)
docker-compose down -v

# Reconstruir sin cache
docker-compose build --no-cache

# Ejecutar comando en contenedor
docker-compose exec backend sh
docker-compose exec frontend bash
```

## Configuración

### Variables de Entorno Principales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `FRONTEND_PORT` | Puerto del frontend | `80` |
| `BACKEND_PORT` | Puerto del backend API | `8082` |
| `APP_URL` | URL pública de la app | `http://localhost` |
| `DB_HOST` | Host de MySQL | `mysql` |
| `DB_NAME` | Nombre de la base de datos | `db_entel` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | - |
| `ASTERISK_HOST` | Host del servidor Asterisk | - |
| `ASTERISK_PORT` | Puerto AMI de Asterisk | `5038` |

### Habilitar MySQL

Por defecto el backend usa SQLite. Para usar MySQL:

1. Descomentar el servicio `mysql` en `docker-compose.yml`
2. Configurar las variables `DB_*` en `.env`
3. Reconstruir: `docker-compose up -d`

## Estructura de Volúmenes

```
volumes:
  backend-data    → /app/data (SQLite, logs)
  frontend-storage → /var/www/html/storage (Laravel storage)
```

## Producción

### Recomendaciones

1. **HTTPS**: Usar un reverse proxy (Nginx/Traefik) con SSL
2. **Secrets**: Usar Docker secrets para contraseñas
3. **Logs**: Configurar log rotation
4. **Backup**: Programar backups de volúmenes

### Ejemplo con Nginx Proxy

```yaml
# Agregar a docker-compose.yml
nginx:
  image: nginx:alpine
  ports:
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
    - ./certs:/etc/ssl/certs
  depends_on:
    - frontend
```

## Solución de Problemas

### El frontend no conecta con el backend

```bash
# Verificar red Docker
docker network inspect asistentevirtual_entel-network

# Probar conectividad
docker-compose exec frontend curl http://backend:8082/api/health
```

### Permisos de storage en Laravel

```bash
docker-compose exec frontend chown -R www-data:www-data /var/www/html/storage
docker-compose exec frontend chmod -R 775 /var/www/html/storage
```

### Regenerar APP_KEY

```bash
docker-compose exec frontend php artisan key:generate
```

## Credenciales por Defecto

| Usuario | Contraseña |
|---------|------------|
| demo@entel.com | demo123 |

---

Desarrollado por NEWIP
