use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
pub struct Lobby {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub visibility: String,
    pub password_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromRow, Serialize)]
pub struct LobbyJoinRequest {
    pub lobby_id: Uuid,
    pub user_id: Uuid,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, FromRow, Serialize)]
pub struct LobbyMember {
    pub lobby_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub notification_preference: String,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, FromRow, Serialize)]
pub struct LobbyBan {
    pub lobby_id: Uuid,
    pub user_id: Uuid,
    pub banned_by: Uuid,
    pub banned_at: DateTime<Utc>,
}

#[derive(Debug, FromRow, Serialize)]
pub struct LobbyMute {
    pub lobby_id: Uuid,
    pub user_id: Uuid,
    pub muted_by: Uuid,
    pub muted_at: DateTime<Utc>,
    pub muted_until: Option<DateTime<Utc>>,
}

