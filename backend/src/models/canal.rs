use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Canal {
    pub id_canal: i32,
    pub id_tecnologia_operador: Option<i32>,
    pub id_equipo: Option<i32>,
    pub estado: Option<String>,
    pub nro_ranura: Option<i32>,
    pub numero: Option<String>,
    pub posicion: Option<i32>,
    pub estado_llamada: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CanalDetalle {
    pub id_canal: i32,
    pub id_tecnologia_operador: Option<i32>,
    pub id_equipo: Option<i32>,
    pub estado: Option<String>,
    pub nro_ranura: Option<i32>,
    pub numero: Option<String>,
    pub posicion: Option<i32>,
    pub estado_llamada: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub nombre_tecnologia: Option<String>,
    pub nombre_operador: Option<String>,
    pub nombre_equipo: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EquipoBasic {
    pub id_equipo: i32,
    pub nombre: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanalConEquipo {
    pub id_canal: i32,
    pub id_tecnologia_operador: Option<i32>,
    pub id_equipo: Option<i32>,
    pub estado: Option<String>,
    pub nro_ranura: Option<i32>,
    pub numero: Option<String>,
    pub posicion: Option<i32>,
    pub estado_llamada: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub equipo: Option<EquipoBasic>,
}
