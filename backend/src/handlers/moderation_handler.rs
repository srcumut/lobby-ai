use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::models::lobby::{LobbyBan, LobbyMember, LobbyMute};
use crate::schemas::lobby::{MuteUserRequest, RoleUpdateRequest};
use crate::services::moderation_service;
use crate::state::SharedState;

pub async fn kick_user(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<()>, AppError> {
    moderation_service::kick_user(&state, lobby_id, auth.user_id, user_id).await?;
    Ok(Json(()))
}

pub async fn ban_user(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<LobbyBan>, AppError> {
    let ban = moderation_service::ban_user(&state, lobby_id, auth.user_id, user_id).await?;
    Ok(Json(ban))
}

pub async fn unban_user(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<()>, AppError> {
    moderation_service::unban_user(&state, lobby_id, auth.user_id, user_id).await?;
    Ok(Json(()))
}

pub async fn mute_user(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<MuteUserRequest>,
) -> Result<Json<LobbyMute>, AppError> {
    request.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let mute = moderation_service::mute_user(
        &state,
        lobby_id,
        auth.user_id,
        user_id,
        request.duration_minutes,
    )
    .await?;
    
    Ok(Json(mute))
}

pub async fn unmute_user(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<()>, AppError> {
    moderation_service::unmute_user(&state, lobby_id, auth.user_id, user_id).await?;
    Ok(Json(()))
}

pub async fn set_role(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<RoleUpdateRequest>,
) -> Result<Json<LobbyMember>, AppError> {
    request.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let member = moderation_service::set_role(
        &state,
        lobby_id,
        auth.user_id,
        user_id,
        &request.role,
    )
    .await?;
    
    Ok(Json(member))
}
