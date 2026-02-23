use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::{Local, Timelike, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::error::{AppError, AppResult};
use crate::models::*;
use crate::AppState;

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct C2CRequest {
    pub id_origen: i32,
    pub id_destino: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EjecutarMatrizRequest {
    pub id_matriz: i32,
}

// ---------------------------------------------------------------------------
// Helper: validate C2C (channel-to-channel)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
struct ValidateResult {
    status: String,
    data: Value,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct CanalConEquipoRow {
    id_canal: i32,
    numero: Option<String>,
    estado_llamada: Option<String>,
    equipo_nombre: Option<String>,
}

async fn validate_c2c(
    pool: &sqlx::PgPool,
    id_canal_origen: i32,
    id_destino: i32,
    tipo: &str,
) -> AppResult<ValidateResult> {
    // Validate origin channel
    let origen = sqlx::query_as::<_, CanalConEquipoRow>(
        "SELECT c.id_canal, c.numero, c.estado_llamada, e.nombre AS equipo_nombre
         FROM canales c
         LEFT JOIN equipos e ON e.id_equipo = c.id_equipo
         WHERE c.id_canal = $1",
    )
    .bind(id_canal_origen)
    .fetch_optional(pool)
    .await?;

    let origen = match origen {
        Some(o) => o,
        None => {
            return Ok(ValidateResult {
                status: "error".to_string(),
                data: json!({"id_origen": "El canal no existe"}),
            });
        }
    };

    if origen.numero.is_none() {
        return Ok(ValidateResult {
            status: "error".to_string(),
            data: json!({"id_origen": "N\u{00fa}mero asociado es null"}),
        });
    }

    if origen.estado_llamada.as_deref() != Some("LIBRE") && origen.numero.is_some() {
        // Check if updated_at is within last 180 seconds
        let updated_at = sqlx::query_scalar::<_, Option<chrono::DateTime<Utc>>>(
            "SELECT updated_at FROM canales WHERE id_canal = $1",
        )
        .bind(id_canal_origen)
        .fetch_one(pool)
        .await?;

        if let Some(ua) = updated_at {
            let diff = Utc::now().signed_duration_since(ua).num_seconds();
            if diff <= 180 {
                return Ok(ValidateResult {
                    status: "blocked".to_string(),
                    data: json!({"id_origen": "El canal esta ocupado"}),
                });
            }
        }
    }

    // Validate destination
    if tipo == "C" {
        let destino = sqlx::query_as::<_, CanalConEquipoRow>(
            "SELECT c.id_canal, c.numero, c.estado_llamada, e.nombre AS equipo_nombre
             FROM canales c
             LEFT JOIN equipos e ON e.id_equipo = c.id_equipo
             WHERE c.id_canal = $1",
        )
        .bind(id_destino)
        .fetch_optional(pool)
        .await?;

        let destino = match destino {
            Some(d) => d,
            None => {
                return Ok(ValidateResult {
                    status: "error".to_string(),
                    data: json!({"id_destino": "El canal no existe"}),
                });
            }
        };

        if destino.estado_llamada.as_deref() != Some("LIBRE") {
            return Ok(ValidateResult {
                status: "blocked".to_string(),
                data: json!({"id_destino": "El canal esta ocupado"}),
            });
        }

        Ok(ValidateResult {
            status: "success".to_string(),
            data: json!({
                "origen": {
                    "id_canal": origen.id_canal,
                    "numero": origen.numero,
                    "equipo_nombre": origen.equipo_nombre
                },
                "destino": {
                    "id_canal": destino.id_canal,
                    "numero": destino.numero,
                    "equipo_nombre": destino.equipo_nombre
                }
            }),
        })
    } else {
        // tipo == 'E' - external number
        let destino = sqlx::query_as::<_, NumeroExterno>(
            "SELECT id_numero_externo, nombre, comentario, numero
             FROM numeros_externos
             WHERE id_numero_externo = $1",
        )
        .bind(id_destino)
        .fetch_optional(pool)
        .await?;

        match destino {
            Some(d) => Ok(ValidateResult {
                status: "success".to_string(),
                data: json!({
                    "origen": {
                        "id_canal": origen.id_canal,
                        "numero": origen.numero,
                        "equipo_nombre": origen.equipo_nombre
                    },
                    "destino": {
                        "id_numero_externo": d.id_numero_externo,
                        "numero": d.numero,
                        "nombre": d.nombre
                    }
                }),
            }),
            None => Ok(ValidateResult {
                status: "error".to_string(),
                data: json!({"id_destino": "El canal no existe"}),
            }),
        }
    }
}

// ---------------------------------------------------------------------------
// Helper: ejecutar_matriz logic
// ---------------------------------------------------------------------------

async fn ejecutar_matriz_logic(
    pool: &sqlx::PgPool,
    id_matriz: i32,
    id_prueba: Option<i32>,
) -> AppResult<(Option<i32>, Vec<Value>)> {
    let mut pruebas = Vec::new();

    // Create ejecucion if id_prueba is provided
    let ejecucion_id = if let Some(prueba_id) = id_prueba {
        let ej = sqlx::query_scalar::<_, i32>(
            "INSERT INTO ejecuciones (numero_prueba, fecha_inicio, estado, id_prueba)
             VALUES (0, NOW(), 'CREADO', $1)
             RETURNING id_ejecucion",
        )
        .bind(prueba_id)
        .fetch_one(pool)
        .await?;
        Some(ej)
    } else {
        None
    };

    // Get active matriz connections (channels)
    let conexiones_canales = sqlx::query_as::<_, MatrizCanalDestino>(
        "SELECT mcd.id_matriz_canal_destino, mcd.id_matriz, mcd.id_canal_origen,
                mcd.id_canal_destino, mcd.id_numero_externo_destino, mcd.tipo, mcd.estado
         FROM matrices_canales_destinos mcd
         LEFT JOIN canales cd ON mcd.id_canal_destino = cd.id_canal
         WHERE mcd.id_matriz = $1 AND mcd.estado = 'ACTIVO'
           AND (cd.deleted_at IS NULL OR mcd.tipo = 'E')",
    )
    .bind(id_matriz)
    .fetch_all(pool)
    .await?;

    if let Some(ej_id) = ejecucion_id {
        for c2c in &conexiones_canales {
            let id_canal_origen = c2c.id_canal_origen;
            let id_destino = if c2c.tipo == "C" {
                c2c.id_canal_destino.unwrap_or(0)
            } else {
                c2c.id_numero_externo_destino.unwrap_or(0)
            };

            let validate = validate_c2c(pool, id_canal_origen, id_destino, &c2c.tipo).await?;

            if validate.status == "success" {
                sqlx::query(
                    "INSERT INTO escenarios (id_ejecucion, id_canal_origen, id_destino, tipo, numero_intento, estado)
                     VALUES ($1, $2, $3, $4, 0, 'CREADO')",
                )
                .bind(ej_id)
                .bind(id_canal_origen)
                .bind(id_destino)
                .bind(&c2c.tipo)
                .execute(pool)
                .await?;

                pruebas.push(json!({
                    "id_origen": id_canal_origen,
                    "id_destino": id_destino
                }));
            }
        }

        // Update ejecucion with count and status
        sqlx::query(
            "UPDATE ejecuciones SET numero_prueba = $1, estado = 'PENDIENTE'
             WHERE id_ejecucion = $2",
        )
        .bind(pruebas.len() as i32)
        .bind(ej_id)
        .execute(pool)
        .await?;
    }

    Ok((ejecucion_id, pruebas))
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/// GET /api/pruebas
pub async fn obtener_todos(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let pruebas = sqlx::query_as::<_, Prueba>(
        "SELECT id_prueba, nombre, comentario, correo, tiempo_timbrado, reintentos,
                tipo, tipo_lanzamiento, activo, ejecutado, programacion,
                fecha_lanzamiento, hora_lanzamiento, dias_lanzamiento,
                id_matriz, id_usuario, created_at, updated_at, deleted_at
         FROM pruebas
         WHERE deleted_at IS NULL
         ORDER BY id_prueba DESC",
    )
    .fetch_all(&state.pool)
    .await?;

    let all_matrices = sqlx::query_as::<_, Matriz>(
        "SELECT id_matriz, nombre, estado FROM matrices",
    )
    .fetch_all(&state.pool)
    .await?;

    // Build response with matriz name and ejecuciones count
    let mut resultado = Vec::new();
    for p in &pruebas {
        let matriz = p.id_matriz.and_then(|mid| {
            all_matrices.iter().find(|m| m.id_matriz == mid)
        });

        let ejecuciones_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM ejecuciones WHERE id_prueba = $1",
        )
        .bind(p.id_prueba)
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

        let ultimo_estado: Option<String> = sqlx::query_scalar(
            "SELECT estado FROM ejecuciones WHERE id_prueba = $1 ORDER BY id_ejecucion DESC LIMIT 1"
        )
        .bind(p.id_prueba)
        .fetch_optional(&state.pool)
        .await
        .unwrap_or(None);

        resultado.push(json!({
            "id_prueba": p.id_prueba,
            "nombre": p.nombre,
            "comentario": p.comentario,
            "correo": p.correo,
            "tiempo_timbrado": p.tiempo_timbrado,
            "reintentos": p.reintentos,
            "tipo": p.tipo,
            "tipo_lanzamiento": p.tipo_lanzamiento,
            "activo": p.activo,
            "ejecutado": p.ejecutado,
            "programacion": p.programacion,
            "fecha_lanzamiento": p.fecha_lanzamiento,
            "hora_lanzamiento": p.hora_lanzamiento.map(|t| t.format("%H:%M:%S").to_string()),
            "dias_lanzamiento": p.dias_lanzamiento,
            "id_matriz": p.id_matriz,
            "id_usuario": p.id_usuario,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "deleted_at": p.deleted_at,
            "matriz": matriz,
            "ejecuciones_count": ejecuciones_count,
            "ultimo_estado_ejecucion": ultimo_estado,
        }));
    }

    Ok(Json(json!({
        "estado": true,
        "pruebas": resultado
    })))
}

/// POST /api/pruebas
pub async fn crear(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreatePrueba>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let correo = html_escape::encode_text(&body.correo).to_string();
    let comentario = html_escape::encode_text(&body.comentario).to_string();

    let mut tipo: Option<String> = None;
    let mut activo: Option<String> = None;
    let mut ejecutado: Option<String> = None;
    let mut fecha_lanzamiento = body.fecha_lanzamiento;
    let mut hora_lanzamiento = body.hora_lanzamiento;
    let programacion = body.programacion.clone();

    // Handle tipo_lanzamiento logic
    if programacion.as_deref() == Some("U") && body.tipo_lanzamiento == "Programado" {
        ejecutado = Some("N".to_string());
        activo = Some("S".to_string());
    }
    if programacion.as_deref() == Some("T") && body.tipo_lanzamiento == "Programado" {
        activo = Some("S".to_string());
    }
    if body.tipo_lanzamiento == "Instantaneo" {
        tipo = Some("E".to_string());
        fecha_lanzamiento = Some(Local::now().date_naive());
        hora_lanzamiento = Some(Local::now().time());
        ejecutado = Some("N".to_string());
    }

    let prueba = sqlx::query_as::<_, Prueba>(
        "INSERT INTO pruebas (nombre, comentario, correo, tiempo_timbrado, reintentos,
                tipo, tipo_lanzamiento, activo, ejecutado, programacion,
                fecha_lanzamiento, hora_lanzamiento, dias_lanzamiento,
                id_matriz, id_usuario)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id_prueba, nombre, comentario, correo, tiempo_timbrado, reintentos,
                   tipo, tipo_lanzamiento, activo, ejecutado, programacion,
                   fecha_lanzamiento, hora_lanzamiento, dias_lanzamiento,
                   id_matriz, id_usuario, created_at, updated_at, deleted_at",
    )
    .bind(&nombre)
    .bind(&comentario)
    .bind(&correo)
    .bind(body.tiempo_timbrado)
    .bind(body.reintentos)
    .bind(&tipo)
    .bind(&body.tipo_lanzamiento)
    .bind(&activo)
    .bind(&ejecutado)
    .bind(&programacion)
    .bind(fecha_lanzamiento)
    .bind(hora_lanzamiento)
    .bind(&body.dias_lanzamiento)
    .bind(body.id_matriz)
    .bind(body.id_usuario)
    .fetch_one(&state.pool)
    .await?;

    // Auto-execute for Instantaneo pruebas
    if body.tipo_lanzamiento == "Instantaneo" {
        {
            let id_matriz = body.id_matriz;
            let id_prueba = prueba.id_prueba;
            let (ejecucion_id, _escenarios) =
                ejecutar_matriz_logic(&state.pool, id_matriz, Some(id_prueba)).await?;

            // Mark as executed
            let now = Local::now();
            sqlx::query(
                "UPDATE pruebas SET ejecutado = 'S', fecha_lanzamiento = $1, hora_lanzamiento = $2,
                        updated_at = NOW()
                 WHERE id_prueba = $3",
            )
            .bind(now.date_naive())
            .bind(chrono::NaiveTime::from_hms_opt(
                now.time().hour(),
                now.time().minute(),
                now.time().second(),
            ))
            .bind(id_prueba)
            .execute(&state.pool)
            .await?;

            // Spawn immediate execution
            if let Some(ej_id) = ejecucion_id {
                let pool_clone = state.pool.clone();
                let ami_clone = state.ami_client.clone();
                let fecha = now.format("%Y-%m-%d").to_string();
                tokio::spawn(async move {
                    let ami = { ami_clone.read().await.clone() };
                    loop {
                        if let Err(e) = crate::scheduler::process_ejecucion(
                            &pool_clone, ej_id, ami.as_deref(), &fecha
                        ).await {
                            tracing::error!("Auto-exec error ej {}: {}", ej_id, e);
                            break;
                        }
                        let remaining = sqlx::query_scalar::<_, i64>(
                            "SELECT COUNT(*) FROM escenarios WHERE id_ejecucion = $1 AND estado = 'CREADO'"
                        ).bind(ej_id).fetch_one(&pool_clone).await.unwrap_or(0);
                        if remaining == 0 { break; }
                        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                    }
                });
            }
        }
    }

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "estado": true,
            "mensaje": "Se cre\u{00f3} correctamente la prueba",
            "data": prueba
        })),
    ))
}

