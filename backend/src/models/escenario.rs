use chrono::{DateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Escenario {
    pub id_escenario: i32,
    pub id_ejecucion: i32,
    pub id_canal_origen: i32,
    pub id_destino: i32,
    pub tipo: String,
    pub numero_intento: Option<i32>,
    pub uniqueid_en: Option<String>,
    pub uniqueid_sal: Option<String>,
    pub estado: Option<String>,
    #[sqlx(rename = "hangupReason")]
    pub hangup_reason: Option<String>,
    pub mos: Option<String>,
    pub id_error: Option<i32>,
    pub hora_saliente: Option<NaiveTime>,
    pub hora_entrante: Option<NaiveTime>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EscenarioDetalle {
    pub id_escenario: i32,
    pub id_ejecucion: i32,
    pub id_canal_origen: i32,
    pub id_destino: i32,
    pub tipo: String,
    pub numero_intento: Option<i32>,
    pub uniqueid_en: Option<String>,
    pub uniqueid_sal: Option<String>,
    pub estado: Option<String>,
    #[sqlx(rename = "hangupReason")]
    pub hangup_reason: Option<String>,
    pub mos: Option<String>,
    pub id_error: Option<i32>,
    pub hora_saliente: Option<NaiveTime>,
    pub hora_entrante: Option<NaiveTime>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub canal_origen_numero: Option<String>,
    pub destino_numero: Option<String>,
    pub canal_origen_operador: Option<String>,
    pub destino_operador: Option<String>,
    pub error_mensaje: Option<String>,
}
