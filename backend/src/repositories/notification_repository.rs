use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::notification::Notification;

pub async fn create_notification(
    pool: &PgPool,
    user_id: Uuid,
    notification_type: &str,
    title: &str,
    message: &str,
    related_entity_id: Option<Uuid>,
) -> Result<Notification, AppError> {
    let notification = sqlx::query_as::<_, Notification>(
        r#"
        INSERT INTO notifications (user_id, type, title, message, related_entity_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, type, title, message, related_entity_id, is_read, created_at
        "#,
    )
    .bind(user_id)
    .bind(notification_type)
    .bind(title)
    .bind(message)
    .bind(related_entity_id)
    .fetch_one(pool)
    .await?;

    Ok(notification)
}

pub async fn get_user_notifications(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<Notification>, AppError> {
    let notifications = sqlx::query_as::<_, Notification>(
        r#"
        SELECT id, user_id, type, title, message, related_entity_id, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 100
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(notifications)
}

pub async fn mark_as_read(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
) -> Result<bool, AppError> {
    let result = sqlx::query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2"
    )
    .bind(id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn mark_all_as_read(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE notifications SET is_read = true WHERE user_id = $1"
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}
