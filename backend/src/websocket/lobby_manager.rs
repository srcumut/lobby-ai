use dashmap::DashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::schemas::ws_event::WsOutgoingEvent;

/// Bounded channel capacity per WebSocket connection.
/// When the queue is full, the connection is considered slow and will be dropped.
const CHANNEL_CAPACITY: usize = 64;

/// Manages active WebSocket connections grouped by lobby.
pub struct LobbyManager {
    /// lobby_id -> { user_id -> sender }
    lobbies: DashMap<Uuid, DashMap<Uuid, mpsc::Sender<WsOutgoingEvent>>>,
}

impl LobbyManager {
    pub fn new() -> Self {
        Self {
            lobbies: DashMap::new(),
        }
    }

    /// Register a user connection to a lobby.
    /// Returns a receiver that the WebSocket handler should use to read outgoing events.
    pub fn subscribe(&self, lobby_id: Uuid, user_id: Uuid) -> mpsc::Receiver<WsOutgoingEvent> {
        let (tx, rx) = mpsc::channel(CHANNEL_CAPACITY);

        self.lobbies
            .entry(lobby_id)
            .or_default()
            .insert(user_id, tx);

        rx
    }

    /// Remove a user connection from a lobby.
    pub fn unsubscribe(&self, lobby_id: Uuid, user_id: Uuid) {
        if let Some(lobby) = self.lobbies.get(&lobby_id) {
            lobby.remove(&user_id);

            // Clean up empty lobby entries
            if lobby.is_empty() {
                drop(lobby);
                self.lobbies.remove(&lobby_id);
            }
        }
    }

    /// Broadcast an event to all connected users in a lobby.
    /// Connections that have a full channel buffer are dropped (slow consumer).
    pub async fn broadcast(&self, lobby_id: Uuid, event: WsOutgoingEvent) {
        if let Some(lobby) = self.lobbies.get(&lobby_id) {
            let mut stale_users = Vec::new();

            for entry in lobby.iter() {
                let user_id = *entry.key();
                let sender = entry.value();

                // try_send to avoid blocking on slow consumers
                if sender.try_send(event.clone()).is_err() {
                    stale_users.push(user_id);
                }
            }

            // Remove stale/slow connections
            for user_id in stale_users {
                tracing::warn!(
                    lobby_id = %lobby_id,
                    user_id = %user_id,
                    "Dropping slow WebSocket consumer"
                );
                lobby.remove(&user_id);
            }
        }
    }

    /// Get list of currently connected user IDs in a lobby.
    #[allow(dead_code)] // Will be used for presence tracking
    pub fn connected_users(&self, lobby_id: Uuid) -> Vec<Uuid> {
        self.lobbies
            .get(&lobby_id)
            .map(|lobby| lobby.iter().map(|e| *e.key()).collect())
            .unwrap_or_default()
    }
}
