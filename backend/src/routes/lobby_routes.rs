use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::lobby_handler;
use crate::handlers::message_handler;
use crate::state::SharedState;

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route(
            "/api/lobbies",
            post(lobby_handler::create_lobby).get(lobby_handler::list_lobbies),
        )
        .route("/api/lobbies/{id}", get(lobby_handler::get_lobby))
        .route("/api/lobbies/{id}/join", post(lobby_handler::join_lobby))
        .route("/api/lobbies/{id}/leave", post(lobby_handler::leave_lobby))
        .route(
            "/api/lobbies/{id}/messages",
            get(message_handler::get_messages),
        )
        .route(
            "/api/lobbies/{id}/messages/{message_id}/reactions",
            post(message_handler::toggle_reaction),
        )
        .route(
            "/api/lobbies/{id}/moderation/kick/{user_id}",
            post(crate::handlers::moderation_handler::kick_user),
        )
        .route(
            "/api/lobbies/{id}/moderation/ban/{user_id}",
            post(crate::handlers::moderation_handler::ban_user)
                .delete(crate::handlers::moderation_handler::unban_user),
        )
        .route(
            "/api/lobbies/{id}/moderation/mute/{user_id}",
            post(crate::handlers::moderation_handler::mute_user)
                .delete(crate::handlers::moderation_handler::unmute_user),
        )
        .route(
            "/api/lobbies/{id}/moderation/role/{user_id}",
            post(crate::handlers::moderation_handler::set_role),
        )
        .route(
            "/api/lobbies/{id}/requests",
            get(lobby_handler::list_requests),
        )
        .route(
            "/api/lobbies/{id}/requests/{user_id}/approve",
            post(lobby_handler::approve_request),
        )
        .route(
            "/api/lobbies/{id}/requests/{user_id}/reject",
            post(lobby_handler::reject_request),
        )
}
