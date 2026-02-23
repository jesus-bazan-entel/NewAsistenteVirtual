#!/usr/bin/env bash
# ============================================
# MySQL to PostgreSQL Migration Script
# ============================================
# Uses pgloader to migrate data from the existing
# MySQL db_entel database to the new PostgreSQL
# asistente_virtual database.
#
# Usage:
#   ./docker/scripts/migrate-mysql-to-pg.sh [options]
#
# Options:
#   --mysql-host HOST       MySQL host (default: localhost)
#   --mysql-port PORT       MySQL port (default: 3306)
#   --mysql-user USER       MySQL user (default: entel_user)
#   --mysql-password PASS   MySQL password
#   --mysql-db DB           MySQL database (default: db_entel)
#   --pg-host HOST          PostgreSQL host (default: localhost)
#   --pg-port PORT          PostgreSQL port (default: 5432)
#   --pg-user USER          PostgreSQL user (default: platform)
#   --pg-password PASS      PostgreSQL password (default: platform123)
#   --pg-db DB              PostgreSQL database (default: asistente_virtual)
#   --dry-run               Show what would be done without executing
#
# Prerequisites:
#   - pgloader installed (apt-get install pgloader)
#   - MySQL source database accessible
#   - PostgreSQL target database accessible
# ============================================

set -euo pipefail

# ------------------------------------------
# Default configuration
# ------------------------------------------
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="entel_user"
MYSQL_PASSWORD=""
MYSQL_DB="db_entel"

PG_HOST="localhost"
PG_PORT="5432"
PG_USER="platform"
PG_PASSWORD="platform123"
PG_DB="asistente_virtual"

DRY_RUN=false

# ------------------------------------------
# Parse arguments
# ------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --mysql-host)    MYSQL_HOST="$2"; shift 2 ;;
        --mysql-port)    MYSQL_PORT="$2"; shift 2 ;;
        --mysql-user)    MYSQL_USER="$2"; shift 2 ;;
        --mysql-password) MYSQL_PASSWORD="$2"; shift 2 ;;
        --mysql-db)      MYSQL_DB="$2"; shift 2 ;;
        --pg-host)       PG_HOST="$2"; shift 2 ;;
        --pg-port)       PG_PORT="$2"; shift 2 ;;
        --pg-user)       PG_USER="$2"; shift 2 ;;
        --pg-password)   PG_PASSWORD="$2"; shift 2 ;;
        --pg-db)         PG_DB="$2"; shift 2 ;;
        --dry-run)       DRY_RUN=true; shift ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [ -z "$MYSQL_PASSWORD" ]; then
    echo "ERROR: --mysql-password is required"
    echo "Usage: $0 --mysql-password <password> [options]"
    exit 1
fi

MYSQL_URI="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}"
PG_URI="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DB}"

echo "============================================"
echo "MySQL to PostgreSQL Migration"
echo "============================================"
echo "Source: mysql://${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}"
echo "Target: postgresql://${PG_USER}@${PG_HOST}:${PG_PORT}/${PG_DB}"
echo ""

# ------------------------------------------
# Pre-flight checks
# ------------------------------------------
if ! command -v pgloader &> /dev/null; then
    echo "ERROR: pgloader is not installed."
    echo ""
    echo "Install it with:"
    echo "  Debian/Ubuntu: apt-get install pgloader"
    echo "  RHEL/CentOS:   yum install pgloader"
    echo "  macOS:          brew install pgloader"
    echo ""
    echo "Or run via Docker:"
    echo "  docker run --rm -it dimitri/pgloader:latest pgloader \\"
    echo "    '${MYSQL_URI}' '${PG_URI}'"
    exit 1
fi

# ------------------------------------------
# Create pgloader command file
# ------------------------------------------
PGLOADER_CMD=$(mktemp /tmp/pgloader-XXXXXX.load)

cat > "$PGLOADER_CMD" <<PGLOAD
/*
 * pgloader command to migrate db_entel (MySQL) to asistente_virtual (PostgreSQL)
 *
 * Table mapping (MySQL -> PostgreSQL):
 *   All tables from db_entel are migrated as-is.
 *   Column types are automatically converted:
 *     INT/BIGINT     -> integer/bigint
 *     VARCHAR        -> varchar
 *     TEXT           -> text
 *     DATETIME       -> timestamp
 *     TINYINT(1)     -> boolean
 *     ENUM           -> varchar (with check constraints)
 *     AUTO_INCREMENT -> serial/bigserial
 */

