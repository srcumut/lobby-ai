use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;

use crate::handlers::ai_handler;
use crate::state::AppState;

pub fn routes() -> Router<crate::state::SharedState> {
    Router::new()
        .route("/credentials", post(ai_handler::add_credential).get(ai_handler::get_credentials))
        .route("/agents", post(ai_handler::create_agent).get(ai_handler::get_agents))
}
