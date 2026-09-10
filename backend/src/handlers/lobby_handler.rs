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
