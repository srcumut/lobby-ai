use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    #[serde(rename = "type")]
    pub r#type: String,
    pub title: String,
    pub message: String,
    pub related_entity_id: Option<Uuid>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}
