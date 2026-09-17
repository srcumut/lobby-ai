// ============================================================================
// TARGET_DESTINATION: backend/src/services/user_service.rs
// PURPOSE: User business logic including updating/removing avatars and friendship operations
// ============================================================================

use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::user_repository;
use crate::schemas::auth::{UpdateProfileRequest, UserInfo};
use crate::schemas::user::{FriendRequestPayload, FriendRequestResponse, IncomingFriendRequest};
use crate::state::SharedState;

pub async fn update_profile(
    state: &SharedState,
    user_id: Uuid,
    request: UpdateProfileRequest,
) -> Result<UserInfo, AppError> {
    let user = user_repository::update_profile(
        &state.db,
        user_id,
        request.display_name.as_deref(),
        request.avatar_url.as_deref(),
        request.bio.as_deref(),
    )
    .await?;

    Ok(UserInfo {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        is_bot: user.is_bot,
        created_at: user.created_at,
    })
}

pub async fn update_avatar(
    state: &SharedState,
    user_id: Uuid,
    avatar_url: Option<String>,
) -> Result<UserInfo, AppError> {
    if let Ok(Some(existing_user)) = user_repository::find_by_id(&state.db, user_id).await {
        if let Some(old_avatar) = existing_user.avatar_url {
            if avatar_url.as_deref() != Some(&old_avatar) {
                upload_service::delete_local_avatar_file(&old_avatar).await;
            }
        }
    }

    let user = user_repository::update_avatar(
        &state.db,
        user_id,
        avatar_url.as_deref(),
    )
    .await?;

    Ok(UserInfo {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        is_bot: user.is_bot,
        created_at: user.created_at,
    })
}

pub async fn get_public_profile(
    state: &SharedState,
    user_id: Uuid,
) -> Result<crate::schemas::auth::PublicUserProfile, AppError> {
    let user = user_repository::find_by_id(&state.db, user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(crate::schemas::auth::PublicUserProfile {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        is_bot: user.is_bot,
        created_at: user.created_at,
    })
}

pub async fn send_friend_request(
    state: &SharedState,
    sender_id: Uuid,
    payload: FriendRequestPayload,
) -> Result<FriendRequestResponse, AppError> {
    let target_user = user_repository::find_by_username(&state.db, &payload.username)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
        
    if target_user.id == sender_id {
        return Err(AppError::BadRequest("Cannot send a friend request to yourself".to_string()));
    }

    let req = user_repository::create_friend_request(&state.db, sender_id, target_user.id).await?;
    
    Ok(FriendRequestResponse {
        id: req.id,
        sender_id: req.sender_id,
        receiver_id: req.receiver_id,
        status: req.status,
        created_at: req.created_at,
    })
}

pub async fn get_pending_incoming_requests(
    state: &SharedState,
    user_id: Uuid,
) -> Result<Vec<IncomingFriendRequest>, AppError> {
    user_repository::get_pending_incoming_requests(&state.db, user_id).await
}

pub async fn accept_friend_request(
    state: &SharedState,
    user_id: Uuid,
    request_id: Uuid,
) -> Result<(), AppError> {
    let req = user_repository::get_friend_request(&state.db, request_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Friend request not found".to_string()))?;
        
    if req.receiver_id != user_id {
        return Err(AppError::Forbidden("You are not authorized to accept this request".to_string()));
    }
    
    if req.status != "PENDING" {
        return Err(AppError::BadRequest("Request is not pending".to_string()));
    }
    
    user_repository::update_friend_request_status(&state.db, request_id, "ACCEPTED").await
}

pub async fn reject_friend_request(
    state: &SharedState,
    user_id: Uuid,
    request_id: Uuid,
) -> Result<(), AppError> {
    let req = user_repository::get_friend_request(&state.db, request_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Friend request not found".to_string()))?;
        
    if req.receiver_id != user_id {
        return Err(AppError::Forbidden("You are not authorized to reject this request".to_string()));
    }
    
    user_repository::delete_friend_request(&state.db, request_id).await
}

pub async fn remove_friend(
    state: &SharedState,
    user_id: Uuid,
    friend_id: Uuid,
) -> Result<(), AppError> {
    let friends = user_repository::get_friends(&state.db, user_id).await?;
    let is_friend = friends.iter().any(|f| f.id == friend_id);
    
    if !is_friend {
        return Err(AppError::NotFound("Friend not found".to_string()));
    }
    
    sqlx::query!(
        "DELETE FROM friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)",
        user_id, friend_id
    )
    .execute(&state.db)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    Ok(())
}

pub async fn get_friends(
    state: &SharedState,
    user_id: Uuid,
) -> Result<Vec<UserInfo>, AppError> {
    user_repository::get_friends(&state.db, user_id).await
}
