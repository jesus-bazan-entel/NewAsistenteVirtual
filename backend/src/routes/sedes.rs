use std::sync::Arc;

use axum::{extract::State, Json};
use serde_json::{json, Value};

use crate::error::AppResult;
use crate::models::*;
use crate::AppState;

/// GET /api/sedes
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let sedes = sqlx::query_as::<_, Sede>(
        "SELECT id_sede, nombre FROM sedes ORDER BY id_sede",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "sedes": sedes
    })))
}
