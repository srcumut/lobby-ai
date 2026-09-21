use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::repositories::lobby_repository;
use crate::schemas::poll::{CreatePollRequest, PollResponse, VotePollRequest};
use crate::services::poll_service;
use crate::state::SharedState;

pub async fn create_poll(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
    Json(request): Json<CreatePollRequest>,
) -> Result<Json<PollResponse>, AppError> {
    request.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    if !lobby_repository::is_member(&state.db, lobby_id, auth.user_id).await? {
        return Err(AppError::Forbidden(
            "Anket oluşturmak için lobi üyesi olmalısınız".to_string(),
        ));
    }

    let poll = poll_service::create_poll(&state, lobby_id, auth.user_id, request).await?;
    Ok(Json(poll))
}

pub async fn list_polls(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
) -> Result<Json<Vec<PollResponse>>, AppError> {
    if !lobby_repository::is_member(&state.db, lobby_id, auth.user_id).await? {
        return Err(AppError::Forbidden(
            "Anketleri görüntülemek için lobi üyesi olmalısınız".to_string(),
        ));
    }

    let polls = poll_service::get_polls(&state, lobby_id, auth.user_id).await?;
    Ok(Json(polls))
}

pub async fn vote_poll(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, poll_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<VotePollRequest>,
) -> Result<Json<PollResponse>, AppError> {
    if !lobby_repository::is_member(&state.db, lobby_id, auth.user_id).await? {
        return Err(AppError::Forbidden(
            "Oy vermek için lobi üyesi olmalısınız".to_string(),
        ));
    }

    let updated_poll = poll_service::vote_poll(
        &state,
        lobby_id,
        poll_id,
        auth.user_id,
        request.option_id,
    )
    .await?;

    Ok(Json(updated_poll))
}

pub async fn close_poll(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, poll_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<PollResponse>, AppError> {
    if !lobby_repository::is_member(&state.db, lobby_id, auth.user_id).await? {
        return Err(AppError::Forbidden(
            "Bu işlem için lobi üyesi olmalısınız".to_string(),
        ));
    }

    let updated_poll = poll_service::close_poll(&state, lobby_id, poll_id, auth.user_id).await?;
    Ok(Json(updated_poll))
}
