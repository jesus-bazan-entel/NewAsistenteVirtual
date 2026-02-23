#!/usr/bin/env python3
"""
Migrate MySQL/MariaDB dump (db_entel_backup.sql) into PostgreSQL (asistente_virtual).
"""

import re
import sys
import subprocess

DUMP_FILE = "/home/avv/db_entel_backup.sql"
PG_DB = "asistente_virtual"
PG_USER = "postgres"

# MySQL column order (from CREATE TABLE in the dump) → PostgreSQL column mapping
# Format: mysql_col → pg_col (or None to skip)
TABLE_COLUMNS = {
    "sedes": [
        ("id_sede", "id_sede"),
        ("nombre", "nombre"),
    ],
    "perfiles": [
        ("id_perfil", "id_perfil"),
        ("nombre", "nombre"),
        ("descripcion", "descripcion"),
        ("estado", "estado"),
    ],
    "usuarios": [
        ("id_usuario", "id_usuario"),
        ("nombres", "nombres"),
        ("apellidos", "apellidos"),
        ("correo", "correo"),
        ("acceso", "acceso"),
        ("clave", "clave"),
        ("id_perfil", "id_perfil"),
    ],
    "modulos": [
        ("id_modulo", "id_modulo"),
        ("nombre", "nombre"),
        ("ruta", "ruta"),
        ("icono", "icono"),
    ],
    "submodulos": [
        ("id_submodulo", "id_submodulo"),
        ("nombre", "nombre"),
        ("ruta", "ruta"),
        ("icono", "icono"),
        ("id_modulo", "id_modulo"),
    ],
    "perfiles_submodulos": [
        ("id_perfil", "id_perfil"),
        ("id_submodulo", "id_submodulo"),
    ],
    "tecnologias": [
        ("id_tecnologia", "id_tecnologia"),
        ("nombre", "nombre"),
    ],
    "operadores_telefonicos": [
        ("id_operador_telefonico", "id_operador_telefonico"),
        ("nombre", "nombre"),
        ("codigo", "codigo"),
    ],
    "tecnologias_operadores": [
        ("id_tecnologia_operador", "id_tecnologia_operador"),
        ("id_tecnologia", "id_tecnologia"),
        ("id_operador_telefonico", "id_operador_telefonico"),
    ],
    "equipos": [
        ("id_equipo", "id_equipo"),
        ("nombre", "nombre"),
        ("ip", "ip"),
        ("tipo", "tipo"),
        ("ranuras", "ranuras"),
        ("id_sede", "id_sede"),
        ("estado", "estado"),
        ("createdAt", "created_at"),
        ("updatedAt", "updated_at"),
        ("deletedAt", "deleted_at"),
    ],
    "canales": [
        ("id_canal", "id_canal"),
        ("id_tecnologia_operador", "id_tecnologia_operador"),
        ("id_equipo", "id_equipo"),
        ("estado", "estado"),
        ("nro_ranura", "nro_ranura"),
        ("numero", "numero"),
        ("posicion", "posicion"),
        ("estado_llamada", "estado_llamada"),
        ("createdAt", "created_at"),
        ("updatedAt", "updated_at"),
        ("deletedAt", "deleted_at"),
    ],
    "numeros_externos": [
        ("id_numero_externo", "id_numero_externo"),
        ("nombre", "nombre"),
        ("comentario", "comentario"),
        ("numero", "numero"),
    ],
    "errores": [
        ("id_error", "id_error"),
        ("codigo", "codigo"),
        ("estado", "estado"),
        ("mensaje", "mensaje"),
    ],
    "registros_claves": [
        ("id_registro_clave", "id_registro_clave"),
        ("nombre", "nombre"),
        ("clave", "clave"),
        ("comentario", "comentario"),
    ],
    "canales_claves": [
        ("id_canal", "id_canal"),
        ("id_registro_clave", "id_registro_clave"),
        ("createdAt", "created_at"),
        ("updatedAt", "updated_at"),
        ("deletedAt", "deleted_at"),
    ],
    "matrices": [
        ("id_matriz", "id_matriz"),
        ("nombre", "nombre"),
        ("estado", "estado"),  # tinyint(1) → boolean
    ],
    "matrices_canales_destinos": [
        ("id_matriz_canal_destino", "id_matriz_canal_destino"),
        ("id_matriz", "id_matriz"),
        ("id_canal_origen", "id_canal_origen"),
        ("id_canal_destino", "id_canal_destino"),
        ("tipo", "tipo"),
        ("id_numero_externo_destino", "id_numero_externo_destino"),
        ("estado", "estado"),
    ],
    "pruebas": [
        ("id_prueba", "id_prueba"),
        ("nombre", "nombre"),
        ("comentario", "comentario"),
        ("correo", "correo"),
        ("tiempo_timbrado", "tiempo_timbrado"),
        ("reintentos", "reintentos"),
        ("tipo", "tipo"),
        ("tipo_lanzamiento", "tipo_lanzamiento"),
        ("activo", "activo"),
        ("programacion", "programacion"),
        ("ejecutado", "ejecutado"),
        ("fecha_lanzamiento", "fecha_lanzamiento"),
        ("hora_lanzamiento", "hora_lanzamiento"),
        ("dias_lanzamiento", "dias_lanzamiento"),
        ("id_matriz", "id_matriz"),
        ("id_usuario", "id_usuario"),
        ("createdAt", "created_at"),
        ("updatedAt", "updated_at"),
        ("deletedAt", "deleted_at"),
    ],
    "ejecuciones": [
        ("id_ejecucion", "id_ejecucion"),
        ("numero_prueba", "numero_prueba"),
        ("fecha_inicio", "fecha_inicio"),
        ("fecha_fin", "fecha_fin"),
        ("estado", "estado"),
        ("id_prueba", "id_prueba"),
        ("createdAt", "created_at"),
        ("updatedAt", "updated_at"),
        ("deletedAt", "deleted_at"),
    ],
    "escenarios": [
        ("id_escenario", "id_escenario"),
        ("id_ejecucion", "id_ejecucion"),
        ("id_canal_origen", "id_canal_origen"),
        ("id_destino", "id_destino"),
        ("tipo", "tipo"),
        ("uniqueid_en", "uniqueid_en"),
        ("uniqueid_sal", "uniqueid_sal"),
        ("estado", "estado"),
        ("id_error", "id_error"),
        ("numero_intento", "numero_intento"),
        ("mos", "mos"),
        ("hangupReason", '"hangupReason"'),
        ("createdAt", "created_at"),
        ("updatedAt", "updated_at"),
        ("hora_saliente", "hora_saliente"),
        ("hora_entrante", "hora_entrante"),
        ("deletedAt", "deleted_at"),
    ],
    "ldap_config": [
        ("id", "id"),
        ("nombre", "nombre"),
        ("data", "data"),
    ],
    "credenciales_api": [
        ("id_credencial_api", "id_credencial_api"),
        ("usuario", "usuario"),
        ("clave", "clave"),
        ("estado", "estado"),
    ],
}

