use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NumeroExterno {
    pub id_numero_externo: i32,
    pub nombre: Option<String>,
    pub comentario: Option<String>,
    pub numero: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNumeroExterno {
    pub nombre: String,
    pub comentario: String,
    pub numero: String,
}
