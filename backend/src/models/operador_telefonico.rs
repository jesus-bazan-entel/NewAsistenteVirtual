use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::tecnologia::Tecnologia;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OperadorTelefonico {
    pub id_operador_telefonico: i32,
    pub nombre: Option<String>,
    pub codigo: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperadorConTecnologias {
    pub id_operador_telefonico: i32,
    pub nombre: Option<String>,
    pub codigo: Option<String>,
    pub tecnologias: Vec<Tecnologia>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOperador {
    pub nombre: String,
    pub codigo: String,
    pub tecnologias: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateOperador {
    pub nombre: String,
    pub codigo: String,
    pub tecnologias: Vec<i32>,
}
