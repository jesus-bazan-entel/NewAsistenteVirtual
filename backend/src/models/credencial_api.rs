use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CredencialApi {
    pub id_credencial_api: i32,
    pub nombre: Option<String>,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub estado: Option<String>,
}
