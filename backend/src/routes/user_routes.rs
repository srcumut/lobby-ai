use axum::{routing::{get, post, delete}, Router};

use crate::handlers::{direct_message_handler, user_handler};
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
        .route(
            "/api/users/me/banner",
            post(user_handler::upload_my_banner).delete(user_handler::delete_my_banner),
        )
        .route("/api/users/{id}", get(user_handler::get_public_profile))
        .route("/api/friends", get(user_handler::get_friends))
        .route("/api/friends/request", post(user_handler::send_friend_request))
        .route("/api/friends/requests/pending", get(user_handler::get_pending_incoming_requests))
        .route("/api/friends/request/{id}/accept", post(user_handler::accept_friend_request))
        .route("/api/friends/request/{id}/reject", post(user_handler::reject_friend_request))
        .route("/api/friends/{id}", delete(user_handler::remove_friend))
        .route(
            "/api/friends/conversations",
            get(direct_message_handler::get_conversations),
        )
        .route(
            "/api/friends/{id}/messages",
            get(direct_message_handler::get_direct_messages)
                .post(direct_message_handler::send_direct_message),
        )
        .route(
            "/api/friends/messages/{id}/reactions",
            post(direct_message_handler::toggle_direct_message_reaction),
        )
        .route(
            "/api/users/badges/unlock",
            post(user_handler::unlock_badge),
        )
        .route(
            "/api/users/coins/add",
            post(user_handler::add_coins),
        )
        .route(
            "/api/shop/purchase",
            post(user_handler::purchase_shop_item),
        )
        .route(
            "/api/shop/inventory",
            get(user_handler::get_inventory),
        )
}
