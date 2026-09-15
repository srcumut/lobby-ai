use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::lobby_repository;
use crate::schemas::lobby::{CreateLobbyRequest, LobbyResponse};
use crate::state::SharedState;

pub async fn create_lobby(
    state: &SharedState,
    user_id: Uuid,
    request: CreateLobbyRequest,
) -> Result<LobbyResponse, AppError> {
    let visibility = if request.is_private.unwrap_or(false) {
        "PRIVATE"
    } else {
        "PUBLIC"
    };

    let password_hash = match &request.password {
        Some(pwd) => Some(crate::auth::password::hash_password(pwd)?),
        None => None,
    };

    let lobby = lobby_repository::create_lobby(
        &state.db,
        &request.name,
        request.description.as_deref(),
        user_id,
        visibility,
        password_hash.as_deref(),
    )
    .await?;

    // Add creator as OWNER member
    lobby_repository::add_member(&state.db, lobby.id, user_id, "OWNER").await?;

    Ok(LobbyResponse {
        id: lobby.id,
        name: lobby.name,
        description: lobby.description,
        owner_id: lobby.owner_id,
        visibility: lobby.visibility,
        member_count: 1,
        created_at: lobby.created_at,
    })
}

pub async fn list_lobbies(state: &SharedState) -> Result<Vec<LobbyResponse>, AppError> {
    let lobbies = lobby_repository::list_public_lobbies(&state.db).await?;

    let mut responses = Vec::with_capacity(lobbies.len());
    for lobby in lobbies {
        let member_count = lobby_repository::get_member_count(&state.db, lobby.id).await?;
        responses.push(LobbyResponse {
            id: lobby.id,
            name: lobby.name,
            description: lobby.description,
            owner_id: lobby.owner_id,
            visibility: lobby.visibility,
            member_count,
            created_at: lobby.created_at,
        });
    }

    Ok(responses)
}

