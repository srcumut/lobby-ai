use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::{game_repository, user_repository};
use crate::state::SharedState;

pub struct GameMessage {
    pub content: String,
    pub xp: i64,
}

pub async fn process_command(
    state: &SharedState,
    lobby_id: Uuid,
    sender_id: Uuid,
    sender_name: &str,
    content: &str,
) -> Result<Option<GameMessage>, AppError> {
    let command = content.to_lowercase();
    if command == "/bomba" {
        let result = game_repository::play_bomb(&state.db, lobby_id, None).await?;
        let started = result.as_deref().is_some_and(|text| text.contains("Başladı!"));
        return Ok(result.map(|content| GameMessage { content, xp: if started { 10 } else { 0 } }));
    }
    if let Ok(number) = content.parse::<i16>() {
        if (1..=100).contains(&number) {
            let result = game_repository::play_bomb(&state.db, lobby_id, Some(number)).await?;
            return Ok(result.map(|text| GameMessage {
                content: if text.starts_with("💥") { format!("💥 [BOMBA PATLADI]: @{} bombayı patlattı! Sayı: {number}", sender_name) } else { text },
                xp: 0,
            }));
        }
    }
    if command == "/dvc" {
        return Ok(Some(GameMessage { content: "🎭 [DVC SEÇİMİ]: Doğruluk 🟢 veya Cesaret 🔥 seç!".to_string(), xp: 0 }));
    }
    if command == "/dvc dogruluk" || command == "/dvc doğruluk" || command == "/dvc cesaret" {
        let truth = command != "/dvc cesaret";
        let prompts = if truth {
            &["Bu odada en gizemli bulduğun kişi kim?", "En komik yanlış anlaşılman neydi?", "Bir günlüğüne kimin hayatını yaşamak isterdin?", "Seni anında güldüren şey ne?", "Çocukken inandığın en tuhaf şey neydi?"][..]
        } else {
            &["Profil resmini tarif eden üç kelime yaz.", "Bir sonraki mesajını sadece emojilerle gönder.", "Odadan birine yaratıcı bir lakap bul.", "Son dinlediğin şarkıyı dramatik biçimde tanıt.", "Kendini üç kelimelik bir reklam sloganıyla anlat."][..]
        };
        let index = rand::random::<u32>() as usize % prompts.len();
        let label = if truth { "DOĞRULUK" } else { "CESARET" };
        return Ok(Some(GameMessage { content: format!("🎭 [{label}]: @{} — {}", sender_name, prompts[index]), xp: 10 }));
    }
    if command == "/slot" {
        let symbols = ["🍒", "⚡", "💎", "🍀", "⭐"];
        let reels: Vec<&str> = (0..3).map(|_| symbols[rand::random::<u32>() as usize % symbols.len()]).collect();
        let jackpot = reels[0] == reels[1] && reels[1] == reels[2];
        if jackpot {
            user_repository::add_coins(&state.db, sender_id, 25).await?;
        }
        let suffix = if jackpot { " 🎉 JACKPOT! +25 Lobi Coin" } else { " Bir daha dene!" };
        return Ok(Some(GameMessage { content: format!("🎰 [SLOT]: [ {} | {} | {} ]{suffix}", reels[0], reels[1], reels[2]), xp: 10 }));
    }
    Ok(None)
}
