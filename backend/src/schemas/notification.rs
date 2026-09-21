use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct NotificationResponse {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub r#type: String,
    pub title: String,
    pub message: String,
    pub related_entity_id: Option<Uuid>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Default)]
pub struct NotificationQuery {
    pub all: Option<bool>,
}
