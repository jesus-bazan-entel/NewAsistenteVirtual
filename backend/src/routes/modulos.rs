use std::sync::Arc;

use axum::{extract::State, Json};
use serde_json::{json, Value};

use crate::error::AppResult;
use crate::models::*;
use crate::AppState;

/// GET /api/modulos
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let modulos = sqlx::query_as::<_, Modulo>(
        "SELECT id_modulo, nombre, ruta, icono FROM modulos ORDER BY id_modulo",
    )
    .fetch_all(&state.pool)
    .await?;

    let submodulos = sqlx::query_as::<_, Submodulo>(
        "SELECT id_submodulo, nombre, ruta, icono, id_modulo FROM submodulos ORDER BY posicion, id_submodulo",
    )
    .fetch_all(&state.pool)
    .await?;

    let resultado: Vec<ModuloConSubmodulos> = modulos
        .into_iter()
        .map(|m| {
            let subs: Vec<Submodulo> = submodulos
                .iter()
                .filter(|s| s.id_modulo == Some(m.id_modulo))
                .cloned()
                .collect();

            ModuloConSubmodulos {
                id_modulo: m.id_modulo,
                nombre: m.nombre,
                ruta: m.ruta,
                icono: m.icono,
                submodulos: subs,
            }
        })
        .collect();

    Ok(Json(json!({
        "estado": true,
        "modulos": resultado
    })))
}
