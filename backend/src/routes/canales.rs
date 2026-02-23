use std::sync::Arc;

use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::error::{AppError, AppResult};
use crate::models::*;
use crate::AppState;

/// GET /api/canales
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let canales = sqlx::query_as::<_, CanalDetalle>(
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
         WHERE c.id_tecnologia_operador IS NOT NULL AND c.deleted_at IS NULL
         ORDER BY c.id_canal ASC",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "canales": canales
    })))
}

/// GET /api/canales/:id
pub async fn obtener_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let canal = sqlx::query_as::<_, CanalDetalle>(
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
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Canal no encontrado".to_string()))?;

    Ok(Json(json!({
        "estado": true,
        "canal": canal
    })))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCanal {
    pub estado: Option<String>,
    pub estado_llamada: Option<String>,
    pub numero: Option<String>,
    pub nro_ranura: Option<i32>,
    pub posicion: Option<i32>,
    pub id_tecnologia_operador: Option<i32>,
}

/// PUT /api/canales/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<UpdateCanal>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query(
        "UPDATE canales
         SET estado = COALESCE($1, estado),
             estado_llamada = COALESCE($2, estado_llamada),
             numero = COALESCE($3, numero),
             nro_ranura = COALESCE($4, nro_ranura),
             posicion = COALESCE($5, posicion),
             id_tecnologia_operador = COALESCE($6, id_tecnologia_operador),
             updated_at = NOW()
         WHERE id_canal = $7",
    )
    .bind(&body.estado)
    .bind(&body.estado_llamada)
    .bind(&body.numero)
    .bind(body.nro_ranura)
    .bind(body.posicion)
    .bind(body.id_tecnologia_operador)
    .bind(id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Canal no encontrado".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se actualiz\u{00f3} correctamente el canal"
    })))
}
