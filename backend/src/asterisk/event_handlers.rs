use std::collections::HashMap;

use chrono::Local;
use sqlx::PgPool;
use tokio::sync::broadcast;

// ---------------------------------------------------------------------------
// AMI event parser
// ---------------------------------------------------------------------------

/// Parse a raw AMI event block into a `HashMap<String, String>`.
///
/// Each line is expected to be in `Key: Value` format.  The function is
/// case-insensitive on keys (stores them in their original casing).
fn parse_event(raw: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for line in raw.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some((key, value)) = trimmed.split_once(':') {
            map.insert(
                key.trim().to_string(),
                value.trim().to_string(),
            );
        }
    }
    map
}

/// Retrieve a value from the event map, case-insensitive.
fn get_ci<'a>(event: &'a HashMap<String, String>, key: &str) -> Option<&'a str> {
    let lower = key.to_lowercase();
    for (k, v) in event {
        if k.to_lowercase() == lower {
            return Some(v.as_str());
        }
    }
    None
}

// ---------------------------------------------------------------------------
// Top-level dispatcher
// ---------------------------------------------------------------------------

/// Handle a single AMI event.  Dispatches to the appropriate handler based on
/// the `Event` field, updates the database, and broadcasts the raw event to
/// WebSocket clients.
pub async fn handle_event(
    raw: &str,
    pool: &PgPool,
    ws_tx: &broadcast::Sender<String>,
) {
    let event = parse_event(raw);

    let event_name = match get_ci(&event, "Event") {
        Some(name) => name.to_string(),
        None => {
            // Not an event line (could be a response) -- skip
            return;
        }
    };

    tracing::debug!("AMI event: {}", event_name);

    match event_name.as_str() {
        "OriginateResponse" => {
            if let Err(e) = handle_originate_response(&event, pool).await {
                tracing::error!("Error handling OriginateResponse: {}", e);
            }
        }
        "Newexten" => {
            if let Err(e) = handle_new_exten(&event, pool).await {
                tracing::error!("Error handling Newexten: {}", e);
            }
        }
        "Hangup" => {
            if let Err(e) = handle_hangup(&event, pool).await {
                tracing::error!("Error handling Hangup: {}", e);
            }
        }
        _ => {
            // Other events are logged at trace level
            tracing::trace!("AMI event ignored: {}", event_name);
        }
    }

    // Broadcast the raw event to all connected WebSocket clients
    let _ = ws_tx.send(raw.to_string());
}

// ---------------------------------------------------------------------------
// State determination helpers
// ---------------------------------------------------------------------------

/// Determine the final state of an escenario based on hangup cause code.
///
/// - Cause 16 (Normal Clearing): EXITOSO if both legs connected (or external),
///   FALLIDO if the inbound leg never arrived.
/// - Cause 19, 18 (No Answer / No User Responding): TIMEOUT
/// - Cause 1, 3, 28 (Unallocated / No Route / Invalid Number): FALLIDO
/// - Cause 21, 34 (Call Rejected / No Circuit): FALLIDO
/// - All other causes: FALLIDO
fn determine_final_state(cause: &str, tipo: &str, uniqueid_en: Option<&str>) -> &'static str {
    match cause {
        "16" => {
            // Normal Clearing
            if tipo == "E" {
                // External calls don't have an inbound leg
                "EXITOSO"
            } else if uniqueid_en.is_some() {
                // Both legs connected
                "EXITOSO"
            } else {
                // Outbound connected but inbound never arrived
                "FALLIDO"
            }
        }
        "19" | "18" => "TIMEOUT",
        "1" | "3" | "28" | "21" | "34" => "FALLIDO",
        _ => "FALLIDO",
    }
}

