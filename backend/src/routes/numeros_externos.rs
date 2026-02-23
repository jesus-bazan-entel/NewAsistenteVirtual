use std::sync::Arc;

use std::collections::HashMap;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};

use crate::error::{AppError, AppResult};
use crate::models::*;
use crate::AppState;

/// GET /api/numeros-externos
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let numeros = sqlx::query_as::<_, NumeroExterno>(
        "SELECT id_numero_externo, nombre, comentario, numero
         FROM numeros_externos
         ORDER BY id_numero_externo",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "numeros_externos": numeros
    })))
}

/// POST /api/numeros-externos
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateNumeroExterno>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let comentario = html_escape::encode_text(&body.comentario).to_string();
    let numero = html_escape::encode_text(&body.numero).to_string();

    let row = sqlx::query_as::<_, NumeroExterno>(
        "INSERT INTO numeros_externos (nombre, comentario, numero) VALUES ($1, $2, $3)
         RETURNING id_numero_externo, nombre, comentario, numero",
    )
    .bind(&nombre)
    .bind(&comentario)
    .bind(&numero)
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Número externo creado exitosamente",
            "data": row
        })),
    ))
}

/// GET /api/numeros-externos/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let numero = sqlx::query_as::<_, NumeroExterno>(
        "SELECT id_numero_externo, nombre, comentario, numero
         FROM numeros_externos
         WHERE id_numero_externo = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Número externo no encontrado".to_string()))?;

    Ok(Json(json!({
        "estado": true,
        "data": numero
    })))
}

/// PUT /api/numeros-externos/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<CreateNumeroExterno>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let comentario = html_escape::encode_text(&body.comentario).to_string();
    let numero = html_escape::encode_text(&body.numero).to_string();

    let result = sqlx::query(
        "UPDATE numeros_externos
         SET nombre = $1, comentario = $2, numero = $3
         WHERE id_numero_externo = $4",
    )
    .bind(&nombre)
    .bind(&comentario)
    .bind(&numero)
    .bind(id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Número externo no encontrado".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Número externo actualizado exitosamente"
    })))
}

/// DELETE /api/numeros-externos/:id?force=true
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Query(params): Query<HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let force = params.get("force").map(|v| v == "true").unwrap_or(false);

    if force {
        let mut tx = state.pool.begin().await?;

        // escenarios que referencian este numero externo como destino
        sqlx::query("DELETE FROM escenarios WHERE id_destino = $1 AND tipo = 'EXTERNO'")
            .bind(id).execute(&mut *tx).await?;

        // matrices_canales_destinos
        sqlx::query("DELETE FROM matrices_canales_destinos WHERE id_numero_externo_destino = $1")
            .bind(id).execute(&mut *tx).await?;

        let result = sqlx::query("DELETE FROM numeros_externos WHERE id_numero_externo = $1")
            .bind(id).execute(&mut *tx).await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Número externo no encontrado".to_string()));
        }

        tx.commit().await?;

        return Ok(Json(json!({
            "estado": true,
            "mensaje": "Número externo y registros asociados eliminados exitosamente"
        })));
    }

    let result = sqlx::query(
        "DELETE FROM numeros_externos WHERE id_numero_externo = $1",
    )
    .bind(id)
    .execute(&state.pool)
    .await;

    match result {
        Ok(r) => {
            if r.rows_affected() == 0 {
                return Err(AppError::NotFound("Número externo no encontrado".to_string()));
            }
            Ok(Json(json!({
                "estado": true,
                "mensaje": "Número externo eliminado exitosamente"
            })))
        }
        Err(sqlx::Error::Database(db_err))
            if db_err.is_foreign_key_violation() =>
        {
            Err(AppError::Conflict(
                "No se puede eliminar el número externo porque tiene registros asociados. Use la opcion de forzar eliminacion.".to_string(),
            ))
        }
        Err(e) => Err(AppError::Database(e)),
    }
}
