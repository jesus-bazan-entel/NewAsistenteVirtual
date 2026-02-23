use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::canal::CanalDetalle;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RegistroClave {
    pub id_registro_clave: i32,
    pub nombre: Option<String>,
    pub comentario: Option<String>,
    pub clave: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistroClaveConCanales {
    pub id_registro_clave: i32,
    pub nombre: Option<String>,
    pub comentario: Option<String>,
    pub clave: Option<String>,
    pub canales: Vec<CanalDetalle>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRegistroClave {
    pub nombre: String,
    pub comentario: String,
    pub clave: String,
    pub canales: Vec<i32>,
}
