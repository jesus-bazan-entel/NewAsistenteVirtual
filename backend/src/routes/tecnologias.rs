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

/// GET /api/tecnologias
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let tecnologias = sqlx::query_as::<_, Tecnologia>(
        "SELECT id_tecnologia, nombre FROM tecnologias ORDER BY id_tecnologia",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_joins = sqlx::query_as::<_, TecnologiaOperador>(
        "SELECT id_tecnologia_operador, id_tecnologia, id_operador_telefonico
         FROM tecnologias_operadores",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_operadores = sqlx::query_as::<_, OperadorTelefonico>(
        "SELECT id_operador_telefonico, nombre, codigo FROM operadores_telefonicos",
    )
    .fetch_all(&state.pool)
    .await?;

    let resultado: Vec<TecnologiaConOperadores> = tecnologias
        .into_iter()
        .map(|t| {
            let op_ids: Vec<i32> = all_joins
                .iter()
                .filter(|j| j.id_tecnologia == t.id_tecnologia)
                .map(|j| j.id_operador_telefonico)
                .collect();

            let operadores: Vec<OperadorTelefonico> = all_operadores
                .iter()
                .filter(|o| op_ids.contains(&o.id_operador_telefonico))
                .cloned()
                .collect();

            TecnologiaConOperadores {
                id_tecnologia: t.id_tecnologia,
                nombre: t.nombre,
                operadores,
            }
        })
        .collect();

    Ok(Json(json!({
        "estado": true,
        "tecnologias": resultado
    })))
}

/// POST /api/tecnologias
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateTecnologia>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();

    let row = sqlx::query_as::<_, Tecnologia>(
        "INSERT INTO tecnologias (nombre) VALUES ($1)
         RETURNING id_tecnologia, nombre",
    )
    .bind(&nombre)
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Tecnología creada exitosamente",
            "data": row
        })),
    ))
}

/// GET /api/tecnologias/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let tecnologia = sqlx::query_as::<_, Tecnologia>(
        "SELECT id_tecnologia, nombre FROM tecnologias WHERE id_tecnologia = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Tecnología no encontrada".to_string()))?;

    let operadores = sqlx::query_as::<_, OperadorTelefonico>(
        "SELECT o.id_operador_telefonico, o.nombre, o.codigo
         FROM operadores_telefonicos o
         INNER JOIN tecnologias_operadores to2 ON to2.id_operador_telefonico = o.id_operador_telefonico
         WHERE to2.id_tecnologia = $1
         ORDER BY o.id_operador_telefonico",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let resultado = TecnologiaConOperadores {
        id_tecnologia: tecnologia.id_tecnologia,
        nombre: tecnologia.nombre,
        operadores,
    };

    Ok(Json(json!({
        "estado": true,
        "data": resultado
    })))
}

/// PUT /api/tecnologias/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<CreateTecnologia>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();

    let result = sqlx::query(
        "UPDATE tecnologias SET nombre = $1 WHERE id_tecnologia = $2",
    )
    .bind(&nombre)
    .bind(id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Tecnología no encontrada".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Tecnología actualizada exitosamente"
    })))
}

/// DELETE /api/tecnologias/:id?force=true
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Query(params): Query<HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let force = params.get("force").map(|v| v == "true").unwrap_or(false);

    if force {
        let mut tx = state.pool.begin().await?;

        // tecnologias_operadores → canales dependientes
        let to_ids: Vec<i32> = sqlx::query_scalar(
            "SELECT id_tecnologia_operador FROM tecnologias_operadores WHERE id_tecnologia = $1"
        ).bind(id).fetch_all(&mut *tx).await?;

        if !to_ids.is_empty() {
            // escenarios que referencian canales de estos tec_op
            sqlx::query(
                "DELETE FROM escenarios WHERE id_canal_origen IN (
                    SELECT id_canal FROM canales WHERE id_tecnologia_operador = ANY($1)
                )"
            ).bind(&to_ids).execute(&mut *tx).await?;

            // matrices_canales_destinos
            sqlx::query(
                "DELETE FROM matrices_canales_destinos WHERE id_canal_origen IN (
                    SELECT id_canal FROM canales WHERE id_tecnologia_operador = ANY($1)
                ) OR id_canal_destino IN (
                    SELECT id_canal FROM canales WHERE id_tecnologia_operador = ANY($1)
                )"
            ).bind(&to_ids).execute(&mut *tx).await?;

            // canales_claves
            sqlx::query(
                "DELETE FROM canales_claves WHERE id_canal IN (
                    SELECT id_canal FROM canales WHERE id_tecnologia_operador = ANY($1)
                )"
            ).bind(&to_ids).execute(&mut *tx).await?;

            // canales
            sqlx::query(
                "DELETE FROM canales WHERE id_tecnologia_operador = ANY($1)"
            ).bind(&to_ids).execute(&mut *tx).await?;
        }

        sqlx::query("DELETE FROM tecnologias_operadores WHERE id_tecnologia = $1")
            .bind(id).execute(&mut *tx).await?;

        let result = sqlx::query("DELETE FROM tecnologias WHERE id_tecnologia = $1")
            .bind(id).execute(&mut *tx).await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Tecnología no encontrada".to_string()));
        }

        tx.commit().await?;

        return Ok(Json(json!({
            "estado": true,
            "mensaje": "Tecnología y registros asociados eliminados exitosamente"
        })));
    }

    let result = sqlx::query("DELETE FROM tecnologias WHERE id_tecnologia = $1")
        .bind(id)
        .execute(&state.pool)
        .await;

    match result {
        Ok(r) => {
            if r.rows_affected() == 0 {
                return Err(AppError::NotFound("Tecnología no encontrada".to_string()));
            }
            Ok(Json(json!({
                "estado": true,
                "mensaje": "Tecnología eliminada exitosamente"
            })))
        }
        Err(sqlx::Error::Database(db_err))
            if db_err.is_foreign_key_violation() =>
        {
            Err(AppError::Conflict(
                "No se puede eliminar la tecnología porque tiene registros asociados. Use la opcion de forzar eliminacion.".to_string(),
            ))
        }
        Err(e) => Err(AppError::Database(e)),
    }
}
