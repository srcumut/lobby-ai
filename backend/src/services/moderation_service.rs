use chrono::{Duration, Utc};
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::lobby::{LobbyBan, LobbyMember, LobbyMute};
use crate::repositories::{lobby_repository, moderation_repository};
use crate::schemas::lobby::{ROLE_MEMBER, ROLE_MODERATOR, ROLE_OWNER};
use crate::schemas::ws_event::WsOutgoingEvent;
use crate::state::SharedState;

async fn check_permission(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
) -> Result<(), AppError> {
    if executor_id == target_id {
        return Err(AppError::Forbidden("You cannot perform moderation actions on yourself".to_string()));
    }

    let executor_role = lobby_repository::get_member_role(&state.db, lobby_id, executor_id).await?;
    let target_role = lobby_repository::get_member_role(&state.db, lobby_id, target_id).await?;

    match (executor_role.as_deref(), target_role.as_deref()) {
        (Some(ROLE_OWNER), _) => Ok(()), // Owner can moderate anyone
        (Some(ROLE_MODERATOR), Some(ROLE_MEMBER)) => Ok(()), // Moderator can moderate members
        (Some(ROLE_MODERATOR), _) => Err(AppError::Forbidden("Moderators cannot moderate owners or other moderators".to_string())),
        (Some(ROLE_MEMBER), _) | (None, _) => Err(AppError::Forbidden("You do not have permission to moderate this lobby".to_string())),
        _ => Err(AppError::Forbidden("Permission denied".to_string())),
    }
}

pub async fn kick_user(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
) -> Result<(), AppError> {
    check_permission(state, lobby_id, executor_id, target_id).await?;
    
    let event = WsOutgoingEvent {
        event_type: "moderation.event".to_string(),
        payload: serde_json::json!({
            "action": "kick",
            "target_user_id": target_id,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, event).await;

    lobby_repository::remove_member(&state.db, lobby_id, target_id).await?;
    
    // Also unsubscribe from websocket if connected
    state.lobby_manager.unsubscribe(lobby_id, target_id);

    let lobby = lobby_repository::find_by_id(&state.db, lobby_id).await?.unwrap();
    let _ = crate::services::notification_service::create_notification(
        state,
        target_id,
        "KICKED",
        "Lobiden Atıldınız",
        &format!("{} lobisinden atıldınız.", lobby.name),
        Some(lobby_id),
    ).await;

    Ok(())
}

pub async fn ban_user(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
) -> Result<LobbyBan, AppError> {
    check_permission(state, lobby_id, executor_id, target_id).await?;
    
    let event = WsOutgoingEvent {
        event_type: "moderation.event".to_string(),
        payload: serde_json::json!({
            "action": "ban",
            "target_user_id": target_id,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, event).await;

    // Remove them from the lobby first (which acts as a kick)
    lobby_repository::remove_member(&state.db, lobby_id, target_id).await?;
    state.lobby_manager.unsubscribe(lobby_id, target_id);
    
    let ban = moderation_repository::ban_user(&state.db, lobby_id, target_id, executor_id).await?;
    
    let lobby = lobby_repository::find_by_id(&state.db, lobby_id).await?.unwrap();
    let _ = crate::services::notification_service::create_notification(
        state,
        target_id,
        "BANNED",
        "Lobiden Yasaklandınız",
        &format!("{} lobisinden yasaklandınız.", lobby.name),
        Some(lobby_id),
    ).await;

    Ok(ban)
}

pub async fn unban_user(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
) -> Result<bool, AppError> {
    // Only moderators or owners can unban, we can check executor role generally
    let executor_role = lobby_repository::get_member_role(&state.db, lobby_id, executor_id)
        .await?
        .unwrap_or_default();
    
    if executor_role != ROLE_OWNER && executor_role != ROLE_MODERATOR {
        return Err(AppError::Forbidden("You do not have permission to unban".to_string()));
    }
    
    moderation_repository::unban_user(&state.db, lobby_id, target_id).await
}

pub async fn mute_user(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
    duration_minutes: Option<i64>,
) -> Result<LobbyMute, AppError> {
    check_permission(state, lobby_id, executor_id, target_id).await?;
    
    let muted_until = duration_minutes.map(|mins| Utc::now() + Duration::minutes(mins));
    let mute = moderation_repository::mute_user(&state.db, lobby_id, target_id, executor_id, muted_until).await?;
    
    let event = WsOutgoingEvent {
        event_type: "moderation.event".to_string(),
        payload: serde_json::json!({
            "action": "mute",
            "target_user_id": target_id,
            "duration_minutes": duration_minutes,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, event).await;

    let lobby = lobby_repository::find_by_id(&state.db, lobby_id).await?.unwrap();
    let duration_str = match duration_minutes {
        Some(mins) => format!("{} dakika süreliğine", mins),
        None => "süresiz olarak".to_string(),
    };
    let _ = crate::services::notification_service::create_notification(
        state,
        target_id,
        "MUTED",
        "Susturuldunuz",
        &format!("{} lobisinde {} susturuldunuz.", lobby.name, duration_str),
        Some(lobby_id),
    ).await;

    Ok(mute)
}

pub async fn unmute_user(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
) -> Result<bool, AppError> {
    check_permission(state, lobby_id, executor_id, target_id).await?;
    let res = moderation_repository::unmute_user(&state.db, lobby_id, target_id).await;
    
    if res.is_ok() {
        let event = WsOutgoingEvent {
            event_type: "moderation.event".to_string(),
            payload: serde_json::json!({
                "action": "unmute",
                "target_user_id": target_id,
            }),
        };
        state.lobby_manager.broadcast(lobby_id, event).await;
    }
    
    res
}

pub async fn set_role(
    state: &SharedState,
    lobby_id: Uuid,
    executor_id: Uuid,
    target_id: Uuid,
    new_role: &str,
) -> Result<LobbyMember, AppError> {
    if new_role != ROLE_MODERATOR && new_role != ROLE_MEMBER {
        return Err(AppError::Validation("Invalid role".to_string()));
    }

    if executor_id == target_id {
        return Err(AppError::Forbidden("You cannot change your own role".to_string()));
    }

    // Only owners can promote/demote
    let executor_role = lobby_repository::get_member_role(&state.db, lobby_id, executor_id)
        .await?
        .unwrap_or_default();
        
    if executor_role != ROLE_OWNER {
        return Err(AppError::Forbidden("Only the lobby owner can change roles".to_string()));
    }
    
    let target_role = lobby_repository::get_member_role(&state.db, lobby_id, target_id).await?;
    if target_role.is_none() {
        return Err(AppError::NotFound("Target user is not in the lobby".to_string()));
    }

    lobby_repository::update_member_role(&state.db, lobby_id, target_id, new_role).await
}
