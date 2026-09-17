// ============================================================================
// TARGET_DESTINATION: backend/src/services/upload_service.rs
// PURPOSE: Business logic for receiving, validating, saving and deleting avatar image uploads
// ============================================================================

use axum::extract::Multipart;
use uuid::Uuid;

use crate::errors::AppError;

pub const MAX_AVATAR_SIZE_BYTES: usize = 5 * 1024 * 1024; // 5 MB
pub const UPLOADS_AVATARS_DIR: &str = "uploads/avatars";

/// Inspects the first bytes of the payload to verify it is genuinely a supported image format.
fn detect_and_verify_image_format(bytes: &[u8]) -> Result<&'static str, AppError> {
    if bytes.len() < 12 {
        return Err(AppError::Validation("Uploaded file is too small to be a valid image".to_string()));
    }

    // PNG: \x89PNG\r\n\x1a\n
    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        return Ok("png");
    }

    // JPEG: \xff\xd8\xff
    if bytes.starts_with(b"\xff\xd8\xff") {
        return Ok("jpg");
    }

    // GIF: GIF87a or GIF89a
    if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        return Ok("gif");
    }

    // WebP: starts with "RIFF" and bytes 8..12 are "WEBP"
    if bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" {
        return Ok("webp");
    }

    Err(AppError::Validation(
        "Invalid image signature. Only valid PNG, JPG, WebP, and GIF files are accepted".to_string(),
    ))
}

/// Saves an avatar file from a multipart form payload after rigorous validation.
/// Returns the public relative path `/api/uploads/avatars/<uuid>.<ext>`.
pub async fn save_avatar_file(mut multipart: Multipart) -> Result<String, AppError> {
    // Ensure the avatars upload directory exists
    tokio::fs::create_dir_all(UPLOADS_AVATARS_DIR)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to create avatars upload directory: {}", e)))?;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Failed to parse multipart field: {}", e)))?
    {
        let content_type = field
            .content_type()
            .map(|s| s.split(';').next().unwrap_or("").trim().to_lowercase());
        let client_filename = field.file_name().map(|s| s.to_string());

        // Skip non-file form fields
        let is_file_candidate = client_filename.is_some()
            || content_type.as_deref().map_or(false, |ct| ct.starts_with("image/"))
            || field.name() == Some("file");

        if !is_file_candidate {
            continue;
        }

        let bytes = field
            .bytes()
            .await
            .map_err(|e| AppError::BadRequest(format!("Failed to read file data: {}", e)))?;

        if bytes.is_empty() {
            continue;
        }

        if bytes.len() > MAX_AVATAR_SIZE_BYTES {
            return Err(AppError::Validation("Image file is too large (maximum allowed: 5MB)".to_string()));
        }

        // Verify magic bytes signature to prevent extension spoofing
        let detected_ext = detect_and_verify_image_format(&bytes)?;

        // Cross-verify with MIME if available
        if let Some(ref mime) = content_type {
            let matches_mime = match (detected_ext, mime.as_str()) {
                ("png", "image/png") => true,
                ("jpg", "image/jpeg") | ("jpg", "image/jpg") => true,
                ("webp", "image/webp") => true,
                ("gif", "image/gif") => true,
                (_, "application/octet-stream") | (_, "") => true,
                _ => true,
            };
            if !matches_mime {
                return Err(AppError::Validation("Image content does not match reported MIME type".to_string()));
            }
        }

        // Generate unpredictable UUID filename to avoid path traversal and file collisions
        let filename = format!("{}.{}", Uuid::new_v4(), detected_ext);
        let destination_path = format!("{}/{}", UPLOADS_AVATARS_DIR, filename);

        tokio::fs::write(&destination_path, &bytes)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to write avatar file to disk: {}", e)))?;

        return Ok(format!("/api/uploads/avatars/{}", filename));
    }

    Err(AppError::BadRequest("No valid image file was found in the upload payload".to_string()))
}

/// Asynchronously deletes a locally stored avatar file if the avatar_url refers to our uploads directory.
pub async fn delete_local_avatar_file(avatar_url: &str) {
    const PREFIX: &str = "/api/uploads/avatars/";
    if let Some(filename) = avatar_url.strip_prefix(PREFIX) {
        if !filename.contains('/') && !filename.contains('\\') && !filename.contains("..") {
            let file_path = format!("{}/{}", UPLOADS_AVATARS_DIR, filename);
            let _ = tokio::fs::remove_file(file_path).await;
        }
    }
}
