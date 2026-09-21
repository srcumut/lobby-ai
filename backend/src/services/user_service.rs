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
        request.first_name.as_deref(),
        request.last_name.as_deref(),
        request.avatar_url.as_deref(),
        request.banner_url.as_deref(),
        request.bio.as_deref(),
        request.badges.as_deref(),
    )
    .await?;

    Ok(UserInfo {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        bio: user.bio,
        badges: user.badges,
        coins: user.coins,
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
                crate::services::upload_service::delete_local_avatar_file(&old_avatar).await;
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
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        bio: user.bio,
        badges: user.badges,
        coins: user.coins,
        is_bot: user.is_bot,
        created_at: user.created_at,
    })
}

pub async fn update_banner(
    state: &SharedState,
    user_id: Uuid,
    banner_url: Option<String>,
) -> Result<UserInfo, AppError> {
    let user = user_repository::update_banner(
        &state.db,
        user_id,
        banner_url.as_deref(),
    )
    .await?;

    Ok(UserInfo {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        bio: user.bio,
        badges: user.badges,
        coins: user.coins,
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

    let (public_bio, owner_username) = if user.is_bot {
        let row: Option<(Option<String>, Option<String>)> = sqlx::query_as(
            r#"
            SELECT a.public_bio, u.username as owner_username
            FROM agents a
            LEFT JOIN users u ON a.owner_id = u.id
            WHERE a.user_id = $1
            LIMIT 1
            "#,
        )
        .bind(user.id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

        row.unwrap_or((None, None))
    } else {
        (None, None)
    };

    Ok(crate::schemas::auth::PublicUserProfile {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        bio: user.bio,
        badges: user.badges,
        coins: user.coins,
        is_bot: user.is_bot,
        created_at: user.created_at,
        public_bio,
        owner_username,
    })
}

pub async fn send_friend_request(
    state: &SharedState,
    sender_id: Uuid,
    payload: FriendRequestPayload,
) -> Result<FriendRequestResponse, AppError> {
    // Cannot send request to yourself (enforced in repo, but good to check here)
    let target_user = user_repository::find_by_username(&state.db, &payload.username)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;
        
    if target_user.id == sender_id {
        return Err(AppError::BadRequest("Cannot send a friend request to yourself".to_string()));
    }
    
    // Prevent bots from being added as friends or sending friend requests? 
    // Wait, the user said nothing about bots, but it's safe to allow it or not. Let's just let it be.

    let req = user_repository::create_friend_request(&state.db, sender_id, target_user.id).await?;
    
    // Notify the target user about the incoming friend request
    if let Ok(Some(sender)) = user_repository::find_by_id(&state.db, sender_id).await {
        let sender_name = sender.display_name.as_deref().unwrap_or(&sender.username);
        let _ = crate::services::notification_service::create_notification(
            state,
            target_user.id,
            "FRIEND_REQUEST",
            "Yeni Arkadaşlık İsteği",
            &format!("{} size arkadaşlık isteği gönderdi.", sender_name),
            Some(req.id),
        ).await;
    }

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
    
    user_repository::update_friend_request_status(&state.db, request_id, "ACCEPTED").await?;

    // Notify the original sender that their request was accepted
    if let Ok(Some(receiver)) = user_repository::find_by_id(&state.db, user_id).await {
        let receiver_name = receiver.display_name.as_deref().unwrap_or(&receiver.username);
        let _ = crate::services::notification_service::create_notification(
            state,
            req.sender_id,
            "FRIEND_REQUEST_ACCEPTED",
            "Arkadaşlık İsteği Kabul Edildi",
            &format!("{} arkadaşlık isteğinizi kabul etti.", receiver_name),
            Some(user_id),
        ).await;
    }

    Ok(())
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
    
    // As per user requirement: "REJECTED durumunu DB'de kalıcı olarak tutmaya şu aşamada gerek yok. Reject edildiğinde request silinebilir."
    user_repository::delete_friend_request(&state.db, request_id).await
}

pub async fn remove_friend(
    state: &SharedState,
    user_id: Uuid,
    friend_id: Uuid,
) -> Result<(), AppError> {
    // Find the accepted request between these two users
    let friends = user_repository::get_friends(&state.db, user_id).await?;
    let is_friend = friends.iter().any(|f| f.id == friend_id);
    
    if !is_friend {
        return Err(AppError::NotFound("Friend not found".to_string()));
    }
    
    // We need the request ID. Actually, we can just delete by sender/receiver pair.
    // Let's execute a direct query to delete the relationship
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

pub async fn unlock_badge(
    state: &SharedState,
    user_id: Uuid,
    badge: &str,
) -> Result<UserInfo, AppError> {
    let user = user_repository::unlock_badge(&state.db, user_id, badge).await?;
    Ok(UserInfo {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        bio: user.bio,
        badges: user.badges,
        is_bot: user.is_bot,
        coins: user.coins,
        created_at: user.created_at,
    })
}

pub async fn add_coins(
    state: &SharedState,
    user_id: Uuid,
    amount: i32,
) -> Result<i32, AppError> {
    user_repository::add_coins(&state.db, user_id, amount).await
}

pub async fn purchase_shop_item(
    state: &SharedState,
    user_id: Uuid,
    item_id: &str,
    item_type: &str,
    price: i32,
) -> Result<i32, AppError> {
    user_repository::purchase_shop_item(&state.db, user_id, item_id, item_type, price).await
}

pub async fn get_inventory(
    state: &SharedState,
    user_id: Uuid,
) -> Result<Vec<String>, AppError> {
    user_repository::get_inventory(&state.db, user_id).await
}


