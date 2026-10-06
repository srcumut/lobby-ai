// ============================================================================
// TARGET_DESTINATION: backend/src/services/ai_service.rs
// PURPOSE: AI business logic including Agent CRUD with custom avatar support and LLM mention processing
// ============================================================================

use std::time::Duration;
use uuid::Uuid;
use tracing::{error, info};

use crate::errors::AppError;
use crate::models::ai::{Agent, AiCredential};
use crate::models::user::User;
use crate::models::message::Message;
use crate::schemas::ai::{AddCredentialRequest, CreateAgentRequest, UpdateAgentRequest};
use crate::state::SharedState;
use crate::ai::crypto::{encrypt_key, decrypt_key};
use crate::ai::prompt_builder::build_system_prompt;
use crate::ai::provider::get_provider;

pub async fn add_credential(
    state: &SharedState,
    user_id: Uuid,
    request: AddCredentialRequest,
) -> Result<AiCredential, AppError> {
    let (encrypted_key, nonce) = encrypt_key(&request.api_key, &state.config.encryption_key)?;
    
    // Insert into db
    let cred = sqlx::query_as::<_, AiCredential>(
        r#"
        INSERT INTO ai_credentials (user_id, provider, encrypted_key, nonce)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, provider) 
        DO UPDATE SET encrypted_key = EXCLUDED.encrypted_key, nonce = EXCLUDED.nonce
        RETURNING id, user_id, provider, encrypted_key, nonce, created_at
        "#,
    )
    .bind(user_id)
    .bind(&request.provider)
    .bind(&encrypted_key)
    .bind(&nonce)
    .fetch_one(&state.db)
    .await?;
    
    Ok(cred)
}

