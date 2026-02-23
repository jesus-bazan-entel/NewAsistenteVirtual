use anyhow::{Context, Result};
use sqlx::PgPool;

use crate::models::{EjecucionConDetalles, EscenarioDetalle, PruebaResumen};

use super::email;
use super::pdf;

// ---------------------------------------------------------------------------
// Row types for the complex ejecucion query
// ---------------------------------------------------------------------------

#[derive(Debug, sqlx::FromRow)]
struct EjecucionRow {
    id_ejecucion: i32,
    numero_prueba: Option<i32>,
    fecha_inicio: Option<chrono::DateTime<chrono::Utc>>,
    fecha_fin: Option<chrono::DateTime<chrono::Utc>>,
    estado: Option<String>,
    id_prueba: Option<i32>,
    created_at: Option<chrono::DateTime<chrono::Utc>>,
    updated_at: Option<chrono::DateTime<chrono::Utc>>,
    deleted_at: Option<chrono::DateTime<chrono::Utc>>,
}

// ---------------------------------------------------------------------------
// find_by_id
// ---------------------------------------------------------------------------

/// Load an ejecucion with all its related data: prueba summary and escenarios
/// with canal details.
///
/// This mirrors `ejecucionService.findById` from the Node.js backend.
pub async fn find_by_id(pool: &PgPool, id_ejecucion: i32) -> Result<EjecucionConDetalles> {
    // Load the ejecucion itself
    let ej = sqlx::query_as::<_, EjecucionRow>(
        "SELECT id_ejecucion, numero_prueba, fecha_inicio, fecha_fin, estado,
                id_prueba, created_at, updated_at, deleted_at
         FROM ejecuciones
         WHERE id_ejecucion = $1",
    )
    .bind(id_ejecucion)
    .fetch_one(pool)
    .await
    .context("Ejecucion not found")?;

    // Load prueba summary (if linked)
    let prueba = if let Some(id_prueba) = ej.id_prueba {
        sqlx::query_as::<_, PruebaResumen>(
            "SELECT p.id_prueba, p.nombre, m.nombre AS nombre_matriz, p.correo
             FROM pruebas p
             LEFT JOIN matrices m ON m.id_matriz = p.id_matriz
             WHERE p.id_prueba = $1",
        )
        .bind(id_prueba)
        .fetch_optional(pool)
        .await?
    } else {
        None
    };

    // Load escenarios with canal + operador details
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
    .bind(id_ejecucion)
    .fetch_all(pool)
    .await?;

    Ok(EjecucionConDetalles {
        id_ejecucion: ej.id_ejecucion,
        numero_prueba: ej.numero_prueba,
        fecha_inicio: ej.fecha_inicio,
        fecha_fin: ej.fecha_fin,
        estado: ej.estado,
        id_prueba: ej.id_prueba,
        created_at: ej.created_at,
        updated_at: ej.updated_at,
        deleted_at: ej.deleted_at,
        prueba,
        escenarios,
    })
}

// ---------------------------------------------------------------------------
// create_and_send_pdf
// ---------------------------------------------------------------------------

/// Generate a PDF report for the ejecucion and send it via email.
///
/// This mirrors `ejecucionService.createAndSendPdf` from the Node.js backend.
pub async fn create_and_send_pdf(
    ejecucion: &EjecucionConDetalles,
    smtp_host: &str,
    smtp_port: u16,
) -> Result<()> {
    // Generate PDF
    let pdf_bytes = pdf::generate_execution_pdf(ejecucion)?;

    // Determine recipient
    let to = if let Some(ref prueba) = ejecucion.prueba {
        prueba.correo.clone().unwrap_or_default()
    } else {
        String::new()
    };

    // Build subject and body
    let prueba_nombre = ejecucion
        .prueba
        .as_ref()
        .and_then(|p| p.nombre.as_deref())
        .unwrap_or("Sin nombre")
        .replace('_', " ");

    let subject = format!("REPORTE DE EJECUCION [{}]", prueba_nombre);
    let body = format!(
        "Nombre: {}\nSe envia reporte de ejecucion en el siguiente archivo adjunto.",
        prueba_nombre
    );

    email::send_report_email(
        &to,
        &subject,
        &body,
        Some((&pdf_bytes, "Reporte_De_Ejecucion.pdf")),
        smtp_host,
        smtp_port,
    )
    .await?;

    Ok(())
}

// ---------------------------------------------------------------------------
// send_ejecucion_by_mail (convenience function)
// ---------------------------------------------------------------------------

/// Load an ejecucion by ID and send its PDF report by email.
///
/// Uses `SMTP_HOST` / `SMTP_PORT` from environment or defaults.
pub async fn send_ejecucion_by_mail(pool: &PgPool, id_ejecucion: i32) -> Result<()> {
    let ejecucion = find_by_id(pool, id_ejecucion).await?;

    let smtp_host =
        std::env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".to_string());
    let smtp_port: u16 = std::env::var("SMTP_PORT")
        .unwrap_or_else(|_| "25".to_string())
        .parse()
        .unwrap_or(25);

    create_and_send_pdf(&ejecucion, &smtp_host, smtp_port).await
}
