use std::sync::Arc;

use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
};

use crate::AppState;
use crate::error::AppError;

use super::jwt::validate_token;

/// Authenticated user extracted from the `Authorization: Bearer <token>` header.
///
/// Use this as an Axum extractor: any handler that declares `AuthUser` as a
/// parameter will automatically require a valid JWT.
///
/// ```rust,ignore
/// async fn protected(auth: AuthUser) -> impl IntoResponse {
///     format!("Hello user {}", auth.user_id)
/// }
/// ```
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: i32,
    pub correo: String,
    pub id_perfil: i32,
}

#[async_trait]
impl FromRequestParts<Arc<AppState>> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        // Extract the Authorization header value.
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| {
                AppError::Unauthorized("Token de autorización no proporcionado".to_string())
            })?;

        // Expect "Bearer <token>" format.
        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| {
                AppError::Unauthorized("Formato de token inválido".to_string())
            })?;

        // Validate the JWT and extract claims.
        let claims = validate_token(token, &state.config.jwt_secret).map_err(|_| {
            AppError::Unauthorized("Token inválido o expirado".to_string())
        })?;

        Ok(AuthUser {
            user_id: claims.sub,
            correo: claims.correo,
            id_perfil: claims.id_perfil,
        })
    }
}
