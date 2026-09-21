use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::schemas::direct_message::{
    ConversationResponse, DirectMessageQuery, DirectMessageResponse, SendDirectMessageRequest,
};
use crate::services::direct_message_service;
use crate::state::SharedState;

pub async fn get_conversations(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<ConversationResponse>>, AppError> {
    let conversations = direct_message_service::get_conversations(&state, auth.user_id).await?;
    Ok(Json(conversations))
}

pub async fn get_direct_messages(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(friend_id): Path<Uuid>,
    Query(query): Query<DirectMessageQuery>,
) -> Result<Json<Vec<DirectMessageResponse>>, AppError> {
    let limit = query.limit.unwrap_or(50);
    let messages = direct_message_service::get_conversation(
        &state,
        auth.user_id,
        friend_id,
        limit,
        query.before,
    )
    .await?;

    Ok(Json(messages))
}

pub async fn send_direct_message(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(friend_id): Path<Uuid>,
    Json(payload): Json<SendDirectMessageRequest>,
) -> Result<Json<DirectMessageResponse>, AppError> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let response = direct_message_service::send_direct_message(
        &state,
        auth.user_id,
        friend_id,
        &payload.content,
    )
    .await?;

    Ok(Json(response))
}

pub async fn toggle_direct_message_reaction(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(message_id): Path<Uuid>,
    Json(payload): Json<crate::schemas::message::ReactionRequest>,
) -> Result<Json<std::collections::HashMap<String, Vec<Uuid>>>, AppError> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    let reactions = direct_message_service::toggle_reaction(
        &state,
        auth.user_id,
        message_id,
        &payload.reaction,
    )
    .await?;
    Ok(Json(reactions))
}

