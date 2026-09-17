// ============================================================================
// TARGET_DESTINATION: backend/src/services/ai_service.rs
// PURPOSE: AI business logic including Agent CRUD with custom avatar support and LLM mention processing
// ============================================================================

use uuid::Uuid;
use tracing::{error, info};

use crate::errors::AppError;
use crate::models::ai::{Agent, AiCredential};
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
               a.custom_instructions, a.created_at, a.updated_at,
               u.avatar_url, u.username
        FROM agents a
        JOIN users u ON u.id = a.user_id
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
               a.custom_instructions, a.created_at, a.updated_at,
               u.avatar_url, u.username
        FROM agents a
        JOIN users u ON u.id = a.user_id
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
            custom_instructions = $8, updated_at = NOW()
        WHERE id = $9 AND owner_id = $10
        RETURNING id, user_id, owner_id, name, provider, model, personality_config, interest_config, communication_config, behavior_config, custom_instructions, created_at, updated_at
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
    let mut agent = sqlx::query_as::<_, Agent>(
        r#"
        INSERT INTO agents (user_id, owner_id, name, provider, model, personality_config, interest_config, communication_config, behavior_config, custom_instructions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, user_id, owner_id, name, provider, model, personality_config, interest_config, communication_config, behavior_config, custom_instructions, created_at, updated_at
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
    .fetch_one(&mut *tx)
    .await?;
    
    tx.commit().await?;

    agent.avatar_url = request.avatar_url;
    agent.username = Some(request.username);
    
    Ok(agent)
}

/// Analyzes mentions in an incoming chat message and dispatches LLM completion for target agents
pub fn handle_agent_mention(
    state: SharedState,
    lobby_id: Uuid,
    message: Message,
) {
    let content = message.content.clone();
    
    tokio::spawn(async move {
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
            let user_record = match crate::repositories::user_repository::find_by_username(&state.db, &username).await {
                Ok(Some(u)) => u,
                _ => continue,
            };

            if !user_record.is_bot {
                continue; // Only process AI bot mentions
            }

            let agent = match sqlx::query_as::<_, Agent>(
                r#"
                SELECT a.id, a.user_id, a.owner_id, a.name, a.provider, a.model, 
                       a.personality_config, a.interest_config, a.communication_config, a.behavior_config, 
                       a.custom_instructions, a.created_at, a.updated_at,
                       u.avatar_url, u.username
                FROM agents a
                JOIN users u ON u.id = a.user_id
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

            // Fetch owner's encrypted API credential for this provider
            let cred = match sqlx::query_as::<_, AiCredential>(
                "SELECT id, user_id, provider, encrypted_key, nonce, created_at FROM ai_credentials WHERE user_id = $1 AND provider = $2"
            )
            .bind(agent.owner_id)
            .bind(&agent.provider)
            .fetch_optional(&state.db)
            .await {
                Ok(Some(c)) => c,
                _ => {
                    error!("Agent {} owner does not have credentials for {}", agent.name, agent.provider);
                    continue;
                }
            };

            let decrypted_key = match decrypt_key(&cred.encrypted_key, &cred.nonce, &state.config.encryption_key) {
                Ok(k) => k,
                Err(e) => {
                    error!("Failed to decrypt API key for agent {}: {}", agent.name, e);
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
                    format!("*(Failed to generate response: {})*", e)
                }
            };

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
            content: bot_message.content,
            is_bot: true,
            created_at: bot_message.created_at,
            reactions: std::collections::HashMap::new(),
        };

        let ws_event = crate::schemas::ws_event::WsOutgoingEvent {
            event_type: "message.created".to_string(),
            payload: serde_json::to_value(&message_response).unwrap(),
        };

        state.lobby_manager.broadcast(lobby_id, ws_event).await;
        info!("Bot {} replied in lobby {}", bot_user_id, lobby_id);
    });
}
