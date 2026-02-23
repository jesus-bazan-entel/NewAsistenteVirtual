use std::sync::Arc;

use axum::{extract::State, Json};
use serde_json::{json, Value};

use crate::asterisk::AmiClient;
use crate::error::{AppError, AppResult};
use crate::models::asterisk_config::{AsteriskConfig, UpdateAsteriskConfig};
use crate::AppState;

/// GET /api/asterisk-config
pub async fn obtener(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let config = sqlx::query_as::<_, AsteriskConfig>(
        "SELECT id, host, puerto, usuario, clave, entorno, activo, created_at, updated_at
         FROM asterisk_config ORDER BY id LIMIT 1",
    )
    .fetch_optional(&state.pool)
    .await?;

    let config = match config {
        Some(c) => c,
        None => {
            sqlx::query_as::<_, AsteriskConfig>(
                "INSERT INTO asterisk_config (host, puerto, usuario, clave, entorno, activo)
                 VALUES ('', 5038, 'admin', '', 'local', false)
                 RETURNING id, host, puerto, usuario, clave, entorno, activo, created_at, updated_at",
            )
            .fetch_one(&state.pool)
            .await?
        }
    };

    Ok(Json(json!({
        "estado": true,
        "data": config
    })))
}

/// PUT /api/asterisk-config
pub async fn actualizar(
    State(state): State<Arc<AppState>>,
    Json(body): Json<UpdateAsteriskConfig>,
) -> AppResult<Json<Value>> {
    let existing = sqlx::query_as::<_, AsteriskConfig>(
        "SELECT id, host, puerto, usuario, clave, entorno, activo, created_at, updated_at
         FROM asterisk_config ORDER BY id LIMIT 1",
    )
    .fetch_optional(&state.pool)
    .await?;

    match existing {
        Some(row) => {
            sqlx::query(
                "UPDATE asterisk_config
                 SET host = $1, puerto = $2, usuario = $3, clave = $4,
                     entorno = $5, activo = $6, updated_at = NOW()
                 WHERE id = $7",
            )
            .bind(&body.host)
            .bind(body.puerto)
            .bind(&body.usuario)
            .bind(&body.clave)
            .bind(&body.entorno)
            .bind(body.activo)
            .bind(row.id)
            .execute(&state.pool)
            .await?;
        }
        None => {
            sqlx::query(
                "INSERT INTO asterisk_config (host, puerto, usuario, clave, entorno, activo)
                 VALUES ($1, $2, $3, $4, $5, $6)",
            )
            .bind(&body.host)
            .bind(body.puerto)
            .bind(&body.usuario)
            .bind(&body.clave)
            .bind(&body.entorno)
            .bind(body.activo)
            .execute(&state.pool)
            .await?;
        }
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Configuración Asterisk actualizada exitosamente"
    })))
}

/// POST /api/asterisk-config/test
pub async fn test_conexion(
    State(state): State<Arc<AppState>>,
    Json(body): Json<UpdateAsteriskConfig>,
) -> AppResult<Json<Value>> {
    if body.host.is_empty() {
        return Err(AppError::BadRequest(
            "El host es obligatorio".to_string(),
        ));
    }

    let client = AmiClient::new(
        body.host,
        body.puerto as u16,
        body.usuario,
        body.clave,
        state.pool.clone(),
        state.ws_broadcast.clone(),
    );

    match client.connect().await {
        Ok(()) => Ok(Json(json!({
            "estado": true,
            "mensaje": "Conexión exitosa al servidor Asterisk"
        }))),
        Err(e) => Ok(Json(json!({
            "estado": false,
            "error": format!("Error de conexión: {}", e)
        }))),
    }
}

/// POST /api/asterisk-config/sync
pub async fn sincronizar(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    crate::asterisk::sync_asterisk_configs(
        &state.pool, &state.config, &state.ami_client
    ).await.map_err(|e| AppError::Internal(format!("Sync failed: {}", e)))?;

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Configuración Asterisk sincronizada"
    })))
}

/// POST /api/asterisk-config/reconnect
pub async fn reconectar(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let config = sqlx::query_as::<_, AsteriskConfig>(
        "SELECT id, host, puerto, usuario, clave, entorno, activo, created_at, updated_at
         FROM asterisk_config ORDER BY id LIMIT 1",
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| {
        AppError::NotFound("No hay configuración Asterisk guardada".to_string())
    })?;

    if !config.activo {
        let mut guard = state.ami_client.write().await;
        *guard = None;
        return Ok(Json(json!({
            "estado": true,
            "mensaje": "AMI desactivado"
        })));
    }

    if config.host.is_empty() {
        return Err(AppError::BadRequest(
            "El host no está configurado".to_string(),
        ));
    }

    let client = Arc::new(AmiClient::new(
        config.host,
        config.puerto as u16,
        config.usuario,
        config.clave,
        state.pool.clone(),
        state.ws_broadcast.clone(),
    ));

    let client_clone = client.clone();
    let pool_clone = state.pool.clone();
    let config_clone = state.config.clone();
    let ami_clone = state.ami_client.clone();
    tokio::spawn(async move {
        if let Err(e) = client_clone.connect().await {
            tracing::warn!("AMI reconnection failed (will retry): {}", e);
            client_clone.reconnect().await;
        }
        // Sync configs after connection established
        if let Err(e) = crate::asterisk::sync_asterisk_configs(
            &pool_clone, &config_clone, &ami_clone
        ).await {
            tracing::error!("Config sync after reconnect failed: {}", e);
        }
        let _ = client_clone.listen_events().await;
    });

    {
        let mut guard = state.ami_client.write().await;
        *guard = Some(client);
    }

    Ok(Json(json!({
        "estado": true,
        "mensaje": "Reconexión AMI iniciada"
    })))
}

/// GET /api/asterisk-config/status
pub async fn estado(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Value>> {
    let guard = state.ami_client.read().await;
    let connected = match guard.as_ref() {
        Some(client) => client.is_connected(),
        None => false,
    };

    Ok(Json(json!({
        "estado": true,
        "data": {
            "conectado": connected
        }
    })))
}
