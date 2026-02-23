use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};

use std::collections::HashMap;

use crate::auth::middleware::AuthUser;
use crate::error::{AppError, AppResult};
use crate::models::*;
use crate::AppState;

/// GET /api/usuarios
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
    _auth: AuthUser,
) -> AppResult<Json<Value>> {
    let usuarios = sqlx::query_as::<_, UsuarioResponse>(
        "SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.acceso,
                u.id_perfil, p.nombre AS perfil_nombre
         FROM usuarios u
         LEFT JOIN perfiles p ON p.id_perfil = u.id_perfil
         ORDER BY u.id_usuario",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "usuarios": usuarios
    })))
}

/// POST /api/usuarios
pub async fn crear(
    State(state): State<Arc<AppState>>,
    _auth: AuthUser,
    Json(body): Json<CreateUsuario>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombres = html_escape::encode_text(&body.nombres).to_string();
    let apellidos = html_escape::encode_text(&body.apellidos).to_string();
    let correo = html_escape::encode_text(&body.correo).to_string();

    // Check email uniqueness
    let existing = sqlx::query_scalar::<_, i32>(
        "SELECT id_usuario FROM usuarios WHERE correo = $1",
    )
    .bind(&correo)
    .fetch_optional(&state.pool)
    .await?;

    if existing.is_some() {
        return Err(AppError::Conflict(
            "Ya existe un usuario con ese correo".to_string(),
        ));
    }

    // Hash password with bcrypt
    let hashed_password = bcrypt::hash(&body.clave, bcrypt::DEFAULT_COST)?;

    let usuario = sqlx::query_as::<_, UsuarioResponse>(
        "INSERT INTO usuarios (nombres, apellidos, correo, clave, acceso, id_perfil)
         VALUES ($1, $2, $3, $4, 'A', $5)
         RETURNING id_usuario, nombres, apellidos, correo, acceso, id_perfil,
                   NULL::text AS perfil_nombre",
    )
    .bind(&nombres)
    .bind(&apellidos)
    .bind(&correo)
    .bind(&hashed_password)
    .bind(body.id_perfil)
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Usuario creado exitosamente",
            "data": usuario
        })),
    ))
}

/// GET /api/usuarios/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    _auth: AuthUser,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let usuario = sqlx::query_as::<_, UsuarioResponse>(
        "SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.acceso,
                u.id_perfil, p.nombre AS perfil_nombre
         FROM usuarios u
         LEFT JOIN perfiles p ON p.id_perfil = u.id_perfil
         WHERE u.id_usuario = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Usuario no encontrado".to_string()))?;

    Ok(Json(json!({
        "estado": true,
        "data": usuario
    })))
}

/// PUT /api/usuarios/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    _auth: AuthUser,
    Path(id): Path<i32>,
    Json(body): Json<UpdateUsuario>,
) -> AppResult<Json<Value>> {
    let nombres = html_escape::encode_text(&body.nombres).to_string();
    let apellidos = html_escape::encode_text(&body.apellidos).to_string();
    let correo = html_escape::encode_text(&body.correo).to_string();

    // Check that this user exists
    let existing = sqlx::query_scalar::<_, i32>(
        "SELECT id_usuario FROM usuarios WHERE id_usuario = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?;

    if existing.is_none() {
        return Err(AppError::NotFound("Usuario no encontrado".to_string()));
    }

    // Check email uniqueness (excluding current user)
    let duplicate = sqlx::query_scalar::<_, i32>(
        "SELECT id_usuario FROM usuarios WHERE correo = $1 AND id_usuario != $2",
    )
    .bind(&correo)
    .bind(id)
    .fetch_optional(&state.pool)
    .await?;

    if duplicate.is_some() {
        return Err(AppError::Conflict(
            "Ya existe otro usuario con ese correo".to_string(),
        ));
    }

    // If clave is provided, hash it and update; otherwise update without clave
    if let Some(ref clave) = body.clave {
        let hashed_password = bcrypt::hash(clave, bcrypt::DEFAULT_COST)?;
        sqlx::query(
            "UPDATE usuarios
             SET nombres = $1, apellidos = $2, correo = $3, clave = $4, id_perfil = $5
             WHERE id_usuario = $6",
        )
        .bind(&nombres)
        .bind(&apellidos)
        .bind(&correo)
        .bind(&hashed_password)
        .bind(body.id_perfil)
        .bind(id)
        .execute(&state.pool)
        .await?;
    } else {
        sqlx::query(
            "UPDATE usuarios
             SET nombres = $1, apellidos = $2, correo = $3, id_perfil = $4
             WHERE id_usuario = $5",
        )
        .bind(&nombres)
        .bind(&apellidos)
        .bind(&correo)
        .bind(body.id_perfil)
        .bind(id)
        .execute(&state.pool)
        .await?;
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Usuario actualizado exitosamente"
    })))
}

/// DELETE /api/usuarios/:id?force=true
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    _auth: AuthUser,
    Path(id): Path<i32>,
    Query(params): Query<HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let force = params.get("force").map(|v| v == "true").unwrap_or(false);

    if force {
        let mut tx = state.pool.begin().await?;

        // pruebas del usuario → ejecuciones → escenarios
        sqlx::query(
            "DELETE FROM escenarios WHERE id_ejecucion IN (
                SELECT id_ejecucion FROM ejecuciones WHERE id_prueba IN (
                    SELECT id_prueba FROM pruebas WHERE id_usuario = $1
                )
            )"
        ).bind(id).execute(&mut *tx).await?;

        sqlx::query(
            "DELETE FROM ejecuciones WHERE id_prueba IN (
                SELECT id_prueba FROM pruebas WHERE id_usuario = $1
            )"
        ).bind(id).execute(&mut *tx).await?;

        sqlx::query("DELETE FROM pruebas WHERE id_usuario = $1")
            .bind(id).execute(&mut *tx).await?;

        let result = sqlx::query("DELETE FROM usuarios WHERE id_usuario = $1")
            .bind(id).execute(&mut *tx).await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Usuario no encontrado".to_string()));
        }

        tx.commit().await?;

        return Ok(Json(json!({
            "estado": true,
            "mensaje": "Usuario y registros asociados eliminados exitosamente"
        })));
    }

    let result = sqlx::query("DELETE FROM usuarios WHERE id_usuario = $1")
        .bind(id)
        .execute(&state.pool)
        .await;

    match result {
        Ok(r) => {
            if r.rows_affected() == 0 {
                return Err(AppError::NotFound("Usuario no encontrado".to_string()));
            }
            Ok(Json(json!({
                "estado": true,
                "mensaje": "Usuario eliminado exitosamente"
            })))
        }
        Err(sqlx::Error::Database(db_err))
            if db_err.is_foreign_key_violation() =>
        {
            Err(AppError::Conflict(
                "No se puede eliminar el usuario porque tiene registros asociados. Use la opcion de forzar eliminacion.".to_string(),
            ))
        }
        Err(e) => Err(AppError::Database(e)),
    }
}
