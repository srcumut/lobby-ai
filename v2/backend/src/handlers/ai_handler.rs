// ============================================================================
// TARGET_DESTINATION: backend/src/handlers/ai_handler.rs
// PURPOSE: HTTP handlers for AI Agent management and Agent Avatar upload/delete
// ============================================================================

use axum::{
    extract::{Multipart, State},
    Json,
};
use validator::Validate;

use crate::errors::AppError;
use crate::models::ai::{Agent, AiCredential};
use crate::schemas::ai::{AddCredentialRequest, CreateAgentRequest, UpdateAgentRequest};
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::state::SharedState;
use crate::services::{ai_service, upload_service};

pub async fn add_credential(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Json(payload): Json<AddCredentialRequest>,
) -> Result<Json<AiCredential>, AppError> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let cred = ai_service::add_credential(&state, auth.user_id, payload).await?;
    
    // We explicitly remove the encrypted key and nonce via model skip serialization,
    // so we can safely return the credential object.
    Ok(Json(cred))
}

pub async fn get_credentials(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<AiCredential>>, AppError> {
    let creds = ai_service::get_credentials(&state, auth.user_id).await?;
    Ok(Json(creds))
}

pub async fn get_agents(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<Agent>>, AppError> {
    let agents = ai_service::get_agents(&state, auth.user_id).await?;
    Ok(Json(agents))
}

pub async fn create_agent(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    Json(payload): Json<CreateAgentRequest>,
) -> Result<Json<Agent>, AppError> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let agent = ai_service::create_agent(&state, auth.user_id, payload).await?;
    Ok(Json(agent))
}

pub async fn get_agent(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<Agent>, AppError> {
    let agent = ai_service::get_agent_by_id(&state, id).await?;
    
    // Ensure only the owner can view their agent's config
    if agent.owner_id != auth.user_id {
        return Err(AppError::Forbidden("You do not own this agent".to_string()));
    }
    
    Ok(Json(agent))
}

pub async fn update_agent(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    Json(payload): Json<UpdateAgentRequest>,
) -> Result<Json<Agent>, AppError> {
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    
    let agent = ai_service::update_agent(&state, auth.user_id, id, payload).await?;
    Ok(Json(agent))
}

pub async fn upload_agent_avatar(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    multipart: Multipart,
) -> Result<Json<Agent>, AppError> {
    let avatar_url = upload_service::save_avatar_file(multipart).await?;
    let updated_agent = ai_service::update_agent_avatar(&state, auth.user_id, id, Some(avatar_url)).await?;
    Ok(Json(updated_agent))
}

pub async fn delete_agent_avatar(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<Agent>, AppError> {
    let updated_agent = ai_service::update_agent_avatar(&state, auth.user_id, id, None).await?;
    Ok(Json(updated_agent))
}

pub async fn delete_agent(
    State(state): State<SharedState>,
    auth: AuthenticatedUser,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    ai_service::delete_agent(&state, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Agent deleted successfully" })))
}
