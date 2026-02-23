use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::escenario::EscenarioDetalle;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Ejecucion {
    pub id_ejecucion: i32,
    pub numero_prueba: Option<i32>,
    pub fecha_inicio: Option<DateTime<Utc>>,
    pub fecha_fin: Option<DateTime<Utc>>,
    pub estado: Option<String>,
    pub id_prueba: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EjecucionConDetalles {
    pub id_ejecucion: i32,
    pub numero_prueba: Option<i32>,
    pub fecha_inicio: Option<DateTime<Utc>>,
    pub fecha_fin: Option<DateTime<Utc>>,
    pub estado: Option<String>,
    pub id_prueba: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub prueba: Option<PruebaResumen>,
    pub escenarios: Vec<EscenarioDetalle>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PruebaResumen {
    pub id_prueba: i32,
    pub nombre: Option<String>,
    pub nombre_matriz: Option<String>,
    pub correo: Option<String>,
}