/// Apply retry logic or set final state for an escenario.
///
/// If the state is TIMEOUT or FALLIDO and the current attempt is below the
/// max retries configured in the prueba, the escenario is reset to CREADO
/// with an incremented attempt number. Otherwise, the final state is set.
async fn apply_retry_or_finalize(
    pool: &PgPool,
    id_escenario: i32,
    final_state: &str,
    hangup_reason: &str,
) -> anyhow::Result<()> {
    // Only consider retries for TIMEOUT or FALLIDO
    if final_state == "TIMEOUT" || final_state == "FALLIDO" {
        // Get max retries from the associated prueba
        let max_reintentos: Option<i32> = sqlx::query_scalar(
            "SELECT p.reintentos FROM pruebas p
             JOIN ejecuciones ej ON ej.id_prueba = p.id_prueba
             JOIN escenarios es ON es.id_ejecucion = ej.id_ejecucion
             WHERE es.id_escenario = $1",
        )
        .bind(id_escenario)
        .fetch_optional(pool)
        .await?;

        let current_intento: Option<i32> = sqlx::query_scalar(
            "SELECT numero_intento FROM escenarios WHERE id_escenario = $1",
        )
        .bind(id_escenario)
        .fetch_optional(pool)
        .await?;

        let max_retries = max_reintentos.unwrap_or(1);
        let current = current_intento.unwrap_or(0);

        if max_retries > 1 && current < max_retries - 1 {
            // Retry: reset to CREADO with incremented attempt
            tracing::info!(
                "Retrying escenario {} (attempt {}/{})",
                id_escenario,
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
            .bind(id_escenario)
            .execute(pool)
            .await?;

            return Ok(());
        }
    }

    // Final state: no more retries
    sqlx::query(
        r#"UPDATE escenarios
           SET estado = $1, "hangupReason" = $2, updated_at = NOW()
           WHERE id_escenario = $3"#,
    )
    .bind(final_state)
    .bind(hangup_reason)
    .bind(id_escenario)
    .execute(pool)
    .await?;

    Ok(())
}

// ---------------------------------------------------------------------------
// OriginateResponse handler
// ---------------------------------------------------------------------------

/// Handle an OriginateResponse event.
///
/// The `CallerIDName` field encodes the escenario id as `id_escenario:<id>`.
/// * If `Response` = `Success` and `Reason` = `4`: update escenario
///   `estado = 'PENDIENTE'` and store the `Uniqueid`.
/// * Otherwise: mark as FALLIDO and apply retry logic.
async fn handle_originate_response(
    event: &HashMap<String, String>,
    pool: &PgPool,
) -> anyhow::Result<()> {
    let calleridname = get_ci(event, "CallerIDName").unwrap_or("");
    let response = get_ci(event, "Response").unwrap_or("");
    let reason = get_ci(event, "Reason").unwrap_or("");
    let uniqueid = get_ci(event, "Uniqueid").unwrap_or("");

    // Extract id_escenario from CallerIDName (format: "id_escenario:<id>")
    let id_escenario = extract_id_escenario(calleridname);
    let id_escenario = match id_escenario {
        Some(id) => id,
        None => return Ok(()), // Not related to a monitored escenario
    };

    tracing::info!(
        "OriginateResponse: id_escenario={} response={} reason={} uniqueid={}",
        id_escenario,
        response,
        reason,
        uniqueid
    );

    if response == "Success" && reason == "4" {
        // Successful originate -- update escenario
        sqlx::query(
            r#"UPDATE escenarios
               SET estado = $1, uniqueid_sal = $2, updated_at = NOW()
               WHERE id_escenario = $3"#,
        )
        .bind("PENDIENTE")
        .bind(uniqueid)
        .bind(id_escenario)
        .execute(pool)
        .await?;
    } else {
        // Failure -- store uniqueid and apply retry logic
        let hangup_reason = serde_json::json!({
            "cause": reason,
            "description": format!("Originate {}", response),
        })
        .to_string();

        // Store uniqueid if present
        if !uniqueid.is_empty() {
            sqlx::query(
                r#"UPDATE escenarios
                   SET uniqueid_sal = $1, updated_at = NOW()
                   WHERE id_escenario = $2"#,
            )
            .bind(uniqueid)
            .bind(id_escenario)
            .execute(pool)
            .await?;
        }

        // Reset channels to LIBRE before retry/finalize
        reset_channels(pool, id_escenario).await?;

        // Apply retry logic or set FALLIDO
        apply_retry_or_finalize(pool, id_escenario, "FALLIDO", &hangup_reason).await?;
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Newexten handler
// ---------------------------------------------------------------------------

/// Handle a Newexten event.
///
/// When the dialplan context is `entrantes` and a ringing channel matches an
/// escenario whose origin and destination numbers match, we record the
/// incoming unique-id and timestamp on the escenario.
///
/// When the context is `monitoreo`, we log the outbound leg.
async fn handle_new_exten(
    event: &HashMap<String, String>,
    pool: &PgPool,
) -> anyhow::Result<()> {
    let context = get_ci(event, "Context").unwrap_or("");
    let channelstatedesc = get_ci(event, "ChannelStateDesc").unwrap_or("");
    let calleridnum = get_ci(event, "CallerIDNum").unwrap_or("");
    let exten = get_ci(event, "Exten").unwrap_or("");
    let priority = get_ci(event, "Priority").unwrap_or("");
    let calleridname = get_ci(event, "CallerIDName").unwrap_or("");
    let uniqueid = get_ci(event, "Uniqueid").unwrap_or("");

    if context == "monitoreo" {
        // Outbound leg: when state is "Up" at priority 1
        if channelstatedesc == "Up" && priority == "1" {
            let _id_escenario = extract_id_escenario(calleridname);
            // Currently the Node.js code does not update anything here
            // beyond logging.  We preserve the same behavior.
            tracing::debug!(
                "Newexten monitoreo: calleridname={} uniqueid={}",
                calleridname,
                uniqueid
            );
        }
    } else if context == "entrantes" {
        // Inbound leg: when a channel starts ringing at priority 1
        if channelstatedesc == "Ring" && priority == "1" {
            // Find an escenario in PENDIENTE state where origin number matches
            // calleridnum and destination number matches exten (for tipo = 'C').
            let hora_entrante = Local::now().time();

            let result = sqlx::query(
                r#"UPDATE escenarios
                   SET uniqueid_en = $1, hora_entrante = $2, updated_at = NOW()
                   WHERE id_escenario = (
                       SELECT es.id_escenario
                       FROM escenarios es
                       JOIN canales co ON co.id_canal = es.id_canal_origen
                       JOIN canales cd ON cd.id_canal = es.id_destino AND es.tipo = 'C'
                       WHERE co.numero = $3
                         AND cd.numero = $4
                         AND es.estado = 'PENDIENTE'
                       LIMIT 1
                   )"#,
            )
            .bind(uniqueid)
            .bind(hora_entrante)
            .bind(calleridnum)
            .bind(exten)
            .execute(pool)
            .await?;

            if result.rows_affected() > 0 {
                tracing::info!(
                    "Newexten entrantes: matched escenario, calleridnum={} exten={} uniqueid={}",
                    calleridnum,
                    exten,
                    uniqueid
                );
            }
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Hangup handler
// ---------------------------------------------------------------------------

/// Handle a Hangup event.
///
/// Determines the final state of the escenario based on hangup cause code,
/// applies retry logic if retries are available, and resets channels.
async fn handle_hangup(
    event: &HashMap<String, String>,
    pool: &PgPool,
) -> anyhow::Result<()> {
    let calleridname = get_ci(event, "CallerIDName").unwrap_or("");
    let cause = get_ci(event, "Cause").unwrap_or("");
    let cause_txt = get_ci(event, "Cause-txt").unwrap_or("");

    let id_escenario = match extract_id_escenario(calleridname) {
        Some(id) => id,
        None => return Ok(()),
    };

    tracing::info!(
        "Hangup: id_escenario={} cause={} cause_txt={}",
        id_escenario,
        cause,
        cause_txt
    );

    // Read current escenario state before updating
    #[derive(sqlx::FromRow)]
    struct EscenarioInfo {
        tipo: String,
        uniqueid_en: Option<String>,
    }

    let esc_info = sqlx::query_as::<_, EscenarioInfo>(
        "SELECT tipo, uniqueid_en FROM escenarios WHERE id_escenario = $1",
    )
    .bind(id_escenario)
    .fetch_optional(pool)
    .await?;

    let esc_info = match esc_info {
        Some(info) => info,
        None => return Ok(()),
    };

    // Build hangupReason JSON matching the Node.js format
    let hangup_reason = serde_json::json!({
        "cause": cause,
        "description": cause_txt,
    })
    .to_string();

    // Determine the final state based on cause code
    let final_state = determine_final_state(
        cause,
        &esc_info.tipo,
        esc_info.uniqueid_en.as_deref(),
    );

    tracing::info!(
        "Hangup: id_escenario={} final_state={}",
        id_escenario,
        final_state
    );

    // Reset channels to LIBRE
    reset_channels(pool, id_escenario).await?;

    // Apply retry logic or set final state
    apply_retry_or_finalize(pool, id_escenario, final_state, &hangup_reason).await?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Channel reset helper
// ---------------------------------------------------------------------------

/// Reset origin and destination channels to LIBRE for an escenario.
async fn reset_channels(pool: &PgPool, id_escenario: i32) -> anyhow::Result<()> {
    // Reset origin channel to LIBRE
    sqlx::query(
        "UPDATE canales SET estado_llamada = 'LIBRE', updated_at = NOW()
         WHERE id_canal = (
             SELECT id_canal_origen FROM escenarios WHERE id_escenario = $1
         )",
    )
    .bind(id_escenario)
    .execute(pool)
    .await?;

    // Reset destination channel to LIBRE (only for tipo = 'C')
    sqlx::query(
        "UPDATE canales SET estado_llamada = 'LIBRE', updated_at = NOW()
         WHERE id_canal = (
             SELECT es.id_destino
             FROM escenarios es
             WHERE es.id_escenario = $1 AND es.tipo = 'C'
         )",
    )
    .bind(id_escenario)
    .execute(pool)
    .await?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Extract `id_escenario` from a CallerIDName string.
///
/// Expected format: `"id_escenario:<number>"` or contains `"id_escenario:"`.
/// Returns `None` if the value does not contain the prefix or cannot be parsed.
fn extract_id_escenario(calleridname: &str) -> Option<i32> {
    if let Some(pos) = calleridname.find("id_escenario:") {
        let after = &calleridname[pos + "id_escenario:".len()..];
        // Take characters while they are digits
        let digits: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        digits.parse::<i32>().ok()
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_event() {
        let raw = "Event: Hangup\r\nCallerIDName: id_escenario:42\r\nCause: 16\r\nCause-txt: Normal Clearing\r\n";
        let map = parse_event(raw);
        assert_eq!(map.get("Event"), Some(&"Hangup".to_string()));
        assert_eq!(map.get("CallerIDName"), Some(&"id_escenario:42".to_string()));
        assert_eq!(map.get("Cause"), Some(&"16".to_string()));
    }

    #[test]
    fn test_extract_id_escenario() {
        assert_eq!(extract_id_escenario("id_escenario:42"), Some(42));
        assert_eq!(extract_id_escenario("id_escenario:7 extra"), Some(7));
        assert_eq!(extract_id_escenario("no match"), None);
        assert_eq!(extract_id_escenario(""), None);
    }

    #[test]
    fn test_determine_final_state() {
        // Normal Clearing with both legs (tipo C, uniqueid_en present)
        assert_eq!(determine_final_state("16", "C", Some("123")), "EXITOSO");

        // Normal Clearing without inbound leg (tipo C, uniqueid_en absent)
        assert_eq!(determine_final_state("16", "C", None), "FALLIDO");

        // Normal Clearing for external call
        assert_eq!(determine_final_state("16", "E", None), "EXITOSO");

        // No Answer
        assert_eq!(determine_final_state("19", "C", None), "TIMEOUT");

        // No User Responding
        assert_eq!(determine_final_state("18", "C", None), "TIMEOUT");

        // Unallocated Number
        assert_eq!(determine_final_state("1", "C", None), "FALLIDO");

        // Call Rejected
        assert_eq!(determine_final_state("21", "C", None), "FALLIDO");

        // Unknown cause
        assert_eq!(determine_final_state("99", "C", None), "FALLIDO");
    }
}
