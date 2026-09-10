use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::lobby::{Lobby, LobbyMember};

pub async fn create_lobby(
    pool: &PgPool,
    name: &str,
    description: Option<&str>,
    owner_id: Uuid,
    visibility: &str,
    password_hash: Option<&str>,
) -> Result<Lobby, AppError> {
    let lobby = sqlx::query_as::<_, Lobby>(
        r#"
        INSERT INTO lobbies (name, description, owner_id, visibility, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, owner_id, visibility, password_hash, created_at, updated_at
        "#,
    )
    .bind(name)
    .bind(description)
    .bind(owner_id)
    .bind(visibility)
    .bind(password_hash)
    .fetch_one(pool)
    .await?;

    Ok(lobby)
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Lobby>, AppError> {
    let lobby = sqlx::query_as::<_, Lobby>(
        "SELECT id, name, description, owner_id, visibility, password_hash, created_at, updated_at FROM lobbies WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(lobby)
}

pub async fn list_public_lobbies(pool: &PgPool) -> Result<Vec<Lobby>, AppError> {
    let lobbies = sqlx::query_as::<_, Lobby>(
        "SELECT id, name, description, owner_id, visibility, password_hash, created_at, updated_at FROM lobbies WHERE visibility = 'PUBLIC' ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await?;

    Ok(lobbies)
}

pub async fn get_member_count(pool: &PgPool, lobby_id: Uuid) -> Result<i64, AppError> {
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM lobby_members WHERE lobby_id = $1")
        .bind(lobby_id)
        .fetch_one(pool)
        .await?;

    Ok(row.0)
}

pub async fn add_member(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
    role: &str,
) -> Result<LobbyMember, AppError> {
    let member = sqlx::query_as::<_, LobbyMember>(
        r#"
        INSERT INTO lobby_members (lobby_id, user_id, role)
        VALUES ($1, $2, $3)
        RETURNING lobby_id, user_id, role, joined_at
        "#,
    )
    .bind(lobby_id)
    .bind(user_id)
    .bind(role)
    .fetch_one(pool)
    .await?;

    Ok(member)
}

pub async fn remove_member(pool: &PgPool, lobby_id: Uuid, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query("DELETE FROM lobby_members WHERE lobby_id = $1 AND user_id = $2")
        .bind(lobby_id)
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn is_member(pool: &PgPool, lobby_id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
    let row: (bool,) = sqlx::query_as(
        "SELECT EXISTS(SELECT 1 FROM lobby_members WHERE lobby_id = $1 AND user_id = $2)",
    )
    .bind(lobby_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(row.0)
}

pub async fn get_member_role(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
) -> Result<Option<String>, AppError> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT role FROM lobby_members WHERE lobby_id = $1 AND user_id = $2")
            .bind(lobby_id)
            .bind(user_id)
            .fetch_optional(pool)
            .await?;

    Ok(row.map(|r| r.0))
}

pub async fn update_member_role(
    pool: &PgPool,
    lobby_id: Uuid,
    user_id: Uuid,
    role: &str,
) -> Result<LobbyMember, AppError> {
    let member = sqlx::query_as::<_, LobbyMember>(
        r#"
        UPDATE lobby_members 
        SET role = $1
        WHERE lobby_id = $2 AND user_id = $3
        RETURNING lobby_id, user_id, role, joined_at
        "#,
    )
    .bind(role)
    .bind(lobby_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(member)
}

