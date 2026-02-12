# Plan de Migración - Sistema de Monitoreo Entel

**Fecha de creación:** 2026-02-03
**Versión del documento:** 1.0
**Sistema:** Monitor System (Backend Node.js) + Entel Frontend (Laravel 11)

---

## Resumen Ejecutivo

Este documento describe el plan de migración para actualizar el sistema de monitoreo y testing de llamadas. La migración incluye:

- **Backend:** Node.js Express API (`monitor_system/`)
- **Frontend:** Laravel 11 con Inertia.js (`entel_frontend/`)
- **Base de Datos:** MySQL (`db_entel`)

---

## FASE 1: PREPARACIÓN Y BACKUP (PRIORITARIO)

### 1.1 Backup de Base de Datos MySQL

**Prioridad:** CRÍTICA
**Responsable:** DBA / DevOps
**Tiempo estimado de ejecución:** Variable según tamaño de datos

#### 1.1.1 Backup Completo de la Base de Datos

```bash
# Crear directorio de backups con fecha
mkdir -p /backups/migracion_$(date +%Y%m%d)

# Backup completo con estructura y datos
mysqldump -h localhost -u root -p \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-database \
    --databases db_entel \
    > /backups/migracion_$(date +%Y%m%d)/db_entel_full_backup.sql

# Backup solo estructura (sin datos)
mysqldump -h localhost -u root -p \
    --no-data \
    --routines \
    --triggers \
    --events \
    db_entel \
    > /backups/migracion_$(date +%Y%m%d)/db_entel_schema_only.sql

# Backup solo datos (sin estructura)
mysqldump -h localhost -u root -p \
    --no-create-info \
    --complete-insert \
    db_entel \
    > /backups/migracion_$(date +%Y%m%d)/db_entel_data_only.sql
```

#### 1.1.2 Verificación del Backup

```bash
# Verificar integridad del archivo SQL
head -100 /backups/migracion_$(date +%Y%m%d)/db_entel_full_backup.sql
tail -50 /backups/migracion_$(date +%Y%m%d)/db_entel_full_backup.sql

# Verificar tamaño del backup
ls -lh /backups/migracion_$(date +%Y%m%d)/

# Verificar que el backup contiene todas las tablas esperadas
grep "CREATE TABLE" /backups/migracion_$(date +%Y%m%d)/db_entel_schema_only.sql | wc -l
```

#### 1.1.3 Tablas Principales a Verificar

Asegurar que el backup incluya las siguientes tablas críticas:

| Tabla | Descripción | Prioridad |
|-------|-------------|-----------|
| `Usuarios` | Cuentas de usuario | CRÍTICA |
| `Perfiles` | Roles y permisos | CRÍTICA |
| `Pruebas` | Definiciones de tests | CRÍTICA |
| `Ejecuciones` | Registros de ejecución | ALTA |
| `Escenarios` | Escenarios de prueba | ALTA |
| `Matrices` | Configuraciones de routing | ALTA |
| `Canales` | Canales de comunicación | MEDIA |
| `Equipos` | Equipos telefónicos | MEDIA |
| `Tecnologias` | Tipos de tecnología | MEDIA |
| `OperadorTelefonico` | Operadores | MEDIA |
| `Modulos` | Módulos del sistema | BAJA |
| `Submodulos` | Submódulos | BAJA |
| `PerfilSubmodulo` | Relación perfiles-submodulos | BAJA |
| `Sedes` | Ubicaciones/sedes | BAJA |

### 1.2 Backup del Código Fuente

```bash
# Backup del backend
tar -czvf /backups/migracion_$(date +%Y%m%d)/monitor_system_backup.tar.gz \
    --exclude='node_modules' \
    --exclude='*.log' \
    monitor_system/

# Backup del frontend
tar -czvf /backups/migracion_$(date +%Y%m%d)/entel_frontend_backup.tar.gz \
    --exclude='vendor' \
    --exclude='node_modules' \
    --exclude='storage/logs/*' \
    entel_frontend/

# Backup de archivos de configuración
cp monitor_system/.env /backups/migracion_$(date +%Y%m%d)/monitor_system_env.backup
cp entel_frontend/.env /backups/migracion_$(date +%Y%m%d)/entel_frontend_env.backup
```

