use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::lobby::{LobbyBan, LobbyMute};

pub async fn ban_user(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
    banned_by: Uuid,
) -> Result<LobbyBan, AppError> {
    let ban = sqlx::query_as::<_, LobbyBan>(
        r#"
        INSERT INTO lobby_bans (lobby_id, user_id, banned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (lobby_id, user_id) DO UPDATE SET banned_by = EXCLUDED.banned_by, banned_at = now()
        RETURNING lobby_id, user_id, banned_by, banned_at
        "#,
    )
    .bind(lobby_id)
    .bind(user_id)
    .bind(banned_by)
    .fetch_one(pool)
    .await?;

    Ok(ban)
}

pub async fn unban_user(pool: &PgPool, lobby_id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
    let result = sqlx::query(
        "DELETE FROM lobby_bans WHERE lobby_id = $1 AND user_id = $2"
    )
    .bind(lobby_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn get_ban(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
) -> Result<Option<LobbyBan>, AppError> {
    let ban = sqlx::query_as::<_, LobbyBan>(
        "SELECT lobby_id, user_id, banned_by, banned_at FROM lobby_bans WHERE lobby_id = $1 AND user_id = $2",
    )
    .bind(lobby_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(ban)
}

pub async fn mute_user(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
    muted_by: Uuid,
    muted_until: Option<DateTime<Utc>>,
) -> Result<LobbyMute, AppError> {
    let mute = sqlx::query_as::<_, LobbyMute>(
        r#"
        INSERT INTO lobby_mutes (lobby_id, user_id, muted_by, muted_until)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (lobby_id, user_id) DO UPDATE SET muted_by = EXCLUDED.muted_by, muted_at = now(), muted_until = EXCLUDED.muted_until
        RETURNING lobby_id, user_id, muted_by, muted_at, muted_until
        "#,
    )
    .bind(lobby_id)
    .bind(user_id)
    .bind(muted_by)
    .bind(muted_until)
    .fetch_one(pool)
    .await?;

    Ok(mute)
}

pub async fn unmute_user(pool: &PgPool, lobby_id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
    let result = sqlx::query(
        "DELETE FROM lobby_mutes WHERE lobby_id = $1 AND user_id = $2"
    )
    .bind(lobby_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn get_mute(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
) -> Result<Option<LobbyMute>, AppError> {
    let mute = sqlx::query_as::<_, LobbyMute>(
        "SELECT lobby_id, user_id, muted_by, muted_at, muted_until FROM lobby_mutes WHERE lobby_id = $1 AND user_id = $2",
    )
    .bind(lobby_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(mute)
}
