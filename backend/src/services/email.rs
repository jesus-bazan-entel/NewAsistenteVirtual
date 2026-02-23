use anyhow::{Context, Result};
use lettre::message::header::ContentType;
use lettre::message::{Attachment, Body, MultiPart, SinglePart};
use lettre::transport::smtp::client::Tls;
use lettre::{Message, SmtpTransport, Transport};

// ---------------------------------------------------------------------------
// Email sending
// ---------------------------------------------------------------------------

/// Send a report email with an optional PDF attachment.
///
/// Uses the `lettre` crate to build and send the email over SMTP.
///
/// # Arguments
///
/// * `to` - Recipient email address
/// * `subject` - Email subject line
/// * `body` - Plain text email body
/// * `attachment` - Optional tuple of `(pdf_bytes, filename)` for the PDF
///   attachment
/// * `smtp_host` - SMTP server hostname
/// * `smtp_port` - SMTP server port
pub async fn send_report_email(
    to: &str,
    subject: &str,
    body: &str,
    attachment: Option<(&[u8], &str)>,
    smtp_host: &str,
    smtp_port: u16,
) -> Result<()> {
    if to.is_empty() {
        tracing::warn!("Email: skipping send, no recipient address");
        return Ok(());
    }

    let from = std::env::var("SMTP_FROM")
        .unwrap_or_else(|_| "asistentevirtual@entel.net.pe".to_string());

    let mut email_builder = Message::builder()
        .from(from.parse().context("Invalid FROM address")?)
        .to(to.parse().context("Invalid TO address")?)
        .subject(subject);

    let email = if let Some((pdf_bytes, filename)) = attachment {
        // Build multipart message with text + attachment
        let text_part = SinglePart::builder()
            .header(ContentType::TEXT_PLAIN)
            .body(body.to_string());

        let attachment_part = Attachment::new(filename.to_string()).body(
            Body::new(pdf_bytes.to_vec()),
            "application/pdf".parse().unwrap(),
        );

        let multipart = MultiPart::mixed()
            .singlepart(text_part)
            .singlepart(attachment_part);

        email_builder
            .multipart(multipart)
            .context("Failed to build email with attachment")?
    } else {
        email_builder
            .body(body.to_string())
            .context("Failed to build email")?
    };

    // Build SMTP transport
    // Use port 25 without TLS (common for internal relay), port 587 with
    // STARTTLS, etc.
    let transport = if smtp_port == 25 {
        SmtpTransport::builder_dangerous(smtp_host)
            .port(smtp_port)
            .tls(Tls::None)
            .build()
    } else {
        SmtpTransport::builder_dangerous(smtp_host)
            .port(smtp_port)
            .build()
    };

    // Send the email (blocking on a thread, since lettre's sync transport is
    // used here)
    let transport_clone = transport;
    let email_clone = email;

    tokio::task::spawn_blocking(move || {
        transport_clone
            .send(&email_clone)
            .context("Failed to send email via SMTP")
    })
    .await
    .context("Email send task panicked")??;

    tracing::info!("Email sent to {} with subject: {}", to, subject);
    Ok(())
}
