// ============================================================================
// TARGET_DESTINATION: backend/src/routes/ai_routes.rs
// PURPOSE: HTTP routes for AI Agent configuration and Agent Avatar upload/deletion
// ============================================================================

use axum::{
    routing::post,
    Router,
};

use crate::handlers::ai_handler;

pub fn routes() -> Router<crate::state::SharedState> {
    Router::new()
        .route("/credentials", post(ai_handler::add_credential).get(ai_handler::get_credentials))
        .route("/agents", post(ai_handler::create_agent).get(ai_handler::get_agents))
        .route(
            "/agents/{id}",
            axum::routing::patch(ai_handler::update_agent)
                .get(ai_handler::get_agent)
                .delete(ai_handler::delete_agent),
        )
        .route(
            "/agents/{id}/avatar",
            post(ai_handler::upload_agent_avatar).delete(ai_handler::delete_agent_avatar),
        )
        .route(
            "/agents/{id}/test",
            post(ai_handler::test_agent),
        )
}
