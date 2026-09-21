use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::{direct_message_repository, user_repository};
use crate::schemas::direct_message::DirectMessageResponse;
use crate::schemas::ws_event::{WsOutgoingEvent, EVENT_DIRECT_MESSAGE_CREATED};
use crate::services::notification_service;
use crate::state::SharedState;

pub async fn send_direct_message(
    state: &SharedState,
    sender_id: Uuid,
    receiver_id: Uuid,
    content: &str,
) -> Result<DirectMessageResponse, AppError> {
    let content = content.trim();
    if content.is_empty() {
        return Err(AppError::Validation("Message content cannot be empty.".to_string()));
    }
    if content.len() > 2000 {
        return Err(AppError::Validation("Message cannot exceed 2000 characters.".to_string()));
    }

    if sender_id == receiver_id {
        return Err(AppError::Validation("Cannot message yourself.".to_string()));
    }

    // Verify friendship
    if !direct_message_repository::are_friends(&state.db, sender_id, receiver_id).await? {
        return Err(AppError::Forbidden("You can only message accepted friends.".to_string()));
    }

    // Persist to database
    let dm = direct_message_repository::create_direct_message(
        &state.db,
        sender_id,
        receiver_id,
        content,
    )
    .await?;

    let response = DirectMessageResponse {
        id: dm.id,
        sender_id: dm.sender_id,
        receiver_id: dm.receiver_id,
        content: dm.content,
        is_read: dm.is_read,
        created_at: dm.created_at,
        reactions: std::collections::HashMap::new(),
    };

    // Broadcast real-time direct message event via GlobalWsManager to receiver & sender
    let event = WsOutgoingEvent {
        event_type: EVENT_DIRECT_MESSAGE_CREATED.to_string(),
        payload: serde_json::to_value(&response).unwrap_or_default(),
    };

    state.global_ws_manager.send_to_user(receiver_id, event.clone()).await;
    state.global_ws_manager.send_to_user(sender_id, event).await;

    // Send push notification to receiver
    let sender_name = user_repository::find_by_id(&state.db, sender_id)
        .await?
        .and_then(|u| u.display_name.or(Some(u.username)))
        .unwrap_or_else(|| "A friend".to_string());

    let snippet = if content.chars().count() > 50 {
        let truncated: String = content.chars().take(50).collect();
        format!("{truncated}...")
    } else {
        content.to_string()
    };

    let _ = notification_service::create_notification(
        state,
        receiver_id,
        "DIRECT_MESSAGE",
        &format!("New message from {sender_name}"),
        &snippet,
        Some(sender_id),
    )
    .await;

    Ok(response)
}

pub async fn get_conversation(
    state: &SharedState,
    current_user_id: Uuid,
    friend_id: Uuid,
    limit: i64,
    before: Option<DateTime<Utc>>,
) -> Result<Vec<DirectMessageResponse>, AppError> {
    if current_user_id == friend_id {
        return Err(AppError::Validation("Cannot message yourself.".to_string()));
    }

    // Verify friendship
    if !direct_message_repository::are_friends(&state.db, current_user_id, friend_id).await? {
        return Err(AppError::Forbidden("You can only view messages with accepted friends.".to_string()));
    }

    let limit = limit.clamp(1, 100);
    let messages = direct_message_repository::get_conversation(
        &state.db,
        current_user_id,
        friend_id,
        limit,
        before,
    )
    .await?;

    // Mark messages from friend to current_user as read
    let _ = direct_message_repository::mark_as_read(&state.db, current_user_id, friend_id).await;

    let msg_ids: Vec<Uuid> = messages.iter().map(|m| m.id).collect();
    let mut reactions_map = direct_message_repository::get_reactions_for_messages(&state.db, &msg_ids)
        .await
        .unwrap_or_default();

    let response = messages
        .into_iter()
        .map(|m| {
            let rx = reactions_map.remove(&m.id).unwrap_or_default();
            DirectMessageResponse {
                id: m.id,
                sender_id: m.sender_id,
                receiver_id: m.receiver_id,
                content: m.content,
                is_read: m.is_read,
                created_at: m.created_at,
                reactions: rx,
            }
        })
        .collect();

    Ok(response)
}

pub async fn toggle_reaction(
    state: &SharedState,
    current_user_id: Uuid,
    message_id: Uuid,
    emoji: &str,
) -> Result<std::collections::HashMap<String, Vec<Uuid>>, AppError> {
    let dm = direct_message_repository::get_direct_message_by_id(&state.db, message_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Direct message not found".to_string()))?;

    // Must be either sender or receiver
    if dm.sender_id != current_user_id && dm.receiver_id != current_user_id {
        return Err(AppError::Forbidden("You do not have permission to react to this message.".to_string()));
    }

    direct_message_repository::toggle_reaction(&state.db, message_id, current_user_id, emoji).await?;

    let reactions = direct_message_repository::get_reactions_for_messages(&state.db, &[message_id])
        .await?
        .remove(&message_id)
        .unwrap_or_default();

    let partner_id = if dm.sender_id == current_user_id {
        dm.receiver_id
    } else {
        dm.sender_id
    };

    let payload = serde_json::json!({
        "message_id": message_id,
        "reactions": reactions,
        "user_id": current_user_id,
        "emoji": emoji,
    });

    let event = WsOutgoingEvent {
        event_type: "direct_message.reaction_updated".to_string(),
        payload,
    };
    state.global_ws_manager.send_to_user(partner_id, event.clone()).await;
    state.global_ws_manager.send_to_user(current_user_id, event).await;

    Ok(reactions)
}

pub async fn get_conversations(
    state: &SharedState,
    current_user_id: Uuid,
) -> Result<Vec<crate::schemas::direct_message::ConversationResponse>, AppError> {
    direct_message_repository::get_conversations(&state.db, current_user_id).await
}
