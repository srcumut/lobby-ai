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
    
    let key = Key::<Aes256Gcm>::from_slice(encryption_key.as_bytes());
    let cipher = Aes256Gcm::new(key);
    
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes); // 96-bits; unique per message
    
    let ciphertext = cipher.encrypt(nonce, plain_text.as_bytes())
        .map_err(|_| AppError::Internal("Encryption failed".to_string()))?;
        
    let encrypted_b64 = STANDARD.encode(&ciphertext);
    let nonce_b64 = STANDARD.encode(&nonce_bytes);
    
    Ok((encrypted_b64, nonce_b64))
}

pub fn decrypt_key(encrypted_b64: &str, nonce_b64: &str, encryption_key: &str) -> Result<String, AppError> {
    if encryption_key.len() != 32 {
        return Err(AppError::Internal("Invalid ENCRYPTION_KEY length. Must be exactly 32 bytes.".to_string()));
    }
    
    let key = Key::<Aes256Gcm>::from_slice(encryption_key.as_bytes());
    let cipher = Aes256Gcm::new(key);
    
    let nonce_bytes = STANDARD.decode(nonce_b64)
        .map_err(|_| AppError::Internal("Invalid nonce format".to_string()))?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = STANDARD.decode(encrypted_b64)
        .map_err(|_| AppError::Internal("Invalid ciphertext format".to_string()))?;
        
    let plaintext_bytes = cipher.decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| AppError::Internal("Decryption failed".to_string()))?;
        
    String::from_utf8(plaintext_bytes)
        .map_err(|_| AppError::Internal("Invalid UTF-8 in decrypted data".to_string()))
}
