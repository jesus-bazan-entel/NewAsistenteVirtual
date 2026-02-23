use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Sede {
    pub id_sede: i32,
    pub nombre: Option<String>,
}