# Tables in FK-safe insertion order
TABLE_ORDER = [
    "sedes", "perfiles", "modulos", "submodulos", "perfiles_submodulos",
    "usuarios", "tecnologias", "operadores_telefonicos", "tecnologias_operadores",
    "equipos", "canales", "numeros_externos", "errores", "registros_claves",
    "canales_claves", "matrices", "matrices_canales_destinos", "pruebas",
    "ejecuciones", "escenarios", "ldap_config", "credenciales_api",
]

# Boolean columns (MySQL tinyint → PG boolean)
BOOLEAN_COLS = {("matrices", "estado")}

# PK columns for sequence reset
PK_COLUMNS = {
    "sedes": "id_sede", "perfiles": "id_perfil", "modulos": "id_modulo",
    "submodulos": "id_submodulo", "usuarios": "id_usuario",
    "tecnologias": "id_tecnologia", "operadores_telefonicos": "id_operador_telefonico",
    "tecnologias_operadores": "id_tecnologia_operador", "equipos": "id_equipo",
    "canales": "id_canal", "numeros_externos": "id_numero_externo",
    "errores": "id_error", "registros_claves": "id_registro_clave",
    "matrices": "id_matriz", "matrices_canales_destinos": "id_matriz_canal_destino",
    "pruebas": "id_prueba", "ejecuciones": "id_ejecucion",
    "escenarios": "id_escenario", "ldap_config": "id",
    "credenciales_api": "id_credencial_api",
}


