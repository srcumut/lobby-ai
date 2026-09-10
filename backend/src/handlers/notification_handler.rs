use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::schemas::notification::NotificationResponse;
use crate::services::notification_service;
use crate::state::SharedState;

pub async fn get_notifications(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<NotificationResponse>>, AppError> {
    let notifications = notification_service::get_user_notifications(&state, auth.user_id).await?;
    Ok(Json(notifications))
}

pub async fn mark_as_read(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    notification_service::mark_as_read(&state, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Notification marked as read" })))
}

pub async fn mark_all_as_read(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    notification_service::mark_all_as_read(&state, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "message": "All notifications marked as read" })))
}
