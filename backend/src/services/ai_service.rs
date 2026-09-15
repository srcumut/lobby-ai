use uuid::Uuid;


use tracing::{error, info};
use crate::errors::AppError;
use crate::models::ai::{Agent, AiCredential};
use crate::models::message::Message;
use crate::schemas::ai::{AddCredentialRequest, CreateAgentRequest};
use crate::state::SharedState;
use crate::ai::crypto::{encrypt_key, decrypt_key};
use crate::ai::prompt_builder::build_system_prompt;
use crate::ai::provider::{get_provider, AiProvider};

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
        SELECT id, user_id, owner_id, name, provider, model, 
               personality_config, interest_config, communication_config, behavior_config, 
               custom_instructions, created_at, updated_at 
        FROM agents 
        WHERE owner_id = $1
        "#
    )
    .bind(owner_id)
    .fetch_all(&state.db)
    .await?;

    Ok(agents)
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
        INSERT INTO users (username, email, password_hash, display_name, is_bot)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id
        "#,
    )
    .bind(&request.username)
    .bind(&fake_email)
    .bind(fake_password_hash)
    .bind(&request.name)
    .fetch_one(&mut *tx)
    .await?;
    
    // 2. Create the Agent
    let agent = sqlx::query_as::<_, Agent>(
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
    
    Ok(agent)
}

/// Gelen bir mesajdaki mention'ları analiz eder ve bota aitse arka planda yanıt üretir.
pub fn handle_agent_mention(
    state: SharedState,
    lobby_id: Uuid,
    _message: Message,
    bot_user_id: Uuid,
) {
    tokio::spawn(async move {
        tracing::info!("handle_agent_mention task started for bot_user_id: {}", bot_user_id);
        // 1. Agent bilgilerini çek
        let agent_opt: Option<Agent> = sqlx::query_as(
            "SELECT * FROM agents WHERE user_id = $1 LIMIT 1"
        )
        .bind(bot_user_id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

        let agent = match agent_opt {
            Some(a) => a,
            None => {
                error!("Agent record not found for bot user_id {}", bot_user_id);
                return;
            }
        };

        // 2. Sahip credential'ını çek
        let cred_opt: Option<AiCredential> = sqlx::query_as(
            "SELECT * FROM ai_credentials WHERE user_id = $1 AND provider = $2 LIMIT 1"
        )
        .bind(agent.owner_id)
        .bind(&agent.provider)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

        let cred = match cred_opt {
            Some(c) => c,
            None => {
                error!("Credential not found for owner {} and provider {}", agent.owner_id, agent.provider);
                return;
            }
        };

        // 3. Şifreyi çöz
        let api_key = match decrypt_key(&cred.encrypted_key, &cred.nonce, &state.config.encryption_key) {
            Ok(k) => k,
            Err(e) => {
                error!("Failed to decrypt API key: {}", e);
                return;
            }
        };

        // 4. Lobi geçmişini al (son 10 mesaj)
        let mut history = crate::repositories::message_repository::get_lobby_messages(&state.db, lobby_id, 10, None)
            .await
            .unwrap_or_default();
        
        // Veritabanı mesajları DESC (en yeni ilk) sıralar.
        // Yapay zekaya kronolojik (en eski ilk, en yeni son) vermemiz gerektiği için listeyi tersine çeviriyoruz.
        history.reverse();

        // 5. Prompt oluştur
        let system_prompt = build_system_prompt(&agent);

        // 6. Yanıt üret
        let provider = get_provider(&agent.provider);
        
        let response_text = match provider.generate_response(&agent, &system_prompt, &history, &api_key).await {
            Ok(resp) => {
                // Try not to leak api_key in memory if we were using zeroize, but since it's a String we just drop it.
                drop(api_key);
                resp
            },
            Err(e) => {
                // Important: we don't log the api_key here
                error!("AI Provider failed: {}", e);
                return;
            }
        };

        // 7. Yanıtı db'ye kaydet ve yayınla
        let bot_message = match crate::repositories::message_repository::create_message(
            &state.db,
            lobby_id,
            bot_user_id,
            &response_text,
        )
        .await
        {
            Ok(m) => m,
            Err(e) => {
                error!("Failed to save bot message: {}", e);
                return;
            }
        };

        // Convert to MessageResponse for the frontend
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

