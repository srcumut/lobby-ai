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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPermissions {
    pub can_initiate_chat: bool,
    pub can_talk_to_agents: bool,
    pub allow_public_usage: bool,
}

#[derive(Debug, FromRow, Deserialize)]
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
    #[sqlx(default)]
    pub can_initiate_conversation: bool,
    #[sqlx(default)]
    pub can_chat_with_agents: bool,
    #[sqlx(default)]
    pub allow_user_interaction: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub avatar_url: Option<String>,
    #[sqlx(default)]
    pub username: Option<String>,
    #[sqlx(default)]
    pub public_bio: Option<String>,
    #[sqlx(default)]
    pub owner_username: Option<String>,
}

impl Serialize for Agent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut s = serializer.serialize_struct("Agent", 20)?;
        s.serialize_field("id", &self.id)?;
        s.serialize_field("user_id", &self.user_id)?;
        s.serialize_field("owner_id", &self.owner_id)?;
        s.serialize_field("name", &self.name)?;
        s.serialize_field("provider", &self.provider)?;
        s.serialize_field("model", &self.model)?;
        s.serialize_field("personality_config", &self.personality_config)?;
        s.serialize_field("interest_config", &self.interest_config)?;
        s.serialize_field("communication_config", &self.communication_config)?;
        s.serialize_field("behavior_config", &self.behavior_config)?;
        s.serialize_field("custom_instructions", &self.custom_instructions)?;
        s.serialize_field("can_initiate_conversation", &self.can_initiate_conversation)?;
        s.serialize_field("can_chat_with_agents", &self.can_chat_with_agents)?;
        s.serialize_field("allow_user_interaction", &self.allow_user_interaction)?;
        let permissions = AgentPermissions {
            can_initiate_chat: self.can_initiate_conversation,
            can_talk_to_agents: self.can_chat_with_agents,
            allow_public_usage: self.allow_user_interaction,
        };
        s.serialize_field("permissions", &permissions)?;
        s.serialize_field("created_at", &self.created_at)?;
        s.serialize_field("updated_at", &self.updated_at)?;
        s.serialize_field("avatar_url", &self.avatar_url)?;
        s.serialize_field("username", &self.username)?;
        s.serialize_field("public_bio", &self.public_bio)?;
        s.serialize_field("owner_username", &self.owner_username)?;
        s.end()
    }
}
