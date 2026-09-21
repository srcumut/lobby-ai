use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::{message_repository, user_repository};
use crate::schemas::message::{MessageResponse, MessageSender};
use crate::state::SharedState;



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

    let is_dice = trimmed == "/zar" || trimmed == "/roll";
    let is_coin = trimmed == "/yazitura" || trimmed == "/yazı-tura" || trimmed == "/coin" || trimmed == "/flip";
    let mut rolled_num: u32 = 0;

    let processed_content = if is_dice {
        let roll = (rand::random::<u32>() % 6) + 1;
        rolled_num = roll;
        let note = if roll == 6 {
            " 🔥 [UĞURLU 6!]"
        } else if roll == 1 {
            " 🐍 [YILAN GÖZÜ 1!]"
        } else {
            ""
        };
        format!("🎲 Zar attı: {} / 6{}", roll, note)
    } else if is_coin {
        let is_heads = rand::random::<bool>();
        let result = if is_heads { "YAZI" } else { "TURA" };
        format!("🪙 Yazı-tura attı: {}! 🪙", result)
    } else if trimmed == "/soru" || trimmed == "/buzkirici" || trimmed == "/icebreaker" {
        let icebreakers = [
            "Eğer hayatınızın geri kalanında sadece tek bir teknoloji kullanabilseydiniz, hangisini seçerdiniz?",
            "Yapay zeka modelleri gerçekten bilinç kazanabilir mi, yoksa sadece çok gelişmiş bir olasılık aynası mıyız?",
            "Geçmişteki herhangi bir tarihi olaya şahit olma şansınız olsaydı nereye giderdiniz?",
            "Bir video oyunu evreninde 1 ay yaşamak zorunda kalsaydınız hangi dünyayı seçerdiniz?",
            "Uzaylılar Dünya'ya gelse ve insanlığı temsil edecek tek bir şarkı seçmemiz gerekseydi bu ne olurdu?",
            "Sizce 10 yıl sonra yazılım geliştiriciliği nasıl bir meslek olacak? Kod yazmaya devam edecek miyiz?",
            "Zaman yolculuğu mu, yoksa ışınlanma gücü mü? Hangisini ve neden seçerdiniz?",
            "Bir yapay zeka ajanı tüm günlük rutin işlerinizi yapsa, kazandığınız serbest zamanla ilk ne yapardınız?",
        ];
        let idx = (rand::random::<u32>() as usize) % icebreakers.len();
        format!("❄️ [GÜNÜN TARTIŞMA SORUSU]: {}", icebreakers[idx])
    } else if trimmed == "/tkm" {
        let choices = ["Taş 🪨", "Kağıt 📄", "Makas ✂️"];
        let idx = (rand::random::<u32>() as usize) % choices.len();
        format!("✊ [TAŞ-KAĞIT-MAKAS]: Rastgele hamle yaptı: {}!", choices[idx])
    } else {
        trimmed.to_string()
    };

    let message =
        message_repository::create_message(&state.db, lobby_id, sender_id, &processed_content).await?;

    if is_dice {
        if rolled_num == 6 {
            let _ = user_repository::unlock_badge(&state.db, sender_id, "lucky_six").await;
            let last_rolls = sqlx::query_scalar::<_, String>(
                r#"
                SELECT content FROM messages
                WHERE lobby_id = $1 AND sender_id = $2 AND content LIKE '🎲 Zar attı: %'
                ORDER BY created_at DESC
                LIMIT 3
                "#
            )
            .bind(lobby_id)
            .bind(sender_id)
            .fetch_all(&state.db)
            .await
            .unwrap_or_default();

            if last_rolls.len() >= 3 && last_rolls.iter().all(|c| c.contains("Zar attı: 6 / 6")) {
                let _ = user_repository::unlock_badge(&state.db, sender_id, "triple_six").await;
            }
        } else if rolled_num == 1 {
            let _ = user_repository::unlock_badge(&state.db, sender_id, "snake_eyes").await;
        }
    } else if is_coin {
        let _ = user_repository::unlock_badge(&state.db, sender_id, "coin_flipper").await;
    } else {
        let _ = user_repository::unlock_badge(&state.db, sender_id, "first_hello").await;
    }


    let sender = user_repository::find_by_id(&state.db, sender_id)
        .await?
        .ok_or_else(|| AppError::Internal("Sender not found".to_string()))?;

    // --- AI Bot Mention Detection (handles both user and bot mentions with loop protection & permissions) ---
    crate::services::ai_service::handle_agent_mention(
        state.clone(),
        lobby_id,
        message.clone(),
    );
    // --- END AI Bot Mention Detection ---

    // --- Lobby Notification & Mentions Logic ---
    if !sender.is_bot {
        // Extract all @mentions from the message content (e.g. "@username hello @other")
        let mention_regex = regex::Regex::new(r"@([a-zA-Z0-9_]+)").unwrap();
        let mentioned_usernames: std::collections::HashSet<String> = mention_regex
            .captures_iter(&trimmed)
            .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_lowercase()))
            .collect();

        if let Ok(members) = crate::repositories::lobby_repository::get_members(&state.db, lobby_id).await {
            let lobby = crate::repositories::lobby_repository::find_by_id(&state.db, lobby_id).await.ok().flatten();
            let lobby_name = lobby.as_ref().map(|l| l.name.as_str()).unwrap_or("Lobi");
            let sender_name = sender.display_name.as_deref().unwrap_or(&sender.username);
            let preview = if trimmed.chars().count() > 40 {
                format!("{}...", trimmed.chars().take(40).collect::<String>())
            } else {
                trimmed.to_string()
            };

            for member in members {
                // Do not notify sender or bot accounts
                if member.user_id == sender_id || member.is_bot {
                    continue;
                }

                let pref = member.notification_preference.as_deref().unwrap_or("MENTIONS_ONLY");
                let is_mentioned = mentioned_usernames.contains(&member.username.to_lowercase());

                let should_notify = match pref {
                    "ALL" => true,
                    "MENTIONS_ONLY" => is_mentioned,
                    "MUTE" => false,
                    _ => is_mentioned,
                };

                if should_notify {
                    let (notif_type, notif_title) = if is_mentioned {
                        ("LOBBY_MENTION", format!("@{} sizi {} lobisinde etiketledi", sender_name, lobby_name))
                    } else {
                        ("LOBBY_MESSAGE", format!("{}: {}", sender_name, lobby_name))
                    };

                    let _ = crate::services::notification_service::create_notification(
                        state,
                        member.user_id,
                        notif_type,
                        &notif_title,
                        &preview,
                        Some(lobby_id),
                    ).await;
                }
            }
        }
    }

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
