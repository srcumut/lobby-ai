use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::schemas::lobby::{CreateLobbyRequest, LobbyResponse, JoinLobbyRequest, JoinRequestResponse};
use crate::services::lobby_service;
use crate::state::SharedState;

pub async fn create_lobby(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Json(request): Json<CreateLobbyRequest>,
) -> Result<Json<LobbyResponse>, AppError> {
    request
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let response = lobby_service::create_lobby(&state, auth.user_id, request).await?;
    Ok(Json(response))
}

pub async fn list_lobbies(
    State(state): State<SharedState>,
    _auth: AuthenticatedUser,
) -> Result<Json<Vec<LobbyResponse>>, AppError> {
    let response = lobby_service::list_lobbies(&state).await?;
    Ok(Json(response))
}

pub async fn get_lobby(
    State(state): State<SharedState>,
    _auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
) -> Result<Json<LobbyResponse>, AppError> {
    let response = lobby_service::get_lobby(&state, lobby_id).await?;
    Ok(Json(response))
}

pub async fn join_lobby(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
    request: Option<Json<JoinLobbyRequest>>,
) -> Result<Json<serde_json::Value>, AppError> {
    if let Some(ref req) = request {
        req.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    }
    
    let result = lobby_service::join_lobby(&state, auth.user_id, lobby_id, request.map(|r| r.0)).await?;
    
    match result {
        lobby_service::JoinResult::Joined => {
            Ok(Json(serde_json::json!({ "message": "Joined lobby successfully" })))
        },
        lobby_service::JoinResult::RequestPending => {
            Ok(Json(serde_json::json!({ "message": "Join request submitted and is pending approval" })))
        }
    }
}

pub async fn leave_lobby(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    lobby_service::leave_lobby(&state, auth.user_id, lobby_id).await?;
    Ok(Json(
        serde_json::json!({ "message": "Left lobby successfully" }),
    ))
}

pub async fn list_requests(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
) -> Result<Json<Vec<JoinRequestResponse>>, AppError> {
    let requests = lobby_service::list_join_requests(&state, lobby_id, auth.user_id).await?;
    Ok(Json(requests))
}


pub async fn add_bot_to_lobby(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
    Json(payload): Json<crate::schemas::lobby::AddBotRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    lobby_service::add_bot_to_lobby(&state, lobby_id, auth.user_id, payload.bot_user_id).await?;
    Ok(Json(serde_json::json!({"status": "success", "lobby_id": lobby_id, "bot_user_id": payload.bot_user_id})))
}

pub async fn initiate_agent_chat(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, agent_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<crate::schemas::message::MessageResponse>, AppError> {
    let msg = crate::services::ai_service::initiate_agent_chat(&state, lobby_id, agent_id, auth.user_id).await?;
    Ok(Json(msg))
}

pub async fn approve_request(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    lobby_service::approve_request(&state, lobby_id, auth.user_id, user_id).await?;
    Ok(Json(serde_json::json!({ "message": "Request approved" })))
}

pub async fn reject_request(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    lobby_service::reject_request(&state, lobby_id, auth.user_id, user_id).await?;
    Ok(Json(serde_json::json!({ "message": "Request rejected" })))
}

pub async fn invite_user(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
    Json(payload): Json<crate::schemas::lobby::InviteUserRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    lobby_service::invite_user(
        &state,
        lobby_id,
        auth.user_id,
        payload.username.as_deref(),
        payload.user_id,
    )
    .await?;
    Ok(Json(serde_json::json!({ "message": "Invitation sent successfully" })))
}

pub async fn get_members(
    State(state): State<SharedState>,
    _auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
) -> Result<Json<Vec<crate::schemas::lobby::LobbyMemberResponse>>, AppError> {
    let members = crate::repositories::lobby_repository::get_members(&state.db, lobby_id).await?;
    Ok(Json(members))
}

pub async fn get_banned_users(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
) -> Result<Json<Vec<crate::schemas::lobby::BannedUserResponse>>, AppError> {
    // Only owner/moderator can see bans
    let role = crate::repositories::lobby_repository::get_member_role(&state.db, lobby_id, auth.user_id).await?;
    if role.as_deref() != Some(crate::schemas::lobby::ROLE_OWNER) && role.as_deref() != Some(crate::schemas::lobby::ROLE_MODERATOR) {
        return Err(AppError::Forbidden("You don't have permission to view bans".to_string()));
    }
    
    let bans = crate::repositories::moderation_repository::get_banned_users(&state.db, lobby_id).await?;
    Ok(Json(bans))
}

pub async fn update_lobby(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
    Json(req): Json<crate::schemas::lobby::UpdateLobbyRequest>,
) -> Result<Json<crate::schemas::lobby::LobbyResponse>, AppError> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let role = crate::repositories::lobby_repository::get_member_role(&state.db, lobby_id, auth.user_id).await?;
    if role.as_deref() != Some(crate::schemas::lobby::ROLE_OWNER) {
        return Err(AppError::Forbidden("Only the lobby owner can update settings".to_string()));
    }
    
    let updated = crate::repositories::lobby_repository::update_lobby(
        &state.db, 
        lobby_id, 
        req.name.as_deref(), 
        req.description.as_deref()
    ).await?;
    
    let member_count = crate::repositories::lobby_repository::get_member_count(&state.db, lobby_id).await?;
    
    Ok(Json(crate::schemas::lobby::LobbyResponse {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        owner_id: updated.owner_id,
        visibility: updated.visibility,
        member_count,
        created_at: updated.created_at,
    }))
}

pub async fn update_notification_preference(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(lobby_id): axum::extract::Path<Uuid>,
    Json(payload): Json<crate::schemas::lobby::UpdateNotificationPreferenceRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    lobby_service::update_notification_preference(&state, lobby_id, auth.user_id, &payload.preference).await?;
    Ok(Json(serde_json::json!({ "message": "Notification preference updated", "preference": payload.preference })))
}

pub async fn get_notification_preference(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(lobby_id): axum::extract::Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let preference = lobby_service::get_notification_preference(&state, lobby_id, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "preference": preference })))
}
