use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;
use crate::models::user::{User, FriendRequest};
use crate::schemas::user::IncomingFriendRequest;
use crate::schemas::auth::UserInfo;
pub async fn create_user(
    pool: &PgPool,
    username: &str,
    email: &str,
    password_hash: &str,
    display_name: Option<&str>,
) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (username, email, password_hash, display_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, is_bot, created_at, updated_at
        "#,
    )
    .bind(username)
    .bind(email)
    .bind(password_hash)
    .bind(display_name)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, is_bot, created_at, updated_at FROM users WHERE email = $1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, is_bot, created_at, updated_at FROM users WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(user)
}

pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, is_bot, created_at, updated_at FROM users WHERE username = $1",
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;
    Ok(user)
}

pub async fn update_profile(
    pool: &PgPool,
    user_id: Uuid,
    display_name: Option<&str>,
    first_name: Option<&str>,
    last_name: Option<&str>,
    avatar_url: Option<&str>,
    banner_url: Option<&str>,
    bio: Option<&str>,
    badges: Option<&[String]>,
) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users 
        SET display_name = COALESCE($1, display_name), 
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            avatar_url = COALESCE($4, avatar_url),
            banner_url = COALESCE($5, banner_url),
            bio = COALESCE($6, bio),
            badges = COALESCE($7, badges),
            updated_at = now() 
        WHERE id = $8
        RETURNING id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, is_bot, created_at, updated_at
        "#,
    )
    .bind(display_name)
    .bind(first_name)
    .bind(last_name)
    .bind(avatar_url)
    .bind(banner_url)
    .bind(bio)
    .bind(badges)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn update_avatar(
    pool: &PgPool,
    user_id: Uuid,
    avatar_url: Option<&str>,
) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users 
        SET avatar_url = $1, updated_at = now() 
        WHERE id = $2
        RETURNING id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, is_bot, created_at, updated_at
        "#,
    )
    .bind(avatar_url)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn update_banner(
    pool: &PgPool,
    user_id: Uuid,
    banner_url: Option<&str>,
) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users 
        SET banner_url = $1, updated_at = now() 
        WHERE id = $2
        RETURNING id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, is_bot, created_at, updated_at
        "#,
    )
    .bind(banner_url)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn create_friend_request(
    pool: &PgPool,
    sender_id: Uuid,
    receiver_id: Uuid,
) -> Result<FriendRequest, AppError> {
    let req = sqlx::query_as::<_, FriendRequest>(
        r#"
        INSERT INTO friend_requests (sender_id, receiver_id, status)
        VALUES ($1, $2, 'PENDING')
        RETURNING id, sender_id, receiver_id, status, created_at, updated_at
        "#,
    )
    .bind(sender_id)
    .bind(receiver_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(db_err) = &e {
            if let Some(code) = db_err.code() {
                if code == "23505" { // unique violation
                    return AppError::Conflict("A friend request or relationship already exists between these users".to_string());
                } else if code == "23514" { // check constraint violation
                    return AppError::BadRequest("Cannot send friend request to yourself".to_string());
                }
            }
        }
        AppError::DatabaseError(e.to_string())
    })?;

    Ok(req)
}

pub async fn get_friend_request(
    pool: &PgPool,
    request_id: Uuid,
) -> Result<Option<FriendRequest>, AppError> {
    let req = sqlx::query_as::<_, FriendRequest>(
        "SELECT id, sender_id, receiver_id, status, created_at, updated_at FROM friend_requests WHERE id = $1",
    )
    .bind(request_id)
    .fetch_optional(pool)
    .await?;
    
    Ok(req)
}

