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
    EVENT_MESSAGE_SEND, EVENT_USER_JOINED, EVENT_USER_LEFT, EVENT_USER_TYPING,
    EVENT_TYPING_INDICATOR, EVENT_TYPING_SEND, EVENT_TYPING_START, EVENT_TYPING_STOP,
    EVENT_GAME_ACTION, EVENT_GAME_EVENT,

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
    let claims = match jwt::validate_token(&params.token, &state.config.jwt_access_secret) {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("WebSocket auth failed: {:?}", e);
            return Err(e);
        }
    };
    let user_id = claims.sub;

    // Verify if user is banned from this lobby
    if let Ok(Some(_)) = crate::repositories::moderation_repository::get_ban(&state.db, lobby_id, user_id).await {
        tracing::warn!("Banned user {} attempted to connect to WS lobby {}", user_id, lobby_id);
        return Err(AppError::Forbidden("You are banned from this lobby".to_string()));
    }

    // Verify lobby membership (resilient to race conditions with public lobby join and owner)
    let is_member = match lobby_repository::is_member(&state.db, lobby_id, user_id).await {
        Ok(true) => true,
        Ok(false) => {
            if let Ok(Some(lobby)) = lobby_repository::find_by_id(&state.db, lobby_id).await {
                if lobby.owner_id == user_id {
                    lobby_repository::add_member(&state.db, lobby_id, user_id, "OWNER").await.is_ok()
                } else if lobby.visibility == "PUBLIC" {
                    lobby_repository::add_member(&state.db, lobby_id, user_id, "MEMBER").await.is_ok()
                } else {
                    false
                }
            } else {
                false
            }
        }
        Err(e) => {
            tracing::error!("Database error checking membership: {:?}", e);
            return Err(e.into());
        }
    };

    if !is_member {
        tracing::error!("User {} is not a member of lobby {}", user_id, lobby_id);
        return Err(AppError::Forbidden(
            "You must be a member of this lobby to connect".to_string(),
        ));
    }

    tracing::info!("User {} successfully authenticated for WS lobby {}", user_id, lobby_id);
    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, lobby_id, user_id)))
}

async fn handle_socket(socket: WebSocket, state: SharedState, lobby_id: Uuid, user_id: Uuid) {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // Subscribe to lobby events
    let mut rx = state.lobby_manager.subscribe(lobby_id, user_id);

    // Fetch user info for richer joined/left notifications
    let current_user = crate::repositories::user_repository::find_by_id(&state.db, user_id).await.ok().flatten();
    let current_username = current_user.as_ref().map(|u| u.username.clone()).unwrap_or_else(|| "A user".to_string());

    // Broadcast user.joined event
    let joined_event = WsOutgoingEvent {
        event_type: EVENT_USER_JOINED.to_string(),
        payload: serde_json::json!({
            "user_id": user_id,
            "lobby_id": lobby_id,
            "user": current_user.as_ref().map(|u| serde_json::json!({
                "id": u.id,
                "username": u.username,
                "display_name": u.display_name,
                "avatar_url": u.avatar_url,
            })),
        }),
    };
    state.lobby_manager.broadcast(lobby_id, joined_event).await;
    broadcast_lobby_xp(&state, lobby_id).await;

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
                handle_message_send(&state, lobby_id, user_id, incoming.payload, &current_username).await;
            }
            EVENT_TYPING_START => {
                handle_typing(
                    &state,
                    lobby_id,
                    user_id,
                    &current_username,
                    true,
                    current_user.as_ref().and_then(|u| u.avatar_url.as_deref()),
                    current_user.as_ref().map(|u| u.is_bot).unwrap_or(false),
                )
                .await;
            }
            EVENT_TYPING_STOP => {
                handle_typing(
                    &state,
                    lobby_id,
                    user_id,
                    &current_username,
                    false,
                    current_user.as_ref().and_then(|u| u.avatar_url.as_deref()),
                    current_user.as_ref().map(|u| u.is_bot).unwrap_or(false),
                )
                .await;
            }
            EVENT_USER_TYPING | EVENT_TYPING_INDICATOR | EVENT_TYPING_SEND | "typing" => {
                let is_typing = incoming.payload.get("is_typing")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(true);
                handle_typing(
                    &state,
                    lobby_id,
                    user_id,
                    &current_username,
                    is_typing,
                    current_user.as_ref().and_then(|u| u.avatar_url.as_deref()),
                    current_user.as_ref().map(|u| u.is_bot).unwrap_or(false),
                )
                .await;
            }
            EVENT_GAME_ACTION => {
                handle_game_action(&state, lobby_id, user_id, &current_username, incoming.payload).await;
            }
            _ => {
                tracing::warn!(
                    event_type = %incoming.event_type,
                    "Unknown WebSocket event type from user {user_id}"
                );
            }
        }

    }

    // Cleanup on disconnect: broadcast typing stop in case user disconnected while typing
    let typing_stop_event = WsOutgoingEvent {
        event_type: EVENT_USER_TYPING.to_string(),
        payload: serde_json::json!({
            "lobby_id": lobby_id,
            "user_id": user_id,
            "username": current_username,
            "is_typing": false,
            "avatar_url": current_user.as_ref().and_then(|u| u.avatar_url.clone()),
            "is_bot": current_user.as_ref().map(|u| u.is_bot).unwrap_or(false),
        }),
    };
    state.lobby_manager.broadcast(lobby_id, typing_stop_event).await;

    state.lobby_manager.unsubscribe(lobby_id, user_id);

    // Broadcast user.left event
    let left_event = WsOutgoingEvent {
        event_type: EVENT_USER_LEFT.to_string(),
        payload: serde_json::json!({
            "user_id": user_id,
            "lobby_id": lobby_id,
            "user": current_user.as_ref().map(|u| serde_json::json!({
                "id": u.id,
                "username": u.username,
                "display_name": u.display_name,
                "avatar_url": u.avatar_url,
            })),
        }),
    };
    state.lobby_manager.broadcast(lobby_id, left_event).await;

    // Abort the send task
    send_task.abort();
}