### 1.3 Documentar Estado Actual

```bash
# Versiones actuales
node -v > /backups/migracion_$(date +%Y%m%d)/versiones.txt
npm -v >> /backups/migracion_$(date +%Y%m%d)/versiones.txt
php -v >> /backups/migracion_$(date +%Y%m%d)/versiones.txt
mysql --version >> /backups/migracion_$(date +%Y%m%d)/versiones.txt

# Lista de dependencias instaladas
cd monitor_system && npm list --depth=0 > /backups/migracion_$(date +%Y%m%d)/npm_dependencies.txt
cd entel_frontend && composer show > /backups/migracion_$(date +%Y%m%d)/composer_dependencies.txt
```

---

## FASE 2: MIGRACIÓN DE BASE DE DATOS

### 2.1 Preparación del Entorno de Destino

#### 2.1.1 Crear Base de Datos en Servidor Destino

```sql
-- Conectar como root
mysql -u root -p

-- Crear base de datos con charset correcto
CREATE DATABASE IF NOT EXISTS db_entel
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico para la aplicación
CREATE USER IF NOT EXISTS 'entel_app'@'localhost'
    IDENTIFIED BY 'password_seguro_aqui';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON db_entel.* TO 'entel_app'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES LIKE 'db_entel';
```

### 2.2 Restauración del Backup

```bash
# Restaurar backup completo
mysql -h localhost -u root -p db_entel < /backups/migracion_$(date +%Y%m%d)/db_entel_full_backup.sql

# Verificar restauración
mysql -u root -p -e "USE db_entel; SHOW TABLES;"
mysql -u root -p -e "USE db_entel; SELECT COUNT(*) FROM Usuarios;"
mysql -u root -p -e "USE db_entel; SELECT COUNT(*) FROM Pruebas;"
```

### 2.3 Validación Post-Migración de BD

```sql
-- Script de validación
USE db_entel;

-- Verificar conteo de registros en tablas críticas
SELECT 'Usuarios' as tabla, COUNT(*) as registros FROM Usuarios
UNION ALL
SELECT 'Perfiles', COUNT(*) FROM Perfiles
UNION ALL
SELECT 'Pruebas', COUNT(*) FROM Pruebas
UNION ALL
SELECT 'Ejecuciones', COUNT(*) FROM Ejecuciones
UNION ALL
SELECT 'Escenarios', COUNT(*) FROM Escenarios
UNION ALL
SELECT 'Matrices', COUNT(*) FROM Matrices;

-- Verificar integridad de relaciones
SELECT COUNT(*) as usuarios_sin_perfil
FROM Usuarios u
LEFT JOIN Perfiles p ON u.id_perfil = p.id
WHERE p.id IS NULL;

-- Verificar índices
SHOW INDEX FROM Usuarios;
SHOW INDEX FROM Pruebas;
```

---

## FASE 3: MIGRACIÓN DEL BACKEND (Node.js)

### 3.1 Preparación del Servidor

```bash
# Verificar versión de Node.js (recomendado: Node 18+ LTS)
node -v

# Actualizar Node.js si es necesario (usando nvm)
nvm install 18
nvm use 18

# Verificar npm
npm -v
```

### 3.2 Despliegue del Backend

```bash
# Clonar/copiar código fuente
cd /var/www/
cp -r /path/to/nuevo/monitor_system ./monitor_system_new

# Instalar dependencias
cd monitor_system_new
npm install

# Copiar configuración de entorno
cp /backups/migracion_$(date +%Y%m%d)/monitor_system_env.backup .env

# Editar .env con nuevos valores si es necesario
nano .env
```

### 3.3 Configuración del Backend (.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=db_entel
DB_USER=entel_app
DB_PASSWORD=password_seguro_aqui

# Asterisk AMI
ASTERISK_HOST=ip_asterisk
ASTERISK_PORT=5038
ASTERISK_USER=admin
ASTERISK_SECRET=secreto

# LDAP
LDAP_URL=ldap://servidor-ldap
LDAP_USER=cn=admin,dc=empresa,dc=com
LDAP_PWD=ldap_password