def parse_values_no_columns(raw_values):
    """Parse MySQL VALUES (...),(...),... into a list of value lists."""
    rows = []
    current_row = []
    current_val = ""
    in_string = False
    escape_next = False
    depth = 0

    for ch in raw_values:
        if escape_next:
            current_val += ch
            escape_next = False
            continue

        if ch == "\\" and in_string:
            current_val += ch
            escape_next = True
            continue

        if ch == "'" and not escape_next:
            in_string = not in_string
            current_val += ch
            continue

        if in_string:
            current_val += ch
            continue

        if ch == "(":
            depth += 1
            if depth == 1:
                current_val = ""
                continue
        elif ch == ")":
            depth -= 1
            if depth == 0:
                current_row.append(current_val.strip())
                rows.append(current_row)
                current_row = []
                current_val = ""
                continue
        elif ch == "," and depth == 1:
            current_row.append(current_val.strip())
            current_val = ""
            continue
        elif ch == "," and depth == 0:
            continue

        if depth >= 1:
            current_val += ch

    return rows


def convert_value(val, table, mysql_col):
    """Convert a MySQL value to PostgreSQL."""
    if val == "NULL" or val == "null":
        return "NULL"

    # Boolean conversion
    if (table, mysql_col) in BOOLEAN_COLS:
        if val in ("0", "'0'"):
            return "false"
        if val in ("1", "'1'"):
            return "true"

    # String values
    if val.startswith("'") and val.endswith("'"):
        inner = val[1:-1]
        inner = inner.replace("\\'", "''")
        inner = inner.replace('\\"', '"')
        # Keep \\n \\r \\t as literal strings (they're MySQL escapes in the dump)
        # Replace double-backslash first
        inner = inner.replace("\\\\", "\x00BSLASH\x00")
        inner = inner.replace("\\n", "\n")
        inner = inner.replace("\\r", "")
        inner = inner.replace("\\t", "\t")
        inner = inner.replace("\\0", "")
        inner = inner.replace("\x00BSLASH\x00", "\\")
        if "\n" in inner or "\t" in inner:
            inner = inner.replace("\\", "\\\\")
            inner = inner.replace("'", "''")
            return f"E'{inner}'"
        return f"'{inner}'"

    return val