/// POST /api/pruebas/ejecutar/c2c
pub async fn canal_hacia_canal(
    State(state): State<Arc<AppState>>,
    Json(body): Json<C2CRequest>,
) -> AppResult<Json<Value>> {
    let validate = validate_c2c(&state.pool, body.id_origen, body.id_destino, "C").await?;

    if validate.status != "success" {
        return Err(AppError::BadRequest(
            serde_json::to_string(&validate.data).unwrap_or_default(),
        ));
    }

    // Build originate params
    let origen_numero = validate.data["origen"]["numero"].as_str().unwrap_or("");
    let equipo_nombre = validate.data["origen"]["equipo_nombre"].as_str().unwrap_or("");
    let destino_numero = validate.data["destino"]["numero"].as_str().unwrap_or("");

    let originate_params = json!({
        "phone": origen_numero,
        "context": "monitoreo",
        "exten": "s",
        "priority": "1",
        "channel": format!("SIP/{}/{}", equipo_nombre, destino_numero),
        "referer": format!("{}->{}", body.id_origen, destino_numero)
    });

    Ok(Json(json!({
        "estado": true,
        "originate_params": originate_params
    })))
}

/// POST /api/pruebas/ejecutar/matriz
pub async fn ejecutar_matriz(
    State(state): State<Arc<AppState>>,
    Json(body): Json<EjecutarMatrizRequest>,
) -> AppResult<Json<Value>> {
    let (_, pruebas) = ejecutar_matriz_logic(&state.pool, body.id_matriz, None).await?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": pruebas
    })))
}

