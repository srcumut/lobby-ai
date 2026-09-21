use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::schemas::message::MessageSender;

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePollRequest {
    #[validate(length(min = 3, max = 255, message = "Soru 3 ile 255 karakter arasında olmalıdır"))]
    pub question: String,
    pub options: Vec<String>,
    #[serde(default)]
    pub is_multiple_choice: bool,
    pub duration_minutes: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct VotePollRequest {
    pub option_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollOptionResponse {
    pub id: Uuid,
    pub poll_id: Uuid,
    pub text: String,
    pub position: i32,
    pub vote_count: i64,
    pub percentage: f64,
    pub has_voted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollResponse {
    pub id: Uuid,
    pub lobby_id: Uuid,
    pub creator: MessageSender,
    pub question: String,
    pub is_multiple_choice: bool,
    pub is_closed: bool,
    pub total_votes: i64,
    pub options: Vec<PollOptionResponse>,
    pub ends_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub user_voted: bool,
}
