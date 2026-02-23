use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::submodulo::Submodulo;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Perfil {
    pub id_perfil: i32,
    pub nombre: Option<String>,
    pub descripcion: Option<String>,
    pub estado: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerfilConSubmodulos {
    pub id_perfil: i32,
    pub nombre: Option<String>,
    pub descripcion: Option<String>,
    pub estado: Option<String>,
    pub submodulos: Vec<Submodulo>,
    pub usuarios: Vec<UsuarioResumen>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePerfil {
    pub nombre: String,
    pub descripcion: String,
    pub submodulos: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePerfil {
    pub nombre: String,
    pub descripcion: String,
    pub submodulos: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UsuarioResumen {
    pub id_usuario: i32,
    pub nombres: Option<String>,
    pub apellidos: Option<String>,
}