/// POST /api/pruebas/:id/ejecutar
pub async fn ejecutar_prueba(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let prueba = sqlx::query_as::<_, Prueba>(
        "SELECT id_prueba, nombre, comentario, correo, tiempo_timbrado, reintentos,
                tipo, tipo_lanzamiento, activo, ejecutado, programacion,
                fecha_lanzamiento, hora_lanzamiento, dias_lanzamiento,
                id_matriz, id_usuario, created_at, updated_at, deleted_at
         FROM pruebas
         WHERE id_prueba = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Prueba no encontrada".to_string()))?;

    let id_matriz = prueba.id_matriz.ok_or_else(|| {
        AppError::BadRequest("La prueba no tiene una matriz asignada".to_string())
    })?;

    let (ejecucion_id, escenarios) = ejecutar_matriz_logic(&state.pool, id_matriz, Some(id)).await?;

    // Update prueba as executed
    let now = Local::now();
    sqlx::query(
        "UPDATE pruebas SET ejecutado = 'S', fecha_lanzamiento = $1, hora_lanzamiento = $2,
                updated_at = NOW()
         WHERE id_prueba = $3",
    )
    .bind(now.date_naive())
    .bind(chrono::NaiveTime::from_hms_opt(
        now.time().hour(),
        now.time().minute(),
        now.time().second(),
    ))
    .bind(id)
    .execute(&state.pool)
    .await?;

    // Spawn immediate execution for instant-type pruebas
    if let Some(ej_id) = ejecucion_id {
        let pool_clone = state.pool.clone();
        let ami_clone = state.ami_client.clone();
        let fecha = now.format("%Y-%m-%d").to_string();
        tokio::spawn(async move {
            let ami = { ami_clone.read().await.clone() };
            loop {
                if let Err(e) = crate::scheduler::process_ejecucion(
                    &pool_clone, ej_id, ami.as_deref(), &fecha
                ).await {
                    tracing::error!("Immediate exec error ej {}: {}", ej_id, e);
                    break;
                }
                let remaining = sqlx::query_scalar::<_, i64>(
                    "SELECT COUNT(*) FROM escenarios WHERE id_ejecucion = $1 AND estado = 'CREADO'"
                ).bind(ej_id).fetch_one(&pool_clone).await.unwrap_or(0);
                if remaining == 0 { break; }
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            }
        });
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": format!("Prueba ejecutada correctamente. Escenarios creados: {}", escenarios.len()),
        "data": escenarios
    })))
}

