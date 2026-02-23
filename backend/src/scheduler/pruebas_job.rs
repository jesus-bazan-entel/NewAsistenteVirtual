use std::sync::Arc;

use chrono::{Datelike, Local, Timelike, Weekday};
use sqlx::PgPool;
use tokio::task::JoinHandle;

use crate::asterisk::ami::{AmiClient, OriginateParams};
use crate::services::ejecucion;
use crate::SharedAmiClient;

// ---------------------------------------------------------------------------
// Row types for scheduler queries
// ---------------------------------------------------------------------------

#[derive(Debug, sqlx::FromRow)]
struct PruebaProgramada {
    id_prueba: i32,
    id_matriz: Option<i32>,
    programacion: Option<String>,
    fecha_lanzamiento: Option<chrono::NaiveDate>,
    hora_lanzamiento: Option<chrono::NaiveTime>,
    dias_lanzamiento: Option<String>,
    correo: Option<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct EjecucionPendiente {
    id_ejecucion: i32,
}

#[derive(Debug, sqlx::FromRow)]
struct EscenarioCreado {
    id_escenario: i32,
    id_ejecucion: i32,
    id_canal_origen: i32,
    id_destino: i32,
    tipo: String,
}

#[derive(Debug, sqlx::FromRow)]
struct CanalConEquipoScheduler {
    id_canal: i32,
    numero: Option<String>,
    estado_llamada: Option<String>,
    equipo_nombre: Option<String>,
    updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, sqlx::FromRow)]
struct EscenarioPendienteCount {
    count: i64,
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

/// Start the background scheduler that runs every 10 seconds.
///
/// This replicates the `pruebasProgramadasJob.js` cron from the Node.js
/// backend.  It performs the following steps on each tick:
///
/// 1. Find pruebas whose scheduled date/time has arrived and that have not
///    been executed yet.
/// 2. For each such prueba, create an ejecucion with escenarios (like
///    `ejecutarMatriz`).
/// 3. Find all ejecuciones in `PENDIENTE` state.
/// 4. For each ejecucion, find escenarios in `CREADO` state where channels
///    are free, and call `originate` on the AMI client.
/// 5. Check for stale channels (updated more than 180 s ago) and reset them
///    to `LIBRE`.
/// 6. If all escenarios of an ejecucion are complete, finalize the ejecucion.
pub fn start_scheduler(
    pool: PgPool,
    ami_client: SharedAmiClient,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));

        loop {
            interval.tick().await;

            // Clone the Arc out of the lock quickly to avoid holding the
            // read-lock during the entire (potentially slow) scheduler tick.
            let ami = {
                let guard = ami_client.read().await;
                guard.clone()
            };

            if let Err(e) = scheduler_tick(&pool, ami.as_deref()).await {
                tracing::error!("Scheduler tick error: {}", e);
            }
        }
    })
}

