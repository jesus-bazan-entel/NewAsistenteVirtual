use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::operador_telefonico::OperadorTelefonico;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tecnologia {
    pub id_tecnologia: i32,
    pub nombre: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TecnologiaConOperadores {
    pub id_tecnologia: i32,
    pub nombre: Option<String>,
    pub operadores: Vec<OperadorTelefonico>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTecnologia {
    pub nombre: String,
}
