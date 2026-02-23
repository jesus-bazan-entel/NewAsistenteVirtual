use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::ejecucion::Ejecucion;
use super::matriz::Matriz;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Prueba {
    pub id_prueba: i32,
    pub nombre: Option<String>,
    pub comentario: Option<String>,
    pub correo: Option<String>,
    pub tiempo_timbrado: Option<i32>,
    pub reintentos: Option<i32>,
    pub tipo: Option<String>,
    pub tipo_lanzamiento: Option<String>,
    pub activo: Option<String>,
    pub ejecutado: Option<String>,
    pub programacion: Option<String>,
    pub fecha_lanzamiento: Option<NaiveDate>,
    pub hora_lanzamiento: Option<NaiveTime>,
    pub dias_lanzamiento: Option<String>,
    pub id_matriz: Option<i32>,
    pub id_usuario: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PruebaConDetalles {
    pub id_prueba: i32,
    pub nombre: Option<String>,
    pub comentario: Option<String>,
    pub correo: Option<String>,
    pub tiempo_timbrado: Option<i32>,
    pub reintentos: Option<i32>,
    pub tipo: Option<String>,
    pub tipo_lanzamiento: Option<String>,
    pub activo: Option<String>,
    pub ejecutado: Option<String>,
    pub programacion: Option<String>,
    pub fecha_lanzamiento: Option<NaiveDate>,
    pub hora_lanzamiento: Option<NaiveTime>,
    pub dias_lanzamiento: Option<String>,
    pub id_matriz: Option<i32>,
    pub id_usuario: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub matriz: Option<Matriz>,
    pub ejecuciones: Vec<Ejecucion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePrueba {
    pub nombre: String,
    pub comentario: String,
    pub correo: String,
    pub tiempo_timbrado: i32,
    pub reintentos: i32,
    pub tipo_lanzamiento: String,
    pub programacion: Option<String>,
    pub fecha_lanzamiento: Option<NaiveDate>,
    pub hora_lanzamiento: Option<NaiveTime>,
    pub dias_lanzamiento: Option<String>,
    pub id_matriz: i32,
    pub id_usuario: i32,
}
