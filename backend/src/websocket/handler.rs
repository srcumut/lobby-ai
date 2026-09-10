use axum::{
    extract::{
        ws::{Message, WebSocket},
        Path, Query, State, WebSocketUpgrade,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::jwt;
use crate::errors::AppError;
use crate::repositories::lobby_repository;
use crate::schemas::ws_event::{
    SendMessagePayload, WsIncomingEvent, WsOutgoingEvent, EVENT_MESSAGE_CREATED,
    EVENT_MESSAGE_SEND, EVENT_USER_JOINED, EVENT_USER_LEFT,
};
use crate::services::message_service;
use crate::state::SharedState;

#[derive(Deserialize)]
pub struct WsQueryParams {
    pub token: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(lobby_id): Path<Uuid>,
    Query(params): Query<WsQueryParams>,
    State(state): State<SharedState>,
) -> Result<Response, AppError> {
    // Authenticate via query parameter token
    let claims = jwt::validate_token(&params.token, &state.config.jwt_access_secret)?;
    let user_id = claims.sub;

    // Verify lobby membership
    if !lobby_repository::is_member(&state.db, lobby_id, user_id).await? {
        return Err(AppError::Forbidden(
            "You must be a member of this lobby to connect".to_string(),
        ));
    }

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, lobby_id, user_id)))
}

async fn handle_socket(socket: WebSocket, state: SharedState, lobby_id: Uuid, user_id: Uuid) {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // Subscribe to lobby events
    let mut rx = state.lobby_manager.subscribe(lobby_id, user_id);

    // Broadcast user.joined event
    let joined_event = WsOutgoingEvent {
        event_type: EVENT_USER_JOINED.to_string(),
        payload: serde_json::json!({
            "user_id": user_id,
            "lobby_id": lobby_id,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, joined_event).await;

    // Spawn task to forward outgoing events to the WebSocket
    let send_task = tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let text = match serde_json::to_string(&event) {
                Ok(t) => t,
                Err(e) => {
                    tracing::error!(error = %e, "Failed to serialize WebSocket event");
                    continue;
                }
            };

            if ws_sender.send(Message::Text(text.into())).await.is_err() {
                break;
            }
        }
    });

    // Process incoming messages from the client
    while let Some(msg) = ws_receiver.next().await {
        let msg = match msg {
            Ok(Message::Text(text)) => text,
            Ok(Message::Close(_)) => break,
            Err(_) => break,
            _ => continue,
        };

        let incoming: WsIncomingEvent = match serde_json::from_str(&msg) {
            Ok(event) => event,
            Err(_) => {
                tracing::warn!("Invalid WebSocket message format from user {user_id}");
                continue;
            }
        };

        match incoming.event_type.as_str() {
            EVENT_MESSAGE_SEND => {
                handle_message_send(&state, lobby_id, user_id, incoming.payload).await;
            }
            _ => {
                tracing::warn!(
                    event_type = %incoming.event_type,
                    "Unknown WebSocket event type from user {user_id}"
                );
            }
        }
    }

    // Cleanup on disconnect
    state.lobby_manager.unsubscribe(lobby_id, user_id);

    // Broadcast user.left event
    let left_event = WsOutgoingEvent {
        event_type: EVENT_USER_LEFT.to_string(),
        payload: serde_json::json!({
            "user_id": user_id,
            "lobby_id": lobby_id,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, left_event).await;

    // Abort the send task
    send_task.abort();
}

async fn handle_message_send(
    state: &SharedState,
    lobby_id: Uuid,
    sender_id: Uuid,
    payload: serde_json::Value,
) {
    let send_payload: SendMessagePayload = match serde_json::from_value(payload) {
        Ok(p) => p,
        Err(_) => {
            tracing::warn!("Invalid message.send payload from user {sender_id}");
            return;
        }
    };

    // Rate limit check
    if let Err(e) = state.ws_rate_limiter.check(&sender_id.to_string()) {
        tracing::warn!(user_id = %sender_id, "WebSocket rate limit exceeded: {}", e);
        // We could send an error event back to the client here
        return;
    }

    // Persist message via service, then broadcast
    match message_service::create_message(state, lobby_id, sender_id, &send_payload.content).await {
        Ok(message_response) => {
            let event = WsOutgoingEvent {
                event_type: EVENT_MESSAGE_CREATED.to_string(),
                payload: serde_json::to_value(&message_response).unwrap_or_default(),
            };
            state.lobby_manager.broadcast(lobby_id, event).await;
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to create message");
        }
    }
}

pub async fn global_ws_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<WsQueryParams>,
    State(state): State<SharedState>,
) -> Result<Response, AppError> {
    // Authenticate via query parameter token
    let claims = jwt::validate_token(&params.token, &state.config.jwt_access_secret)?;
    let user_id = claims.sub;

    Ok(ws.on_upgrade(move |socket| handle_global_socket(socket, state, user_id)))
}

async fn handle_global_socket(socket: WebSocket, state: SharedState, user_id: Uuid) {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // Subscribe to global events
    let (conn_id, mut rx) = state.global_ws_manager.subscribe(user_id);

    // Spawn task to forward outgoing events to the WebSocket
    let send_task = tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let text = match serde_json::to_string(&event) {
                Ok(t) => t,
                Err(e) => {
                    tracing::error!(error = %e, "Failed to serialize global WebSocket event");
                    continue;
                }
            };

            if ws_sender.send(Message::Text(text.into())).await.is_err() {
                break;
            }
        }
    });

    // Process incoming messages (if any)
    while let Some(msg) = ws_receiver.next().await {
        let _msg = match msg {
            Ok(Message::Text(text)) => text,
            Ok(Message::Close(_)) => break,
            Err(_) => break,
            _ => continue,
        };
        // For global WS, we might not expect incoming messages, or we can handle them here.
    }

    // Cleanup on disconnect
    state.global_ws_manager.unsubscribe(user_id, conn_id);
    send_task.abort();
}
