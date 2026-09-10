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

// Event type constants
pub const EVENT_MESSAGE_CREATED: &str = "message.created";
pub const EVENT_USER_JOINED: &str = "user.joined";
pub const EVENT_USER_LEFT: &str = "user.left";
pub const EVENT_MESSAGE_SEND: &str = "message.send";
pub const EVENT_MESSAGE_REACTION_UPDATED: &str = "message.reaction_updated";
