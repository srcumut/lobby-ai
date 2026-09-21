use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::schemas::notification::{NotificationQuery, NotificationResponse};
use crate::services::notification_service;
use crate::state::SharedState;

pub async fn get_notifications(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Query(query): Query<NotificationQuery>,
) -> Result<Json<Vec<NotificationResponse>>, AppError> {
    let include_all = query.all.unwrap_or(false);
    let notifications = notification_service::get_user_notifications(&state, auth.user_id, include_all).await?;
    Ok(Json(notifications))
}

pub async fn get_all_notifications(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<NotificationResponse>>, AppError> {
    let notifications = notification_service::get_user_notifications(&state, auth.user_id, true).await?;
    Ok(Json(notifications))
}

pub async fn mark_as_read(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(id): Path<Uuid>,
) -> Result<Json<NotificationResponse>, AppError> {
    let notification = notification_service::mark_as_read(&state, auth.user_id, id).await?;
    Ok(Json(notification))
}

pub async fn mark_all_as_read(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<serde_json::Value>, AppError> {
    notification_service::mark_all_as_read(&state, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "message": "All notifications marked as read" })))
}