LOAD DATABASE
    FROM ${MYSQL_URI}
    INTO ${PG_URI}

WITH
    include drop,
    create tables,
    create indexes,
    reset sequences,
    workers = 4,
    concurrency = 2,
    batch rows = 1000,
    prefetch rows = 10000

SET
    maintenance_work_mem to '128MB',
    work_mem to '64MB'

CAST
    type tinyint to boolean using tinyint-to-boolean,
    type int when (= precision 11) to integer,
    type bigint when (= precision 20) to bigint

BEFORE LOAD DO
    \$\$ DROP SCHEMA IF EXISTS ${MYSQL_DB} CASCADE; \$\$

AFTER LOAD DO
    \$\$ -- Move tables from MySQL schema to public schema \$\$
    \$\$ DO \$body\$
       DECLARE
           r RECORD;
       BEGIN
           FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = '${MYSQL_DB}'
           LOOP
               EXECUTE format('ALTER TABLE %I.%I SET SCHEMA public', '${MYSQL_DB}', r.tablename);
           END LOOP;
           -- Drop the empty MySQL schema
           EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', '${MYSQL_DB}');
       END
       \$body\$;
    \$\$
;
PGLOAD

echo "pgloader command file: $PGLOADER_CMD"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would execute:"
    echo "  pgloader $PGLOADER_CMD"
    echo ""
    echo "pgloader command contents:"
    cat "$PGLOADER_CMD"
    rm -f "$PGLOADER_CMD"
    exit 0
fi

# ------------------------------------------
# Run migration
# ------------------------------------------
echo "Starting migration..."
echo ""

pgloader "$PGLOADER_CMD"
PGLOADER_EXIT=$?

rm -f "$PGLOADER_CMD"

if [ $PGLOADER_EXIT -ne 0 ]; then
    echo ""
    echo "ERROR: pgloader exited with code $PGLOADER_EXIT"
    exit $PGLOADER_EXIT
fi

echo ""

# ------------------------------------------
# Verify row counts
# ------------------------------------------
echo "============================================"
echo "Verifying row counts..."
echo "============================================"
echo ""

# Tables to verify (matching the 21 Sequelize models)
TABLES=(
    "usuarios"
    "perfiles"
    "modulos"
    "submodulos"
    "perfil_submodulo"
    "sedes"
    "ldap_configs"
    "credencial_apis"
    "tecnologias"
    "operador_telefonicos"
    "tecnologia_operadors"
    "equipos"
    "canales"
    "numero_externos"
    "pruebas"
    "matrices"
    "matriz_canal_destinos"
    "ejecuciones"
    "escenarios"
    "errores"
    "registro_claves"
    "canal_claves"
)

PASS=0
FAIL=0

printf "%-30s %10s %10s %s\n" "Table" "MySQL" "PostgreSQL" "Status"
printf "%-30s %10s %10s %s\n" "-----" "-----" "----------" "------"

for table in "${TABLES[@]}"; do
    # Get MySQL row count
    MYSQL_COUNT=$(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
        -N -e "SELECT COUNT(*) FROM \`$table\`" "$MYSQL_DB" 2>/dev/null || echo "N/A")

    # Get PostgreSQL row count
    PG_COUNT=$(PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
        -t -c "SELECT COUNT(*) FROM \"$table\"" 2>/dev/null | tr -d ' ' || echo "N/A")

    if [ "$MYSQL_COUNT" = "$PG_COUNT" ] && [ "$MYSQL_COUNT" != "N/A" ]; then
        STATUS="OK"
        PASS=$((PASS + 1))
    elif [ "$MYSQL_COUNT" = "N/A" ] || [ "$PG_COUNT" = "N/A" ]; then
        STATUS="SKIP"
    else
        STATUS="MISMATCH"
        FAIL=$((FAIL + 1))
    fi

    printf "%-30s %10s %10s %s\n" "$table" "$MYSQL_COUNT" "$PG_COUNT" "$STATUS"
done

echo ""
echo "============================================"
echo "Migration Summary"
echo "============================================"
echo "  Passed:  $PASS tables"
echo "  Failed:  $FAIL tables"
echo "  Total:   ${#TABLES[@]} tables"

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "WARNING: Some tables have mismatched row counts."
    echo "Review the pgloader output above for errors."
    exit 1
fi

echo ""
echo "Migration completed successfully!"
echo "============================================"
