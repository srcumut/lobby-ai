use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::direct_message::DirectMessage;

pub async fn are_friends(pool: &PgPool, user_a: Uuid, user_b: Uuid) -> Result<bool, AppError> {
    let result = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM friend_requests
            WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
              AND status = 'ACCEPTED'
        )
        "#,
    )
    .bind(user_a)
    .bind(user_b)
    .fetch_one(pool)
    .await?;

    Ok(result)
}

pub async fn create_direct_message(
    pool: &PgPool,
    sender_id: Uuid,
    receiver_id: Uuid,
    content: &str,
) -> Result<DirectMessage, AppError> {
    let dm = sqlx::query_as::<_, DirectMessage>(
        r#"
        INSERT INTO direct_messages (sender_id, receiver_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, sender_id, receiver_id, content, is_read, created_at, updated_at, deleted_at
        "#,
    )
    .bind(sender_id)
    .bind(receiver_id)
    .bind(content)
    .fetch_one(pool)
    .await?;

    Ok(dm)
}

pub async fn get_conversation(
    pool: &PgPool,
    user_a: Uuid,
    user_b: Uuid,
    limit: i64,
    before: Option<DateTime<Utc>>,
) -> Result<Vec<DirectMessage>, AppError> {
    let dms = match before {
        Some(before_time) => {
            sqlx::query_as::<_, DirectMessage>(
                r#"
                SELECT id, sender_id, receiver_id, content, is_read, created_at, updated_at, deleted_at
                FROM direct_messages
                WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
                  AND deleted_at IS NULL
                  AND created_at < $3
                ORDER BY created_at ASC
                LIMIT $4
                "#,
            )
            .bind(user_a)
            .bind(user_b)
            .bind(before_time)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
        None => {
            sqlx::query_as::<_, DirectMessage>(
                r#"
                SELECT id, sender_id, receiver_id, content, is_read, created_at, updated_at, deleted_at
                FROM (
                    SELECT id, sender_id, receiver_id, content, is_read, created_at, updated_at, deleted_at
                    FROM direct_messages
                    WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
                      AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT $3
                ) sub
                ORDER BY created_at ASC
                "#,
            )
            .bind(user_a)
            .bind(user_b)
            .bind(limit)
            .fetch_all(pool)
            .await?
        }
    };

    Ok(dms)
}

use crate::schemas::auth::UserInfo;
use crate::schemas::direct_message::{ConversationResponse, DirectMessageResponse};

pub async fn mark_as_read(
    pool: &PgPool,
    receiver_id: Uuid,
    sender_id: Uuid,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        UPDATE direct_messages
        SET is_read = TRUE, updated_at = now()
        WHERE receiver_id = $1
          AND sender_id = $2
          AND is_read = FALSE
          AND deleted_at IS NULL
        "#,
    )
    .bind(receiver_id)
    .bind(sender_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_conversations(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<ConversationResponse>, AppError> {
    let records = sqlx::query!(
        r#"
        SELECT 
            u.id, u.username, u.email, u.display_name, u.avatar_url, u.bio, u.is_bot, u.created_at,
            m.id as "last_message_id?",
            m.sender_id as "last_message_sender_id?",
            m.receiver_id as "last_message_receiver_id?",
            m.content as "last_message_content?",
            m.is_read as "last_message_is_read?",
            m.created_at as "last_message_created_at?",
            COALESCE(unread.unread_count, 0) as "unread_count!"
        FROM friend_requests fr
        JOIN users u ON (u.id = fr.sender_id OR u.id = fr.receiver_id)
        LEFT JOIN LATERAL (
            SELECT id, sender_id, receiver_id, content, is_read, created_at
            FROM direct_messages
            WHERE ((sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1))
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        ) m ON true
        LEFT JOIN (
            SELECT sender_id, COUNT(*) as unread_count
            FROM direct_messages
            WHERE receiver_id = $1 AND is_read = FALSE AND deleted_at IS NULL
            GROUP BY sender_id
        ) unread ON unread.sender_id = u.id
        WHERE (fr.sender_id = $1 OR fr.receiver_id = $1)
          AND u.id != $1
          AND fr.status = 'ACCEPTED'
        ORDER BY m.created_at DESC NULLS LAST, u.username ASC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    let conversations = records
        .into_iter()
        .map(|r| {
            let last_message = match (
                r.last_message_id,
                r.last_message_sender_id,
                r.last_message_receiver_id,
                r.last_message_content,
                r.last_message_is_read,
                r.last_message_created_at,
            ) {
                (
                    Some(id),
                    Some(sender_id),
                    Some(receiver_id),
                    Some(content),
                    Some(is_read),
                    Some(created_at),
                ) => Some(DirectMessageResponse {
                    id,
                    sender_id,
                    receiver_id,
                    content,
                    is_read,
                    created_at,
                }),
                _ => None,
            };

            ConversationResponse {
                friend: UserInfo {
                    id: r.id,
                    username: r.username,
                    email: r.email,
                    display_name: r.display_name,
                    avatar_url: r.avatar_url,
                    bio: r.bio,
                    is_bot: r.is_bot,
                    created_at: r.created_at,
                },
                last_message,
                unread_count: r.unread_count,
            }
        })
        .collect();

    Ok(conversations)
}
