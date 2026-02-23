use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

/// JWT claims payload embedded in every token.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject – the user id (`id_usuario`).
    pub sub: i32,
    /// User email.
    pub correo: String,
    /// Profile id (`id_perfil`).
    pub id_perfil: i32,
    /// Expiration timestamp (seconds since UNIX epoch).
    pub exp: usize,
}

/// Create a signed HS256 JWT for the given user.
///
/// * `user_id`          – `id_usuario`
/// * `correo`           – user email
/// * `id_perfil`        – profile / role id
/// * `secret`           – HMAC-SHA256 signing key
/// * `expiration_hours` – token lifetime in hours
pub fn create_token(
    user_id: i32,
    correo: &str,
    id_perfil: i32,
    secret: &str,
    expiration_hours: i64,
) -> AppResult<String> {
    let expiration = Utc::now()
        .checked_add_signed(chrono::Duration::hours(expiration_hours))
        .ok_or_else(|| AppError::Internal("Error al calcular expiración del token".to_string()))?
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        correo: correo.to_string(),
        id_perfil,
        exp: expiration,
    };

    let token = encode(
        &Header::default(), // HS256
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?;

    Ok(token)
}

/// Validate and decode a JWT, returning the embedded [`Claims`].
///
/// Returns `AppError::Jwt` on any validation failure (expired, bad
/// signature, malformed, etc.).
pub fn validate_token(token: &str, secret: &str) -> AppResult<Claims> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(), // HS256, checks exp automatically
    )?;

    Ok(token_data.claims)
}
