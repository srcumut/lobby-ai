use dashmap::DashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::schemas::ws_event::WsOutgoingEvent;

const CHANNEL_CAPACITY: usize = 64;

/// Manages global WebSocket connections for notifications (user_id -> connection_id -> sender).
pub struct GlobalWsManager {
    users: DashMap<Uuid, DashMap<Uuid, mpsc::Sender<WsOutgoingEvent>>>,
}

impl GlobalWsManager {
    pub fn new() -> Self {
        Self {
            users: DashMap::new(),
        }
    }

    pub fn subscribe(&self, user_id: Uuid) -> (Uuid, mpsc::Receiver<WsOutgoingEvent>) {
        let (tx, rx) = mpsc::channel(CHANNEL_CAPACITY);
        let conn_id = Uuid::new_v4();

        self.users.entry(user_id).or_default().insert(conn_id, tx);

        (conn_id, rx)
    }

    pub fn unsubscribe(&self, user_id: Uuid, conn_id: Uuid) {
        if let Some(user_conns) = self.users.get(&user_id) {
            user_conns.remove(&conn_id);

            if user_conns.is_empty() {
                drop(user_conns);
                self.users.remove(&user_id);
            }
        }
    }

    pub async fn send_to_user(&self, user_id: Uuid, event: WsOutgoingEvent) {
        if let Some(user_conns) = self.users.get(&user_id) {
            let mut stale_conns = Vec::new();

            for entry in user_conns.iter() {
                let conn_id = *entry.key();
                let sender = entry.value();

                if sender.send(event.clone()).await.is_err() {
                    stale_conns.push(conn_id);
                }
            }

            for conn_id in stale_conns {
                user_conns.remove(&conn_id);
            }
        }
    }
}
