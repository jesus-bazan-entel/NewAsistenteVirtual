use std::io::Write;
use std::net::TcpStream;
use std::path::Path;

use anyhow::{Context, Result};
use ssh2::Session;

// ---------------------------------------------------------------------------
// SFTP upload
// ---------------------------------------------------------------------------

/// Upload string content to a remote path via SFTP.
///
/// Opens an SSH connection to `host:22`, authenticates with username/password,
/// and writes the content to `remote_path` using the SFTP subsystem.
///
/// # Arguments
///
/// * `host` - SSH/SFTP server hostname or IP
/// * `user` - SSH username
/// * `password` - SSH password
/// * `remote_path` - Absolute path on the remote server where the file
///   should be written
/// * `content` - The string content to upload
pub async fn upload_content(
    host: &str,
    user: &str,
    password: &str,
    remote_path: &str,
    content: &str,
) -> Result<()> {
    // ssh2 is a blocking library, so we run it on a blocking thread
    let host = host.to_string();
    let user = user.to_string();
    let password = password.to_string();
    let remote_path = remote_path.to_string();
    let content = content.to_string();

    tokio::task::spawn_blocking(move || {
        upload_content_blocking(&host, &user, &password, &remote_path, &content)
    })
    .await
    .context("SFTP upload task panicked")?
}

/// Blocking implementation of SFTP upload.
fn upload_content_blocking(
    host: &str,
    user: &str,
    password: &str,
    remote_path: &str,
    content: &str,
) -> Result<()> {
    let addr = format!("{}:22", host);
    tracing::info!("SFTP: connecting to {}", addr);

    let tcp = TcpStream::connect(&addr)
        .with_context(|| format!("SFTP: failed to connect to {}", addr))?;

    let mut session = Session::new()
        .context("SFTP: failed to create SSH session")?;

    session.set_tcp_stream(tcp);
    session.handshake()
        .context("SFTP: SSH handshake failed")?;

    session
        .userauth_password(user, password)
        .context("SFTP: authentication failed")?;

    if !session.authenticated() {
        anyhow::bail!("SFTP: authentication was not successful");
    }

    let sftp = session.sftp()
        .context("SFTP: failed to open SFTP subsystem")?;

    // Write the content to the remote file
    let remote = Path::new(remote_path);
    let mut remote_file = sftp
        .create(remote)
        .with_context(|| format!("SFTP: failed to create remote file {}", remote_path))?;

    remote_file
        .write_all(content.as_bytes())
        .with_context(|| format!("SFTP: failed to write to {}", remote_path))?;

    tracing::info!("SFTP: uploaded {} bytes to {}", content.len(), remote_path);
    Ok(())
}
