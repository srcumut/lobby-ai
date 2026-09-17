use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct AiCredential {
    pub id: Uuid,
    pub user_id: Uuid,
    pub provider: String,
    #[serde(skip_serializing)]
    pub encrypted_key: String,
    #[serde(skip_serializing)]
    pub nonce: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Agent {
    pub id: Uuid,
    pub user_id: Uuid, // The bot user ID
    pub owner_id: Uuid, // The creator user ID
    pub name: String,
    pub provider: String,
    pub model: String,
    pub personality_config: Option<serde_json::Value>,
    pub interest_config: Option<serde_json::Value>,
    pub communication_config: Option<serde_json::Value>,
    pub behavior_config: Option<serde_json::Value>,
    pub custom_instructions: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub avatar_url: Option<String>,
    #[sqlx(default)]
    pub username: Option<String>,
}
