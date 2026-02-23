use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use tokio::sync::broadcast;

use crate::AppState;

// ---------------------------------------------------------------------------
// WebSocket upgrade handler
// ---------------------------------------------------------------------------

/// Axum handler that upgrades an HTTP request to a WebSocket connection.
///
/// Once upgraded, the handler subscribes to the broadcast channel and forwards
/// all AMI events to the WebSocket client.  Client-sent messages are
/// currently ignored (the WebSocket is used as a server-push channel).
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state.ws_broadcast.subscribe()))
}

// ---------------------------------------------------------------------------
// Socket handling
// ---------------------------------------------------------------------------

/// Manage a single WebSocket connection.
///
/// Subscribes to the broadcast channel and forwards every message to the
/// client.  If the client disconnects or an error occurs, the task ends
/// gracefully.
async fn handle_socket(
    socket: WebSocket,
    mut rx: broadcast::Receiver<String>,
) {
    let (mut sender, mut receiver) = socket.split();

    // Spawn a task that reads from the broadcast channel and writes to the
    // WebSocket.
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                // Client disconnected
                break;
            }
        }
    });

    // Spawn a task that reads from the WebSocket (client messages).
    // We currently just drain them to detect disconnection.
    let mut recv_task = tokio::spawn(async move {
        while let Some(result) = receiver.next().await {
            match result {
                Ok(Message::Close(_)) => break,
                Ok(_) => {
                    // Ignore other client messages
                }
                Err(e) => {
                    tracing::debug!("WebSocket receive error: {}", e);
                    break;
                }
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = &mut send_task => {
            recv_task.abort();
        }
        _ = &mut recv_task => {
            send_task.abort();
        }
    }

    tracing::debug!("WebSocket client disconnected");
}
