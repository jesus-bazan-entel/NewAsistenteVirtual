use std::sync::Arc;

use anyhow::{Context, Result};
use sqlx::PgPool;
use tokio::sync::RwLock;

use crate::asterisk::AmiClient;
use crate::config::Config;
use crate::services::ftp;

// ---------------------------------------------------------------------------
// Row types for queries
// ---------------------------------------------------------------------------

#[derive(Debug, sqlx::FromRow)]
struct EquipoRow {
    id_equipo: i32,
    nombre: Option<String>,
    ip: Option<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct CanalRow {
    numero: Option<String>,
}

// ---------------------------------------------------------------------------
// SIP configuration
// ---------------------------------------------------------------------------

/// Generate `sip.monitoreo.conf` content from the database.
///
/// Queries all active equipos and produces a `[equipo_name]` SIP friend
/// section for each one with standard codec and connection settings.
pub async fn generate_sip_conf(pool: &PgPool) -> Result<String> {
    let equipos = sqlx::query_as::<_, EquipoRow>(
        "SELECT id_equipo, nombre, ip FROM equipos WHERE deleted_at IS NULL",
    )
    .fetch_all(pool)
    .await
    .context("Failed to query equipos for SIP config")?;

    let mut conf = String::new();

    for equipo in &equipos {
        let nombre = equipo.nombre.as_deref().unwrap_or("unknown");
        let ip = equipo.ip.as_deref().unwrap_or("0.0.0.0");

        conf.push_str(&format!(
            r#"
[{nombre}]
type=friend
disallow=all
allow=ulaw,alaw,g729
context=entrantes
qualify=no
dtmfmode=RFC2833
host={ip}
directmedia=no
insecure=invite,port
"#,
        ));
    }

    Ok(conf)
}

// ---------------------------------------------------------------------------
// Extensions (dialplan) configuration
// ---------------------------------------------------------------------------

/// Generate `extensions.monitoreo.conf` content from the database.
///
/// Creates the `[monitoreo]` context (outbound test calls) and the
/// `[entrantes]` context with an extension for every canal that has a phone
/// number.
pub async fn generate_extensions_conf(pool: &PgPool) -> Result<String> {
    let mut conf = String::new();

    // Monitoring context (outbound)
    conf.push_str(
        r#"
[monitoreo]
exten => s,1,Noop(Llamada Saliente)
same => n,playback(hello-world)
same => hangup()

exten => h,1,Set(RTCP_data=${CHANNEL(rtpqos,audio,all)})
exten => h,n,NoOp(RTCP Values : ${RTCP_data})

[entrantes]
"#,
    );

    // Query all equipos
    let equipos = sqlx::query_as::<_, EquipoRow>(
        "SELECT id_equipo, nombre, ip FROM equipos WHERE deleted_at IS NULL",
    )
    .fetch_all(pool)
    .await
    .context("Failed to query equipos for extensions config")?;

    for equipo in &equipos {
        // Get canales for this equipo
        let canales = sqlx::query_as::<_, CanalRow>(
            "SELECT numero FROM canales WHERE id_equipo = $1 AND deleted_at IS NULL",
        )
        .bind(equipo.id_equipo)
        .fetch_all(pool)
        .await
        .context("Failed to query canales for extensions config")?;

        for canal in &canales {
            if let Some(ref numero) = canal.numero {
                if !numero.is_empty() {
                    conf.push_str(&format!(
                        r#"
exten => {numero},1,Noop(Llamada Entrante)
same => n,playback(hello-world)
same => hangup()
"#,
                    ));
                }
            }
        }
    }

    Ok(conf)
}

// ---------------------------------------------------------------------------
// Write / upload configs
// ---------------------------------------------------------------------------

/// Generate both SIP and extensions configuration files and either write them
/// locally or upload them via SFTP depending on `config.asterisk_env`.
///
/// * If `asterisk_env` is `"local"`, files are written to
///   `/etc/asterisk/sip.monitoreo.conf` and
///   `/etc/asterisk/extensions.monitoreo.conf`.
/// * Otherwise, the files are uploaded via SFTP using the FTP credentials in
///   the config.
pub async fn write_configs(pool: &PgPool, config: &Config) -> Result<()> {
    let sip_conf = generate_sip_conf(pool).await?;
    let extensions_conf = generate_extensions_conf(pool).await?;

    tracing::info!("Generated SIP config ({} bytes)", sip_conf.len());
    tracing::info!("Generated extensions config ({} bytes)", extensions_conf.len());

    if config.asterisk_env == "local" {
        // Write to configurable path (bind-mounted into Asterisk container)
        let sip_path = format!("{}/sip.monitoreo.conf", config.asterisk_config_path);
        let ext_path = format!("{}/extensions.monitoreo.conf", config.asterisk_config_path);

        tokio::fs::write(&sip_path, &sip_conf)
            .await
            .with_context(|| format!("Failed to write {}", sip_path))?;

        tokio::fs::write(&ext_path, &extensions_conf)
            .await
            .with_context(|| format!("Failed to write {}", ext_path))?;

        tracing::info!("Asterisk configs written to {}", config.asterisk_config_path);
    } else {
        // Upload via SFTP
        ftp::upload_content(
            &config.ftp_host,
            &config.ftp_user,
            &config.ftp_password,
            "/etc/asterisk/sip.monitoreo.conf",
            &sip_conf,
        )
        .await
        .context("Failed to upload sip.monitoreo.conf via SFTP")?;

        ftp::upload_content(
            &config.ftp_host,
            &config.ftp_user,
            &config.ftp_password,
            "/etc/asterisk/extensions.monitoreo.conf",
            &extensions_conf,
        )
        .await
        .context("Failed to upload extensions.monitoreo.conf via SFTP")?;

        tracing::info!("Asterisk configs uploaded via SFTP");
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Full sync: write configs + AMI reload
// ---------------------------------------------------------------------------

/// Generate config files from the database, write them to the configured path,
/// and send an AMI Reload command so Asterisk picks up the changes.
pub async fn sync_asterisk_configs(
    pool: &PgPool,
    config: &Config,
    ami_client: &Arc<RwLock<Option<Arc<AmiClient>>>>,
) -> Result<()> {
    // 1. Generate and write configs
    write_configs(pool, config).await?;

    // 2. If AMI client is connected, send reload
    let guard = ami_client.read().await;
    if let Some(ref client) = *guard {
        if client.is_connected() {
            client.reload().await?;
            tracing::info!("Asterisk config synced and reloaded via AMI");
        } else {
            tracing::warn!("AMI client not connected, configs written but reload skipped");
        }
    } else {
        tracing::warn!("No AMI client configured, configs written but reload skipped");
    }

    Ok(())
}
