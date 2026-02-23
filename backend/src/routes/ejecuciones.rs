use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::header,
    response::IntoResponse,
    Json,
};
use serde_json::{json, Value};

use crate::error::{AppError, AppResult};
use crate::models::*;
use crate::services::{ejecucion as ejecucion_service, pdf};
use crate::AppState;

/// GET /api/ejecuciones
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    #[derive(Debug, sqlx::FromRow, serde::Serialize)]
    struct EjecucionConPrueba {
        id_ejecucion: i32,
        numero_prueba: Option<i32>,
        fecha_inicio: Option<chrono::DateTime<chrono::Utc>>,
        fecha_fin: Option<chrono::DateTime<chrono::Utc>>,
        estado: Option<String>,
        id_prueba: Option<i32>,
        created_at: Option<chrono::DateTime<chrono::Utc>>,
        updated_at: Option<chrono::DateTime<chrono::Utc>>,
        deleted_at: Option<chrono::DateTime<chrono::Utc>>,
        prueba_nombre: Option<String>,
        matriz_nombre: Option<String>,
    }

    let ejecuciones = sqlx::query_as::<_, EjecucionConPrueba>(
        "SELECT ej.id_ejecucion, ej.numero_prueba, ej.fecha_inicio, ej.fecha_fin,
                ej.estado, ej.id_prueba, ej.created_at, ej.updated_at, ej.deleted_at,
                p.nombre AS prueba_nombre, m.nombre AS matriz_nombre
         FROM ejecuciones ej
         LEFT JOIN pruebas p ON p.id_prueba = ej.id_prueba
         LEFT JOIN matrices m ON m.id_matriz = p.id_matriz
         ORDER BY ej.id_ejecucion DESC",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "ejecuciones": ejecuciones
    })))
}

/// GET /api/ejecuciones/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let ejecucion = sqlx::query_as::<_, Ejecucion>(
        "SELECT id_ejecucion, numero_prueba, fecha_inicio, fecha_fin, estado,
                id_prueba, created_at, updated_at, deleted_at
         FROM ejecuciones
         WHERE id_ejecucion = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Ejecuci\u{00f3}n no encontrada".to_string()))?;

    // Load prueba with matriz name
    let prueba = if let Some(id_prueba) = ejecucion.id_prueba {
        sqlx::query_as::<_, PruebaResumen>(
            "SELECT p.id_prueba, p.nombre, m.nombre AS nombre_matriz, p.correo
             FROM pruebas p
             LEFT JOIN matrices m ON m.id_matriz = p.id_matriz
             WHERE p.id_prueba = $1",
        )
        .bind(id_prueba)
        .fetch_optional(&state.pool)
        .await?
    } else {
        None
    };

    // Load escenarios with canal details
    let escenarios = sqlx::query_as::<_, EscenarioDetalle>(
        r#"SELECT es.id_escenario, es.id_ejecucion, es.id_canal_origen, es.id_destino,
                es.tipo, es.numero_intento, es.uniqueid_en, es.uniqueid_sal,
                es.estado, es."hangupReason", es.mos, es.id_error,
                es.hora_saliente, es.hora_entrante,
                es.created_at, es.updated_at, es.deleted_at,
                co.numero AS canal_origen_numero,
                CASE
                    WHEN es.tipo = 'C' THEN cd.numero
                    WHEN es.tipo = 'E' THEN ne.numero
                    ELSE NULL
                END AS destino_numero,
                oo.nombre AS canal_origen_operador,
                CASE
                    WHEN es.tipo = 'C' THEN od.nombre
                    ELSE NULL
                END AS destino_operador,
                err.mensaje AS error_mensaje
         FROM escenarios es
         LEFT JOIN canales co ON co.id_canal = es.id_canal_origen
         LEFT JOIN tecnologias_operadores too ON too.id_tecnologia_operador = co.id_tecnologia_operador
         LEFT JOIN operadores_telefonicos oo ON oo.id_operador_telefonico = too.id_operador_telefonico
         LEFT JOIN canales cd ON cd.id_canal = es.id_destino AND es.tipo = 'C'
         LEFT JOIN tecnologias_operadores tod ON tod.id_tecnologia_operador = cd.id_tecnologia_operador
         LEFT JOIN operadores_telefonicos od ON od.id_operador_telefonico = tod.id_operador_telefonico
         LEFT JOIN numeros_externos ne ON ne.id_numero_externo = es.id_destino AND es.tipo = 'E'
         LEFT JOIN errores err ON err.id_error = es.id_error
         WHERE es.id_ejecucion = $1
         ORDER BY es.id_escenario ASC"#,
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    // Calculate summary counts
    let total = escenarios.len() as i32;
    let escenarios_pasados = escenarios.iter().filter(|e| {
        matches!(e.estado.as_deref(), Some("EXITOSO"))
    }).count() as i32;
    let escenarios_fallidos = escenarios.iter().filter(|e| {
        matches!(e.estado.as_deref(), Some("FALLIDO") | Some("TIMEOUT") | Some("ERROR"))
    }).count() as i32;
    let escenarios_pendientes = total - escenarios_pasados - escenarios_fallidos;

    let resultado = EjecucionConDetalles {
        id_ejecucion: ejecucion.id_ejecucion,
        numero_prueba: ejecucion.numero_prueba,
        fecha_inicio: ejecucion.fecha_inicio,
        fecha_fin: ejecucion.fecha_fin,
        estado: ejecucion.estado,
        id_prueba: ejecucion.id_prueba,
        created_at: ejecucion.created_at,
        updated_at: ejecucion.updated_at,
        deleted_at: ejecucion.deleted_at,
        prueba,
        escenarios,
    };

    Ok(Json(json!({
        "estado": true,
        "ejecucion": resultado,
        "escenarios_pasados": escenarios_pasados,
        "escenarios_fallidos": escenarios_fallidos,
        "escenarios_pendientes": escenarios_pendientes
    })))
}