# SMTP
SMTP_HOST=smtp.empresa.com
SMTP_PORT=587

# FTP
FTP_HOST=ftp.empresa.com
FTP_USER=usuario_ftp
FTP_PWD=ftp_password

# Server
PORT=8082
```

### 3.4 Verificación del Backend

```bash
# Ejecutar en modo desarrollo para verificar
npm run dev

# Verificar endpoints principales
curl http://localhost:8082/api/health
curl http://localhost:8082/api/usuarios
```

### 3.5 Configuración como Servicio (systemd)

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/monitor-system.service
```

```ini
[Unit]
Description=Monitor System Node.js API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/monitor_system
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=monitor-system
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar y arrancar servicio
sudo systemctl daemon-reload
sudo systemctl enable monitor-system
sudo systemctl start monitor-system
sudo systemctl status monitor-system
```

---

## FASE 4: MIGRACIÓN DEL FRONTEND (Laravel 11)

### 4.1 Preparación del Servidor

```bash
# Verificar versión de PHP (requerido: PHP 8.2+)
php -v

# Verificar extensiones PHP requeridas
php -m | grep -E "(pdo|mysql|mbstring|xml|curl|zip|gd)"

# Instalar extensiones faltantes (Ubuntu/Debian)
sudo apt install php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-gd
```

### 4.2 Despliegue del Frontend

```bash
# Copiar código fuente
cd /var/www/
cp -r /path/to/nuevo/entel_frontend ./entel_frontend_new

# Instalar dependencias PHP
cd entel_frontend_new
composer install --optimize-autoloader --no-dev

# Instalar dependencias NPM (para assets)
npm install
npm run build

# Configurar permisos
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 4.3 Configuración del Frontend (.env)

```env
APP_NAME="Entel Monitor"
APP_ENV=production
APP_KEY=base64:GENERAR_NUEVA_CLAVE
APP_DEBUG=false
APP_URL=https://monitor.empresa.com

LOG_CHANNEL=stack
LOG_LEVEL=error

# Base de datos (misma que backend)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=db_entel
DB_USERNAME=entel_app
DB_PASSWORD=password_seguro_aqui

# API Backend
API_URL=http://localhost:8082/api/

# Cache y sesiones
CACHE_DRIVER=file
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Queue
QUEUE_CONNECTION=sync
```

### 4.4 Comandos Post-Instalación Laravel

```bash
# Generar clave de aplicación (si es nueva instalación)
php artisan key:generate

