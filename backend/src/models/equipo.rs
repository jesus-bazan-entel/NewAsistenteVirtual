use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::canal::CanalDetalle;
use super::sede::Sede;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Equipo {
    pub id_equipo: i32,
    pub nombre: Option<String>,
    pub ip: Option<String>,
    pub tipo: Option<String>,
    pub ranuras: Option<String>,
    pub id_sede: Option<i32>,
    pub estado: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquipoConDetalles {
    pub id_equipo: i32,
    pub nombre: Option<String>,
    pub ip: Option<String>,
    pub tipo: Option<String>,
    pub ranuras: Option<String>,
    pub id_sede: Option<i32>,
    pub estado: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub canales: Vec<CanalDetalle>,
    pub sede: Option<Sede>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEquipo {
    pub nombre: String,
    pub ip: String,
    pub tipo: String,
    pub ranuras: String,
    pub id_sede: Option<i32>,
    pub canales: Vec<CreateCanalEquipo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCanalEquipo {
    pub id_tecnologia: i32,
    pub id_operador: i32,
    pub nro_ranura: Option<i32>,
    pub numero: Option<String>,
    pub posicion: Option<i32>,
    pub id_canal: Option<i32>,
}
