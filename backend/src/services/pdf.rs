use anyhow::{Context, Result};
use printpdf::*;

use crate::models::EjecucionConDetalles;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_WIDTH_MM: f32 = 210.0;
const PAGE_HEIGHT_MM: f32 = 297.0;
const MARGIN_MM: f32 = 15.0;
const FONT_SIZE_TITLE: f32 = 16.0;
const FONT_SIZE_SUBTITLE: f32 = 12.0;
const FONT_SIZE_BODY: f32 = 9.0;
const LINE_HEIGHT_MM: f32 = 5.0;

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

/// Generate a PDF document for an execution report.
///
/// The generated PDF includes:
/// - Report title with the prueba name
/// - Execution date range
/// - User and matriz names
/// - Scenario results table (origin, destination, status, hangup reason)
///
/// Returns the raw PDF bytes suitable for saving or attaching to an email.
pub fn generate_execution_pdf(ejecucion: &EjecucionConDetalles) -> Result<Vec<u8>> {
    let prueba_nombre = ejecucion
        .prueba
        .as_ref()
        .and_then(|p| p.nombre.as_deref())
        .unwrap_or("Sin nombre")
        .replace('_', " ");

    let matriz_nombre = ejecucion
        .prueba
        .as_ref()
        .and_then(|p| p.nombre_matriz.as_deref())
        .unwrap_or("N/A");

    let fecha_inicio = ejecucion
        .fecha_inicio
        .map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string())
        .unwrap_or_else(|| "N/A".to_string());

    let fecha_fin = ejecucion
        .fecha_fin
        .map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string())
        .unwrap_or_else(|| "N/A".to_string());

    // Create PDF document
    let (doc, page1, layer1) =
        PdfDocument::new("Reporte de Ejecucion", Mm(PAGE_WIDTH_MM), Mm(PAGE_HEIGHT_MM), "Layer 1");

    let font = doc.add_builtin_font(BuiltinFont::Helvetica)
        .context("Failed to add Helvetica font")?;
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold)
        .context("Failed to add Helvetica-Bold font")?;

    let current_layer = doc.get_page(page1).get_layer(layer1);

    let mut y = PAGE_HEIGHT_MM - MARGIN_MM;

    // -----------------------------------------------------------------
    // Title
    // -----------------------------------------------------------------
    current_layer.use_text(
        &format!("Reporte de Ejecucion: {}", prueba_nombre),
        FONT_SIZE_TITLE,
        Mm(MARGIN_MM),
        Mm(y),
        &font_bold,
    );
    y -= LINE_HEIGHT_MM * 2.0;

    // -----------------------------------------------------------------
    // Metadata
    // -----------------------------------------------------------------
    let meta_lines = [
        format!("Matriz: {}", matriz_nombre),
        format!("Fecha Inicio: {}", fecha_inicio),
        format!("Fecha Fin: {}", fecha_fin),
        format!("Total Escenarios: {}", ejecucion.escenarios.len()),
    ];

    for line in &meta_lines {
        current_layer.use_text(line, FONT_SIZE_SUBTITLE, Mm(MARGIN_MM), Mm(y), &font);
        y -= LINE_HEIGHT_MM * 1.5;
    }

    y -= LINE_HEIGHT_MM;

    // -----------------------------------------------------------------
    // Table header
    // -----------------------------------------------------------------
    let col_x: [f32; 5] = [MARGIN_MM, 55.0, 105.0, 145.0, 175.0];
    let headers = ["Origen", "Destino", "Estado", "Hangup Reason", "MOS"];

    for (i, header) in headers.iter().enumerate() {
        current_layer.use_text(*header, FONT_SIZE_BODY, Mm(col_x[i]), Mm(y), &font_bold);
    }
    y -= LINE_HEIGHT_MM;

    // Draw a separator line
    let points = vec![
        (Point::new(Mm(MARGIN_MM), Mm(y)), false),
        (Point::new(Mm(PAGE_WIDTH_MM - MARGIN_MM), Mm(y)), false),
    ];
    let line = Line {
        points,
        is_closed: false,
    };
    current_layer.add_line(line);
    y -= LINE_HEIGHT_MM;

    // -----------------------------------------------------------------
    // Scenario rows
    // -----------------------------------------------------------------
    for escenario in &ejecucion.escenarios {
        if y < MARGIN_MM + 10.0 {
            // Would need a new page in a production system.
            // For now, truncate to avoid going off-page.
            current_layer.use_text(
                "... (mas escenarios)",
                FONT_SIZE_BODY,
                Mm(MARGIN_MM),
                Mm(y),
                &font,
            );
            break;
        }

        let origen = escenario
            .canal_origen_numero
            .as_deref()
            .unwrap_or("N/A");

        let destino = escenario
            .destino_numero
            .as_deref()
            .unwrap_or("N/A");

        let estado = escenario
            .estado
            .as_deref()
            .unwrap_or("N/A");

        // Parse hangupReason JSON if present
        let hangup_desc = escenario
            .hangup_reason
            .as_deref()
            .and_then(|hr| {
                serde_json::from_str::<serde_json::Value>(hr)
                    .ok()
                    .and_then(|v| v.get("description").and_then(|d| d.as_str().map(|s| s.to_string())))
            })
            .unwrap_or_else(|| "N/A".to_string());

        let mos = escenario
            .mos
            .as_deref()
            .unwrap_or("N/A");

        let values = [origen, destino, estado, &hangup_desc, mos];

        for (i, value) in values.iter().enumerate() {
            // Truncate long values to avoid overlapping columns
            let truncated: String = value.chars().take(25).collect();
            current_layer.use_text(
                &truncated,
                FONT_SIZE_BODY,
                Mm(col_x[i]),
                Mm(y),
                &font,
            );
        }

        y -= LINE_HEIGHT_MM;
    }

    // -----------------------------------------------------------------
    // Save to bytes
    // -----------------------------------------------------------------
    let bytes = doc
        .save_to_bytes()
        .context("Failed to save PDF to bytes")?;

    Ok(bytes)
}
