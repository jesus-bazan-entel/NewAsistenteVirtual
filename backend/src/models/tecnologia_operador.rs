use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TecnologiaOperador {
    pub id_tecnologia_operador: i32,
    pub id_tecnologia: i32,
    pub id_operador_telefonico: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TecnologiaOperadorDetalle {
    pub id_tecnologia_operador: i32,
    pub id_tecnologia: i32,
    pub id_operador_telefonico: i32,
    pub nombre_tecnologia: Option<String>,
    pub nombre_operador: Option<String>,
}
