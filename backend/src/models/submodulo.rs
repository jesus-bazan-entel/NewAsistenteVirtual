use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Submodulo {
    pub id_submodulo: i32,
    pub nombre: Option<String>,
    pub ruta: Option<String>,
    pub icono: Option<String>,
    pub id_modulo: Option<i32>,
}
