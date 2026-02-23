use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PerfilSubmodulo {
    pub id_perfil: i32,
    pub id_submodulo: i32,
}
