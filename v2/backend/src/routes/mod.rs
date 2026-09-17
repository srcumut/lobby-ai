// ============================================================================
// TARGET_DESTINATION: backend/src/routes/mod.rs
// PURPOSE: Root router configuration including upload routes and static avatar serving
// ============================================================================

use tower_http::services::ServeDir;

use crate::state::SharedState;

mod auth_routes;
mod lobby_routes;
mod notification_routes;
mod user_routes;
mod ws_routes;
mod ai_routes;
mod upload_routes;

pub fn create_router(state: SharedState) -> axum::Router {
    axum::Router::new()
        .merge(auth_routes::routes())
        .merge(
            axum::Router::new()
                .merge(lobby_routes::routes())
                .merge(user_routes::routes())
                .merge(notification_routes::routes())
                .nest("/api/ai", ai_routes::routes())
                .nest("/api/uploads", upload_routes::routes())
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    crate::middleware::rate_limiter::api_rate_limit_middleware,
                )),
        )
        .merge(ws_routes::routes())
        .nest_service("/uploads", ServeDir::new("uploads"))
        .nest_service("/api/uploads/avatars", ServeDir::new("uploads/avatars"))
        .with_state(state)
}
