use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Usuario {
    pub id_usuario: i32,
    pub nombres: Option<String>,
    pub apellidos: Option<String>,
    pub correo: String,
    pub acceso: String,
    pub clave: String,
    pub id_perfil: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UsuarioResponse {
    pub id_usuario: i32,
    pub nombres: Option<String>,
    pub apellidos: Option<String>,
    pub correo: String,
    pub acceso: String,
    pub id_perfil: Option<i32>,
    pub perfil_nombre: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUsuario {
    pub nombres: String,
    pub apellidos: String,
    pub correo: String,
    pub clave: String,
    pub id_perfil: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUsuario {
    pub nombres: String,
    pub apellidos: String,
    pub correo: String,
    pub clave: Option<String>,
    pub id_perfil: Option<i32>,
}
