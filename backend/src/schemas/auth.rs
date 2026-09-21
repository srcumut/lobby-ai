use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(
        min = 3,
        max = 32,
        message = "Username must be between 3 and 32 characters"
    ))]
    pub username: String,

    #[validate(email(message = "Invalid email address"))]
    pub email: String,

    #[validate(length(
        min = 8,
        max = 128,
        message = "Password must be between 8 and 128 characters"
    ))]
    pub password: String,

    #[validate(length(max = 64, message = "Display name must be at most 64 characters"))]
    pub display_name: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 1, message = "Email or username is required"))]
    pub email: String,

    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub display_name: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub bio: Option<String>,
    pub badges: Vec<String>,
    #[serde(default)]
    pub coins: i32,
    pub is_bot: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct PublicUserProfile {
    pub id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub bio: Option<String>,
    pub badges: Vec<String>,
    #[serde(default)]
    pub coins: i32,
    pub is_bot: bool,
    pub created_at: DateTime<Utc>,
    #[serde(default)]
    pub public_bio: Option<String>,
    #[serde(default)]
    pub owner_username: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(max = 64, message = "Display name must be at most 64 characters"))]
    pub display_name: Option<String>,

    #[validate(length(max = 64, message = "First name must be at most 64 characters"))]
    pub first_name: Option<String>,

    #[validate(length(max = 64, message = "Last name must be at most 64 characters"))]
    pub last_name: Option<String>,

    #[validate(length(max = 2048, message = "Avatar URL must be at most 2048 characters"))]
    pub avatar_url: Option<String>,

    #[validate(length(max = 2048, message = "Banner URL must be at most 2048 characters"))]
    pub banner_url: Option<String>,

    #[validate(length(max = 500, message = "Bio must be at most 500 characters"))]
    pub bio: Option<String>,

    pub badges: Option<Vec<String>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_request_validation() {
        let valid = RegisterRequest {
            username: "valid_user".to_string(),
            email: "valid@example.com".to_string(),
            password: "password123".to_string(),
            display_name: Some("Valid User".to_string()),
        };
        assert!(valid.validate().is_ok());

        let invalid_email = RegisterRequest {
            username: "valid_user".to_string(),
            email: "invalid-email".to_string(),
            password: "password123".to_string(),
            display_name: None,
        };
        assert!(invalid_email.validate().is_err());

        let short_password = RegisterRequest {
            username: "valid_user".to_string(),
            email: "valid@example.com".to_string(),
            password: "123".to_string(),
            display_name: None,
        };
        assert!(short_password.validate().is_err());
    }

    #[test]
    fn test_update_profile_request_validation() {
        let valid = UpdateProfileRequest {
            display_name: Some("Updated".to_string()),
            first_name: Some("John".to_string()),
            last_name: Some("Doe".to_string()),
            avatar_url: None,
            banner_url: None,
            bio: Some("A short bio".to_string()),
            badges: Some(vec!["VIP".to_string()]),
        };
        assert!(valid.validate().is_ok());

        let too_long_bio = UpdateProfileRequest {
            display_name: None,
            first_name: None,
            last_name: None,
            avatar_url: None,
            banner_url: None,
            bio: Some("a".repeat(501)),
            badges: None,
        };
        assert!(too_long_bio.validate().is_err());
    }
}

