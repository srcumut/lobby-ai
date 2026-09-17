// ============================================================================
// TARGET_DESTINATION: backend/src/handlers/upload_handler.rs
// PURPOSE: HTTP handler for general multipart avatar file uploads
// ============================================================================

use axum::{
    extract::{Multipart, State},
    Json,
};
use serde_json::{json, Value};

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::services::upload_service;
use crate::state::SharedState;

/// POST /api/uploads/avatar
/// Handles direct multipart image file upload and returns the public avatar URL.
pub async fn upload_avatar(
    State(_state): State<SharedState>,
    _auth: AuthenticatedUser,
    multipart: Multipart,
) -> Result<Json<Value>, AppError> {
    let avatar_url = upload_service::save_avatar_file(multipart).await?;
    Ok(Json(json!({
        "avatar_url": avatar_url,
        "message": "Avatar uploaded successfully"
    })))
}
