use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};

use crate::error::{AppError, AppResult};
use crate::models::*;
use crate::AppState;

/// GET /api/matrices
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let matrices = sqlx::query_as::<_, Matriz>(
        "SELECT id_matriz, nombre, estado
         FROM matrices
         WHERE estado = true
         ORDER BY id_matriz ASC",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "matrices": matrices
    })))
}

/// POST /api/matrices
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateMatriz>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();

    let mut tx = state.pool.begin().await?;

    let matriz = sqlx::query_as::<_, Matriz>(
        "INSERT INTO matrices (nombre, estado) VALUES ($1, true)
         RETURNING id_matriz, nombre, estado",
    )
    .bind(&nombre)
    .fetch_one(&mut *tx)
    .await?;

    for item in &body.matriz_data {
        let id_canal_destino = if item.tipo == "C" { item.id_canal_destino } else { None };
        let id_numero_externo_destino = if item.tipo == "E" { item.id_numero_externo_destino } else { None };

        sqlx::query(
            "INSERT INTO matrices_canales_destinos
             (id_matriz, id_canal_origen, id_canal_destino, id_numero_externo_destino, tipo, estado)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVO')",
        )
        .bind(matriz.id_matriz)
        .bind(item.id_canal_origen)
        .bind(id_canal_destino)
        .bind(id_numero_externo_destino)
        .bind(&item.tipo)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Se cre\u{00f3} correctamente la matriz",
            "data": matriz
        })),
    ))
}

/// GET /api/matrices/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let matriz = sqlx::query_as::<_, Matriz>(
        "SELECT id_matriz, nombre, estado
         FROM matrices
         WHERE id_matriz = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Matriz no encontrada".to_string()))?;

    // Load all active conexiones for this matriz
    let conexiones_raw = sqlx::query_as::<_, MatrizCanalDestino>(
        "SELECT mcd.id_matriz_canal_destino, mcd.id_matriz, mcd.id_canal_origen,
                mcd.id_canal_destino, mcd.id_numero_externo_destino, mcd.tipo, mcd.estado
         FROM matrices_canales_destinos mcd
         LEFT JOIN canales cd ON mcd.id_canal_destino = cd.id_canal
         WHERE mcd.id_matriz = $1
           AND mcd.estado = 'ACTIVO'
           AND (cd.deleted_at IS NULL OR mcd.tipo = 'E')
         ORDER BY mcd.id_matriz_canal_destino ASC",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let mut conexiones = Vec::new();

    for conn in &conexiones_raw {
        // Load canal_origen with tecnologia_operador details
        let canal_origen = sqlx::query_as::<_, CanalDetalle>(
            "SELECT c.id_canal, c.id_tecnologia_operador, c.id_equipo, c.estado,
                    c.nro_ranura, c.numero, c.posicion, c.estado_llamada,
                    c.created_at, c.updated_at, c.deleted_at,
                    t.nombre AS nombre_tecnologia, o.nombre AS nombre_operador,
                    e.nombre AS nombre_equipo
             FROM canales c
             LEFT JOIN tecnologias_operadores to2 ON to2.id_tecnologia_operador = c.id_tecnologia_operador
             LEFT JOIN tecnologias t ON t.id_tecnologia = to2.id_tecnologia
             LEFT JOIN operadores_telefonicos o ON o.id_operador_telefonico = to2.id_operador_telefonico
             LEFT JOIN equipos e ON e.id_equipo = c.id_equipo
             WHERE c.id_canal = $1",
        )
        .bind(conn.id_canal_origen)
        .fetch_optional(&state.pool)
        .await?;

        let mut canal_destino = None;
        let mut numero_externo = None;

        if conn.tipo == "C" {
            if let Some(id_cd) = conn.id_canal_destino {
                canal_destino = sqlx::query_as::<_, CanalDetalle>(
                    "SELECT c.id_canal, c.id_tecnologia_operador, c.id_equipo, c.estado,
                            c.nro_ranura, c.numero, c.posicion, c.estado_llamada,
                            c.created_at, c.updated_at, c.deleted_at,
                            t.nombre AS nombre_tecnologia, o.nombre AS nombre_operador,
                            e.nombre AS nombre_equipo
                     FROM canales c
                     LEFT JOIN tecnologias_operadores to2 ON to2.id_tecnologia_operador = c.id_tecnologia_operador
                     LEFT JOIN tecnologias t ON t.id_tecnologia = to2.id_tecnologia
                     LEFT JOIN operadores_telefonicos o ON o.id_operador_telefonico = to2.id_operador_telefonico
                     LEFT JOIN equipos e ON e.id_equipo = c.id_equipo
                     WHERE c.id_canal = $1 AND c.deleted_at IS NULL",
                )
                .bind(id_cd)
                .fetch_optional(&state.pool)
                .await?;
            }
        } else if conn.tipo == "E" {
            if let Some(id_ne) = conn.id_numero_externo_destino {
                numero_externo = sqlx::query_as::<_, NumeroExterno>(
                    "SELECT id_numero_externo, nombre, comentario, numero
                     FROM numeros_externos
                     WHERE id_numero_externo = $1",
                )
                .bind(id_ne)
                .fetch_optional(&state.pool)
                .await?;
            }
        }

        conexiones.push(MatrizCanalDestinoDetalle {
            id_matriz_canal_destino: conn.id_matriz_canal_destino,
            id_matriz: conn.id_matriz,
            id_canal_origen: conn.id_canal_origen,
            id_canal_destino: conn.id_canal_destino,
            id_numero_externo_destino: conn.id_numero_externo_destino,
            tipo: conn.tipo.clone(),
            estado: conn.estado.clone(),
            canal_origen,
            canal_destino,
            numero_externo,
        });
    }

    let resultado = MatrizConConexiones {
        id_matriz: matriz.id_matriz,
        nombre: matriz.nombre,
        estado: matriz.estado,
        conexiones,
    };

    Ok(Json(json!({
        "estado": true,
        "matriz": resultado
    })))
}

/// PUT /api/matrices/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<CreateMatriz>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();

    let mut tx = state.pool.begin().await?;

    let result = sqlx::query(
        "UPDATE matrices SET nombre = $1 WHERE id_matriz = $2 AND estado = true",
    )
    .bind(&nombre)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Matriz no encontrada".to_string()));
    }

    // Soft-delete old conexiones (set estado = 'INACTIVO')
    sqlx::query(
        "UPDATE matrices_canales_destinos SET estado = 'INACTIVO' WHERE id_matriz = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    // Insert new conexiones
    for item in &body.matriz_data {
        let id_canal_destino = if item.tipo == "C" { item.id_canal_destino } else { None };
        let id_numero_externo_destino = if item.tipo == "E" { item.id_numero_externo_destino } else { None };

        sqlx::query(
            "INSERT INTO matrices_canales_destinos
             (id_matriz, id_canal_origen, id_canal_destino, id_numero_externo_destino, tipo, estado)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVO')",
        )
        .bind(id)
        .bind(item.id_canal_origen)
        .bind(id_canal_destino)
        .bind(id_numero_externo_destino)
        .bind(&item.tipo)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se actualiz\u{00f3} correctamente la matriz"
    })))
}

/// DELETE /api/matrices/:id
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query(
        "UPDATE matrices SET estado = false WHERE id_matriz = $1 AND estado = true",
    )
    .bind(id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Matriz no encontrada".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se elimin\u{00f3} correctamente la matriz"
    })))
}
