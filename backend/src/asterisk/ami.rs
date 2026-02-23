use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use tokio::sync::{broadcast, Mutex};
use tokio::task::JoinHandle;

use super::event_handlers;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OriginateParams {
    pub phone: String,
    pub context: String,
    pub exten: String,
    pub priority: String,
    pub channel: String,
    pub referer: String,
    pub id_escenario: Option<i32>,
    pub timeout_ms: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OriginateResult {
    pub success: bool,
    pub action_id: String,
    pub message: String,
}

// ---------------------------------------------------------------------------
// AmiClient
// ---------------------------------------------------------------------------

/// Async AMI TCP client for Asterisk Manager Interface.
///
/// The client maintains a persistent TCP connection to Asterisk, sends AMI
/// actions, and listens for events that it dispatches to `event_handlers`.
pub struct AmiClient {
    stream: Mutex<Option<TcpStream>>,
    connected: AtomicBool,
    host: String,
    port: u16,
    user: String,
    password: String,
    pool: PgPool,
    ws_broadcast: broadcast::Sender<String>,
    action_counter: Mutex<u64>,
}

impl AmiClient {
    // -----------------------------------------------------------------
    // Construction
    // -----------------------------------------------------------------

    /// Create a new `AmiClient`.  Call [`connect`] afterwards to establish the
    /// TCP link to the Asterisk AMI.
    pub fn new(
        host: String,
        port: u16,
        user: String,
        password: String,
        pool: PgPool,
        ws_broadcast: broadcast::Sender<String>,
    ) -> Self {
        Self {
            stream: Mutex::new(None),
            connected: AtomicBool::new(false),
            host,
            port,
            user,
            password,
            pool,
            ws_broadcast,
            action_counter: Mutex::new(0),
        }
    }

    // -----------------------------------------------------------------
    // Connection management
    // -----------------------------------------------------------------

    /// Connect to the Asterisk AMI, send a Login action, and verify the
    /// response.  Returns `Ok(())` on successful authentication.
    pub async fn connect(&self) -> Result<()> {
        let addr = format!("{}:{}", self.host, self.port);
        tracing::info!("AMI: connecting to {}", addr);

        let tcp = TcpStream::connect(&addr)
            .await
            .with_context(|| format!("AMI: failed to connect to {}", addr))?;

        // Store the stream
        {
            let mut guard = self.stream.lock().await;
            *guard = Some(tcp);
        }

        // Read the initial AMI banner line (e.g. "Asterisk Call Manager/...")
        let banner = self.read_line().await?;
        tracing::info!("AMI banner: {}", banner.trim());

        // Send Login action
        let mut headers = HashMap::new();
        headers.insert("Username".to_string(), self.user.clone());
        headers.insert("Secret".to_string(), self.password.clone());
        let response = self.send_action("Login", headers).await?;

        if response.contains("Authentication accepted") {
            self.connected.store(true, Ordering::SeqCst);
            tracing::info!("AMI: authentication accepted");
            Ok(())
        } else if response.contains("Authentication failed") {
            self.connected.store(false, Ordering::SeqCst);
            Err(anyhow!("AMI: authentication failed"))
        } else {
            // Treat any other response as tentatively connected
            self.connected.store(true, Ordering::SeqCst);
            tracing::warn!("AMI: unexpected login response: {}", response.trim());
            Ok(())
        }
    }

    /// Loop reconnection attempts every 5 seconds until a connection is
    /// established.
    pub async fn reconnect(&self) {
        loop {
            tracing::info!("AMI: attempting reconnection...");
            match self.connect().await {
                Ok(_) => {
                    tracing::info!("AMI: reconnected successfully");
                    return;
                }
                Err(e) => {
                    tracing::error!("AMI: reconnection failed: {}", e);
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                }
            }
        }
    }

    /// Returns `true` if the client believes it is connected.
    pub fn is_connected(&self) -> bool {
        self.connected.load(Ordering::SeqCst)
    }

    // -----------------------------------------------------------------
    // Low-level I/O
    // -----------------------------------------------------------------

    /// Generate a unique ActionID for each request.
    async fn next_action_id(&self) -> String {
        let mut counter = self.action_counter.lock().await;
        *counter += 1;
        format!("rust-ami-{}", *counter)
    }

    /// Read a single line from the AMI TCP stream.
    async fn read_line(&self) -> Result<String> {
        let mut guard = self.stream.lock().await;
        let stream = guard.as_mut().ok_or_else(|| anyhow!("AMI: not connected"))?;

        let mut reader = BufReader::new(stream);
        let mut line = String::new();
        reader
            .read_line(&mut line)
            .await
            .context("AMI: failed to read line")?;
        Ok(line)
    }

    /// Send a raw AMI action with the given headers and read the response
    /// packet (terminated by a blank line `\r\n`).
    pub async fn send_action(
        &self,
        action: &str,
        headers: HashMap<String, String>,
    ) -> Result<String> {
        let action_id = self.next_action_id().await;

        // Build the AMI packet
        let mut packet = format!("Action: {}\r\nActionID: {}\r\n", action, action_id);
        for (key, value) in &headers {
            packet.push_str(&format!("{}: {}\r\n", key, value));
        }
        packet.push_str("\r\n");

        // Write to stream
        {
            let mut guard = self.stream.lock().await;
            let stream = guard.as_mut().ok_or_else(|| anyhow!("AMI: not connected"))?;
            stream
                .write_all(packet.as_bytes())
                .await
                .context("AMI: failed to write action")?;
            stream.flush().await.context("AMI: flush failed")?;
        }

        // Read response until blank line
        let response = self.read_response().await?;
        Ok(response)
    }

    /// Read an AMI response packet: lines until an empty `\r\n`.
    async fn read_response(&self) -> Result<String> {
        let mut guard = self.stream.lock().await;
        let stream = guard.as_mut().ok_or_else(|| anyhow!("AMI: not connected"))?;

        let mut reader = BufReader::new(stream);
        let mut response = String::new();

        loop {
            let mut line = String::new();
            let bytes_read = reader
                .read_line(&mut line)
                .await
                .context("AMI: failed to read response")?;

            if bytes_read == 0 {
                // Connection closed
                break;
            }

            let trimmed = line.trim();
            if trimmed.is_empty() {
                break;
            }

            response.push_str(&line);
        }

        Ok(response)
    }

    // -----------------------------------------------------------------
    // High-level actions
    // -----------------------------------------------------------------

    /// Send an AMI Originate action to place a call.
    pub async fn originate(&self, params: OriginateParams) -> Result<OriginateResult> {
        let action_id = if let Some(id_escenario) = params.id_escenario {
            format!("originate-esc-{}", id_escenario)
        } else {
            self.next_action_id().await
        };

        let callerid = format!(
            "{} <{}>",
            params.referer, params.phone
        );

        let mut headers = HashMap::new();
        headers.insert("Channel".to_string(), params.channel.clone());
        headers.insert("Context".to_string(), params.context.clone());
        headers.insert("Exten".to_string(), params.exten.clone());
        headers.insert("Priority".to_string(), params.priority.clone());
        headers.insert("CallerID".to_string(), callerid);
        let timeout = params.timeout_ms.unwrap_or(30000);
        headers.insert("Timeout".to_string(), timeout.to_string());
        headers.insert("Async".to_string(), "true".to_string());
        headers.insert("ActionID".to_string(), action_id.clone());

        // Build and send the packet manually (we need the custom ActionID)
        let mut packet = String::from("Action: Originate\r\n");
        for (key, value) in &headers {
            packet.push_str(&format!("{}: {}\r\n", key, value));
        }
        packet.push_str("\r\n");

        // Write
        {
            let mut guard = self.stream.lock().await;
            let stream = guard.as_mut().ok_or_else(|| anyhow!("AMI: not connected"))?;
            stream.write_all(packet.as_bytes()).await?;
            stream.flush().await?;
        }

        // Read immediate response
        let response = self.read_response().await?;

        let success = response.contains("Response: Success")
            || !response.contains("Response: Error");

        tracing::info!(
            "AMI: originate action_id={} channel={} response_ok={}",
            action_id,
            params.channel,
            success
        );

        Ok(OriginateResult {
            success,
            action_id,
            message: response,
        })
    }

    /// Check whether an Asterisk peer is reachable (status contains "OK").
    pub async fn check_peer_status(&self, peer: &str) -> Result<bool> {
        let mut headers = HashMap::new();
        headers.insert("Peer".to_string(), peer.to_string());

        let response = self.send_action("SIPshowpeer", headers).await?;

        let is_ok = response.contains("OK");
        tracing::info!("AMI: peer {} status OK={}", peer, is_ok);
        Ok(is_ok)
    }

    /// Send an AMI Reload action.
    pub async fn reload(&self) -> Result<String> {
        let mut headers = HashMap::new();
        headers.insert("Async".to_string(), "true".to_string());

        let response = self.send_action("Reload", headers).await?;
        tracing::info!("AMI: reload response: {}", response.trim());
        Ok(response)
    }

    // -----------------------------------------------------------------
    // Event listener
    // -----------------------------------------------------------------

    /// Spawn a background tokio task that continuously reads AMI events from a
    /// **separate** TCP connection and dispatches them through
    /// `event_handlers`.
    ///
    /// This uses its own TCP stream so that the main stream can still be used
    /// for sending actions.
    pub fn listen_events(self: &Arc<Self>) -> JoinHandle<()> {
        let client = Arc::clone(self);

        tokio::spawn(async move {
            loop {
                // Open a dedicated event connection
                let addr = format!("{}:{}", client.host, client.port);
                tracing::info!("AMI events: connecting to {}", addr);

                let tcp = match TcpStream::connect(&addr).await {
                    Ok(s) => s,
                    Err(e) => {
                        tracing::error!("AMI events: connection failed: {}", e);
                        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                        continue;
                    }
                };

                let (reader, mut writer) = tokio::io::split(tcp);
                let mut buf_reader = BufReader::new(reader);

                // Read banner
                let mut banner = String::new();
                if let Err(e) = buf_reader.read_line(&mut banner).await {
                    tracing::error!("AMI events: failed to read banner: {}", e);
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    continue;
                }
                tracing::info!("AMI events banner: {}", banner.trim());

                // Login on the event connection
                let login_packet = format!(
                    "Action: Login\r\nUsername: {}\r\nSecret: {}\r\nEvents: on\r\n\r\n",
                    client.user, client.password
                );
                if let Err(e) = writer.write_all(login_packet.as_bytes()).await {
                    tracing::error!("AMI events: login write failed: {}", e);
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    continue;
                }

                // Read login response (until blank line)
                let mut login_ok = false;
                loop {
                    let mut line = String::new();
                    match buf_reader.read_line(&mut line).await {
                        Ok(0) => break,
                        Ok(_) => {
                            if line.contains("Authentication accepted") {
                                login_ok = true;
                            }
                            if line.trim().is_empty() {
                                break;
                            }
                        }
                        Err(e) => {
                            tracing::error!("AMI events: login read error: {}", e);
                            break;
                        }
                    }
                }

                if !login_ok {
                    tracing::error!("AMI events: authentication failed on event connection");
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    continue;
                }

                tracing::info!("AMI events: listening for events");

                // Read events in a loop.  Each event is a block of
                // "Key: Value" lines terminated by a blank line.
                let mut event_buf = String::new();
                loop {
                    let mut line = String::new();
                    match buf_reader.read_line(&mut line).await {
                        Ok(0) => {
                            // Connection closed
                            tracing::warn!("AMI events: connection closed");
                            break;
                        }
                        Ok(_) => {
                            let trimmed = line.trim();
                            if trimmed.is_empty() {
                                // End of event block
                                if !event_buf.is_empty() {
                                    event_handlers::handle_event(
                                        &event_buf,
                                        &client.pool,
                                        &client.ws_broadcast,
                                    )
                                    .await;
                                    event_buf.clear();
                                }
                            } else {
                                event_buf.push_str(&line);
                            }
                        }
                        Err(e) => {
                            tracing::error!("AMI events: read error: {}", e);
                            break;
                        }
                    }
                }

                // If we reach here, the event connection was lost
                tracing::warn!("AMI events: reconnecting in 5 seconds...");
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            }
        })
    }
}