pub async fn get_pending_incoming_requests(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<IncomingFriendRequest>, AppError> {
    let records = sqlx::query!(
        r#"
        SELECT 
            fr.id as request_id, 
            fr.status, 
            fr.created_at,
            u.id as sender_id,
            u.username,
            u.email,
            u.display_name,
            u.first_name,
            u.last_name,
            u.avatar_url,
            u.banner_url,
            u.bio,
            u.badges,
            u.is_bot,
            u.coins,
            u.created_at as user_created_at
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = $1 AND fr.status = 'PENDING'
        ORDER BY fr.created_at DESC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    let requests = records.into_iter().map(|r| IncomingFriendRequest {
        id: r.request_id,
        status: r.status,
        created_at: r.created_at,
        sender: UserInfo {
            id: r.sender_id,
            username: r.username,
            email: r.email,
            display_name: r.display_name,
            first_name: r.first_name,
            last_name: r.last_name,
            avatar_url: r.avatar_url,
            banner_url: r.banner_url,
            bio: r.bio,
            badges: r.badges,
            is_bot: r.is_bot,
            coins: r.coins,
            created_at: r.user_created_at,
        }
    }).collect();

    Ok(requests)
}

pub async fn update_friend_request_status(
    pool: &PgPool,
    request_id: Uuid,
    status: &str,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE friend_requests SET status = $1, updated_at = now() WHERE id = $2"
    )
    .bind(status)
    .bind(request_id)
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn delete_friend_request(
    pool: &PgPool,
    request_id: Uuid,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM friend_requests WHERE id = $1")
        .bind(request_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_friends(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<UserInfo>, AppError> {
    // A friend is someone where status = 'ACCEPTED'
    let records = sqlx::query!(
        r#"
        SELECT 
            u.id, u.username, u.email, u.display_name, u.first_name, u.last_name, u.avatar_url, u.banner_url, u.bio, u.badges, u.coins, u.is_bot, u.created_at
        FROM friend_requests fr
        JOIN users u ON (u.id = fr.sender_id OR u.id = fr.receiver_id)
        WHERE (fr.sender_id = $1 OR fr.receiver_id = $1)
          AND u.id != $1
          AND fr.status = 'ACCEPTED'
        ORDER BY u.username ASC
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    let friends = records.into_iter().map(|r| UserInfo {
        id: r.id,
        username: r.username,
        email: r.email,
        display_name: r.display_name,
        first_name: r.first_name,
        last_name: r.last_name,
        avatar_url: r.avatar_url,
        banner_url: r.banner_url,
        bio: r.bio,
        badges: r.badges,
        coins: r.coins,
        is_bot: r.is_bot,
        created_at: r.created_at,
    }).collect();

    Ok(friends)
}

pub async fn unlock_badge(pool: &PgPool, user_id: Uuid, badge: &str) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users
        SET badges = CASE 
            WHEN $2 = ANY(badges) THEN badges 
            ELSE array_append(badges, $2) 
        END,
        coins = CASE 
            WHEN $2 = ANY(badges) THEN coins 
            ELSE coins + 50 
        END,
        updated_at = NOW()
        WHERE id = $1
        RETURNING id, username, email, password_hash, display_name, first_name, last_name, avatar_url, banner_url, bio, badges, coins, is_bot, created_at, updated_at
        "#
    )
    .bind(user_id)
    .bind(badge)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn add_coins(pool: &PgPool, user_id: Uuid, amount: i32) -> Result<i32, AppError> {
    let new_coins = sqlx::query_scalar::<_, i32>(
        "UPDATE users SET coins = GREATEST(0, coins + $2), updated_at = NOW() WHERE id = $1 RETURNING coins"
    )
    .bind(user_id)
    .bind(amount)
    .fetch_one(pool)
    .await?;

    Ok(new_coins)
}

pub async fn purchase_shop_item(pool: &PgPool, user_id: Uuid, item_id: &str, item_type: &str, price: i32) -> Result<i32, AppError> {
    let mut tx = pool.begin().await?;
    let current_coins: i32 = sqlx::query_scalar("SELECT coins FROM users WHERE id = $1 FOR UPDATE")
        .bind(user_id)
        .fetch_one(&mut *tx)
        .await?;

    if current_coins < price {
        return Err(AppError::BadRequest("Yetersiz bakiye".to_string()));
    }

    let new_coins: i32 = sqlx::query_scalar("UPDATE users SET coins = coins - $2, updated_at = NOW() WHERE id = $1 RETURNING coins")
        .bind(user_id)
        .bind(price)
        .fetch_one(&mut *tx)
        .await?;

    sqlx::query("INSERT INTO user_inventory (user_id, item_id, item_type, is_equipped) VALUES ($1, $2, $3, true) ON CONFLICT (user_id, item_id) DO NOTHING")
        .bind(user_id)
        .bind(item_id)
        .bind(item_type)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(new_coins)
}

pub async fn get_inventory(pool: &PgPool, user_id: Uuid) -> Result<Vec<String>, AppError> {
    let items = sqlx::query_scalar::<_, String>("SELECT item_id FROM user_inventory WHERE user_id = $1")
        .bind(user_id)
        .fetch_all(pool)
        .await?;

    Ok(items)
}
