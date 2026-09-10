use axum::{routing::post, Router};

use crate::handlers::auth_handler;
use crate::state::SharedState;

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route("/api/auth/register", post(auth_handler::register))
        .route("/api/auth/login", post(auth_handler::login))
        .route("/api/auth/refresh", post(auth_handler::refresh))
        .route("/api/auth/logout", post(auth_handler::logout))
}