def main():
    print(f"Reading MySQL dump: {DUMP_FILE}")

    # Read INSERT statements
    inserts_by_table = {}
    with open(DUMP_FILE, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.startswith("INSERT INTO"):
                continue
            # Read continuation lines if the INSERT spans multiple lines
            full_line = line
            while not full_line.rstrip().endswith(";"):
                full_line += next(f)

            # Extract table name
            m = re.match(r"INSERT INTO `(\w+)`\s*VALUES\s*(.+);", full_line, re.DOTALL)
            if not m:
                # Try format with column names
                m2 = re.match(r"INSERT INTO `(\w+)`\s*\([^)]+\)\s*VALUES\s*(.+);", full_line, re.DOTALL)
                if m2:
                    m = m2
                if not m:
                    continue

            table = m.group(1)
            raw_values = m.group(2).strip()

            rows = parse_values_no_columns(raw_values)
            if table not in inserts_by_table:
                inserts_by_table[table] = []
            inserts_by_table[table].extend(rows)

    print(f"Parsed {len(inserts_by_table)} tables:")
    total_all = 0
    for t in TABLE_ORDER:
        if t in inserts_by_table:
            n = len(inserts_by_table[t])
            total_all += n
            print(f"  {t}: {n} rows")

    # Generate migration SQL
    sql_parts = []
    sql_parts.append("-- MySQL → PostgreSQL data migration")
    sql_parts.append("BEGIN;")
    sql_parts.append("SET session_replication_role = 'replica';")
    sql_parts.append("")

    # Truncate all tables
    sql_parts.append("-- Truncate existing data")
    for table in reversed(TABLE_ORDER):
        sql_parts.append(f"TRUNCATE TABLE {table} CASCADE;")
    sql_parts.append("")

    # Insert data
    for table in TABLE_ORDER:
        if table not in inserts_by_table:
            continue
        if table not in TABLE_COLUMNS:
            print(f"  WARNING: No column mapping for {table}, skipping")
            continue

        col_map = TABLE_COLUMNS[table]
        pg_cols = [pg for _, pg in col_map]
        col_str = ", ".join(pg_cols)
        rows = inserts_by_table[table]

        sql_parts.append(f"-- {table} ({len(rows)} rows)")

        # Batch inserts for performance
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            row_strs = []
            for row in batch:
                vals = []
                for j, (mysql_col, pg_col) in enumerate(col_map):
                    if j < len(row):
                        val = convert_value(row[j], table, mysql_col)
                    else:
                        val = "NULL"
                    vals.append(val)
                row_strs.append(f"({', '.join(vals)})")

            stmt = f"INSERT INTO {table} ({col_str}) VALUES\n" + ",\n".join(row_strs) + ";"
            sql_parts.append(stmt)

        sql_parts.append("")

    # Reset sequences
    sql_parts.append("-- Reset sequences")
    for table in TABLE_ORDER:
        if table in PK_COLUMNS and table in inserts_by_table:
            pk = PK_COLUMNS[table]
            seq = f"{table}_{pk}_seq"
            sql_parts.append(
                f"SELECT setval('{seq}', COALESCE((SELECT MAX({pk}) FROM {table}), 0) + 1, false);"
            )

    sql_parts.append("")
    sql_parts.append("SET session_replication_role = 'origin';")
    sql_parts.append("COMMIT;")

    out_file = "/tmp/mysql_to_pg_migration.sql"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_parts))

    size_mb = len("\n".join(sql_parts)) / (1024 * 1024)
    print(f"\nGenerated: {out_file} ({size_mb:.1f} MB, {total_all} total rows)")

    # Execute
    print(f"Importing into PostgreSQL ({PG_DB})...")
    result = subprocess.run(
        ["sudo", "-u", PG_USER, "psql", "-d", PG_DB, "-f", out_file, "-v", "ON_ERROR_STOP=1"],
        capture_output=True, text=True, timeout=600,
    )

    if result.returncode != 0:
        stderr_lines = result.stderr.strip().split("\n")
        error_lines = [l for l in stderr_lines if "ERROR" in l]
        print(f"\nImport failed!")
        for el in error_lines[:10]:
            print(f"  {el}")
        # Show context
        for el in stderr_lines[-5:]:
            print(f"  {el}")
        sys.exit(1)

    print("Import completed!")

    # Verify
    print("\nRow count verification:")
    print(f"{'Table':<30} {'MySQL':>8} {'PG':>8} {'Status':>10}")
    print("-" * 60)
    all_ok = True
    for table in TABLE_ORDER:
        if table not in inserts_by_table:
            continue
        expected = len(inserts_by_table[table])
        r = subprocess.run(
            ["sudo", "-u", PG_USER, "psql", "-d", PG_DB, "-t", "-c",
             f"SELECT COUNT(*) FROM {table};"],
            capture_output=True, text=True,
        )
        actual = int(r.stdout.strip())
        ok = "OK" if actual == expected else "MISMATCH"
        if ok != "OK":
            all_ok = False
        print(f"  {table:<28} {expected:>8} {actual:>8} {ok:>10}")

    if all_ok:
        print("\nAll tables migrated successfully!")
    else:
        print("\nSome tables have mismatches - check above.")


if __name__ == "__main__":
    main()
