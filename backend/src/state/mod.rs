use std::sync::Arc;

use sqlx::PgPool;

use crate::config::AppConfig;
use crate::middleware::rate_limiter::RateLimiter;
use crate::websocket::lobby_manager::LobbyManager;

pub type SharedState = Arc<AppState>;

pub struct AppState {
    pub db: PgPool,
    pub config: AppConfig,
    pub lobby_manager: LobbyManager,
    pub global_ws_manager: crate::websocket::global_ws_manager::GlobalWsManager,
    pub login_rate_limiter: RateLimiter,
    pub api_rate_limiter: RateLimiter,
    pub ws_rate_limiter: RateLimiter,
}
