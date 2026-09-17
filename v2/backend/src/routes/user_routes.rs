// ============================================================================
// TARGET_DESTINATION: backend/src/routes/user_routes.rs
// PURPOSE: HTTP routes for user management including avatar upload and deletion
// ============================================================================

use axum::{routing::{delete, get, post}, Router};

use crate::handlers::user_handler;
use crate::state::SharedState;

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route(
            "/api/users/me",
            get(user_handler::get_me).patch(user_handler::update_profile),
        )
        .route(
            "/api/users/me/avatar",
            post(user_handler::upload_my_avatar).delete(user_handler::delete_my_avatar),
        )
        .route("/api/users/{id}", get(user_handler::get_public_profile))
        .route("/api/friends", get(user_handler::get_friends))
        .route("/api/friends/request", post(user_handler::send_friend_request))
        .route("/api/friends/requests/pending", get(user_handler::get_pending_incoming_requests))
        .route("/api/friends/request/{id}/accept", post(user_handler::accept_friend_request))
        .route("/api/friends/request/{id}/reject", post(user_handler::reject_friend_request))
        .route("/api/friends/{id}", delete(user_handler::remove_friend))
}