/// GET /api/ejecuciones/:id/escenarios
pub async fn buscar_escenarios(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    // Load escenarios for an ejecucion where canales are LIBRE
    // For tipo='C', both origin and destination must be LIBRE
    // For tipo='E', only origin must be LIBRE
    let escenarios = sqlx::query_as::<_, EscenarioDetalle>(
        r#"SELECT es.id_escenario, es.id_ejecucion, es.id_canal_origen, es.id_destino,
                es.tipo, es.numero_intento, es.uniqueid_en, es.uniqueid_sal,
                es.estado, es."hangupReason", es.mos, es.id_error,
                es.hora_saliente, es.hora_entrante,
                es.created_at, es.updated_at, es.deleted_at,
                co.numero AS canal_origen_numero,
                CASE
                    WHEN es.tipo = 'C' THEN cd.numero
                    WHEN es.tipo = 'E' THEN ne.numero
                    ELSE NULL
                END AS destino_numero,
                oo.nombre AS canal_origen_operador,
                CASE
                    WHEN es.tipo = 'C' THEN od.nombre
                    ELSE NULL
                END AS destino_operador,
                err.mensaje AS error_mensaje
         FROM escenarios es
         LEFT JOIN canales co ON co.id_canal = es.id_canal_origen
         LEFT JOIN tecnologias_operadores too ON too.id_tecnologia_operador = co.id_tecnologia_operador
         LEFT JOIN operadores_telefonicos oo ON oo.id_operador_telefonico = too.id_operador_telefonico
         LEFT JOIN canales cd ON cd.id_canal = es.id_destino AND es.tipo = 'C'
         LEFT JOIN tecnologias_operadores tod ON tod.id_tecnologia_operador = cd.id_tecnologia_operador
         LEFT JOIN operadores_telefonicos od ON od.id_operador_telefonico = tod.id_operador_telefonico
         LEFT JOIN numeros_externos ne ON ne.id_numero_externo = es.id_destino AND es.tipo = 'E'
         LEFT JOIN errores err ON err.id_error = es.id_error
         WHERE es.id_ejecucion = $1
           AND co.estado_llamada = 'LIBRE'
           AND (cd.estado_llamada = 'LIBRE' OR es.tipo = 'E')
         ORDER BY es.id_escenario ASC"#,
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(json!({
        "estado": true,
        "escenarios": escenarios
    })))
}

/// GET /api/ejecuciones/:id/pdf
pub async fn download_pdf(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> Result<impl IntoResponse, AppError> {
    let ejecucion = ejecucion_service::find_by_id(&state.pool, id)
        .await
        .map_err(|e| AppError::NotFound(e.to_string()))?;

    let pdf_bytes = pdf::generate_execution_pdf(&ejecucion)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let filename = format!("Reporte_Ejecucion_{}.pdf", id);

    Ok((
        [
            (header::CONTENT_TYPE, "application/pdf".to_string()),
            (
                header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{}\"", filename),
            ),
        ],
        pdf_bytes,
    ))
}

/// POST /api/ejecuciones/:id/reenviar
pub async fn reenviar_reporte(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    ejecucion_service::send_ejecucion_by_mail(&state.pool, id)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Reporte enviado por correo correctamente"
    })))
}
