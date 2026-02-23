use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::matriz_canal_destino::MatrizCanalDestinoDetalle;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Matriz {
    pub id_matriz: i32,
    pub nombre: Option<String>,
    pub estado: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrizConConexiones {
    pub id_matriz: i32,
    pub nombre: Option<String>,
    pub estado: Option<bool>,
    pub conexiones: Vec<MatrizCanalDestinoDetalle>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMatriz {
    pub nombre: String,
    pub matriz_data: Vec<CreateMatrizCanalDestino>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMatrizCanalDestino {
    pub id_canal_origen: i32,
    pub id_canal_destino: Option<i32>,
    pub id_numero_externo_destino: Option<i32>,
    pub tipo: String,
}
