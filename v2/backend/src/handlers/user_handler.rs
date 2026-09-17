// ============================================================================
// TARGET_DESTINATION: backend/src/handlers/user_handler.rs
// PURPOSE: User HTTP handlers including profile updates and avatar upload/deletion
// ============================================================================

use axum::{
    extract::{Multipart, State},
    Json,
};
use validator::Validate;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::repositories::user_repository;
use crate::schemas::auth::{UpdateProfileRequest, UserInfo};
use crate::schemas::user::{FriendRequestPayload, FriendRequestResponse, IncomingFriendRequest};
use crate::services::{upload_service, user_service};
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
        is_bot: user.is_bot,
        created_at: user.created_at,
    }))
}

pub async fn get_public_profile(
    State(state): State<SharedState>,
    axum::extract::Path(user_id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<crate::schemas::auth::PublicUserProfile>, AppError> {
    let profile = user_service::get_public_profile(&state, user_id).await?;
    Ok(Json(profile))
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

pub async fn upload_my_avatar(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    multipart: Multipart,
) -> Result<Json<UserInfo>, AppError> {
    let avatar_url = upload_service::save_avatar_file(multipart).await?;
    let updated_user = user_service::update_avatar(&state, auth.user_id, Some(avatar_url)).await?;
    Ok(Json(updated_user))
}

pub async fn delete_my_avatar(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<UserInfo>, AppError> {
    let updated_user = user_service::update_avatar(&state, auth.user_id, None).await?;
    Ok(Json(updated_user))
}

pub async fn send_friend_request(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Json(payload): Json<FriendRequestPayload>,
) -> Result<Json<FriendRequestResponse>, AppError> {
    let resp = user_service::send_friend_request(&state, auth.user_id, payload).await?;
    Ok(Json(resp))
}

pub async fn get_pending_incoming_requests(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<IncomingFriendRequest>>, AppError> {
    let reqs = user_service::get_pending_incoming_requests(&state, auth.user_id).await?;
    Ok(Json(reqs))
}

pub async fn accept_friend_request(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(request_id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    user_service::accept_friend_request(&state, auth.user_id, request_id).await?;
    Ok(Json(serde_json::json!({ "message": "Friend request accepted" })))
}

pub async fn reject_friend_request(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(request_id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    user_service::reject_friend_request(&state, auth.user_id, request_id).await?;
    Ok(Json(serde_json::json!({ "message": "Friend request rejected" })))
}

pub async fn remove_friend(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(friend_id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    user_service::remove_friend(&state, auth.user_id, friend_id).await?;
    Ok(Json(serde_json::json!({ "message": "Friend removed" })))
}

pub async fn get_friends(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<UserInfo>>, AppError> {
    let friends = user_service::get_friends(&state, auth.user_id).await?;
    Ok(Json(friends))
}
