use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

mod auth;
mod asterisk;
mod config;
mod db;
mod error;
mod models;
mod routes;
mod scheduler;
mod services;
mod ws;

use config::Config;
use asterisk::AmiClient;

pub type SharedAmiClient = Arc<RwLock<Option<Arc<AmiClient>>>>;

pub struct AppState {
    pub pool: sqlx::PgPool,
    pub config: Config,
    pub ws_broadcast: broadcast::Sender<String>,
    pub ami_client: SharedAmiClient,
}

#[tokio::main]
async fn main() {
    // Load .env file
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,sqlx=warn".into()),
        )
        .init();

    let config = Config::from_env();
    let port = config.port;

    // Connect to database
    tracing::info!("Connecting to PostgreSQL...");
    let pool = db::create_pool(&config.database_url).await;

    // Run migrations
    tracing::info!("Running migrations...");
    db::run_migrations(&pool).await;

    // WebSocket broadcast channel
    let (ws_tx, _) = broadcast::channel::<String>(256);

    // Initialize Asterisk AMI client (non-blocking, app works without it)
    let ami_client: Option<Arc<AmiClient>> = if !config.asterisk_host.is_empty() {
        tracing::info!("Initializing Asterisk AMI connection to {}:{}...", config.asterisk_host, config.asterisk_port);
        let client = Arc::new(AmiClient::new(
            config.asterisk_host.clone(),
            config.asterisk_port,
            config.asterisk_user.clone(),
            config.asterisk_password.clone(),
            pool.clone(),
            ws_tx.clone(),
        ));
        let client_clone = client.clone();
        let startup_pool = pool.clone();
        let startup_config = config.clone();
        tokio::spawn(async move {
            if let Err(e) = client_clone.connect().await {
                tracing::warn!("Initial AMI connection failed (will retry): {}", e);
                client_clone.reconnect().await;
            }
            // Sync configs on startup (write files + reload)
            // We build a temporary SharedAmiClient for the sync call
            let tmp_ami: crate::SharedAmiClient =
                Arc::new(RwLock::new(Some(client_clone.clone())));
            if let Err(e) = asterisk::sync_asterisk_configs(
                &startup_pool, &startup_config, &tmp_ami
            ).await {
                tracing::error!("Initial config sync failed: {}", e);
            }
            client_clone.listen_events().await;
        });
        Some(client)
    } else {
        tracing::info!("Asterisk AMI not configured, skipping");
        None
    };

    // Wrap AMI client in shared lock for dynamic reconnection
    let shared_ami: SharedAmiClient = Arc::new(RwLock::new(ami_client));

    // Start scheduled test runner
    let _scheduler_handle = scheduler::start_scheduler(pool.clone(), shared_ami.clone());
    tracing::info!("Scheduler started (10s interval)");

    // Create shared state
    let state = Arc::new(AppState {
        pool,
        config,
        ws_broadcast: ws_tx,
        ami_client: shared_ami,
    });

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = routes::create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("Server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
