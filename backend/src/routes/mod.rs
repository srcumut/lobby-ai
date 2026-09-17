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
        .nest_service("/api/uploads/avatars", ServeDir::new("uploads/avatars"))
        .nest_service("/uploads/avatars", ServeDir::new("uploads/avatars"))
        .nest_service("/uploads", ServeDir::new("uploads"))
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
        .with_state(state)
}
