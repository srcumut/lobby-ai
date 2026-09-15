use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::notification_repository;
use crate::schemas::notification::NotificationResponse;
use crate::schemas::ws_event::WsOutgoingEvent;
use crate::state::SharedState;

pub async fn create_notification(
    state: &SharedState,
    user_id: Uuid,
    notification_type: &str,
    title: &str,
    message: &str,
    related_entity_id: Option<Uuid>,
) -> Result<(), AppError> {
    let notification: crate::models::notification::Notification = notification_repository::create_notification(
        &state.db,
        user_id,
        notification_type,
        title,
        message,
        related_entity_id,
    )
    .await?;

    let event = WsOutgoingEvent {
        event_type: "notification.new".to_string(),
        payload: serde_json::to_value(&notification).unwrap(),
    };

    state.global_ws_manager.send_to_user(user_id, event).await;

    Ok(())
}

pub async fn get_user_notifications(
    state: &SharedState,
    user_id: Uuid,
) -> Result<Vec<NotificationResponse>, AppError> {
    let notifications = notification_repository::get_user_notifications(&state.db, user_id).await?;

    let responses = notifications
        .into_iter()
        .map(|n| NotificationResponse {
            id: n.id,
            r#type: n.r#type,
            title: n.title,
            message: n.message,
            related_entity_id: n.related_entity_id,
            is_read: n.is_read,
            created_at: n.created_at,
        })
        .collect();

    Ok(responses)
}

pub async fn mark_as_read(
    state: &SharedState,
    user_id: Uuid,
    id: Uuid,
) -> Result<(), AppError> {
    let success = notification_repository::mark_as_read(&state.db, id, user_id).await?;
    if !success {
        return Err(AppError::NotFound("Notification not found".to_string()));
    }
    Ok(())
}

pub async fn mark_all_as_read(
    state: &SharedState,
    user_id: Uuid,
) -> Result<(), AppError> {
    notification_repository::mark_all_as_read(&state.db, user_id).await?;
    Ok(())
}
