use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::AppError;

pub async fn award_xp(pool: &PgPool, lobby_id: Uuid, amount: i64) -> Result<i64, AppError> {
    sqlx::query_scalar::<_, i64>("UPDATE lobbies SET xp = xp + $2 WHERE id = $1 RETURNING xp")
        .bind(lobby_id)
        .bind(amount)
        .fetch_one(pool)
        .await
        .map_err(Into::into)
}

// Lock the lobby row so starts and guesses from different connections stay ordered.
pub async fn play_bomb(pool: &PgPool, lobby_id: Uuid, guess: Option<i16>) -> Result<Option<String>, AppError> {
    let mut tx = pool.begin().await?;
    sqlx::query("SELECT id FROM lobbies WHERE id = $1 FOR UPDATE")
        .bind(lobby_id)
        .fetch_one(&mut *tx)
        .await?;

    let active: Option<(i16, i16, i16)> = sqlx::query_as(
        "SELECT target, lower_bound, upper_bound FROM lobby_bomb_games WHERE lobby_id = $1 AND expires_at > NOW()"
    )
    .bind(lobby_id)
    .fetch_optional(&mut *tx)
    .await?;

    let result = match (active, guess) {
        (Some(_), None) => Some("💣 [BOMBA]: Oyun sürüyor! 1-100 arasında bir sayı yaz.".to_string()),
        (None, Some(_)) => None,
        (None, None) => {
            let target = (rand::random::<u32>() % 100 + 1) as i16;
            sqlx::query("INSERT INTO lobby_bomb_games (lobby_id, target, lower_bound, upper_bound, expires_at) VALUES ($1, $2, 1, 100, NOW() + INTERVAL '30 seconds') ON CONFLICT (lobby_id) DO UPDATE SET target = EXCLUDED.target, lower_bound = 1, upper_bound = 100, expires_at = EXCLUDED.expires_at")
                .bind(lobby_id).bind(target).execute(&mut *tx).await?;
            Some("💣 [BOMBA]: Başladı! 30 saniyede 1-100 arasında tahmin yapın.".to_string())
        }
        (Some((target, low, high)), Some(number)) if number < low || number > high => {
            Some(format!("💣 [BOMBA]: {number} aralık dışında! Aralık: {low} - {high}"))
        }
        (Some((target, _, _)), Some(number)) if number == target => {
            sqlx::query("DELETE FROM lobby_bomb_games WHERE lobby_id = $1")
                .bind(lobby_id).execute(&mut *tx).await?;
            Some(format!("💥 [BOMBA PATLADI]: {number} bombaydı!"))
        }
        (Some((target, low, high)), Some(number)) => {
            let (next_low, next_high) = if number < target { (number + 1, high) } else { (low, number - 1) };
            sqlx::query("UPDATE lobby_bomb_games SET lower_bound = $2, upper_bound = $3 WHERE lobby_id = $1")
                .bind(lobby_id).bind(next_low).bind(next_high).execute(&mut *tx).await?;
            Some(format!("💣 [BOMBA]: {number} güvenli! Sıcak! Aralık: {next_low} - {next_high}"))
        }
    };
    tx.commit().await?;
    Ok(result)
}

pub async fn expire_bomb(pool: &PgPool, lobby_id: Uuid) -> Result<Option<i16>, AppError> {
    sqlx::query_scalar::<_, i16>("DELETE FROM lobby_bomb_games WHERE lobby_id = $1 AND expires_at <= NOW() RETURNING target")
        .bind(lobby_id)
        .fetch_optional(pool)
        .await
        .map_err(Into::into)
}
