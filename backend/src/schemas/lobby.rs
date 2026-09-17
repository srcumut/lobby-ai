use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateLobbyRequest {
    #[validate(length(
        min = 1,
        max = 100,
        message = "Lobby name must be between 1 and 100 characters"
    ))]
    pub name: String,

    #[validate(length(max = 500, message = "Description must be at most 500 characters"))]
    pub description: Option<String>,

    pub is_private: Option<bool>,
    
    pub password: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateLobbyRequest {
    #[validate(length(
        min = 1,
        max = 100,
        message = "Lobby name must be between 1 and 100 characters"
    ))]
    pub name: Option<String>,

    #[validate(length(max = 500, message = "Description must be at most 500 characters"))]
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LobbyResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: Uuid,
    pub visibility: String,
    pub member_count: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[allow(dead_code)] // Will be used for lobby member listing endpoint
pub struct LobbyMemberResponse {
    pub user_id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub role: String,
    pub notification_preference: Option<String>,
    pub is_bot: bool,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateNotificationPreferenceRequest {
    #[validate(custom(function = "validate_notification_preference"))]
    pub preference: String, // "ALL", "MENTIONS_ONLY", "MUTE"
}

fn validate_notification_preference(pref: &str) -> Result<(), validator::ValidationError> {
    match pref {
        "ALL" | "MENTIONS_ONLY" | "MUTE" => Ok(()),
        _ => Err(validator::ValidationError::new("invalid_preference")),
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BannedUserResponse {
    pub user_id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub banned_at: DateTime<Utc>,
    pub banned_by: Uuid,
}

pub const ROLE_OWNER: &str = "OWNER";
pub const ROLE_MODERATOR: &str = "MODERATOR";
pub const ROLE_MEMBER: &str = "MEMBER";

#[derive(Debug, Deserialize, Validate)]
pub struct MuteUserRequest {
    pub duration_minutes: Option<i64>, // if None, it's a permanent mute
}

#[derive(Debug, Deserialize, Validate)]
pub struct RoleUpdateRequest {
    #[validate(length(min = 1, message = "Role must be specified"))]
    pub role: String, // "MODERATOR" or "MEMBER"
}

#[derive(Debug, Deserialize, Validate)]
pub struct JoinLobbyRequest {
    #[validate(length(max = 100, message = "Password must be at most 100 characters"))]
    pub password: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct JoinRequestResponse {
    pub lobby_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AddBotRequest {
    pub bot_user_id: Uuid,
}

#[derive(Debug, Deserialize, Validate)]
pub struct InviteUserRequest {
    pub username: Option<String>,
    pub user_id: Option<Uuid>,
}


