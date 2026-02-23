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

/// GET /api/perfiles
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let perfiles = sqlx::query_as::<_, Perfil>(
        "SELECT id_perfil, nombre, descripcion, estado
         FROM perfiles
         ORDER BY id_perfil",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_ps = sqlx::query_as::<_, PerfilSubmodulo>(
        "SELECT id_perfil, id_submodulo FROM perfiles_submodulos",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_submodulos = sqlx::query_as::<_, Submodulo>(
        "SELECT id_submodulo, nombre, ruta, icono, id_modulo FROM submodulos",
    )
    .fetch_all(&state.pool)
    .await?;

    #[derive(Debug, sqlx::FromRow)]
    struct UsuarioConPerfil {
        id_usuario: i32,
        nombres: Option<String>,
        apellidos: Option<String>,
        id_perfil: Option<i32>,
    }

    let usuarios_con_perfil = sqlx::query_as::<_, UsuarioConPerfil>(
        "SELECT id_usuario, nombres, apellidos, id_perfil FROM usuarios",
    )
    .fetch_all(&state.pool)
    .await?;

    let resultado: Vec<PerfilConSubmodulos> = perfiles
        .into_iter()
        .map(|p| {
            let sub_ids: Vec<i32> = all_ps
                .iter()
                .filter(|ps| ps.id_perfil == p.id_perfil)
                .map(|ps| ps.id_submodulo)
                .collect();

            let submodulos: Vec<Submodulo> = all_submodulos
                .iter()
                .filter(|s| sub_ids.contains(&s.id_submodulo))
                .cloned()
                .collect();

            let usuarios: Vec<UsuarioResumen> = usuarios_con_perfil
                .iter()
                .filter(|u| u.id_perfil == Some(p.id_perfil))
                .map(|u| UsuarioResumen {
                    id_usuario: u.id_usuario,
                    nombres: u.nombres.clone(),
                    apellidos: u.apellidos.clone(),
                })
                .collect();

            PerfilConSubmodulos {
                id_perfil: p.id_perfil,
                nombre: p.nombre,
                descripcion: p.descripcion,
                estado: p.estado,
                submodulos,
                usuarios,
            }
        })
        .collect();

    Ok(Json(json!({
        "estado": true,
        "perfiles": resultado
    })))
}

/// POST /api/perfiles
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreatePerfil>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let descripcion = html_escape::encode_text(&body.descripcion).to_string();

    let mut tx = state.pool.begin().await?;

    let perfil = sqlx::query_as::<_, Perfil>(
        "INSERT INTO perfiles (nombre, descripcion, estado) VALUES ($1, $2, 'A')
         RETURNING id_perfil, nombre, descripcion, estado",
    )
    .bind(&nombre)
    .bind(&descripcion)
    .fetch_one(&mut *tx)
    .await?;

    for id_submodulo in &body.submodulos {
        sqlx::query(
            "INSERT INTO perfiles_submodulos (id_perfil, id_submodulo)
             VALUES ($1, $2)",
        )
        .bind(perfil.id_perfil)
        .bind(id_submodulo)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Perfil creado exitosamente",
            "data": perfil
        })),
    ))
}

/// GET /api/perfiles/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let perfil = sqlx::query_as::<_, Perfil>(
        "SELECT id_perfil, nombre, descripcion, estado
         FROM perfiles
         WHERE id_perfil = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Perfil no encontrado".to_string()))?;

    let submodulos = sqlx::query_as::<_, Submodulo>(
        "SELECT s.id_submodulo, s.nombre, s.ruta, s.icono, s.id_modulo
         FROM submodulos s
         INNER JOIN perfiles_submodulos ps ON ps.id_submodulo = s.id_submodulo
         WHERE ps.id_perfil = $1
         ORDER BY s.posicion, s.id_submodulo",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let usuarios = sqlx::query_as::<_, UsuarioResumen>(
        "SELECT id_usuario, nombres, apellidos
         FROM usuarios
         WHERE id_perfil = $1",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let resultado = PerfilConSubmodulos {
        id_perfil: perfil.id_perfil,
        nombre: perfil.nombre,
        descripcion: perfil.descripcion,
        estado: perfil.estado,
        submodulos,
        usuarios,
    };

    Ok(Json(json!({
        "estado": true,
        "data": resultado
    })))
}

/// PUT /api/perfiles/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<UpdatePerfil>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let descripcion = html_escape::encode_text(&body.descripcion).to_string();

    let mut tx = state.pool.begin().await?;

    let result = sqlx::query(
        "UPDATE perfiles SET nombre = $1, descripcion = $2
         WHERE id_perfil = $3",
    )
    .bind(&nombre)
    .bind(&descripcion)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Perfil no encontrado".to_string()));
    }

    // Sync submodulos: delete removed, add new
    sqlx::query("DELETE FROM perfiles_submodulos WHERE id_perfil = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;

    for id_submodulo in &body.submodulos {
        sqlx::query(
            "INSERT INTO perfiles_submodulos (id_perfil, id_submodulo)
             VALUES ($1, $2)",
        )
        .bind(id)
        .bind(id_submodulo)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Perfil actualizado exitosamente"
    })))
}

/// DELETE /api/perfiles/:id?force=true
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Query(params): Query<HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let force = params.get("force").map(|v| v == "true").unwrap_or(false);

    let mut tx = state.pool.begin().await?;

    // Remove submodulo associations first
    sqlx::query("DELETE FROM perfiles_submodulos WHERE id_perfil = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;

    if force {
        // Desvincular usuarios de este perfil (poner id_perfil = NULL)
        sqlx::query("UPDATE usuarios SET id_perfil = NULL WHERE id_perfil = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
    }

    let result = sqlx::query("DELETE FROM perfiles WHERE id_perfil = $1")
        .bind(id)
        .execute(&mut *tx)
        .await;

    match result {
        Ok(r) => {
            if r.rows_affected() == 0 {
                return Err(AppError::NotFound("Perfil no encontrado".to_string()));
            }
            tx.commit().await?;
            Ok(Json(json!({
                "estado": true,
                "mensaje": if force { "Perfil eliminado y usuarios desvinculados exitosamente" } else { "Perfil eliminado exitosamente" }
            })))
        }
        Err(sqlx::Error::Database(db_err))
            if db_err.is_foreign_key_violation() =>
        {
            Err(AppError::Conflict(
                "No se puede eliminar el perfil porque tiene usuarios asociados. Use la opcion de forzar eliminacion.".to_string(),
            ))
        }
        Err(e) => Err(AppError::Database(e)),
    }
}
