use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ErrorCode {
    pub id_error: i32,
    pub codigo: Option<String>,
    pub estado: Option<String>,
    pub mensaje: Option<String>,
}
