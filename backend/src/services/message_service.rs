use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::{message_repository, user_repository};
use crate::schemas::message::{MessageResponse, MessageSender};
use crate::state::SharedState;

lazy_static::lazy_static! {
    static ref MENTION_RE: regex::Regex = regex::Regex::new(r"@([a-zA-Z0-9_]{3,32})").unwrap();
}

const MAX_MESSAGE_LENGTH: usize = 2000;
const DEFAULT_MESSAGE_LIMIT: i64 = 50;
const MAX_MESSAGE_LIMIT: i64 = 100;

pub async fn create_message(
    state: &SharedState,
    lobby_id: Uuid,
    sender_id: Uuid,
    content: &str,
) -> Result<MessageResponse, AppError> {
    let trimmed = content.trim();

    if trimmed.is_empty() {
        return Err(AppError::Validation(
            "Message content cannot be empty".to_string(),
        ));
    }

    if trimmed.len() > MAX_MESSAGE_LENGTH {
        return Err(AppError::Validation(format!(
            "Message content must be at most {MAX_MESSAGE_LENGTH} characters"
        )));
    }

    if let Some(mute) =
        crate::repositories::moderation_repository::get_mute(&state.db, lobby_id, sender_id).await?
    {
        if mute.muted_until.map(|u| u > chrono::Utc::now()).unwrap_or(true) {
            return Err(AppError::Forbidden(
                "You are muted in this lobby".to_string(),
            ));
        } else {
            // Mute expired, we could theoretically clean it up here, but leaving it is fine
        }
    }

    let message =
        message_repository::create_message(&state.db, lobby_id, sender_id, trimmed).await?;

    let sender = user_repository::find_by_id(&state.db, sender_id)
        .await?
        .ok_or_else(|| AppError::Internal("Sender not found".to_string()))?;

    // --- NEW: AI Bot Mention Detection ---
    if !sender.is_bot {
        let mut mentioned_usernames = std::collections::HashSet::new();
        for cap in MENTION_RE.captures_iter(trimmed) {
            if let Some(username) = cap.get(1) {
                mentioned_usernames.insert(username.as_str().to_string());
            }
        }
        
        if !mentioned_usernames.is_empty() {
            tracing::info!("Found mentions: {:?}", mentioned_usernames);
            let usernames_vec: Vec<String> = mentioned_usernames.into_iter().collect();
            // Fetch users with these usernames who are bots
            let bots = sqlx::query_scalar::<_, Uuid>(
                "SELECT id FROM users WHERE username = ANY($1) AND is_bot = true",
            )
            .bind(&usernames_vec)
            .fetch_all(&state.db)
            .await
            .unwrap_or_default();
            
            for bot_id in bots {
                // Check if bot is a member of the lobby
                let is_member = crate::repositories::lobby_repository::is_member(&state.db, lobby_id, bot_id)
                    .await
                    .unwrap_or(false);
                    
                if is_member {
                    tracing::info!("Triggering AI response for bot: {}", bot_id);
                    crate::services::ai_service::handle_agent_mention(
                        state.clone(),
                        lobby_id,
                        message.clone(),
                        bot_id,
                    );
                } else {
                    tracing::info!("Bot {} is not a member of lobby {}", bot_id, lobby_id);
                }
            }
        }
    }
    // --- END NEW ---

    Ok(MessageResponse {
        id: message.id,
        lobby_id: message.lobby_id,
        sender: MessageSender {
            id: sender.id,
            username: sender.username,
            display_name: sender.display_name,
            avatar_url: sender.avatar_url,
        },
        content: message.content,
        is_bot: sender.is_bot,
        created_at: message.created_at,
        reactions: std::collections::HashMap::new(),
    })
}

pub async fn get_lobby_messages(
    state: &SharedState,
    lobby_id: Uuid,
    limit: Option<i64>,
    before: Option<Uuid>,
) -> Result<Vec<MessageResponse>, AppError> {
    let limit = limit
        .unwrap_or(DEFAULT_MESSAGE_LIMIT)
        .clamp(1, MAX_MESSAGE_LIMIT);

    let messages =
        message_repository::get_lobby_messages(&state.db, lobby_id, limit, before).await?;

    let mut responses = Vec::with_capacity(messages.len());
    for msg in messages {
        let sender = user_repository::find_by_id(&state.db, msg.sender_id)
            .await?
            .ok_or_else(|| AppError::Internal("Message sender not found".to_string()))?;

        responses.push(MessageResponse {
            id: msg.id,
            lobby_id: msg.lobby_id,
            sender: MessageSender {
                id: sender.id,
                username: sender.username,
                display_name: sender.display_name,
                avatar_url: sender.avatar_url,
            },
            content: msg.content,
            is_bot: sender.is_bot,
            created_at: msg.created_at,
            reactions: std::collections::HashMap::new(),
        });
    }

    // Attach reactions
    for resp in &mut responses {
        let reactions = crate::repositories::reaction_repository::get_reactions_for_message(&state.db, resp.id).await?;
        for r in reactions {
            resp.reactions.entry(r.reaction).or_default().push(r.user_id);
        }
    }

    Ok(responses)
}

pub async fn toggle_reaction(
    state: &SharedState,
    lobby_id: Uuid,
    message_id: Uuid,
    user_id: Uuid,
    reaction: &str,
) -> Result<(), AppError> {
    let result = crate::repositories::reaction_repository::toggle_reaction(&state.db, message_id, user_id, reaction).await?;

    let event_payload = serde_json::json!({
        "message_id": message_id,
        "user_id": user_id,
        "reaction": reaction,
        "action": match result {
            crate::repositories::reaction_repository::ToggleResult::Added(_) => "added",
            crate::repositories::reaction_repository::ToggleResult::Removed => "removed",
        }
    });

    state.lobby_manager.broadcast(
        lobby_id,
        crate::schemas::ws_event::WsOutgoingEvent {
            event_type: crate::schemas::ws_event::EVENT_MESSAGE_REACTION_UPDATED.to_string(),
            payload: event_payload,
        },
    ).await;

    // Send notification if reaction was added
    if let crate::repositories::reaction_repository::ToggleResult::Added(_) = result {
        // Fetch message to get the sender
        if let Some(msg) = message_repository::get_message(&state.db, message_id).await? {
            if msg.sender_id != user_id {
                let user = user_repository::find_by_id(&state.db, user_id).await?.unwrap();
                let _ = crate::services::notification_service::create_notification(
                    state,
                    msg.sender_id,
                    "NEW_REACTION",
                    "Yeni Tepki",
                    &format!("{} mesajınıza {} tepkisi bıraktı.", user.username, reaction),
                    Some(message_id),
                ).await;
            }
        }
    }

    Ok(())
}
