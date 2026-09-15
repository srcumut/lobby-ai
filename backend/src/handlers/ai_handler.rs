use axum::{
    extract::State,
    Json,
};
use validator::Validate;

use crate::errors::AppError;
use crate::models::ai::{Agent, AiCredential};
use crate::schemas::ai::{AddCredentialRequest, CreateAgentRequest};
use crate::middleware::auth_middleware::AuthenticatedUser;
use crate::state::SharedState;
use crate::services::ai_service;

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
