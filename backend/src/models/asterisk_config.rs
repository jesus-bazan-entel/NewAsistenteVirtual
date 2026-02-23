use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AsteriskConfig {
    pub id: i32,
    pub host: String,
    pub puerto: i32,
    pub usuario: String,
    pub clave: String,
    pub entorno: String,
    pub activo: bool,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAsteriskConfig {
    pub host: String,
    pub puerto: i32,
    pub usuario: String,
    pub clave: String,
    pub entorno: String,
    pub activo: bool,
}
