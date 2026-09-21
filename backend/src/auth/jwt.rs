use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: i64,
    pub iat: i64,
}

pub fn generate_access_token(user_id: Uuid, secret: &str) -> Result<String, AppError> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id,
        iat: now.timestamp(),
        exp: (now + Duration::minutes(15)).timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Token generation failed: {e}")))
}

pub fn generate_refresh_token(user_id: Uuid, secret: &str) -> Result<String, AppError> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id,
        iat: now.timestamp(),
        exp: (now + Duration::days(7)).timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Token generation failed: {e}")))
}

pub fn validate_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| AppError::Unauthorized("Invalid or expired token".to_string()))?;

    Ok(token_data.claims)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_SECRET: &str = "my_super_secret_jwt_key_that_is_32_bytes_long!";

    #[test]
    fn test_generate_and_validate_access_token() {
        let user_id = Uuid::new_v4();
        let token = generate_access_token(user_id, TEST_SECRET).expect("Token should be created");

        let claims = validate_token(&token, TEST_SECRET).expect("Token should be valid");
        assert_eq!(claims.sub, user_id);
        assert!(claims.exp > claims.iat);
    }

    #[test]
    fn test_generate_and_validate_refresh_token() {
        let user_id = Uuid::new_v4();
        let token = generate_refresh_token(user_id, TEST_SECRET).expect("Refresh token should be created");

        let claims = validate_token(&token, TEST_SECRET).expect("Refresh token should be valid");
        assert_eq!(claims.sub, user_id);
        assert!(claims.exp > claims.iat);
    }

    #[test]
    fn test_validate_token_with_wrong_secret_fails() {
        let user_id = Uuid::new_v4();
        let token = generate_access_token(user_id, TEST_SECRET).unwrap();

        let wrong_secret = "completely_different_secret_key_12345678";
        let result = validate_token(&token, wrong_secret);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_tampered_token_fails() {
        let user_id = Uuid::new_v4();
        let token = generate_access_token(user_id, TEST_SECRET).unwrap();
        let tampered = format!("{}tampered", token);

        let result = validate_token(&tampered, TEST_SECRET);
        assert!(result.is_err());
    }
}
