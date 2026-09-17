use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::schemas::auth::UserInfo;

#[derive(Debug, Deserialize)]
pub struct FriendRequestPayload {
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct FriendRequestResponse {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct IncomingFriendRequest {
    pub id: Uuid,
    pub sender: UserInfo,
    pub status: String,
    pub created_at: DateTime<Utc>,
}
