use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::errors::AppError;
use crate::schemas::message::MessageSender;
use crate::schemas::poll::{PollOptionResponse, PollResponse};

pub async fn create_poll(
    pool: &PgPool,
    lobby_id: Uuid,
    creator_id: Uuid,
    question: &str,
    is_multiple_choice: bool,
    ends_at: Option<DateTime<Utc>>,
    options: &[String],
) -> Result<PollResponse, AppError> {
    let mut tx = pool.begin().await?;

    let poll_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO polls (lobby_id, creator_id, question, is_multiple_choice, ends_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
    )
    .bind(lobby_id)
    .bind(creator_id)
    .bind(question)
    .bind(is_multiple_choice)
    .bind(ends_at)
    .fetch_one(&mut *tx)
    .await?;

    for (pos, text) in options.iter().enumerate() {
        sqlx::query(
            r#"
            INSERT INTO poll_options (poll_id, text, position)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(poll_id)
        .bind(text)
        .bind(pos as i32)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    get_poll_by_id(pool, poll_id, creator_id)
        .await?
        .ok_or_else(|| AppError::Internal("Yeni oluşturulan anket bulunamadı".to_string()))
}

pub async fn get_poll_by_id(
    pool: &PgPool,
    poll_id: Uuid,
    current_user_id: Uuid,
) -> Result<Option<PollResponse>, AppError> {
    let poll_row = sqlx::query(
        r#"
        SELECT 
            p.id, p.lobby_id, p.creator_id, p.question, p.is_multiple_choice, p.is_closed, p.ends_at, p.created_at,
            u.id as user_id, u.username, u.display_name, u.avatar_url
        FROM polls p
        JOIN users u ON u.id = p.creator_id
        WHERE p.id = $1
        "#,
    )
    .bind(poll_id)
    .fetch_optional(pool)
    .await?;

    let row = match poll_row {
        Some(r) => r,
        None => return Ok(None),
    };

    let option_rows = sqlx::query(
        r#"
        SELECT 
            o.id, o.poll_id, o.text, o.position,
            COUNT(v.user_id)::BIGINT AS vote_count,
            COALESCE(BOOL_OR(v.user_id = $2), false) AS has_voted
        FROM poll_options o
        LEFT JOIN poll_votes v ON v.option_id = o.id
        WHERE o.poll_id = $1
        GROUP BY o.id, o.poll_id, o.text, o.position
        ORDER BY o.position ASC
        "#,
    )
    .bind(poll_id)
    .bind(current_user_id)
    .fetch_all(pool)
    .await?;

    let total_votes: i64 = option_rows
        .iter()
        .map(|r| r.get::<i64, _>("vote_count"))
        .sum();

    let mut user_voted = false;
    let options = option_rows
        .into_iter()
        .map(|r| {
            let vote_count: i64 = r.get("vote_count");
            let has_voted: bool = r.get("has_voted");
            if has_voted {
                user_voted = true;
            }
            let percentage = if total_votes > 0 {
                (vote_count as f64 / total_votes as f64) * 100.0
            } else {
                0.0
            };

            PollOptionResponse {
                id: r.get("id"),
                poll_id: r.get("poll_id"),
                text: r.get("text"),
                position: r.get("position"),
                vote_count,
                percentage,
                has_voted,
            }
        })
        .collect();

    let ends_at: Option<DateTime<Utc>> = row.get("ends_at");
    let mut is_closed: bool = row.get("is_closed");
    if !is_closed {
        if let Some(expiry) = ends_at {
            if Utc::now() > expiry {
                is_closed = true;
            }
        }
    }

    Ok(Some(PollResponse {
        id: row.get("id"),
        lobby_id: row.get("lobby_id"),
        creator: MessageSender {
            id: row.get("user_id"),
            username: row.get("username"),
            display_name: row.get("display_name"),
            avatar_url: row.get("avatar_url"),
        },
        question: row.get("question"),
        is_multiple_choice: row.get("is_multiple_choice"),
        is_closed,
        total_votes,
        options,
        ends_at,
        created_at: row.get("created_at"),
        user_voted,
    }))
}

pub async fn get_polls_by_lobby(
    pool: &PgPool,
    lobby_id: Uuid,
    current_user_id: Uuid,
) -> Result<Vec<PollResponse>, AppError> {
    let poll_ids: Vec<Uuid> = sqlx::query_scalar(
        r#"
        SELECT id FROM polls
        WHERE lobby_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(lobby_id)
    .fetch_all(pool)
    .await?;

    let mut polls = Vec::new();
    for id in poll_ids {
        if let Some(poll) = get_poll_by_id(pool, id, current_user_id).await? {
            polls.push(poll);
        }
    }

    Ok(polls)
}

pub async fn vote_poll(
    pool: &PgPool,
    poll_id: Uuid,
    option_id: Uuid,
    user_id: Uuid,
    is_multiple_choice: bool,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;

    // Check if user already voted for this option
    let already_voted: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM poll_votes
            WHERE poll_id = $1 AND option_id = $2 AND user_id = $3
        )
        "#,
    )
    .bind(poll_id)
    .bind(option_id)
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await?;

    if already_voted {
        // Toggle off
        sqlx::query(
            r#"
            DELETE FROM poll_votes
            WHERE poll_id = $1 AND option_id = $2 AND user_id = $3
            "#,
        )
        .bind(poll_id)
        .bind(option_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    } else {
        // If single-choice, remove any existing vote for other options in this poll
        if !is_multiple_choice {
            sqlx::query(
                r#"
                DELETE FROM poll_votes
                WHERE poll_id = $1 AND user_id = $2
                "#,
            )
            .bind(poll_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        }

        // Insert new vote
        sqlx::query(
            r#"
            INSERT INTO poll_votes (poll_id, option_id, user_id)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(poll_id)
        .bind(option_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

pub async fn close_poll(pool: &PgPool, poll_id: Uuid) -> Result<(), AppError> {
    sqlx::query(
        r#"
        UPDATE polls
        SET is_closed = true
        WHERE id = $1
        "#,
    )
    .bind(poll_id)
    .execute(pool)
    .await?;

    Ok(())
}
