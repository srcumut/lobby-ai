use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use crate::errors::AppError;

pub fn encrypt_key(plain_text: &str, encryption_key: &str) -> Result<(String, String), AppError> {
    if encryption_key.len() != 32 {
        return Err(AppError::Internal("Invalid ENCRYPTION_KEY length. Must be exactly 32 bytes.".to_string()));
    }
    
    let key: &Key<Aes256Gcm> = encryption_key
        .as_bytes()
        .try_into()
        .map_err(|_| AppError::Internal("Failed to convert key".to_string()))?;
    let cipher = Aes256Gcm::new(key);
    
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from(nonce_bytes);
    
    let ciphertext = cipher.encrypt(&nonce, plain_text.as_bytes())
        .map_err(|_| AppError::Internal("Encryption failed".to_string()))?;
        
    let encrypted_b64 = STANDARD.encode(&ciphertext);
    let nonce_b64 = STANDARD.encode(&nonce_bytes);
    
    Ok((encrypted_b64, nonce_b64))
}

pub fn decrypt_key(encrypted_b64: &str, nonce_b64: &str, encryption_key: &str) -> Result<String, AppError> {
    if encryption_key.len() != 32 {
        return Err(AppError::Internal("Invalid ENCRYPTION_KEY length. Must be exactly 32 bytes.".to_string()));
    }
    
    let key: &Key<Aes256Gcm> = encryption_key
        .as_bytes()
        .try_into()
        .map_err(|_| AppError::Internal("Failed to convert key".to_string()))?;
    let cipher = Aes256Gcm::new(key);
    
    let nonce_bytes = STANDARD.decode(nonce_b64)
        .map_err(|_| AppError::Internal("Invalid nonce format".to_string()))?;
    let nonce: &aes_gcm::aead::Nonce<Aes256Gcm> = nonce_bytes
        .as_slice()
        .try_into()
        .map_err(|_| AppError::Internal("Invalid nonce length".to_string()))?;
    
    let ciphertext = STANDARD.decode(encrypted_b64)
        .map_err(|_| AppError::Internal("Invalid ciphertext format".to_string()))?;
        
    let plaintext_bytes = cipher.decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| AppError::Internal("Decryption failed".to_string()))?;
        
    String::from_utf8(plaintext_bytes)
        .map_err(|_| AppError::Internal("Invalid UTF-8 in decrypted data".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_KEY: &str = "01234567890123456789012345678901"; // 32 bytes

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let plain = "sk-ant-api03-secret-key-for-testing-12345";
        let (encrypted, nonce) = encrypt_key(plain, TEST_KEY).expect("Encryption failed");

        assert_ne!(encrypted, plain);
        assert!(!nonce.is_empty());

        let decrypted = decrypt_key(&encrypted, &nonce, TEST_KEY).expect("Decryption failed");
        assert_eq!(decrypted, plain);
    }

    #[test]
    fn test_invalid_key_length() {
        let result = encrypt_key("secret", "short-key");
        assert!(result.is_err());

        let result = decrypt_key("dummy", "dummy", "short-key");
        assert!(result.is_err());
    }

    #[test]
    fn test_decrypt_with_wrong_key() {
        let plain = "super-secret-key";
        let (encrypted, nonce) = encrypt_key(plain, TEST_KEY).unwrap();

        let wrong_key = "99999999999999999999999999999999";
        let result = decrypt_key(&encrypted, &nonce, wrong_key);
        assert!(result.is_err());
    }

    #[test]
    fn test_decrypt_with_corrupted_ciphertext() {
        let plain = "another-secret";
        let (_encrypted, nonce) = encrypt_key(plain, TEST_KEY).unwrap();

        let corrupted = STANDARD.encode("not-valid-aes-gcm-ciphertext");
        let result = decrypt_key(&corrupted, &nonce, TEST_KEY);
        assert!(result.is_err());
    }
}
