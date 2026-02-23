use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::submodulo::Submodulo;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Modulo {
    pub id_modulo: i32,
    pub nombre: Option<String>,
    pub ruta: Option<String>,
    pub icono: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuloConSubmodulos {
    pub id_modulo: i32,
    pub nombre: Option<String>,
    pub ruta: Option<String>,
    pub icono: Option<String>,
    pub submodulos: Vec<Submodulo>,
}
