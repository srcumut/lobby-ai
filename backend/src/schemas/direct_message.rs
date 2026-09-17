use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::schemas::auth::UserInfo;

#[derive(Debug, Deserialize, Validate)]
pub struct SendDirectMessageRequest {
    #[validate(length(min = 1, max = 2000, message = "Message must be between 1 and 2000 characters"))]
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectMessageResponse {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub content: String,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationResponse {
    pub friend: UserInfo,
    pub last_message: Option<DirectMessageResponse>,
    pub unread_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct DirectMessageQuery {
    pub limit: Option<i64>,
    pub before: Option<DateTime<Utc>>,
}
