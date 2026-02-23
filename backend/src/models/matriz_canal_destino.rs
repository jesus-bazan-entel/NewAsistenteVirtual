use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::canal::CanalDetalle;
use super::numero_externo::NumeroExterno;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MatrizCanalDestino {
    pub id_matriz_canal_destino: i32,
    pub id_matriz: i32,
    pub id_canal_origen: i32,
    pub id_canal_destino: Option<i32>,
    pub id_numero_externo_destino: Option<i32>,
    pub tipo: String,
    pub estado: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrizCanalDestinoDetalle {
    pub id_matriz_canal_destino: i32,
    pub id_matriz: i32,
    pub id_canal_origen: i32,
    pub id_canal_destino: Option<i32>,
    pub id_numero_externo_destino: Option<i32>,
    pub tipo: String,
    pub estado: String,
    pub canal_origen: Option<CanalDetalle>,
    pub canal_destino: Option<CanalDetalle>,
    pub numero_externo: Option<NumeroExterno>,
}
