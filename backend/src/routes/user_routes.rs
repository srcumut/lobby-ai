use axum::{routing::get, Router};

use crate::handlers::user_handler;
use crate::state::SharedState;

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route(
            "/api/users/me",
            get(user_handler::get_me).patch(user_handler::update_profile),
        )
        .route("/api/users/{id}", get(user_handler::get_public_profile))
}
