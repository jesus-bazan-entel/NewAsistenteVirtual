use std::sync::Arc;

use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::AppState;
use crate::error::{AppError, AppResult};

use super::jwt::create_token;

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub correo: String,
    pub clave: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub estado: bool,
    pub token: String,
    pub usuario: UsuarioLogin,
}

#[derive(Debug, Serialize)]
pub struct UsuarioLogin {
    pub id_usuario: i32,
    pub nombres: Option<String>,
    pub apellidos: Option<String>,
    pub id_perfil: i32,
    pub accesos: Vec<ModuloAcceso>,
}

#[derive(Debug, Serialize)]
pub struct ModuloAcceso {
    pub id_modulo: i32,
    pub nombre: Option<String>,
    pub ruta: Option<String>,
    pub icono: Option<String>,
    pub submodulos: Vec<SubmoduloAcceso>,
}

#[derive(Debug, Serialize)]
pub struct SubmoduloAcceso {
    pub id_submodulo: i32,
    pub nombre: Option<String>,
    pub ruta: Option<String>,
    pub icono: Option<String>,
}

// ---------------------------------------------------------------------------
// Internal query-row helpers (not public models)
// ---------------------------------------------------------------------------

#[derive(Debug, sqlx::FromRow)]
struct UsuarioRow {
    id_usuario: i32,
    nombres: Option<String>,
    apellidos: Option<String>,
    correo: String,
    acceso: String,
    clave: String,
    id_perfil: Option<i32>,
}

#[derive(Debug, sqlx::FromRow)]
struct SubmoduloRow {
    id_submodulo: i32,
    nombre: Option<String>,
    ruta: Option<String>,
    icono: Option<String>,
    id_modulo: Option<i32>,
}

#[derive(Debug, sqlx::FromRow)]
struct ModuloRow {
    id_modulo: i32,
    nombre: Option<String>,
    ruta: Option<String>,
    icono: Option<String>,
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

/// Authenticate a user with email + password, build the navigation menu for
/// the user's profile, and return a JWT.
///
/// Mirrors the Node.js `validarCredenciales` controller logic (without the
/// LDAP path, which will be added later).
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> AppResult<Json<LoginResponse>> {
    // 1. Find user by correo where acceso = 'A' (active).
    let usuario: UsuarioRow = sqlx::query_as::<_, UsuarioRow>(
        r#"
        SELECT id_usuario, nombres, apellidos, correo, acceso, clave, id_perfil
        FROM usuarios
        WHERE correo = $1 AND acceso = 'A'
        "#,
    )
    .bind(&payload.correo)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| {
        AppError::Unauthorized("Usuario o contraseña incorrectos".to_string())
    })?;

    // 2. Verify password with bcrypt.
    let password_valid =
        bcrypt::verify(&payload.clave, &usuario.clave).map_err(|_| {
            AppError::Internal("Error al verificar contraseña".to_string())
        })?;

    if !password_valid {
        return Err(AppError::Unauthorized(
            "Usuario o contraseña incorrectos".to_string(),
        ));
    }

    let id_perfil = usuario.id_perfil.ok_or_else(|| {
        AppError::Unauthorized("Usuario sin perfil asignado".to_string())
    })?;

    // 3. Load the submodules that belong to this profile.
    let submodulos: Vec<SubmoduloRow> = sqlx::query_as::<_, SubmoduloRow>(
        r#"
        SELECT s.id_submodulo, s.nombre, s.ruta, s.icono, s.id_modulo
        FROM submodulos s
        INNER JOIN perfiles_submodulos ps ON ps.id_submodulo = s.id_submodulo
        WHERE ps.id_perfil = $1
        ORDER BY s.id_submodulo
        "#,
    )
    .bind(id_perfil)
    .fetch_all(&state.pool)
    .await?;

    // 4. Load all modules.
    let modulos: Vec<ModuloRow> = sqlx::query_as::<_, ModuloRow>(
        r#"
        SELECT id_modulo, nombre, ruta, icono
        FROM modulos
        ORDER BY id_modulo
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    // 5. Build the navigation menu: only modules that have at least one
    //    submodule granted to the user's profile.
    let accesos: Vec<ModuloAcceso> = modulos
        .into_iter()
        .filter_map(|modulo| {
            let subs: Vec<SubmoduloAcceso> = submodulos
                .iter()
                .filter(|s| s.id_modulo == Some(modulo.id_modulo))
                .map(|s| SubmoduloAcceso {
                    id_submodulo: s.id_submodulo,
                    nombre: s.nombre.clone(),
                    ruta: s.ruta.clone(),
                    icono: s.icono.clone(),
                })
                .collect();

            if subs.is_empty() {
                None
            } else {
                Some(ModuloAcceso {
                    id_modulo: modulo.id_modulo,
                    nombre: modulo.nombre,
                    ruta: modulo.ruta,
                    icono: modulo.icono,
                    submodulos: subs,
                })
            }
        })
        .collect();

    // 6. Generate JWT.
    let token = create_token(
        usuario.id_usuario,
        &usuario.correo,
        id_perfil,
        &state.config.jwt_secret,
        state.config.jwt_expiration_hours,
    )?;

    // 7. Return response.
    Ok(Json(LoginResponse {
        estado: true,
        token,
        usuario: UsuarioLogin {
            id_usuario: usuario.id_usuario,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            id_perfil,
            accesos,
        },
    }))
}