pub async fn get_lobby(state: &SharedState, lobby_id: Uuid) -> Result<LobbyResponse, AppError> {
    let lobby = lobby_repository::find_by_id(&state.db, lobby_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Lobby not found".to_string()))?;

    let member_count = lobby_repository::get_member_count(&state.db, lobby.id).await?;

    Ok(LobbyResponse {
        id: lobby.id,
        name: lobby.name,
        description: lobby.description,
        owner_id: lobby.owner_id,
        visibility: lobby.visibility,
        member_count,
        created_at: lobby.created_at,
    })
}

pub enum JoinResult {
    Joined,
    RequestPending,
}

pub async fn join_lobby(
    state: &SharedState,
    user_id: Uuid,
    lobby_id: Uuid,
    request: Option<crate::schemas::lobby::JoinLobbyRequest>,
) -> Result<JoinResult, AppError> {
    // Verify lobby exists
    let lobby = lobby_repository::find_by_id(&state.db, lobby_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Lobby not found".to_string()))?;

    // Check if banned
    if crate::repositories::moderation_repository::get_ban(&state.db, lobby_id, user_id)
        .await?
        .is_some()
    {
        return Err(AppError::Forbidden(
            "You have been banned from this lobby".to_string(),
        ));
    }

    // Check if already a member
    if lobby_repository::is_member(&state.db, lobby_id, user_id).await? {
        return Err(AppError::Conflict(
            "Already a member of this lobby".to_string(),
        ));
    }

    // Private lobby logic
    if lobby.visibility != "PUBLIC" {
        let provided_password = request.as_ref().and_then(|r| r.password.as_deref());
        
        // If password protected AND a password is provided
        if lobby.password_hash.is_some() && provided_password.is_some() {
            let pwd = provided_password.unwrap();
                
            let valid = crate::auth::password::verify_password(pwd, lobby.password_hash.as_ref().unwrap())?;
            if !valid {
                return Err(AppError::Unauthorized("Invalid lobby password".to_string()));
            }
            // Password valid, join immediately
            lobby_repository::add_member(&state.db, lobby_id, user_id, "MEMBER").await?;
            return Ok(JoinResult::Joined);
        } else {
            // It's PRIVATE (invite/request only) or PASSWORD_PROTECTED but no password was provided
            crate::repositories::request_repository::create_request(&state.db, lobby_id, user_id).await?;
            
            // Notify owner
            if let Some(user) = crate::repositories::user_repository::find_by_id(&state.db, user_id).await? {
                let _ = crate::services::notification_service::create_notification(
                    state,
                    lobby.owner_id,
                    "JOIN_REQUEST",
                    "Yeni Katılma İsteği",
                    &format!("{} kullanıcısı {} lobisine katılmak istiyor.", user.username, lobby.name),
                    Some(lobby_id),
                ).await;
            }

            return Ok(JoinResult::RequestPending);
        }
    }

    lobby_repository::add_member(&state.db, lobby_id, user_id, "MEMBER").await?;

    Ok(JoinResult::Joined)
}

pub async fn leave_lobby(
    state: &SharedState,
    user_id: Uuid,
    lobby_id: Uuid,
) -> Result<(), AppError> {
    let role = lobby_repository::get_member_role(&state.db, lobby_id, user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Not a member of this lobby".to_string()))?;

    if role == "OWNER" {
        return Err(AppError::Forbidden(
            "Lobby owner cannot leave the lobby".to_string(),
        ));
    }

    lobby_repository::remove_member(&state.db, lobby_id, user_id).await?;

    Ok(())
}

pub async fn list_join_requests(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
) -> Result<Vec<crate::schemas::lobby::JoinRequestResponse>, AppError> {
    let role = lobby_repository::get_member_role(&state.db, lobby_id, executor_id).await?;
    if role.as_deref() != Some(crate::schemas::lobby::ROLE_OWNER) && role.as_deref() != Some(crate::schemas::lobby::ROLE_MODERATOR) {
        return Err(AppError::Forbidden("Only moderators can view requests".to_string()));
    }

    let requests = crate::repositories::request_repository::list_pending_requests(&state.db, lobby_id).await?;
    Ok(requests)
}

pub async fn add_bot_to_lobby(
    state: &SharedState,
    lobby_id: Uuid,
    caller_id: Uuid,
    bot_user_id: Uuid,
) -> Result<(), AppError> {
    // Verify caller is OWNER or MODERATOR
    let role = lobby_repository::get_member_role(&state.db, lobby_id, caller_id).await?;
    match role.as_deref() {
        Some("OWNER") | Some("MODERATOR") => {}
        _ => return Err(AppError::Forbidden("Only moderators can add bots".to_string())),
    }

    // Verify the bot actually is a bot
    let is_bot = sqlx::query_scalar::<_, bool>("SELECT is_bot FROM users WHERE id = $1")
        .bind(bot_user_id)
        .fetch_optional(&state.db)
        .await?
        .unwrap_or(false);

    if !is_bot {
        return Err(AppError::Validation("User is not a bot".to_string()));
    }

    // Check if already member
    let is_member = lobby_repository::is_member(&state.db, lobby_id, bot_user_id).await?;
    if is_member {
        return Err(AppError::Validation("Bot is already in the lobby".to_string()));
    }

    // Add bot to lobby as MEMBER
    lobby_repository::add_member(&state.db, lobby_id, bot_user_id, "MEMBER").await?;

    Ok(())
}

pub async fn approve_request(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
) -> Result<(), AppError> {
    let role = lobby_repository::get_member_role(&state.db, lobby_id, executor_id).await?;
    if role.as_deref() != Some(crate::schemas::lobby::ROLE_OWNER) && role.as_deref() != Some(crate::schemas::lobby::ROLE_MODERATOR) {
        return Err(AppError::Forbidden("Only moderators can approve requests".to_string()));
    }

    crate::repositories::request_repository::update_status(&state.db, lobby_id, target_id, "APPROVED").await?;
    lobby_repository::add_member(&state.db, lobby_id, target_id, "MEMBER").await?;
    
    let lobby = lobby_repository::find_by_id(&state.db, lobby_id).await?.unwrap();
    let _ = crate::services::notification_service::create_notification(
        state,
        target_id,
        "JOIN_REQUEST_APPROVED",
        "İstek Onaylandı",
        &format!("{} lobisine katılma isteğiniz onaylandı.", lobby.name),
        Some(lobby_id),
    ).await;

    Ok(())
}

pub async fn reject_request(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
) -> Result<(), AppError> {
    let role = lobby_repository::get_member_role(&state.db, lobby_id, executor_id).await?;
    if role.as_deref() != Some(crate::schemas::lobby::ROLE_OWNER) && role.as_deref() != Some(crate::schemas::lobby::ROLE_MODERATOR) {
        return Err(AppError::Forbidden("Only moderators can reject requests".to_string()));
    }

    crate::repositories::request_repository::update_status(&state.db, lobby_id, target_id, "REJECTED").await?;
    
    let lobby = lobby_repository::find_by_id(&state.db, lobby_id).await?.unwrap();
    let _ = crate::services::notification_service::create_notification(
        state,
        target_id,
        "JOIN_REQUEST_REJECTED",
        "İstek Reddedildi",
        &format!("{} lobisine katılma isteğiniz reddedildi.", lobby.name),
        Some(lobby_id),
    ).await;

    Ok(())
}