/// GET /api/pruebas/:id
pub async fn buscar_uno(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let prueba = sqlx::query_as::<_, Prueba>(
        "SELECT id_prueba, nombre, comentario, correo, tiempo_timbrado, reintentos,
                tipo, tipo_lanzamiento, activo, ejecutado, programacion,
                fecha_lanzamiento, hora_lanzamiento, dias_lanzamiento,
                id_matriz, id_usuario, created_at, updated_at, deleted_at
         FROM pruebas
         WHERE id_prueba = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Prueba no encontrada".to_string()))?;

    let matriz = if let Some(id_matriz) = prueba.id_matriz {
        sqlx::query_as::<_, Matriz>(
            "SELECT id_matriz, nombre, estado FROM matrices WHERE id_matriz = $1",
        )
        .bind(id_matriz)
        .fetch_optional(&state.pool)
        .await?
    } else {
        None
    };

    let ejecuciones = sqlx::query_as::<_, Ejecucion>(
        "SELECT id_ejecucion, numero_prueba, fecha_inicio, fecha_fin, estado,
                id_prueba, created_at, updated_at, deleted_at
         FROM ejecuciones
         WHERE id_prueba = $1
         ORDER BY id_ejecucion DESC",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let resultado = PruebaConDetalles {
        id_prueba: prueba.id_prueba,
        nombre: prueba.nombre,
        comentario: prueba.comentario,
        correo: prueba.correo,
        tiempo_timbrado: prueba.tiempo_timbrado,
        reintentos: prueba.reintentos,
        tipo: prueba.tipo,
        tipo_lanzamiento: prueba.tipo_lanzamiento,
        activo: prueba.activo,
        ejecutado: prueba.ejecutado,
        programacion: prueba.programacion,
        fecha_lanzamiento: prueba.fecha_lanzamiento,
        hora_lanzamiento: prueba.hora_lanzamiento,
        dias_lanzamiento: prueba.dias_lanzamiento,
        id_matriz: prueba.id_matriz,
        id_usuario: prueba.id_usuario,
        created_at: prueba.created_at,
        updated_at: prueba.updated_at,
        deleted_at: prueba.deleted_at,
        matriz,
        ejecuciones,
    };

    Ok(Json(json!({
        "estado": true,
        "prueba": resultado
    })))
}

/// PUT /api/pruebas/:id
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
    Json(body): Json<CreatePrueba>,
) -> AppResult<Json<Value>> {
    let nombre = html_escape::encode_text(&body.nombre).to_string();
    let correo = html_escape::encode_text(&body.correo).to_string();
    let comentario = html_escape::encode_text(&body.comentario).to_string();

    let result = sqlx::query(
        "UPDATE pruebas
         SET nombre = $1, comentario = $2, correo = $3, tiempo_timbrado = $4,
             reintentos = $5, tipo_lanzamiento = $6, programacion = $7,
             fecha_lanzamiento = $8, hora_lanzamiento = $9, dias_lanzamiento = $10,
             id_matriz = $11, id_usuario = $12, updated_at = NOW()
         WHERE id_prueba = $13 AND deleted_at IS NULL",
    )
    .bind(&nombre)
    .bind(&comentario)
    .bind(&correo)
    .bind(body.tiempo_timbrado)
    .bind(body.reintentos)
    .bind(&body.tipo_lanzamiento)
    .bind(&body.programacion)
    .bind(body.fecha_lanzamiento)
    .bind(body.hora_lanzamiento)
    .bind(&body.dias_lanzamiento)
    .bind(body.id_matriz)
    .bind(body.id_usuario)
    .bind(id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Prueba no encontrada".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se actualiz\u{00f3} correctamente la prueba"
    })))
}

/// GET /api/pruebas/:id/ultima-ejecucion
///
/// Returns the most recent ejecucion for a prueba with all its escenarios
/// and summary counts.
pub async fn ultima_ejecucion(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    // Find the most recent ejecucion for this prueba
    let ejecucion = sqlx::query_as::<_, Ejecucion>(
        "SELECT id_ejecucion, numero_prueba, fecha_inicio, fecha_fin, estado,
                id_prueba, created_at, updated_at, deleted_at
         FROM ejecuciones
         WHERE id_prueba = $1
         ORDER BY id_ejecucion DESC
         LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("No hay ejecuciones para esta prueba".to_string()))?;

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
    .bind(ejecucion.id_ejecucion)
    .fetch_all(&state.pool)
    .await?;

    // Calculate summary
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
        prueba: None,
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

/// DELETE /api/pruebas/:id
pub async fn eliminar(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query(
        "UPDATE pruebas SET deleted_at = NOW() WHERE id_prueba = $1 AND deleted_at IS NULL",
    )
    .bind(id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Prueba no encontrada".to_string()));
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Se elimin\u{00f3} correctamente la prueba"
    })))
}