/// Execute a single scheduler tick.
async fn scheduler_tick(
    pool: &PgPool,
    ami_client: Option<&AmiClient>,
) -> anyhow::Result<()> {
    let now = Local::now();
    let fecha_actual = now.format("%Y-%m-%d").to_string();
    let hora_actual = now.format("%H:%M:%S").to_string();

    // ---------------------------------------------------------------
    // Step 1: Find pruebas programadas that should fire now
    // ---------------------------------------------------------------
    let pruebas_programadas = find_pruebas_programadas(pool, &fecha_actual, &hora_actual, &now).await?;

    for prueba in &pruebas_programadas {
        if let Some(id_matriz) = prueba.id_matriz {
            tracing::info!(
                "Scheduler: executing prueba_programada id={} matriz={}",
                prueba.id_prueba,
                id_matriz
            );

            if let Err(e) = ejecutar_matriz(pool, id_matriz, Some(prueba.id_prueba)).await {
                tracing::error!(
                    "Scheduler: failed to execute prueba {}: {}",
                    prueba.id_prueba,
                    e
                );
            }

            // Mark once-only pruebas as executed
            if prueba.programacion.as_deref() == Some("U") {
                sqlx::query(
                    "UPDATE pruebas SET ejecutado = 'S', updated_at = NOW() WHERE id_prueba = $1",
                )
                .bind(prueba.id_prueba)
                .execute(pool)
                .await?;
            }
        }
    }

    // ---------------------------------------------------------------
    // Step 2: Process pending ejecuciones
    // ---------------------------------------------------------------
    let ejecuciones = sqlx::query_as::<_, EjecucionPendiente>(
        "SELECT id_ejecucion FROM ejecuciones WHERE estado = 'PENDIENTE'",
    )
    .fetch_all(pool)
    .await?;

    for ej in &ejecuciones {
        process_ejecucion(pool, ej.id_ejecucion, ami_client, &fecha_actual).await?;
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Step 1 helpers
// ---------------------------------------------------------------------------

/// Find pruebas that are active, not yet executed, and whose scheduled
/// date/time match the current moment.
async fn find_pruebas_programadas(
    pool: &PgPool,
    fecha_actual: &str,
    hora_actual: &str,
    now: &chrono::DateTime<Local>,
) -> anyhow::Result<Vec<PruebaProgramada>> {
    // Single-fire pruebas (programacion='U'): exact date+time match
    let mut resultado: Vec<PruebaProgramada> = sqlx::query_as::<_, PruebaProgramada>(
        "SELECT id_prueba, id_matriz, programacion, fecha_lanzamiento,
                hora_lanzamiento, dias_lanzamiento, correo
         FROM pruebas
         WHERE activo = 'S'
           AND ejecutado = 'N'
           AND programacion = 'U'
           AND fecha_lanzamiento::text = $1
           AND hora_lanzamiento::text <= $2
           AND deleted_at IS NULL",
    )
    .bind(fecha_actual)
    .bind(hora_actual)
    .fetch_all(pool)
    .await?;

    // Recurring pruebas (programacion='T'): match day-of-week and time
    let day_initial = match now.weekday() {
        Weekday::Mon => "L",
        Weekday::Tue => "M",
        Weekday::Wed => "X",
        Weekday::Thu => "J",
        Weekday::Fri => "V",
        Weekday::Sat => "S",
        Weekday::Sun => "D",
    };

    let recurring = sqlx::query_as::<_, PruebaProgramada>(
        "SELECT id_prueba, id_matriz, programacion, fecha_lanzamiento,
                hora_lanzamiento, dias_lanzamiento, correo
         FROM pruebas
         WHERE activo = 'S'
           AND programacion = 'T'
           AND dias_lanzamiento LIKE $1
           AND hora_lanzamiento::text <= $2
           AND deleted_at IS NULL
           AND NOT EXISTS (
               SELECT 1 FROM ejecuciones
               WHERE id_prueba = pruebas.id_prueba
                 AND DATE(fecha_inicio) = CURRENT_DATE
           )",
    )
    .bind(format!("%{}%", day_initial))
    .bind(hora_actual)
    .fetch_all(pool)
    .await?;

    resultado.extend(recurring);

    Ok(resultado)
}

// ---------------------------------------------------------------------------
// Step 2: process each pending ejecucion
// ---------------------------------------------------------------------------

/// Get tiempo_timbrado from the prueba associated with an ejecucion.
async fn get_prueba_timeout(pool: &PgPool, id_ejecucion: i32) -> anyhow::Result<Option<i32>> {
    let timeout = sqlx::query_scalar::<_, Option<i32>>(
        "SELECT p.tiempo_timbrado FROM pruebas p
         JOIN ejecuciones ej ON ej.id_prueba = p.id_prueba
         WHERE ej.id_ejecucion = $1",
    )
    .bind(id_ejecucion)
    .fetch_optional(pool)
    .await?;

    Ok(timeout.flatten())
}

pub(crate) async fn process_ejecucion(
    pool: &PgPool,
    id_ejecucion: i32,
    ami_client: Option<&AmiClient>,
    fecha_actual: &str,
) -> anyhow::Result<()> {
    // Check if there are escenarios in CREADO state
    let escenarios_creados = sqlx::query_as::<_, EscenarioCreado>(
        "SELECT id_escenario, id_ejecucion, id_canal_origen, id_destino, tipo
         FROM escenarios
         WHERE id_ejecucion = $1 AND estado = 'CREADO'
         LIMIT 1",
    )
    .bind(id_ejecucion)
    .fetch_all(pool)
    .await?;

    // Safety net: check for stuck PENDIENTE escenarios that exceeded timeout
    check_timed_out_escenarios(pool, id_ejecucion).await?;

    if !escenarios_creados.is_empty() {
        // Find escenarios where channels are free
        let escenarios_libres = sqlx::query_as::<_, EscenarioCreado>(
            "SELECT es.id_escenario, es.id_ejecucion, es.id_canal_origen, es.id_destino, es.tipo
             FROM escenarios es
             JOIN canales co ON co.id_canal = es.id_canal_origen
             LEFT JOIN canales cd ON cd.id_canal = es.id_destino AND es.tipo = 'C'
             WHERE es.id_ejecucion = $1
               AND es.estado = 'CREADO'
               AND co.estado_llamada = 'LIBRE'
               AND (cd.estado_llamada = 'LIBRE' OR es.tipo = 'E')
             LIMIT 1",
        )
        .bind(id_ejecucion)
        .fetch_all(pool)
        .await?;

        if !escenarios_libres.is_empty() {
            // Execute free escenarios
            for escenario in &escenarios_libres {
                if let Some(ami) = ami_client {
                    if let Err(e) = ejecutar_escenario(pool, escenario, ami).await {
                        tracing::error!(
                            "Scheduler: failed to execute escenario {}: {}",
                            escenario.id_escenario,
                            e
                        );
                    }
                } else {
                    tracing::warn!(
                        "Scheduler: no AMI client available for escenario {}",
                        escenario.id_escenario
                    );
                }
            }
        } else {
            // No free channels -- check for stale channels (> 180s)
            for escenario in &escenarios_creados {
                check_and_reset_stale_channels(pool, escenario).await?;
            }
        }
    } else {
        // No CREADO escenarios -- check if all are done
        // (no PENDIENTE either -- terminal states are EXITOSO, FALLIDO, TIMEOUT, ERROR)
        let pending_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM escenarios
             WHERE id_ejecucion = $1 AND estado IN ('PENDIENTE', 'CREADO')",
        )
        .bind(id_ejecucion)
        .fetch_one(pool)
        .await?;

        if pending_count == 0 {
            // All escenarios are finished -- finalize the ejecucion
            tracing::info!("Scheduler: finalizing ejecucion {}", id_ejecucion);

            sqlx::query(
                "UPDATE ejecuciones
                 SET estado = 'FINALIZADO', fecha_fin = NOW(), updated_at = NOW()
                 WHERE id_ejecucion = $1",
            )
            .bind(id_ejecucion)
            .execute(pool)
            .await?;

            // Send email report (fire and forget)
            let pool_clone = pool.clone();
            let ej_id = id_ejecucion;
            tokio::spawn(async move {
                if let Err(e) = ejecucion::send_ejecucion_by_mail(&pool_clone, ej_id).await {
                    tracing::error!(
                        "Scheduler: failed to send mail for ejecucion {}: {}",
                        ej_id,
                        e
                    );
                }
            });
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Safety net: check for timed-out PENDIENTE escenarios
// ---------------------------------------------------------------------------

/// Check for escenarios stuck in PENDIENTE state beyond the configured timeout.
/// These are escenarios where the Hangup event was missed or never arrived.
async fn check_timed_out_escenarios(
    pool: &PgPool,
    id_ejecucion: i32,
) -> anyhow::Result<()> {
    let tiempo_timbrado = get_prueba_timeout(pool, id_ejecucion).await?;
    // Add 30s buffer beyond the configured timeout
    let timeout_secs = (tiempo_timbrado.unwrap_or(30) + 30) as i64;

    #[derive(sqlx::FromRow)]
    struct EscenarioTimedOut {
        id_escenario: i32,
        numero_intento: Option<i32>,
        tipo: String,
        uniqueid_en: Option<String>,
    }

    let timed_out = sqlx::query_as::<_, EscenarioTimedOut>(
        "SELECT es.id_escenario, es.numero_intento, es.tipo, es.uniqueid_en
         FROM escenarios es
         WHERE es.id_ejecucion = $1 AND es.estado = 'PENDIENTE'
           AND es.updated_at < NOW() - ($2::text || ' seconds')::INTERVAL",
    )
    .bind(id_ejecucion)
    .bind(timeout_secs)
    .fetch_all(pool)
    .await?;

    for esc in &timed_out {
        tracing::warn!(
            "Scheduler: escenario {} timed out (stuck PENDIENTE > {}s)",
            esc.id_escenario,
            timeout_secs
        );

        let hangup_reason = serde_json::json!({
            "cause": "0",
            "description": "Timeout: no hangup event received",
        })
        .to_string();

        // Reset channels
        sqlx::query(
            "UPDATE canales SET estado_llamada = 'LIBRE', updated_at = NOW()
             WHERE id_canal = (SELECT id_canal_origen FROM escenarios WHERE id_escenario = $1)",
        )
        .bind(esc.id_escenario)
        .execute(pool)
        .await?;

        sqlx::query(
            "UPDATE canales SET estado_llamada = 'LIBRE', updated_at = NOW()
             WHERE id_canal = (
                 SELECT es.id_destino FROM escenarios es
                 WHERE es.id_escenario = $1 AND es.tipo = 'C'
             )",
        )
        .bind(esc.id_escenario)
        .execute(pool)
        .await?;

        // Get max retries
        let max_reintentos: Option<i32> = sqlx::query_scalar(
            "SELECT p.reintentos FROM pruebas p
             JOIN ejecuciones ej ON ej.id_prueba = p.id_prueba
             JOIN escenarios es ON es.id_ejecucion = ej.id_ejecucion
             WHERE es.id_escenario = $1",
        )
        .bind(esc.id_escenario)
        .fetch_optional(pool)
        .await?;

        let max_retries = max_reintentos.unwrap_or(1);
        let current = esc.numero_intento.unwrap_or(0);

        if max_retries > 1 && current < max_retries - 1 {
            // Retry
            tracing::info!(
                "Scheduler: retrying timed-out escenario {} (attempt {}/{})",
                esc.id_escenario,
                current + 2,
                max_retries
            );

            sqlx::query(
                r#"UPDATE escenarios
                   SET estado = 'CREADO',
                       numero_intento = numero_intento + 1,
                       uniqueid_en = NULL,
                       uniqueid_sal = NULL,
                       "hangupReason" = NULL,
                       hora_saliente = NULL,
                       hora_entrante = NULL,
                       updated_at = NOW()
                   WHERE id_escenario = $1"#,
            )
            .bind(esc.id_escenario)
            .execute(pool)
            .await?;
        } else {
            // Final state: TIMEOUT
            sqlx::query(
                r#"UPDATE escenarios
                   SET estado = 'TIMEOUT', "hangupReason" = $1, updated_at = NOW()
                   WHERE id_escenario = $2"#,
            )
            .bind(&hangup_reason)
            .bind(esc.id_escenario)
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Execute a single escenario via AMI
// ---------------------------------------------------------------------------

async fn ejecutar_escenario(
    pool: &PgPool,
    escenario: &EscenarioCreado,
    ami: &AmiClient,
) -> anyhow::Result<()> {
    // Load origin channel with equipo name
    let origen = sqlx::query_as::<_, CanalConEquipoScheduler>(
        "SELECT c.id_canal, c.numero, c.estado_llamada, e.nombre AS equipo_nombre, c.updated_at
         FROM canales c
         LEFT JOIN equipos e ON e.id_equipo = c.id_equipo
         WHERE c.id_canal = $1",
    )
    .bind(escenario.id_canal_origen)
    .fetch_optional(pool)
    .await?;

    let origen = match origen {
        Some(o) => o,
        None => {
            mark_escenario_error(pool, escenario.id_escenario).await?;
            return Ok(());
        }
    };

    let origen_numero = match &origen.numero {
        Some(n) if !n.is_empty() => n.clone(),
        _ => {
            mark_escenario_error(pool, escenario.id_escenario).await?;
            return Ok(());
        }
    };

    // Load destination number
    let destino_numero = if escenario.tipo == "C" {
        let destino = sqlx::query_scalar::<_, Option<String>>(
            "SELECT numero FROM canales WHERE id_canal = $1",
        )
        .bind(escenario.id_destino)
        .fetch_one(pool)
        .await?;
        destino.unwrap_or_default()
    } else {
        // External number
        let numero = sqlx::query_scalar::<_, Option<String>>(
            "SELECT numero FROM numeros_externos WHERE id_numero_externo = $1",
        )
        .bind(escenario.id_destino)
        .fetch_one(pool)
        .await?;
        numero.unwrap_or_default()
    };

    if destino_numero.is_empty() {
        mark_escenario_error(pool, escenario.id_escenario).await?;
        return Ok(());
    }

    let equipo_nombre = origen.equipo_nombre.as_deref().unwrap_or("");
    let channel = format!("SIP/{}/{}", equipo_nombre, destino_numero);

    // Mark channels as busy
    sqlx::query(
        "UPDATE canales SET estado_llamada = 'SALIENTE', updated_at = NOW()
         WHERE id_canal = $1",
    )
    .bind(escenario.id_canal_origen)
    .execute(pool)
    .await?;

    if escenario.tipo == "C" {
        sqlx::query(
            "UPDATE canales SET estado_llamada = 'ENTRANTE', updated_at = NOW()
             WHERE id_canal = $1",
        )
        .bind(escenario.id_destino)
        .execute(pool)
        .await?;
    }

    let hora_saliente = Local::now().time();

    // Get dynamic timeout from prueba configuration
    let tiempo_timbrado = get_prueba_timeout(pool, escenario.id_ejecucion).await?;
    let timeout_ms = (tiempo_timbrado.unwrap_or(30) as u32) * 1000;

    // Build originate params
    let params = OriginateParams {
        phone: origen_numero,
        context: "monitoreo".to_string(),
        exten: "s".to_string(),
        priority: "1".to_string(),
        channel,
        referer: format!("id_escenario:{}", escenario.id_escenario),
        id_escenario: Some(escenario.id_escenario),
        timeout_ms: Some(timeout_ms),
    };

    match ami.originate(params).await {
        Ok(result) => {
            if result.success {
                sqlx::query(
                    "UPDATE escenarios SET estado = 'PENDIENTE', hora_saliente = $1, updated_at = NOW()
                     WHERE id_escenario = $2",
                )
                .bind(hora_saliente)
                .bind(escenario.id_escenario)
                .execute(pool)
                .await?;

                tracing::info!(
                    "Scheduler: originate success for escenario {} (timeout={}ms)",
                    escenario.id_escenario,
                    timeout_ms
                );
            } else {
                sqlx::query(
                    "UPDATE escenarios SET estado = 'FALLIDO', hora_saliente = $1, updated_at = NOW()
                     WHERE id_escenario = $2",
                )
                .bind(hora_saliente)
                .bind(escenario.id_escenario)
                .execute(pool)
                .await?;

                tracing::warn!(
                    "Scheduler: originate failure for escenario {}",
                    escenario.id_escenario
                );
            }
        }
        Err(e) => {
            tracing::error!(
                "Scheduler: originate error for escenario {}: {}",
                escenario.id_escenario,
                e
            );

            sqlx::query(
                "UPDATE escenarios SET estado = 'ERROR', updated_at = NOW()
                 WHERE id_escenario = $1",
            )
            .bind(escenario.id_escenario)
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async fn mark_escenario_error(pool: &PgPool, id_escenario: i32) -> anyhow::Result<()> {
    sqlx::query(
        "UPDATE escenarios SET estado = 'ERROR', updated_at = NOW()
         WHERE id_escenario = $1",
    )
    .bind(id_escenario)
    .execute(pool)
    .await?;
    Ok(())
}

/// Check if channels have been in use for more than 180 seconds and reset
/// them to LIBRE.
async fn check_and_reset_stale_channels(
    pool: &PgPool,
    escenario: &EscenarioCreado,
) -> anyhow::Result<()> {
    let now = chrono::Utc::now();

    // Origin channel
    let origin_updated = sqlx::query_scalar::<_, Option<chrono::DateTime<chrono::Utc>>>(
        "SELECT updated_at FROM canales WHERE id_canal = $1",
    )
    .bind(escenario.id_canal_origen)
    .fetch_one(pool)
    .await?;

    if let Some(ua) = origin_updated {
        if now.signed_duration_since(ua).num_seconds() > 180 {
            tracing::info!(
                "Scheduler: resetting stale origin channel {} to LIBRE",
                escenario.id_canal_origen
            );
            sqlx::query(
                "UPDATE canales SET estado_llamada = 'LIBRE', updated_at = NOW()
                 WHERE id_canal = $1",
            )
            .bind(escenario.id_canal_origen)
            .execute(pool)
            .await?;
        }
    }

    // Destination channel (only for tipo = 'C')
    if escenario.tipo == "C" {
        let dest_updated = sqlx::query_scalar::<_, Option<chrono::DateTime<chrono::Utc>>>(
            "SELECT updated_at FROM canales WHERE id_canal = $1",
        )
        .bind(escenario.id_destino)
        .fetch_one(pool)
        .await?;

        if let Some(ua) = dest_updated {
            if now.signed_duration_since(ua).num_seconds() > 180 {
                tracing::info!(
                    "Scheduler: resetting stale destination channel {} to LIBRE",
                    escenario.id_destino
                );
                sqlx::query(
                    "UPDATE canales SET estado_llamada = 'LIBRE', updated_at = NOW()
                     WHERE id_canal = $1",
                )
                .bind(escenario.id_destino)
                .execute(pool)
                .await?;
            }
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// ejecutar_matriz (reusable logic for scheduler)
// ---------------------------------------------------------------------------

/// Create an ejecucion and its escenarios from a matriz definition.
///
/// This mirrors the `ejecutarMatriz` function in the Node.js Prueba
/// controller.
async fn ejecutar_matriz(
    pool: &PgPool,
    id_matriz: i32,
    id_prueba: Option<i32>,
) -> anyhow::Result<Vec<(i32, i32)>> {
    let mut created = Vec::new();

    let ejecucion_id = if let Some(prueba_id) = id_prueba {
        let ej_id = sqlx::query_scalar::<_, i32>(
            "INSERT INTO ejecuciones (numero_prueba, fecha_inicio, estado, id_prueba)
             VALUES (0, NOW(), 'CREADO', $1)
             RETURNING id_ejecucion",
        )
        .bind(prueba_id)
        .fetch_one(pool)
        .await?;
        Some(ej_id)
    } else {
        None
    };

    // Get active connections from the matrix
    #[derive(Debug, sqlx::FromRow)]
    struct MatrizConexion {
        id_canal_origen: i32,
        id_canal_destino: Option<i32>,
        id_numero_externo_destino: Option<i32>,
        tipo: String,
    }

    let conexiones = sqlx::query_as::<_, MatrizConexion>(
        "SELECT mcd.id_canal_origen, mcd.id_canal_destino,
                mcd.id_numero_externo_destino, mcd.tipo
         FROM matrices_canales_destinos mcd
         LEFT JOIN canales cd ON mcd.id_canal_destino = cd.id_canal
         WHERE mcd.id_matriz = $1 AND mcd.estado = 'ACTIVO'
           AND (cd.deleted_at IS NULL OR mcd.tipo = 'E')",
    )
    .bind(id_matriz)
    .fetch_all(pool)
    .await?;

    if let Some(ej_id) = ejecucion_id {
        for c2c in &conexiones {
            let id_destino = if c2c.tipo == "C" {
                c2c.id_canal_destino.unwrap_or(0)
            } else {
                c2c.id_numero_externo_destino.unwrap_or(0)
            };

            // Create escenario
            sqlx::query(
                "INSERT INTO escenarios (id_ejecucion, id_canal_origen, id_destino, tipo, numero_intento, estado)
                 VALUES ($1, $2, $3, $4, 0, 'CREADO')",
            )
            .bind(ej_id)
            .bind(c2c.id_canal_origen)
            .bind(id_destino)
            .bind(&c2c.tipo)
            .execute(pool)
            .await?;

            created.push((c2c.id_canal_origen, id_destino));
        }

        // Update ejecucion with count and status
        sqlx::query(
            "UPDATE ejecuciones SET numero_prueba = $1, estado = 'PENDIENTE', updated_at = NOW()
             WHERE id_ejecucion = $2",
        )
        .bind(created.len() as i32)
        .bind(ej_id)
        .execute(pool)
        .await?;
    }

    Ok(created)
}
