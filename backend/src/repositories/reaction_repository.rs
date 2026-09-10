use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::message::MessageReaction;

pub enum ToggleResult {
    Added(()),
    Removed,
}

pub async fn toggle_reaction(
    pool: &PgPool,
    message_id: Uuid,
    user_id: Uuid,
    reaction: &str,
) -> Result<ToggleResult, AppError> {
    // Check if the reaction already exists
    let existing = sqlx::query_as::<_, MessageReaction>(
        "SELECT message_id, user_id, reaction, created_at FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND reaction = $3"
    )
    .bind(message_id)
    .bind(user_id)
    .bind(reaction)
    .fetch_optional(pool)
    .await?;

    if existing.is_some() {
        // Remove it
        sqlx::query(
            "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND reaction = $3",
        )
        .bind(message_id)
        .bind(user_id)
        .bind(reaction)
        .execute(pool)
        .await?;

        Ok(ToggleResult::Removed)
    } else {
        // Add it
        let _added = sqlx::query_as::<_, MessageReaction>(
            r#"
            INSERT INTO message_reactions (message_id, user_id, reaction)
            VALUES ($1, $2, $3)
            RETURNING message_id, user_id, reaction, created_at
            "#,
        )
        .bind(message_id)
        .bind(user_id)
        .bind(reaction)
        .fetch_one(pool)
        .await?;

        Ok(ToggleResult::Added(()))
    }
}

pub async fn get_reactions_for_message(
    pool: &PgPool,
    message_id: Uuid,
) -> Result<Vec<MessageReaction>, AppError> {
    let reactions = sqlx::query_as::<_, MessageReaction>(
        "SELECT message_id, user_id, reaction, created_at FROM message_reactions WHERE message_id = $1",
    )
    .bind(message_id)
    .fetch_all(pool)
    .await?;

    Ok(reactions)
}
