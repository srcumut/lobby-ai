use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::lobby::LobbyJoinRequest;
use crate::schemas::lobby::JoinRequestResponse;

pub async fn create_request(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
) -> Result<LobbyJoinRequest, AppError> {
    let req = sqlx::query_as::<_, LobbyJoinRequest>(
        r#"
        INSERT INTO lobby_join_requests (lobby_id, user_id, status)
        VALUES ($1, $2, 'PENDING')
        ON CONFLICT (lobby_id, user_id) DO UPDATE SET status = 'PENDING', updated_at = now()
        RETURNING lobby_id, user_id, status, created_at, updated_at
        "#,
    )
    .bind(lobby_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(req)
}

pub async fn update_status(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
    status: &str,
) -> Result<bool, AppError> {
    let result = sqlx::query(
        "UPDATE lobby_join_requests SET status = $1, updated_at = now() WHERE lobby_id = $2 AND user_id = $3"
    )
    .bind(status)
    .bind(lobby_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn list_pending_requests(
    pool: &PgPool,
    lobby_id: Uuid,
) -> Result<Vec<JoinRequestResponse>, AppError> {
    let requests = sqlx::query_as::<_, JoinRequestResponse>(
        r#"
        SELECT 
            r.lobby_id, 
            r.user_id, 
            u.username, 
            u.display_name, 
            r.status, 
            r.created_at
        FROM lobby_join_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.lobby_id = $1 AND r.status = 'PENDING'
        ORDER BY r.created_at ASC
        "#
    )
    .bind(lobby_id)
    .fetch_all(pool)
    .await?;

    Ok(requests)
}