pub async fn get_credentials(
    state: &SharedState,
    user_id: Uuid,
) -> Result<Vec<AiCredential>, AppError> {
    let creds = sqlx::query_as::<_, AiCredential>(
        "SELECT id, user_id, provider, encrypted_key, nonce, created_at FROM ai_credentials WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await?;
    
    Ok(creds)
}

pub async fn get_agents(
    state: &SharedState,
    owner_id: Uuid,
) -> Result<Vec<Agent>, AppError> {
    let agents = sqlx::query_as::<_, Agent>(
        r#"
        SELECT a.id, a.user_id, a.owner_id, a.name, a.provider, a.model, 
               a.personality_config, a.interest_config, a.communication_config, a.behavior_config, 
               a.custom_instructions, a.can_initiate_conversation, a.can_chat_with_agents, a.allow_user_interaction,
               a.public_bio, a.created_at, a.updated_at,
               u.avatar_url, u.username,
               u_owner.username as owner_username
        FROM agents a
        JOIN users u ON u.id = a.user_id
        LEFT JOIN users u_owner ON u_owner.id = a.owner_id
        WHERE a.owner_id = $1
        ORDER BY a.created_at DESC
        "#
    )
    .bind(owner_id)
    .fetch_all(&state.db)
    .await?;

    Ok(agents)
}

pub async fn get_agent_by_id(
    state: &SharedState,
    agent_id: Uuid,
) -> Result<Agent, AppError> {
    let agent = sqlx::query_as::<_, Agent>(
        r#"
        SELECT a.id, a.user_id, a.owner_id, a.name, a.provider, a.model, 
               a.personality_config, a.interest_config, a.communication_config, a.behavior_config, 
               a.custom_instructions, a.can_initiate_conversation, a.can_chat_with_agents, a.allow_user_interaction,
               a.public_bio, a.created_at, a.updated_at,
               u.avatar_url, u.username,
               u_owner.username as owner_username
        FROM agents a
        JOIN users u ON u.id = a.user_id
        LEFT JOIN users u_owner ON u_owner.id = a.owner_id
        WHERE a.id = $1
        "#
    )
    .bind(agent_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Agent not found".to_string()))?;

    Ok(agent)
}

pub async fn update_agent(
    state: &SharedState,
    owner_id: Uuid,
    agent_id: Uuid,
    request: UpdateAgentRequest,
) -> Result<Agent, AppError> {
    // Check if agent exists and belongs to the owner
    let existing_agent = get_agent_by_id(state, agent_id).await?;
    if existing_agent.owner_id != owner_id {
        return Err(AppError::Forbidden("You do not have permission to edit this agent".to_string()));
    }

    // Verify credentials for the requested provider
    let creds = get_credentials(state, owner_id).await?;
    if !creds.iter().any(|c| c.provider == request.provider) {
        return Err(AppError::Validation(format!(
            "You have not configured API credentials for provider: {}",
            request.provider
        )));
    }

    // Provider-Model compatibility check
    let valid_models = match request.provider.as_str() {
        "OpenAI" => vec!["gpt-4o", "gpt-4o-mini"],
        "Gemini" => vec!["gemini-1.5-flash", "gemini-1.5-pro", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.1-pro"],
        "Anthropic" => vec!["claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"],
        _ => vec![],
    };

    if !valid_models.contains(&request.model.as_str()) {
        return Err(AppError::Validation(format!(
            "Model '{}' is not valid for provider '{}'",
            request.model, request.provider
        )));
    }

    let mut tx = state.db.begin().await?;

    // 1. Update the agent record
    let mut agent = sqlx::query_as::<_, Agent>(
        r#"
        UPDATE agents 
        SET name = $1, provider = $2, model = $3, 
            personality_config = $4, interest_config = $5, 
            communication_config = $6, behavior_config = $7, 
            custom_instructions = $8,
            can_initiate_conversation = COALESCE($9, can_initiate_conversation),
            can_chat_with_agents = COALESCE($10, can_chat_with_agents),
            allow_user_interaction = COALESCE($11, allow_user_interaction),
            public_bio = COALESCE($12, public_bio),
            updated_at = NOW()
        WHERE id = $13 AND owner_id = $14
        RETURNING id, user_id, owner_id, name, provider, model, personality_config, interest_config, communication_config, behavior_config, custom_instructions, can_initiate_conversation, can_chat_with_agents, allow_user_interaction, public_bio, created_at, updated_at
        "#,
    )
    .bind(&request.name)
    .bind(&request.provider)
    .bind(&request.model)
    .bind(&request.personality_config)
    .bind(&request.interest_config)
    .bind(&request.communication_config)
    .bind(&request.behavior_config)
    .bind(&request.custom_instructions)
    .bind(request.resolved_can_initiate())
    .bind(request.resolved_can_chat_with_agents())
    .bind(request.resolved_allow_user_interaction())
    .bind(&request.public_bio)
    .bind(agent_id)
    .bind(owner_id)
    .fetch_one(&mut *tx)
    .await?;

    // 2. Update the bot user record (display_name and optionally avatar_url)
    if let Some(ref avatar) = request.avatar_url {
        sqlx::query("UPDATE users SET display_name = $1, avatar_url = $2 WHERE id = $3")
            .bind(&request.name)
            .bind(avatar)
            .bind(existing_agent.user_id)
            .execute(&mut *tx)
            .await?;
        agent.avatar_url = Some(avatar.clone());
    } else {
        sqlx::query("UPDATE users SET display_name = $1 WHERE id = $2")
            .bind(&request.name)
            .bind(existing_agent.user_id)
            .execute(&mut *tx)
            .await?;
        agent.avatar_url = existing_agent.avatar_url;
    }

    agent.username = existing_agent.username;

    tx.commit().await?;

    Ok(agent)
}

pub async fn update_agent_avatar(
    state: &SharedState,
    owner_id: Uuid,
    agent_id: Uuid,
    avatar_url: Option<String>,
) -> Result<Agent, AppError> {
    let existing_agent = get_agent_by_id(state, agent_id).await?;
    if existing_agent.owner_id != owner_id {
        return Err(AppError::Forbidden("You do not have permission to edit this agent".to_string()));
    }

    sqlx::query("UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2")
        .bind(avatar_url.as_deref())
        .bind(existing_agent.user_id)
        .execute(&state.db)
        .await?;

    let mut updated_agent = existing_agent;
    updated_agent.avatar_url = avatar_url;
    Ok(updated_agent)
}

pub async fn delete_agent(
    state: &SharedState,
    owner_id: Uuid,
    agent_id: Uuid,
) -> Result<(), AppError> {
    let existing_agent = get_agent_by_id(state, agent_id).await?;
    if existing_agent.owner_id != owner_id {
        return Err(AppError::Forbidden("You do not have permission to delete this agent".to_string()));
    }

    let rows_affected = sqlx::query("DELETE FROM agents WHERE id = $1 AND owner_id = $2")
        .bind(agent_id)
        .bind(owner_id)
        .execute(&state.db)
        .await?
        .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::NotFound("Agent not found".to_string()));
    }

    // Also delete the underlying bot user (cascades or explicit)
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(existing_agent.user_id)
        .execute(&state.db)
        .await;

    Ok(())
}

pub async fn create_agent(
    state: &SharedState,
    owner_id: Uuid,
    request: CreateAgentRequest,
) -> Result<Agent, AppError> {
    // 1. Create a bot User
    let mut tx = state.db.begin().await?;
    
    // Check if username is taken
    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)")
        .bind(&request.username)
        .fetch_one(&mut *tx)
        .await?;
        
    if exists {
        return Err(AppError::Conflict("Username is already taken".to_string()));
    }
    
    // Create random email and password hash for the bot since they are required but unused
    let fake_email = format!("bot_{}@lobby.ai", Uuid::new_v4());
    let fake_password_hash = "bot_no_login_allowed";
    
    let bot_user_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO users (username, email, password_hash, display_name, avatar_url, is_bot)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id
        "#,
    )
    .bind(&request.username)
    .bind(&fake_email)
    .bind(fake_password_hash)
    .bind(&request.name)
    .bind(&request.avatar_url)
    .fetch_one(&mut *tx)
    .await?;
    
    // 2. Create the Agent
    let can_initiate = request.resolved_can_initiate();
    let can_chat_agents = request.resolved_can_chat_with_agents();
    let allow_interaction = request.resolved_allow_user_interaction();

    let mut agent = sqlx::query_as::<_, Agent>(
        r#"
        INSERT INTO agents (user_id, owner_id, name, provider, model, personality_config, interest_config, communication_config, behavior_config, custom_instructions, can_initiate_conversation, can_chat_with_agents, allow_user_interaction, public_bio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, user_id, owner_id, name, provider, model, personality_config, interest_config, communication_config, behavior_config, custom_instructions, can_initiate_conversation, can_chat_with_agents, allow_user_interaction, public_bio, created_at, updated_at
        "#,
    )
    .bind(bot_user_id)
    .bind(owner_id)
    .bind(&request.name)
    .bind(&request.provider)
    .bind(&request.model)
    .bind(&request.personality_config)
    .bind(&request.interest_config)
    .bind(&request.communication_config)
    .bind(&request.behavior_config)
    .bind(&request.custom_instructions)
    .bind(can_initiate)
    .bind(can_chat_agents)
    .bind(allow_interaction)
    .bind(&request.public_bio)
    .fetch_one(&mut *tx)
    .await?;
    
    tx.commit().await?;

    agent.avatar_url = request.avatar_url;
    agent.username = Some(request.username);
    
    Ok(agent)
}

