use axum::{routing::get, Router};

use crate::state::SharedState;
use crate::websocket::handler::{global_ws_handler, ws_handler};

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route("/ws/lobbies/{lobby_id}", get(ws_handler))
        .route("/ws/notifications", get(global_ws_handler))
}