# Limpiar cachés
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimizar para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Verificar migraciones (solo si hay nuevas)
php artisan migrate:status
# php artisan migrate --force  # Solo si hay migraciones pendientes
```

### 4.5 Configuración del Servidor Web (Nginx)

```nginx
server {
    listen 80;
    server_name monitor.empresa.com;
    root /var/www/entel_frontend_new/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## FASE 5: VALIDACIÓN Y PRUEBAS

### 5.1 Checklist de Validación

| # | Componente | Prueba | Estado |
|---|------------|--------|--------|
| 1 | MySQL | Conexión exitosa | ☐ |
| 2 | MySQL | Todas las tablas presentes | ☐ |
| 3 | MySQL | Datos migrados correctamente | ☐ |
| 4 | Backend | Servicio arrancado | ☐ |
| 5 | Backend | API responde en puerto 8082 | ☐ |
| 6 | Backend | Conexión a MySQL funcional | ☐ |
| 7 | Backend | Conexión a Asterisk AMI | ☐ |
| 8 | Backend | Conexión LDAP funcional | ☐ |
| 9 | Frontend | Página de login carga | ☐ |
| 10 | Frontend | Login funcional | ☐ |
| 11 | Frontend | Comunicación con API | ☐ |
| 12 | Sistema | Creación de pruebas | ☐ |
| 13 | Sistema | Ejecución de pruebas | ☐ |
| 14 | Sistema | Generación de reportes | ☐ |
| 15 | Sistema | Cron jobs funcionando | ☐ |

### 5.2 Pruebas Funcionales Críticas

```bash
# 1. Verificar API Backend
curl -X POST http://localhost:8082/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usuario": "admin", "clave": "password"}'

# 2. Verificar endpoint de usuarios
curl http://localhost:8082/api/usuarios

# 3. Verificar endpoint de pruebas
curl http://localhost:8082/api/pruebas

# 4. Verificar logs
tail -f /var/www/monitor_system/logs/app.log
tail -f /var/www/entel_frontend_new/storage/logs/laravel.log
```

### 5.3 Monitoreo Post-Migración

```bash
# Monitorear uso de recursos
htop

# Monitorear logs en tiempo real
journalctl -u monitor-system -f

# Verificar conexiones MySQL
mysql -u root -p -e "SHOW PROCESSLIST;"

# Verificar estado de servicios
sudo systemctl status monitor-system
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql
```

---

## FASE 6: ROLLBACK (Plan de Contingencia)

### 6.1 Procedimiento de Rollback de Base de Datos

```bash
# Si la migración falla, restaurar backup anterior
mysql -u root -p -e "DROP DATABASE db_entel;"
mysql -u root -p < /backups/migracion_$(date +%Y%m%d)/db_entel_full_backup.sql
```

### 6.2 Procedimiento de Rollback del Backend

```bash
# Detener nuevo servicio
sudo systemctl stop monitor-system

# Restaurar versión anterior
mv /var/www/monitor_system_new /var/www/monitor_system_failed
tar -xzvf /backups/migracion_$(date +%Y%m%d)/monitor_system_backup.tar.gz -C /var/www/

# Reiniciar servicio con versión anterior
sudo systemctl start monitor-system
```

### 6.3 Procedimiento de Rollback del Frontend

```bash
# Restaurar versión anterior
mv /var/www/entel_frontend_new /var/www/entel_frontend_failed
tar -xzvf /backups/migracion_$(date +%Y%m%d)/entel_frontend_backup.tar.gz -C /var/www/

# Reinstalar dependencias
cd /var/www/entel_frontend
composer install
npm install && npm run build

# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
```

---

## FASE 7: POST-MIGRACIÓN

### 7.1 Tareas de Limpieza

```bash
# Eliminar instalaciones temporales después de 7 días de funcionamiento estable
rm -rf /var/www/monitor_system_old
rm -rf /var/www/entel_frontend_old

# Archivar backups
tar -czvf /backups/archivo/migracion_$(date +%Y%m%d).tar.gz \
    /backups/migracion_$(date +%Y%m%d)/
```

### 7.2 Documentación Final

- [ ] Actualizar documentación de arquitectura
- [ ] Actualizar credenciales en gestor de secretos
- [ ] Registrar cambios en changelog
- [ ] Notificar a usuarios sobre nueva versión
- [ ] Programar capacitación si hay cambios en UI

### 7.3 Configurar Backups Automáticos

```bash
# Agregar cron para backup diario
crontab -e

# Backup diario a las 2:00 AM
0 2 * * * mysqldump -u entel_app -p'password' db_entel | gzip > /backups/daily/db_entel_$(date +\%Y\%m\%d).sql.gz

# Limpiar backups mayores a 30 días
0 3 * * * find /backups/daily/ -name "*.sql.gz" -mtime +30 -delete
```

---

## Cronograma Sugerido

| Fase | Descripción | Duración Sugerida |
|------|-------------|-------------------|
| 1 | Backup y Preparación | 1-2 horas |
| 2 | Migración BD | 1-3 horas |
| 3 | Backend | 2-4 horas |
| 4 | Frontend | 2-4 horas |
| 5 | Validación | 2-3 horas |
| 6 | (Contingencia) | Según necesidad |
| 7 | Post-migración | 1-2 horas |

**Total estimado:** 1 jornada laboral (8-16 horas)

---

## Contactos de Emergencia

| Rol | Nombre | Contacto |
|-----|--------|----------|
| DBA | [Completar] | [Completar] |
| DevOps | [Completar] | [Completar] |
| Tech Lead | [Completar] | [Completar] |
| Soporte Asterisk | [Completar] | [Completar] |

---

## Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-02-03 | Claude | Versión inicial |
