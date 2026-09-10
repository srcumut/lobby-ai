use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;

use crate::errors::AppError;
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::repositories::lobby_repository;
use crate::schemas::message::{MessageQuery, MessageResponse};
use crate::services::message_service;
use crate::state::SharedState;

pub async fn get_messages(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path(lobby_id): Path<Uuid>,
    Query(query): Query<MessageQuery>,
) -> Result<Json<Vec<MessageResponse>>, AppError> {
    // Verify membership before returning messages
    if !lobby_repository::is_member(&state.db, lobby_id, auth.user_id).await? {
        return Err(AppError::Forbidden(
            "You must be a member of this lobby to view messages".to_string(),
        ));
    }

    let messages =
        message_service::get_lobby_messages(&state, lobby_id, query.limit, query.before).await?;

    Ok(Json(messages))
}

pub async fn toggle_reaction(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Path((lobby_id, message_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<crate::schemas::message::ReactionRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    use validator::Validate;
    request.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    // Verify membership
    if !lobby_repository::is_member(&state.db, lobby_id, auth.user_id).await? {
        return Err(AppError::Forbidden(
            "You must be a member of this lobby to react".to_string(),
        ));
    }

    message_service::toggle_reaction(&state, lobby_id, message_id, auth.user_id, &request.reaction).await?;

    Ok(Json(serde_json::json!({ "message": "Reaction updated" })))
}
