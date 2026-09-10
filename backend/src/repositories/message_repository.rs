use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::message::Message;

pub async fn create_message(
    pool: &PgPool,
    lobby_id: Uuid,
    sender_id: Uuid,
    content: &str,
) -> Result<Message, AppError> {
    let message = sqlx::query_as::<_, Message>(
        r#"
        INSERT INTO messages (lobby_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, lobby_id, sender_id, content, created_at, updated_at, deleted_at
        "#,
    )
    .bind(lobby_id)
    .bind(sender_id)
    .bind(content)
    .fetch_one(pool)
    .await?;

    Ok(message)
}

pub async fn get_lobby_messages(
    pool: &PgPool,
    lobby_id: Uuid,
    limit: i64,
    before: Option<Uuid>,
) -> Result<Vec<Message>, AppError> {
    let messages = match before {
        Some(before_id) => {
            sqlx::query_as::<_, Message>(
                r#"
                SELECT m.id, m.lobby_id, m.sender_id, m.content, m.created_at, m.updated_at, m.deleted_at
                FROM messages m
                WHERE m.lobby_id = $1
                  AND m.deleted_at IS NULL
                  AND m.created_at < (SELECT created_at FROM messages WHERE id = $2)
                ORDER BY m.created_at DESC
                LIMIT $3
                "#,
            )
            .bind(lobby_id)
            .bind(before_id)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        None => {
            sqlx::query_as::<_, Message>(
                r#"
                SELECT id, lobby_id, sender_id, content, created_at, updated_at, deleted_at
                FROM messages
                WHERE lobby_id = $1 AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT $2
                "#,
            )
            .bind(lobby_id)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
    };

    Ok(messages)
}

pub async fn get_message(
    pool: &PgPool,
    message_id: Uuid,
) -> Result<Option<Message>, AppError> {
    let message = sqlx::query_as::<_, Message>(
        "SELECT id, lobby_id, sender_id, content, created_at, updated_at, deleted_at FROM messages WHERE id = $1",
    )
    .bind(message_id)
    .fetch_optional(pool)
    .await?;

    Ok(message)
}
