use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};

use crate::error::{AppError, AppResult};
use crate::models::ldap_config::{CreateLdapConfig, LdapConfig};
use crate::AppState;

/// GET /api/ldap-config
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let configs = sqlx::query_as::<_, LdapConfig>(
        "SELECT id, nombre, data FROM ldap_config ORDER BY id",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "ldap_configs": configs
    })))
}

/// POST /api/ldap-config
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateLdapConfig>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let row = sqlx::query_as::<_, LdapConfig>(
        "INSERT INTO ldap_config (nombre, data) VALUES ($1, $2)
         RETURNING id, nombre, data",
    )
    .bind(&body.nombre)
    .bind(&body.data)
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Configuración LDAP creada exitosamente",
            "data": row
        })),
    ))
}

/// GET /api/ldap-config/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let config = sqlx::query_as::<_, LdapConfig>(
        "SELECT id, nombre, data FROM ldap_config WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Configuración LDAP no encontrada".to_string()))?;

    Ok(Json(json!({
        "estado": true,
        "data": config
    })))
}

/// PUT /api/ldap-config/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<CreateLdapConfig>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query(
        "UPDATE ldap_config SET nombre = $1, data = $2 WHERE id = $3",
    )
    .bind(&body.nombre)
    .bind(&body.data)
    .bind(id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Configuración LDAP no encontrada".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Configuración LDAP actualizada exitosamente"
    })))
}

/// DELETE /api/ldap-config/:id
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query("DELETE FROM ldap_config WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Configuración LDAP no encontrada".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Configuración LDAP eliminada exitosamente"
    })))
}
