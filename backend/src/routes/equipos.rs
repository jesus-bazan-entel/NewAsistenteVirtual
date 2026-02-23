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

/// GET /api/equipos
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let equipos = sqlx::query_as::<_, Equipo>(
        "SELECT id_equipo, nombre, ip, tipo, ranuras, id_sede, estado,
                created_at, updated_at, deleted_at
         FROM equipos
         WHERE deleted_at IS NULL
         ORDER BY id_equipo ASC",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_sedes = sqlx::query_as::<_, Sede>(
        "SELECT id_sede, nombre FROM sedes",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_canales = sqlx::query_as::<_, Canal>(
        "SELECT id_canal, id_tecnologia_operador, id_equipo, estado, nro_ranura,
                numero, posicion, estado_llamada, created_at, updated_at, deleted_at
         FROM canales
         WHERE deleted_at IS NULL
         ORDER BY posicion ASC, id_canal ASC",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_tec_op = sqlx::query_as::<_, TecnologiaOperadorDetalle>(
        "SELECT to2.id_tecnologia_operador, to2.id_tecnologia, to2.id_operador_telefonico,
                t.nombre AS nombre_tecnologia, o.nombre AS nombre_operador
         FROM tecnologias_operadores to2
         LEFT JOIN tecnologias t ON t.id_tecnologia = to2.id_tecnologia
         LEFT JOIN operadores_telefonicos o ON o.id_operador_telefonico = to2.id_operador_telefonico",
    )
    .fetch_all(&state.pool)
    .await?;

    let resultado: Vec<EquipoConDetalles> = equipos
        .into_iter()
        .map(|e| {
            let sede = all_sedes
                .iter()
                .find(|s| Some(s.id_sede) == e.id_sede)
                .cloned();

            let canales: Vec<CanalDetalle> = all_canales
                .iter()
                .filter(|c| c.id_equipo == Some(e.id_equipo))
                .map(|c| {
                    let tec_op = c.id_tecnologia_operador.and_then(|to_id| {
                        all_tec_op.iter().find(|to| to.id_tecnologia_operador == to_id)
                    });

                    CanalDetalle {
                        id_canal: c.id_canal,
                        id_tecnologia_operador: c.id_tecnologia_operador,
                        id_equipo: c.id_equipo,
                        estado: c.estado.clone(),
                        nro_ranura: c.nro_ranura,
                        numero: c.numero.clone(),
                        posicion: c.posicion,
                        estado_llamada: c.estado_llamada.clone(),
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                        deleted_at: c.deleted_at,
                        nombre_tecnologia: tec_op.and_then(|to| to.nombre_tecnologia.clone()),
                        nombre_operador: tec_op.and_then(|to| to.nombre_operador.clone()),
                        nombre_equipo: Some(e.nombre.clone().unwrap_or_default()),
                    }
                })
                .collect();

            EquipoConDetalles {
                id_equipo: e.id_equipo,
                nombre: e.nombre,
                ip: e.ip,
                tipo: e.tipo,
                ranuras: e.ranuras,
                id_sede: e.id_sede,
                estado: e.estado,
                created_at: e.created_at,
                updated_at: e.updated_at,
                deleted_at: e.deleted_at,
                canales,
                sede,
            }
        })
        .collect();

    Ok(Json(json!({
        "estado": true,
        "equipos": resultado
    })))
}

/// POST /api/equipos
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateEquipo>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let ip = html_escape::encode_text(&body.ip).to_string();

    let mut tx = state.pool.begin().await?;

    let equipo = sqlx::query_as::<_, Equipo>(
        "INSERT INTO equipos (nombre, ip, tipo, ranuras, id_sede, estado)
         VALUES ($1, $2, $3, $4, $5, 'A')
         RETURNING id_equipo, nombre, ip, tipo, ranuras, id_sede, estado,
                   created_at, updated_at, deleted_at",
    )
    .bind(&nombre)
    .bind(&ip)
    .bind(&body.tipo)
    .bind(&body.ranuras)
    .bind(body.id_sede)
    .fetch_one(&mut *tx)
    .await?;

    for (i, canal) in body.canales.iter().enumerate() {
        // Find tecnologia_operador by (id_tecnologia, id_operador)
        let tec_op = sqlx::query_scalar::<_, i32>(
            "SELECT id_tecnologia_operador FROM tecnologias_operadores
             WHERE id_tecnologia = $1 AND id_operador_telefonico = $2",
        )
        .bind(canal.id_tecnologia)
        .bind(canal.id_operador)
        .fetch_optional(&mut *tx)
        .await?;

        let posicion = canal.posicion.unwrap_or(i as i32);

        sqlx::query(
            "INSERT INTO canales (id_tecnologia_operador, id_equipo, nro_ranura, numero, posicion)
             VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(tec_op)
        .bind(equipo.id_equipo)
        .bind(canal.nro_ranura)
        .bind(&canal.numero)
        .bind(posicion)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    // Fire-and-forget config sync
    let pool = state.pool.clone();
    let config = state.config.clone();
    let ami = state.ami_client.clone();
    tokio::spawn(async move {
        if let Err(e) = crate::asterisk::sync_asterisk_configs(&pool, &config, &ami).await {
            tracing::error!("Auto-sync after equipo create failed: {}", e);
        }
    });

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Se cre\u{00f3} correctamente el equipo",
            "data": equipo
        })),
    ))
}

