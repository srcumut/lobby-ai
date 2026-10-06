use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Clone)]
pub struct MessageResponse {
    pub id: Uuid,
    pub lobby_id: Uuid,
    pub sender: MessageSender,
    pub content: String,
    pub is_bot: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub reactions: std::collections::HashMap<String, Vec<Uuid>>, // reaction -> list of user_ids
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct CreateMessageRequest {
    #[validate(length(min = 1, max = 2000, message = "Message content must be between 1 and 2000 characters"))]
    pub content: String,
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct UpdateMessageRequest {
    #[validate(length(min = 1, max = 2000, message = "Message content must be between 1 and 2000 characters"))]
    pub content: String,
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct ReactionRequest {
    #[validate(length(min = 1, max = 50, message = "Reaction must be between 1 and 50 characters"))]
    pub reaction: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[cfg(test)]
mod tests {
    use super::*;
    use validator::Validate;

    #[test]
    fn test_update_message_request_validation() {
        let valid = UpdateMessageRequest {
            content: "Düzenlenmiş mesaj içeriği".to_string(),
        };
        assert!(valid.validate().is_ok());

        let empty = UpdateMessageRequest {
            content: "".to_string(),
        };
        assert!(empty.validate().is_err());

        let too_long = UpdateMessageRequest {
            content: "a".repeat(2001),
        };
        assert!(too_long.validate().is_err());
    }
}
