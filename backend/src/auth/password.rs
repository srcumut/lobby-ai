use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};

use crate::errors::AppError;

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {e}")))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash =
        PasswordHash::new(hash).map_err(|e| AppError::Internal(format!("Invalid hash: {e}")))?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_and_verify_password_success() {
        let password = "SuperSecretPassword123!";
        let hash = hash_password(password).expect("Hashing should succeed");

        assert_ne!(password, hash);
        assert!(verify_password(password, &hash).expect("Verification should succeed"));
    }

    #[test]
    fn test_verify_wrong_password_returns_false() {
        let password = "CorrectPassword123";
        let wrong_password = "WrongPassword123";
        let hash = hash_password(password).unwrap();

        let is_valid = verify_password(wrong_password, &hash).unwrap();
        assert!(!is_valid);
    }

    #[test]
    fn test_verify_invalid_hash_format_returns_err() {
        let result = verify_password("somepassword", "not_a_valid_argon2_hash");
        assert!(result.is_err());
    }
}
