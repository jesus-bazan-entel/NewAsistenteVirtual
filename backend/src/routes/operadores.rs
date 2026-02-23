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

/// GET /api/operadores-telefonicos
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let operadores = sqlx::query_as::<_, OperadorTelefonico>(
        "SELECT id_operador_telefonico, nombre, codigo
         FROM operadores_telefonicos
         ORDER BY id_operador_telefonico",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_joins = sqlx::query_as::<_, TecnologiaOperador>(
        "SELECT id_tecnologia_operador, id_tecnologia, id_operador_telefonico
         FROM tecnologias_operadores",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_tecnologias = sqlx::query_as::<_, Tecnologia>(
        "SELECT id_tecnologia, nombre FROM tecnologias",
    )
    .fetch_all(&state.pool)
    .await?;

    let resultado: Vec<OperadorConTecnologias> = operadores
        .into_iter()
        .map(|o| {
            let tec_ids: Vec<i32> = all_joins
                .iter()
                .filter(|j| j.id_operador_telefonico == o.id_operador_telefonico)
                .map(|j| j.id_tecnologia)
                .collect();

            let tecnologias: Vec<Tecnologia> = all_tecnologias
                .iter()
                .filter(|t| tec_ids.contains(&t.id_tecnologia))
                .cloned()
                .collect();

            OperadorConTecnologias {
                id_operador_telefonico: o.id_operador_telefonico,
                nombre: o.nombre,
                codigo: o.codigo,
                tecnologias,
            }
        })
        .collect();

    Ok(Json(json!({
        "estado": true,
        "operadores": resultado
    })))
}

/// POST /api/operadores-telefonicos
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateOperador>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let codigo = html_escape::encode_text(&body.codigo).to_string();

    let mut tx = state.pool.begin().await?;

    let operador = sqlx::query_as::<_, OperadorTelefonico>(
        "INSERT INTO operadores_telefonicos (nombre, codigo) VALUES ($1, $2)
         RETURNING id_operador_telefonico, nombre, codigo",
    )
    .bind(&nombre)
    .bind(&codigo)
    .fetch_one(&mut *tx)
    .await?;

    for id_tecnologia in &body.tecnologias {
        sqlx::query(
            "INSERT INTO tecnologias_operadores (id_tecnologia, id_operador_telefonico)
             VALUES ($1, $2)",
        )
        .bind(id_tecnologia)
        .bind(operador.id_operador_telefonico)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Operador creado exitosamente",
            "data": operador
        })),
    ))
}

/// GET /api/operadores-telefonicos/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let operador = sqlx::query_as::<_, OperadorTelefonico>(
        "SELECT id_operador_telefonico, nombre, codigo
         FROM operadores_telefonicos
         WHERE id_operador_telefonico = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Operador no encontrado".to_string()))?;

    let tecnologias = sqlx::query_as::<_, Tecnologia>(
        "SELECT t.id_tecnologia, t.nombre
         FROM tecnologias t
         INNER JOIN tecnologias_operadores to2 ON to2.id_tecnologia = t.id_tecnologia
         WHERE to2.id_operador_telefonico = $1
         ORDER BY t.id_tecnologia",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let resultado = OperadorConTecnologias {
        id_operador_telefonico: operador.id_operador_telefonico,
        nombre: operador.nombre,
        codigo: operador.codigo,
        tecnologias,
    };

    Ok(Json(json!({
        "estado": true,
        "data": resultado
    })))
}

/// PUT /api/operadores-telefonicos/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<UpdateOperador>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let codigo = html_escape::encode_text(&body.codigo).to_string();

    let mut tx = state.pool.begin().await?;

    let result = sqlx::query(
        "UPDATE operadores_telefonicos SET nombre = $1, codigo = $2
         WHERE id_operador_telefonico = $3",
    )
    .bind(&nombre)
    .bind(&codigo)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Operador no encontrado".to_string()));
    }

    // Sync tecnologias: delete old associations and add new ones
    sqlx::query(
        "DELETE FROM tecnologias_operadores WHERE id_operador_telefonico = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    for id_tecnologia in &body.tecnologias {
        sqlx::query(
            "INSERT INTO tecnologias_operadores (id_tecnologia, id_operador_telefonico)
             VALUES ($1, $2)",
        )
        .bind(id_tecnologia)
        .bind(id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Operador actualizado exitosamente"
    })))
}

/// DELETE /api/operadores-telefonicos/:id
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let mut tx = state.pool.begin().await?;

    // Remove junction table associations first
    sqlx::query(
        "DELETE FROM tecnologias_operadores WHERE id_operador_telefonico = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    let result = sqlx::query(
        "DELETE FROM operadores_telefonicos WHERE id_operador_telefonico = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Operador no encontrado".to_string()));
    }

    tx.commit().await?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Operador eliminado exitosamente"
    })))
}
