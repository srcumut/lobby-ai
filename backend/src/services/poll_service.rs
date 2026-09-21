use chrono::Utc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::{lobby_repository, poll_repository, user_repository};
use crate::schemas::poll::{CreatePollRequest, PollResponse};
use crate::schemas::ws_event::{WsOutgoingEvent, EVENT_POLL_CREATED, EVENT_POLL_UPDATED};
use crate::state::SharedState;

pub async fn create_poll(
    state: &SharedState,
    lobby_id: Uuid,
    creator_id: Uuid,
    request: CreatePollRequest,
) -> Result<PollResponse, AppError> {
    let question = request.question.trim();
    if question.len() < 3 || question.len() > 255 {
        return Err(AppError::Validation(
            "Soru 3 ile 255 karakter arasında olmalıdır".to_string(),
        ));
    }

    let cleaned_options: Vec<String> = request
        .options
        .into_iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if cleaned_options.len() < 2 || cleaned_options.len() > 6 {
        return Err(AppError::Validation(
            "Anket için en az 2, en fazla 6 seçenek gereklidir".to_string(),
        ));
    }

    // Check for duplicate options
    let mut unique_check = std::collections::HashSet::new();
    for opt in &cleaned_options {
        if !unique_check.insert(opt.to_lowercase()) {
            return Err(AppError::Validation(
                "Anket seçenekleri birbirinin aynısı olamaz".to_string(),
            ));
        }
    }

    let ends_at = request
        .duration_minutes
        .filter(|m| *m > 0)
        .map(|m| Utc::now() + chrono::Duration::minutes(m));

    let poll = poll_repository::create_poll(
        &state.db,
        lobby_id,
        creator_id,
        question,
        request.is_multiple_choice,
        ends_at,
        &cleaned_options,
    )
    .await?;

    // Broadcast poll.created event over WebSocket
    let out_event = WsOutgoingEvent {
        event_type: EVENT_POLL_CREATED.to_string(),
        payload: serde_json::to_value(&poll).unwrap_or_default(),
    };
    state.lobby_manager.broadcast(lobby_id, out_event).await;

    // Post announcement in chat
    let creator_user = user_repository::find_by_id(&state.db, creator_id).await.ok().flatten();
    let creator_name = creator_user
        .as_ref()
        .map(|u| u.display_name.as_deref().unwrap_or(&u.username))
        .unwrap_or("Bir üye");

    let announcement = format!("📊 {} yeni bir anket başlattı: \"{}\"", creator_name, question);
    let _ = crate::services::message_service::create_message(state, lobby_id, creator_id, &announcement).await;

    Ok(poll)
}

pub async fn get_polls(
    state: &SharedState,
    lobby_id: Uuid,
    current_user_id: Uuid,
) -> Result<Vec<PollResponse>, AppError> {
    poll_repository::get_polls_by_lobby(&state.db, lobby_id, current_user_id).await
}

pub async fn vote_poll(
    state: &SharedState,
    lobby_id: Uuid,
    poll_id: Uuid,
    user_id: Uuid,
    option_id: Uuid,
) -> Result<PollResponse, AppError> {
    let poll = poll_repository::get_poll_by_id(&state.db, poll_id, user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Anket bulunamadı".to_string()))?;

    if poll.lobby_id != lobby_id {
        return Err(AppError::Forbidden("Bu anket bu lobiye ait değil".to_string()));
    }

    if poll.is_closed {
        return Err(AppError::Validation("Bu anket tamamlanmıştır, oy verilemez".to_string()));
    }

    if let Some(ends_at) = poll.ends_at {
        if Utc::now() > ends_at {
            let _ = poll_repository::close_poll(&state.db, poll_id).await;
            return Err(AppError::Validation("Anketin süresi dolmuştur".to_string()));
        }
    }

    // Verify option exists in this poll
    if !poll.options.iter().any(|o| o.id == option_id) {
        return Err(AppError::NotFound("Seçenek bulunamadı".to_string()));
    }

    poll_repository::vote_poll(
        &state.db,
        poll_id,
        option_id,
        user_id,
        poll.is_multiple_choice,
    )
    .await?;

    let updated_poll = poll_repository::get_poll_by_id(&state.db, poll_id, user_id)
        .await?
        .ok_or_else(|| AppError::Internal("Güncellenen anket bulunamadı".to_string()))?;

    // Broadcast poll.updated event over WebSocket
    let out_event = WsOutgoingEvent {
        event_type: EVENT_POLL_UPDATED.to_string(),
        payload: serde_json::to_value(&updated_poll).unwrap_or_default(),
    };
    state.lobby_manager.broadcast(lobby_id, out_event).await;

    Ok(updated_poll)
}

pub async fn close_poll(
    state: &SharedState,
    lobby_id: Uuid,
    poll_id: Uuid,
    user_id: Uuid,
) -> Result<PollResponse, AppError> {
    let poll = poll_repository::get_poll_by_id(&state.db, poll_id, user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Anket bulunamadı".to_string()))?;

    if poll.lobby_id != lobby_id {
        return Err(AppError::Forbidden("Bu anket bu lobiye ait değil".to_string()));
    }

    // Check permissions: creator OR lobby owner OR moderator
    let is_creator = poll.creator.id == user_id;
    let lobby = lobby_repository::find_by_id(&state.db, lobby_id).await?.ok_or_else(|| {
        AppError::NotFound("Lobi bulunamadı".to_string())
    })?;
    let is_owner = lobby.owner_id == user_id;
    let member = lobby_repository::get_members(&state.db, lobby_id)
        .await?
        .into_iter()
        .find(|m| m.user_id == user_id);
    let is_mod = member.map(|m| m.role == "MODERATOR").unwrap_or(false);

    if !is_creator && !is_owner && !is_mod {
        return Err(AppError::Forbidden(
            "Anketi yalnızca anketi oluşturan veya lobi yetkilileri sonlandırabilir".to_string(),
        ));
    }

    poll_repository::close_poll(&state.db, poll_id).await?;

    let updated_poll = poll_repository::get_poll_by_id(&state.db, poll_id, user_id)
        .await?
        .ok_or_else(|| AppError::Internal("Güncellenen anket bulunamadı".to_string()))?;

    // Broadcast poll.updated event over WebSocket
    let out_event = WsOutgoingEvent {
        event_type: EVENT_POLL_UPDATED.to_string(),
        payload: serde_json::to_value(&updated_poll).unwrap_or_default(),
    };
    state.lobby_manager.broadcast(lobby_id, out_event).await;

    // Chat announcement
    let announcement = format!("🏁 \"{}\" anketi sonlandırıldı! Sonuçlar açıklandı.", updated_poll.question);
    let _ = crate::services::message_service::create_message(state, lobby_id, user_id, &announcement).await;

    Ok(updated_poll)
}
