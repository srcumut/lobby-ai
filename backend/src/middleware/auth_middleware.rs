use axum::{extract::FromRequestParts, http::request::Parts};
use uuid::Uuid;

use crate::auth::jwt;
use crate::errors::AppError;
use crate::state::SharedState;

/// Extracted from the `Authorization: Bearer <token>` header.
/// Use this as an extractor in handler function signatures to require authentication.
#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: Uuid,
}

impl FromRequestParts<SharedState> for AuthenticatedUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &SharedState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Missing authorization header".to_string()))?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| AppError::Unauthorized("Invalid authorization format".to_string()))?;

        let claims = jwt::validate_token(token, &state.config.jwt_access_secret)?;

        Ok(Self {
            user_id: claims.sub,
        })
    }
}