/// GET /api/equipos/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let equipo = sqlx::query_as::<_, Equipo>(
        "SELECT id_equipo, nombre, ip, tipo, ranuras, id_sede, estado,
                created_at, updated_at, deleted_at
         FROM equipos
         WHERE id_equipo = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Equipo no encontrado".to_string()))?;

    let sede = if let Some(id_sede) = equipo.id_sede {
        sqlx::query_as::<_, Sede>(
            "SELECT id_sede, nombre FROM sedes WHERE id_sede = $1",
        )
        .bind(id_sede)
        .fetch_optional(&state.pool)
        .await?
    } else {
        None
    };

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
         WHERE c.id_equipo = $1 AND c.deleted_at IS NULL
         ORDER BY c.posicion ASC, c.id_canal ASC",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let resultado = EquipoConDetalles {
        id_equipo: equipo.id_equipo,
        nombre: equipo.nombre,
        ip: equipo.ip,
        tipo: equipo.tipo,
        ranuras: equipo.ranuras,
        id_sede: equipo.id_sede,
        estado: equipo.estado,
        created_at: equipo.created_at,
        updated_at: equipo.updated_at,
        deleted_at: equipo.deleted_at,
        canales,
        sede,
    };

    Ok(Json(json!({
        "estado": true,
        "equipo_response": resultado
    })))
}

/// PUT /api/equipos/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<CreateEquipo>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let ip = html_escape::encode_text(&body.ip).to_string();

    let mut tx = state.pool.begin().await?;

    // Check equipo exists and get current canales
    let existing_canales = sqlx::query_as::<_, Canal>(
        "SELECT id_canal, id_tecnologia_operador, id_equipo, estado, nro_ranura,
                numero, posicion, estado_llamada, created_at, updated_at, deleted_at
         FROM canales
         WHERE id_equipo = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_all(&mut *tx)
    .await?;

    let result = sqlx::query(
        "UPDATE equipos SET nombre = $1, ip = $2, tipo = $3, ranuras = $4, id_sede = $5,
                updated_at = NOW()
         WHERE id_equipo = $6 AND deleted_at IS NULL",
    )
    .bind(&nombre)
    .bind(&ip)
    .bind(&body.tipo)
    .bind(&body.ranuras)
    .bind(body.id_sede)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Equipo no encontrado".to_string()));
    }

    // Process canales: separate into update, add, delete
    let mut canales_actualizar = Vec::new();
    let mut canales_agregar = Vec::new();

    for (i, canal) in body.canales.iter().enumerate() {
        // Find tecnologia_operador
        let tec_op = sqlx::query_scalar::<_, i32>(
            "SELECT id_tecnologia_operador FROM tecnologias_operadores
             WHERE id_tecnologia = $1 AND id_operador_telefonico = $2",
        )
        .bind(canal.id_tecnologia)
        .bind(canal.id_operador)
        .fetch_optional(&mut *tx)
        .await?;

        let posicion = canal.posicion.unwrap_or(i as i32);

        if let Some(id_canal) = canal.id_canal {
            canales_actualizar.push((id_canal, tec_op, canal.nro_ranura, canal.numero.clone(), posicion));
        } else {
            canales_agregar.push((tec_op, canal.nro_ranura, canal.numero.clone(), posicion));
        }
    }

    // Determine canales to delete: in DB but not in update list
    let update_ids: Vec<i32> = canales_actualizar.iter().map(|(id, _, _, _, _)| *id).collect();
    let canales_eliminar: Vec<i32> = existing_canales
        .iter()
        .filter(|c| !update_ids.contains(&c.id_canal))
        .map(|c| c.id_canal)
        .collect();

    // Update existing canales
    for (id_canal, id_tec_op, nro_ranura, numero, posicion) in &canales_actualizar {
        sqlx::query(
            "UPDATE canales SET id_tecnologia_operador = $1, nro_ranura = $2,
                    numero = $3, posicion = $4, updated_at = NOW()
             WHERE id_canal = $5",
        )
        .bind(id_tec_op)
        .bind(nro_ranura)
        .bind(numero)
        .bind(posicion)
        .bind(id_canal)
        .execute(&mut *tx)
        .await?;
    }

    // Add new canales
    for (id_tec_op, nro_ranura, numero, posicion) in &canales_agregar {
        sqlx::query(
            "INSERT INTO canales (id_tecnologia_operador, id_equipo, nro_ranura, numero, posicion)
             VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(id_tec_op)
        .bind(id)
        .bind(nro_ranura)
        .bind(numero)
        .bind(posicion)
        .execute(&mut *tx)
        .await?;
    }

    // Soft-delete removed canales
    for id_canal in &canales_eliminar {
        sqlx::query(
            "UPDATE canales SET deleted_at = NOW() WHERE id_canal = $1",
        )
        .bind(id_canal)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    // Fire-and-forget config sync
    let pool = state.pool.clone();
    let config = state.config.clone();
    let ami = state.ami_client.clone();
    tokio::spawn(async move {
        if let Err(e) = crate::asterisk::sync_asterisk_configs(&pool, &config, &ami).await {
            tracing::error!("Auto-sync after equipo update failed: {}", e);
        }
    });

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se actualiz\u{00f3} correctamente el equipo"
    })))
}

/// DELETE /api/equipos/:id
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let mut tx = state.pool.begin().await?;

    // Soft-delete canales belonging to this equipo
    sqlx::query(
        "UPDATE canales SET deleted_at = NOW() WHERE id_equipo = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    // Soft-delete the equipo
    let result = sqlx::query(
        "UPDATE equipos SET deleted_at = NOW() WHERE id_equipo = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Equipo no encontrado".to_string()));
    }

    tx.commit().await?;

    // Fire-and-forget config sync
    let pool = state.pool.clone();
    let config = state.config.clone();
    let ami = state.ami_client.clone();
    tokio::spawn(async move {
        if let Err(e) = crate::asterisk::sync_asterisk_configs(&pool, &config, &ami).await {
            tracing::error!("Auto-sync after equipo delete failed: {}", e);
        }
    });

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se elimin\u{00f3} correctamente el equipo"
    })))
}