/// Broadcasts a typing indicator state for a bot user in a lobby
async fn set_bot_typing(state: &SharedState, lobby_id: Uuid, bot_user_id: Uuid, bot_name: &str, is_typing: bool) {
    let event = crate::schemas::ws_event::WsOutgoingEvent {
        event_type: crate::schemas::ws_event::EVENT_USER_TYPING.to_string(),
        payload: serde_json::json!({
            "lobby_id": lobby_id,
            "user_id": bot_user_id,
            "username": bot_name,
            "is_typing": is_typing,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, event).await;
}

/// Initiates an AI agent conversation / opening message in a lobby with strict permission checks
pub async fn initiate_agent_chat(
    state: &SharedState,
    lobby_id: Uuid,
    agent_id: Uuid,
    caller_id: Uuid,
) -> Result<crate::schemas::message::MessageResponse, AppError> {
    let agent = match get_agent_by_id(state, agent_id).await {
        Ok(a) => a,
        Err(_) => {
            // Fallback lookup by user_id if bot's user_id was passed
            sqlx::query_as::<_, Agent>(
                r#"
                SELECT a.id, a.user_id, a.owner_id, a.name, a.provider, a.model, 
                       a.personality_config, a.interest_config, a.communication_config, a.behavior_config, 
                       a.custom_instructions, a.can_initiate_conversation, a.can_chat_with_agents, a.allow_user_interaction,
                       a.public_bio, a.created_at, a.updated_at,
                       u.avatar_url, u.username,
                       u_owner.username as owner_username
                FROM agents a
                JOIN users u ON u.id = a.user_id
                LEFT JOIN users u_owner ON u_owner.id = a.owner_id
                WHERE a.user_id = $1
                "#,
            )
            .bind(agent_id)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| AppError::NotFound("Agent not found".to_string()))?
        }
    };

    // 1. Permission check: can_initiate_conversation
    if !agent.can_initiate_conversation {
        return Err(AppError::Forbidden(
            "This AI agent does not have permission to initiate conversations (can_initiate_conversation is false)".to_string(),
        ));
    }

    // 2. Caller permission check: owner or (if allow_user_interaction, lobby member)
    if agent.owner_id != caller_id {
        if !agent.allow_user_interaction {
            return Err(AppError::Forbidden(
                "This agent does not allow interaction from users other than its owner".to_string(),
            ));
        }
        let is_member = crate::repositories::lobby_repository::is_member(&state.db, lobby_id, caller_id).await?;
        if !is_member {
            return Err(AppError::Forbidden("You are not a member of this lobby".to_string()));
        }

        let allowed_users_opt: Option<Vec<String>> = agent
            .behavior_config
            .as_ref()
            .and_then(|bc| {
                bc.get("permissions")
                    .and_then(|p| p.get("allowed_users"))
                    .or_else(|| bc.get("allowed_users"))
            })
            .and_then(|v| serde_json::from_value(v.clone()).ok());

        if let Some(allowed_list) = allowed_users_opt {
            if !allowed_list.is_empty() {
                let caller_id_str = caller_id.to_string();
                if !allowed_list.iter().any(|u| u.eq_ignore_ascii_case(&caller_id_str)) {
                    return Err(AppError::Forbidden("You are not in this agent's authorized users list".to_string()));
                }
            }
        }
    }

    // 3. Verify agent is in the lobby
    let is_agent_member = crate::repositories::lobby_repository::is_member(&state.db, lobby_id, agent.user_id).await?;
    if !is_agent_member {
        return Err(AppError::BadRequest("Agent is not a member of this lobby".to_string()));
    }

    // Broadcast bot typing indicator = true
    set_bot_typing(state, lobby_id, agent.user_id, &agent.name, true).await;

    // Fetch API credentials (case-insensitive with system fallback)
    let cred = match sqlx::query_as::<_, AiCredential>(
        "SELECT id, user_id, provider, encrypted_key, nonce, created_at FROM ai_credentials WHERE user_id = $1 AND LOWER(provider) = LOWER($2)"
    )
    .bind(agent.owner_id)
    .bind(&agent.provider)
    .fetch_optional(&state.db)
    .await? {
        Some(c) => c,
        None => {
            sqlx::query_as::<_, AiCredential>(
                "SELECT id, user_id, provider, encrypted_key, nonce, created_at FROM ai_credentials WHERE LOWER(provider) = LOWER($1) LIMIT 1"
            )
            .bind(&agent.provider)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| AppError::BadRequest(format!("No credentials configured for provider: {}", agent.provider)))?
        }
    };

    let decrypted_key = decrypt_key(&cred.encrypted_key, &cred.nonce, &state.config.encryption_key)?;

    let mut recent_messages = crate::repositories::message_repository::get_lobby_messages(&state.db, lobby_id, 10, None).await.unwrap_or_default();
    recent_messages.reverse();

    let mut system_prompt = build_system_prompt(&agent);
    system_prompt.push_str("\n\nYou are initiating a conversation or saying hello in this lobby. Stay natural, engaging, and in character.");

    let provider = get_provider(&agent.provider);
    let reply_text = match provider.generate_response(
        &agent,
        &system_prompt,
        &recent_messages,
        &decrypted_key,
    ).await {
        Ok(t) => t,
        Err(e) => {
            error!("Agent {} failed to generate initiation message: {}", agent.name, e);
            set_bot_typing(state, lobby_id, agent.user_id, &agent.name, false).await;
            return Err(AppError::Internal(format!("AI generation failed: {}", e)));
        }
    };

    set_bot_typing(state, lobby_id, agent.user_id, &agent.name, false).await;

    // Persist message
    let bot_message = crate::repositories::message_repository::create_message(
        &state.db,
        lobby_id,
        agent.user_id,
        &reply_text,
    ).await?;

    let bot_user = crate::repositories::user_repository::find_by_id(&state.db, agent.user_id).await?
        .ok_or_else(|| AppError::Internal("Bot user not found".to_string()))?;

    let message_response = crate::schemas::message::MessageResponse {
        id: bot_message.id,
        lobby_id: bot_message.lobby_id,
        sender: crate::schemas::message::MessageSender {
            id: bot_user.id,
            username: bot_user.username,
            display_name: bot_user.display_name,
            avatar_url: bot_user.avatar_url,
        },
        content: bot_message.content.clone(),
        is_bot: true,
        created_at: bot_message.created_at,
        updated_at: bot_message.updated_at,
        reactions: std::collections::HashMap::new(),
    };

    let ws_event = crate::schemas::ws_event::WsOutgoingEvent {
        event_type: "message.created".to_string(),
        payload: serde_json::to_value(&message_response).unwrap(),
    };
    state.lobby_manager.broadcast(lobby_id, ws_event).await;

    // Trigger any mentions in this opening message
    handle_agent_mention(state.clone(), lobby_id, bot_message);

    Ok(message_response)
}

