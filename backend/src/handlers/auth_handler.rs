use std::net::SocketAddr;

use axum::extract::ConnectInfo;
use axum::{extract::State, Json};
use validator::Validate;

use crate::errors::AppError;
use crate::schemas::auth::{AuthResponse, LoginRequest, RefreshRequest, RegisterRequest};
use crate::services::auth_service;
use crate::state::SharedState;

pub async fn register(
    State(state): State<SharedState>,
    Json(request): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    request
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let response = auth_service::register(&state, request).await?;
    Ok(Json(response))
}

pub async fn login(
    State(state): State<SharedState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Rate limit check
    state.login_rate_limiter.check(&addr.ip().to_string())?;

    request
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let response = auth_service::login(&state, request).await?;
    Ok(Json(response))
}

pub async fn refresh(
    State(state): State<SharedState>,
    Json(request): Json<RefreshRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let response = auth_service::refresh(&state, request).await?;
    Ok(Json(response))
}

/// Phase 1: Logout is client-side only (clear tokens).
/// No server-side token revocation/blacklist in this phase.
pub async fn logout() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "message": "Logged out successfully" }))
}
