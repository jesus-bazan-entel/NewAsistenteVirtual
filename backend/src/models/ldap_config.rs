use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LdapConfig {
    pub id: i32,
    pub nombre: String,
    pub data: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateLdapConfig {
    pub nombre: String,
    pub data: String,
}