/// Analyzes mentions in an incoming chat message and dispatches LLM completion for target agents
pub fn handle_agent_mention(
    state: SharedState,
    lobby_id: Uuid,
    message: Message,
) {
    let content = message.content.clone();
    
    tokio::spawn(async move {
        // Fetch sender user to check whether sender is a bot
        let sender_user = match crate::repositories::user_repository::find_by_id(&state.db, message.sender_id).await {
            Ok(Some(u)) => u,
            _ => return,
        };

        // If sender is a bot, enforce agent-to-agent permissions & loop protection
        if sender_user.is_bot {
            // Check sender agent's can_chat_with_agents permission
            let sender_agent = sqlx::query_as::<_, Agent>(
                r#"
                SELECT a.id, a.user_id, a.owner_id, a.name, a.provider, a.model, 
                       a.personality_config, a.interest_config, a.communication_config, a.behavior_config, 
                       a.custom_instructions, a.can_initiate_conversation, a.can_chat_with_agents, a.allow_user_interaction,
                       a.created_at, a.updated_at,
                       u.avatar_url, u.username
                FROM agents a
                JOIN users u ON u.id = a.user_id
                WHERE a.user_id = $1
                "#
            )
            .bind(sender_user.id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();

            if let Some(sa) = sender_agent {
                if !sa.can_chat_with_agents {
                    info!("Sender agent {} does not have can_chat_with_agents enabled, aborting mention cascade", sa.name);
                    return;
                }
            } else {
                return;
            }

            // Loop protection: inspect recent messages in this lobby
            if let Ok(recent) = crate::repositories::message_repository::get_lobby_messages(&state.db, lobby_id, 4, None).await {
                let mut bot_count = 0;
                for m in &recent {
                    if let Ok(Some(u)) = crate::repositories::user_repository::find_by_id(&state.db, m.sender_id).await {
                        if u.is_bot {
                            bot_count += 1;
                        } else {
                            break;
                        }
                    }
                }

                if bot_count >= 3 {
                    tracing::warn!(
                        lobby_id = %lobby_id,
                        "AI Agent loop protection triggered: {} consecutive bot messages detected. Halting agent replies.",
                        bot_count
                    );
                    return;
                }
            }
        }

        // Regex to extract all @username occurrences
        lazy_static::lazy_static! {
            static ref MENTION_RE: regex::Regex = regex::Regex::new(r"@([a-zA-Z0-9_]{3,32})").unwrap();
        }

        let mut mentioned_usernames = Vec::new();
        for cap in MENTION_RE.captures_iter(&content) {
            if let Some(username_match) = cap.get(1) {
                mentioned_usernames.push(username_match.as_str().to_string());
            }
        }

        if mentioned_usernames.is_empty() {
            return;
        }

        info!("Mentions found in lobby {}: {:?}", lobby_id, mentioned_usernames);

        for username in mentioned_usernames {
            // Case-insensitive lookup matching either username, display_name, or normalised name
            let user_record = match sqlx::query_as::<_, User>(
                "SELECT id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, coins, is_bot, created_at, updated_at FROM users WHERE (LOWER(username) = LOWER($1) OR LOWER(display_name) = LOWER($1) OR REPLACE(LOWER(username), '_', '') = LOWER($1)) AND is_bot = true LIMIT 1"
            )
            .bind(&username)
            .fetch_optional(&state.db)
            .await {
                Ok(Some(u)) => u,
                _ => continue,
            };

            // Only process AI bot mentions and prevent self-mentions
            if user_record.id == message.sender_id {
                continue;
            }

            let agent = match sqlx::query_as::<_, Agent>(
                r#"
                SELECT a.id, a.user_id, a.owner_id, a.name, a.provider, a.model, 
                       a.personality_config, a.interest_config, a.communication_config, a.behavior_config, 
                       a.custom_instructions, a.can_initiate_conversation, a.can_chat_with_agents, a.allow_user_interaction,
                       a.public_bio, a.created_at, a.updated_at,
                       u.avatar_url, u.username,
                       u_owner.username as owner_username
                FROM agents a
                JOIN users u ON u.id = a.user_id
                LEFT JOIN users u_owner ON u_owner.id = a.owner_id
                WHERE a.user_id = $1
                "#
            )
            .bind(user_record.id)
            .fetch_optional(&state.db)
            .await {
                Ok(Some(a)) => a,
                _ => {
                    error!("Bot user exists but no agent config found for {}", user_record.id);
                    continue;
                }
            };

            // Permission Check 1: Agent-to-Agent interaction
            if sender_user.is_bot && !agent.can_chat_with_agents {
                info!("Agent {} has can_chat_with_agents=false, ignoring mention from bot {}", agent.name, sender_user.username);
                continue;
            }

            // Permission Check 2: Interaction permissions (interaction_mode / allowed_users)
            let interaction_mode = agent
                .behavior_config
                .as_ref()
                .and_then(|bc| {
                    bc.get("interaction_mode")
                        .or_else(|| bc.get("permissions").and_then(|p| p.get("interaction_mode")))
                })
                .and_then(|v| v.as_str())
                .unwrap_or("EVERYONE");

            if !sender_user.is_bot && sender_user.id != agent.owner_id {
                match interaction_mode {
                    "OWNER_ONLY" => {
                        info!("Agent {} has interaction_mode=OWNER_ONLY and sender is not owner, ignoring mention", agent.name);
                        continue;
                    }
                    "MODERATORS" => {
                        // Check if sender is OWNER or MODERATOR of this lobby
                        let member_role = crate::repositories::lobby_repository::get_member_role(&state.db, lobby_id, sender_user.id)
                            .await
                            .ok()
                            .flatten();
                        let is_mod = member_role.as_deref() == Some("OWNER") || member_role.as_deref() == Some("MODERATOR");
                        if !is_mod {
                            info!("Agent {} has interaction_mode=MODERATORS and sender is neither owner nor lobby mod, ignoring mention", agent.name);
                            continue;
                        }
                    }
                    "WHITELIST" => {
                        let allowed_users_opt: Option<Vec<String>> = agent
                            .behavior_config
                            .as_ref()
                            .and_then(|bc| {
                                bc.get("permissions")
                                    .and_then(|p| p.get("allowed_users"))
                                    .or_else(|| bc.get("allowed_users"))
                            })
                            .and_then(|v| serde_json::from_value(v.clone()).ok());

                        if let Some(allowed_list) = allowed_users_opt {
                            if !allowed_list.is_empty() {
                                let sender_id_str = sender_user.id.to_string();
                                let is_allowed = allowed_list.iter().any(|u| {
                                    u.eq_ignore_ascii_case(&sender_id_str) || u.eq_ignore_ascii_case(&sender_user.username)
                                });
                                if !is_allowed {
                                    info!("User {} is not in agent {}'s allowed_users whitelist, ignoring mention", sender_user.username, agent.name);
                                    continue;
                                }
                            }
                        }
                    }
                    _ => {
                        // "EVERYONE" fallback to allow_user_interaction check
                        if !agent.allow_user_interaction {
                            info!("Agent {} has allow_user_interaction=false and sender is not owner, ignoring mention", agent.name);
                            continue;
                        }
                    }
                }
            }

            // Natural 0.75-second delay before typing animation starts
            tokio::time::sleep(Duration::from_millis(750)).await;

            // Show typing indicator for bot
            set_bot_typing(&state, lobby_id, agent.user_id, &agent.name, true).await;

            // Fetch owner's encrypted API credential for this provider (case-insensitive)
            let cred = match sqlx::query_as::<_, AiCredential>(
                "SELECT id, user_id, provider, encrypted_key, nonce, created_at FROM ai_credentials WHERE user_id = $1 AND LOWER(provider) = LOWER($2)"
            )
            .bind(agent.owner_id)
            .bind(&agent.provider)
            .fetch_optional(&state.db)
            .await {
                Ok(Some(c)) => c,
                _ => {
                    // Fallback to any active credential in the system for this provider
                    let fallback = sqlx::query_as::<_, AiCredential>(
                        "SELECT id, user_id, provider, encrypted_key, nonce, created_at FROM ai_credentials WHERE LOWER(provider) = LOWER($1) LIMIT 1"
                    )
                    .bind(&agent.provider)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten();

                    match fallback {
                        Some(c) => c,
                        None => {
                            error!("No credentials found for provider {}", agent.provider);
                            set_bot_typing(&state, lobby_id, agent.user_id, &agent.name, false).await;
                            continue;
                        }
                    }
                }
            };

            let decrypted_key = match decrypt_key(&cred.encrypted_key, &cred.nonce, &state.config.encryption_key) {
                Ok(k) => k,
                Err(e) => {
                    error!("Failed to decrypt API key for agent {}: {}", agent.name, e);
                    set_bot_typing(&state, lobby_id, agent.user_id, &agent.name, false).await;
                    continue;
                }
            };

            let mut recent_messages = match crate::repositories::message_repository::get_lobby_messages(&state.db, lobby_id, 10, None).await {
                Ok(msgs) => msgs,
                Err(e) => {
                    error!("Failed to fetch chat history for agent context: {}", e);
                    vec![]
                }
            };
            recent_messages.reverse();

            let system_prompt = build_system_prompt(&agent);

            let provider = get_provider(&agent.provider);

            let reply_text = match provider.generate_response(
                &agent,
                &system_prompt,
                &recent_messages,
                &decrypted_key,
            ).await {
                Ok(t) => t,
                Err(e) => {
                    error!("Agent {} LLM generation failed: {}", agent.name, e);
                    "*(⚠️ Yapay zeka servisi şu anda aşırı yoğunluk nedeniyle yanıt veremedi. Lütfen birazdan tekrar deneyin.)*".to_string()
                }
            };

            // Turn off typing indicator
            set_bot_typing(&state, lobby_id, agent.user_id, &agent.name, false).await;

            dispatch_bot_reply(state.clone(), lobby_id, agent.user_id, reply_text).await;
        }
    });
}

async fn dispatch_bot_reply(
    state: SharedState,
    lobby_id: Uuid,
    bot_user_id: Uuid,
    content: String,
) {
    tokio::spawn(async move {
        // Persist the bot reply
        let bot_message = match crate::repositories::message_repository::create_message(
            &state.db,
            lobby_id,
            bot_user_id,
            &content,
        ).await {
            Ok(m) => m,
            Err(e) => {
                error!("Failed to persist bot message: {}", e);
                return;
            }
        };

        // Fetch bot user info
        let bot_user = match crate::repositories::user_repository::find_by_id(&state.db, bot_user_id).await {
            Ok(Some(u)) => u,
            _ => {
                error!("Failed to fetch bot user for MessageResponse");
                return;
            }
        };

        let message_response = crate::schemas::message::MessageResponse {
            id: bot_message.id,
            lobby_id: bot_message.lobby_id,
            sender: crate::schemas::message::MessageSender {
                id: bot_user.id,
                username: bot_user.username,
                display_name: bot_user.display_name,
                avatar_url: bot_user.avatar_url,
            },
            content: bot_message.content.clone(),
            is_bot: true,
            created_at: bot_message.created_at,
            updated_at: bot_message.updated_at,
            reactions: std::collections::HashMap::new(),
        };

        let ws_event = crate::schemas::ws_event::WsOutgoingEvent {
            event_type: "message.created".to_string(),
            payload: serde_json::to_value(&message_response).unwrap(),
        };

        state.lobby_manager.broadcast(lobby_id, ws_event).await;
        info!("Bot {} replied in lobby {}", bot_user_id, lobby_id);

        // Allow subsequent bot mentions with loop protection
        handle_agent_mention(state.clone(), lobby_id, bot_message);
    });
}

/// Tests an agent's prompt in sandbox mode without requiring a lobby or persistence
pub async fn test_agent_prompt(
    state: &SharedState,
    caller_id: Uuid,
    agent_id: Uuid,
    message: &str,
) -> Result<String, AppError> {
    let agent = get_agent_by_id(state, agent_id).await?;

    if agent.owner_id != caller_id {
        return Err(AppError::Forbidden("You do not own this agent".to_string()));
    }

    let cred = sqlx::query_as::<_, AiCredential>(
        "SELECT id, user_id, provider, encrypted_key, nonce, created_at FROM ai_credentials WHERE user_id = $1 AND provider = $2"
    )
    .bind(agent.owner_id)
    .bind(&agent.provider)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::BadRequest(format!("Agent owner does not have credentials configured for provider: {}", agent.provider)))?;

    let decrypted_key = decrypt_key(&cred.encrypted_key, &cred.nonce, &state.config.encryption_key)?;

    let system_prompt = build_system_prompt(&agent);

    let test_msg = crate::models::message::Message {
        id: Uuid::new_v4(),
        lobby_id: Uuid::new_v4(),
        sender_id: caller_id,
        content: message.to_string(),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
    };

    let provider = get_provider(&agent.provider);
    let reply_text = provider
        .generate_response(&agent, &system_prompt, &[test_msg], &decrypted_key)
        .await
        .map_err(|e| AppError::Internal(format!("AI test generation failed: {e}")))?;

    Ok(reply_text)
}
