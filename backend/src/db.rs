use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub async fn create_pool(database_url: &str) -> PgPool {
    let mut retries = 15;
    loop {
        match PgPoolOptions::new()
            .max_connections(20)
            .connect(database_url)
            .await
        {
            Ok(pool) => {
                tracing::info!("Connected to PostgreSQL");
                return pool;
            }
            Err(e) => {
                retries -= 1;
                if retries == 0 {
                    panic!("Failed to connect to database after 15 retries: {}", e);
                }
                tracing::warn!(
                    "Failed to connect to database (retries left: {}): {}",
                    retries,
                    e
                );
                tokio::time::sleep(std::time::Duration::from_secs(3)).await;
            }
        }
    }
}

pub async fn run_migrations(pool: &PgPool) {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await
        .expect("Failed to run database migrations");
    tracing::info!("Database migrations completed");
}
