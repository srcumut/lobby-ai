use axum::{extract::State, Json};

use validator::Validate;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::repositories::user_repository;
use crate::schemas::auth::{UpdateProfileRequest, UserInfo};
use crate::services::user_service;
use crate::state::SharedState;

pub async fn get_me(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<UserInfo>, AppError> {
    let user = user_repository::find_by_id(&state.db, auth.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(UserInfo {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at,
    }))
}

pub async fn update_profile(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Json(request): Json<UpdateProfileRequest>,
) -> Result<Json<UserInfo>, AppError> {
    request
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let response = user_service::update_profile(&state, auth.user_id, request).await?;
    Ok(Json(response))
}
