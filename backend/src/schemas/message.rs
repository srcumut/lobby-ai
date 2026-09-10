use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub id: Uuid,
    pub lobby_id: Uuid,
    pub sender: MessageSender,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub reactions: std::collections::HashMap<String, Vec<Uuid>>, // reaction -> list of user_ids
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct ReactionRequest {
    #[validate(length(min = 1, max = 50, message = "Reaction must be between 1 and 50 characters"))]
    pub reaction: String,
}

#[derive(Debug, Serialize)]
pub struct MessageSender {
    pub id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MessageQuery {
    pub limit: Option<i64>,
    pub before: Option<Uuid>,
}
