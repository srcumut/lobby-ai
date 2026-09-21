use serde::{Deserialize, Serialize};

/// Server-to-client event sent over WebSocket.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsOutgoingEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub payload: serde_json::Value,
}

/// Client-to-server message received over WebSocket.
#[derive(Debug, Deserialize)]
pub struct WsIncomingEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub payload: serde_json::Value,
}

/// Payload sent by the client when creating a message.
#[derive(Debug, Deserialize)]
pub struct SendMessagePayload {
    pub content: String,
}

/// Payload sent or received for typing status.
#[derive(Debug, Deserialize, Serialize)]
#[allow(dead_code)]
pub struct TypingPayload {
    pub is_typing: bool,
}

// Event type constants
pub const EVENT_MESSAGE_CREATED: &str = "message.created";
pub const EVENT_USER_JOINED: &str = "user.joined";
pub const EVENT_USER_LEFT: &str = "user.left";
pub const EVENT_MESSAGE_SEND: &str = "message.send";
pub const EVENT_MESSAGE_REACTION_UPDATED: &str = "message.reaction_updated";
pub const EVENT_DIRECT_MESSAGE_CREATED: &str = "direct_message.created";
pub const EVENT_USER_TYPING: &str = "user.typing";
pub const EVENT_TYPING_INDICATOR: &str = "typing.indicator";
pub const EVENT_TYPING_SEND: &str = "typing.send";
pub const EVENT_TYPING_START: &str = "typing.start";
pub const EVENT_TYPING_STOP: &str = "typing.stop";
pub const EVENT_USER_ROLE_UPDATED: &str = "user.role_updated";
pub const EVENT_GAME_ACTION: &str = "game.action";
pub const EVENT_GAME_EVENT: &str = "game.event";
pub const EVENT_POLL_CREATED: &str = "poll.created";
pub const EVENT_POLL_UPDATED: &str = "poll.updated";


