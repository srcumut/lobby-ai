use axum::{
    routing::{get, patch},
    Router,
};

use crate::handlers::notification_handler;
use crate::state::SharedState;

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route(
            "/api/notifications",
            get(notification_handler::get_notifications),
        )
        .route(
            "/api/notifications/read-all",
            patch(notification_handler::mark_all_as_read),
        )
        .route(
            "/api/notifications/{id}/read",
            patch(notification_handler::mark_as_read),
        )
}
