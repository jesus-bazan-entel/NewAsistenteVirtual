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

/// GET /api/registro-clave
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let datos = sqlx::query_as::<_, RegistroClave>(
        "SELECT id_registro_clave, nombre, comentario, clave
         FROM registros_claves
         ORDER BY id_registro_clave ASC",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "datos": datos
    })))
}

/// POST /api/registro-clave
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateRegistroClave>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let comentario = html_escape::encode_text(&body.comentario).to_string();
    let clave = html_escape::encode_text(&body.clave).to_string();

    let mut tx = state.pool.begin().await?;

    let registro = sqlx::query_as::<_, RegistroClave>(
        "INSERT INTO registros_claves (nombre, comentario, clave)
         VALUES ($1, $2, $3)
         RETURNING id_registro_clave, nombre, comentario, clave",
    )
    .bind(&nombre)
    .bind(&comentario)
    .bind(&clave)
    .fetch_one(&mut *tx)
    .await?;

    // Add canales to junction table
    for id_canal in &body.canales {
        sqlx::query(
            "INSERT INTO canales_claves (id_canal, id_registro_clave)
             VALUES ($1, $2)",
        )
        .bind(id_canal)
        .bind(registro.id_registro_clave)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Se cre\u{00f3} correctamente"
        })),
    ))
}

/// GET /api/registro-clave/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let registro = sqlx::query_as::<_, RegistroClave>(
        "SELECT id_registro_clave, nombre, comentario, clave
         FROM registros_claves
         WHERE id_registro_clave = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Registro no encontrado".to_string()))?;

    // Load canales with tecnologia/operador names
    let canales = sqlx::query_as::<_, CanalDetalle>(
        "SELECT c.id_canal, c.id_tecnologia_operador, c.id_equipo, c.estado,
                c.nro_ranura, c.numero, c.posicion, c.estado_llamada,
                c.created_at, c.updated_at, c.deleted_at,
                t.nombre AS nombre_tecnologia, o.nombre AS nombre_operador,
                e.nombre AS nombre_equipo
         FROM canales c
         INNER JOIN canales_claves cc ON cc.id_canal = c.id_canal
         LEFT JOIN tecnologias_operadores to2 ON to2.id_tecnologia_operador = c.id_tecnologia_operador
         LEFT JOIN tecnologias t ON t.id_tecnologia = to2.id_tecnologia
         LEFT JOIN operadores_telefonicos o ON o.id_operador_telefonico = to2.id_operador_telefonico
         LEFT JOIN equipos e ON e.id_equipo = c.id_equipo
         WHERE cc.id_registro_clave = $1
         ORDER BY c.id_canal ASC",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let resultado = RegistroClaveConCanales {
        id_registro_clave: registro.id_registro_clave,
        nombre: registro.nombre,
        comentario: registro.comentario,
        clave: registro.clave,
        canales,
    };

    Ok(Json(json!({
        "estado": true,
        "dato": resultado
    })))
}

/// PUT /api/registro-clave/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<CreateRegistroClave>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let comentario = html_escape::encode_text(&body.comentario).to_string();
    let clave = html_escape::encode_text(&body.clave).to_string();

    let mut tx = state.pool.begin().await?;

    // Update the registro_clave record
    let result = sqlx::query(
        "UPDATE registros_claves SET nombre = $1, comentario = $2, clave = $3
         WHERE id_registro_clave = $4",
    )
    .bind(&nombre)
    .bind(&comentario)
    .bind(&clave)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Registro no encontrado".to_string()));
    }

    // Sync canales: get existing canal IDs
    let existing_canal_ids: Vec<i32> = sqlx::query_scalar(
        "SELECT id_canal FROM canales_claves WHERE id_registro_clave = $1",
    )
    .bind(id)
    .fetch_all(&mut *tx)
    .await?;

    // Determine canales to add and remove
    let canales_agregar: Vec<i32> = body
        .canales
        .iter()
        .filter(|c| !existing_canal_ids.contains(c))
        .copied()
        .collect();

    let canales_eliminar: Vec<i32> = existing_canal_ids
        .iter()
        .filter(|c| !body.canales.contains(c))
        .copied()
        .collect();

    // Add new canales
    for id_canal in &canales_agregar {
        sqlx::query(
            "INSERT INTO canales_claves (id_canal, id_registro_clave)
             VALUES ($1, $2)",
        )
        .bind(id_canal)
        .bind(id)
        .execute(&mut *tx)
        .await?;
    }

    // Remove old canales
    for id_canal in &canales_eliminar {
        sqlx::query(
            "DELETE FROM canales_claves WHERE id_canal = $1 AND id_registro_clave = $2",
        )
        .bind(id_canal)
        .bind(id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se actualiz\u{00f3} correctamente"
    })))
}

/// DELETE /api/registro-clave/:id
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let mut tx = state.pool.begin().await?;

    // Remove all canal associations
    sqlx::query(
        "DELETE FROM canales_claves WHERE id_registro_clave = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    // Delete the registro_clave
    let result = sqlx::query(
        "DELETE FROM registros_claves WHERE id_registro_clave = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Registro no encontrado".to_string()));
    }

    tx.commit().await?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se elimin\u{00f3} correctamente"
    })))
}
