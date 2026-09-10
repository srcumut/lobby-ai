
use crate::state::SharedState;

mod auth_routes;
mod lobby_routes;
mod notification_routes;
mod user_routes;
mod ws_routes;

pub fn create_router(state: SharedState) -> axum::Router {
    axum::Router::new()
        .merge(auth_routes::routes())
        .merge(
            axum::Router::new()
                .merge(lobby_routes::routes())
                .merge(user_routes::routes())
                .merge(notification_routes::routes())
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    crate::middleware::rate_limiter::api_rate_limit_middleware,
                )),
        )
        .merge(ws_routes::routes())
        .with_state(state)
}