async fn handle_typing(
    state: &SharedState,
    lobby_id: Uuid,
    user_id: Uuid,
    username: &str,
    is_typing: bool,
    avatar_url: Option<&str>,
    is_bot: bool,
) {
    // Rate limit typing events to avoid flood
    let rate_key = format!("typing:{}:{}", lobby_id, user_id);
    if is_typing && state.ws_rate_limiter.check(&rate_key).is_err() {
        return;
    }

    let event = WsOutgoingEvent {
        event_type: EVENT_USER_TYPING.to_string(),
        payload: serde_json::json!({
            "lobby_id": lobby_id,
            "user_id": user_id,
            "username": username,
            "is_typing": is_typing,
            "avatar_url": avatar_url,
            "is_bot": is_bot,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, event).await;
}

async fn handle_game_action(
    state: &SharedState,
    lobby_id: Uuid,
    user_id: Uuid,
    username: &str,
    payload: serde_json::Value,
) {
    // Rate limit check for games (avoid spamming actions)
    let rate_key = format!("game:{}:{}", lobby_id, user_id);
    if state.ws_rate_limiter.check(&rate_key).is_err() {
        return;
    }

    let action = payload.get("type").and_then(|value| value.as_str());
    if matches!(action, Some("trivia_session_start") | Some("rps_accept")) {
        if crate::repositories::game_repository::award_xp(&state.db, lobby_id, 10).await.is_ok() {
            broadcast_lobby_xp(state, lobby_id).await;
        }
    }

    let event = WsOutgoingEvent {
        event_type: EVENT_GAME_EVENT.to_string(),
        payload: serde_json::json!({
            "lobby_id": lobby_id,
            "sender_id": user_id,
            "sender_username": username,
            "data": payload,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, event).await;
}

async fn handle_message_send(
    state: &SharedState,
    lobby_id: Uuid,
    sender_id: Uuid,
    payload: serde_json::Value,
    sender_username: &str,
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
        return;
    }

    // Immediately stop typing indicator for sender upon message dispatch
    let stop_typing = WsOutgoingEvent {
        event_type: EVENT_USER_TYPING.to_string(),
        payload: serde_json::json!({
            "lobby_id": lobby_id,
            "user_id": sender_id,
            "username": sender_username,
            "is_typing": false,
        }),
    };
    state.lobby_manager.broadcast(lobby_id, stop_typing).await;

    // Persist message via service, then broadcast
    match message_service::create_message(state, lobby_id, sender_id, &send_payload.content).await {
        Ok(message_response) => {
            if send_payload.content.trim().eq_ignore_ascii_case("/bomba") && message_response.content.contains("Başladı!") {
                let timer_state = state.clone();
                tokio::spawn(async move {
                    tokio::time::sleep(std::time::Duration::from_secs(31)).await;
                    if let Ok(Some(target)) = crate::repositories::game_repository::expire_bomb(&timer_state.db, lobby_id).await {
                        timer_state.lobby_manager.broadcast(lobby_id, WsOutgoingEvent {
                            event_type: "bomb.expired".to_string(),
                            payload: serde_json::json!({ "target": target }),
                        }).await;
                    }
                });
            }
            let event = WsOutgoingEvent {
                event_type: EVENT_MESSAGE_CREATED.to_string(),
                payload: serde_json::to_value(&message_response).unwrap_or_default(),
            };
            state.lobby_manager.broadcast(lobby_id, event).await;
            broadcast_lobby_xp(state, lobby_id).await;
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to create message");
        }
    }
}

async fn broadcast_lobby_xp(state: &SharedState, lobby_id: Uuid) {
    if let Ok(Some(lobby)) = lobby_repository::find_by_id(&state.db, lobby_id).await {
        state.lobby_manager.broadcast(lobby_id, WsOutgoingEvent {
            event_type: "lobby.xp.updated".to_string(),
            payload: serde_json::json!({ "lobby_id": lobby_id, "xp": lobby.xp }),
        }).await;
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

    // Process incoming messages (e.g. DM typing events)
    while let Some(msg) = ws_receiver.next().await {
        let text = match msg {
            Ok(Message::Text(t)) => t,
            Ok(Message::Close(_)) => break,
            Err(_) => break,
            _ => continue,
        };

        if let Ok(event) = serde_json::from_str::<WsIncomingEvent>(&text) {
            if event.event_type == "direct_message.typing" {
                if let Some(receiver_id_val) = event.payload.get("receiver_id") {
                    if let Ok(receiver_id) = serde_json::from_value::<Uuid>(receiver_id_val.clone()) {
                        let is_typing = event.payload.get("is_typing")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(true);

                        let typing_event = WsOutgoingEvent {
                            event_type: "direct_message.typing".to_string(),
                            payload: serde_json::json!({
                                "sender_id": user_id,
                                "is_typing": is_typing,
                            }),
                        };
                        state.global_ws_manager.send_to_user(receiver_id, typing_event).await;
                    }
                }
            }
        }
    }

    // Cleanup on disconnect
    state.global_ws_manager.unsubscribe(user_id, conn_id);
    send_task.abort();
}
