// ============================================================================
// TARGET_DESTINATION: backend/src/routes/upload_routes.rs
// PURPOSE: HTTP route definitions for general file and avatar uploads and static avatar serving
// ============================================================================

use axum::{routing::post, Router};
use tower_http::services::ServeDir;

use crate::handlers::upload_handler;
use crate::state::SharedState;

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route("/avatar", post(upload_handler::upload_avatar))
        .nest_service("/avatars", ServeDir::new("uploads/avatars"))
}
