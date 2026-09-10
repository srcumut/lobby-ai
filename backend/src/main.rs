mod auth;
mod config;
mod errors;
mod handlers;
mod middleware;
mod models;
mod repositories;
mod routes;
mod schemas;
mod services;
mod state;
mod websocket;

use std::sync::Arc;

use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use std::time::Duration;

use crate::config::AppConfig;
use crate::middleware::rate_limiter::RateLimiter;
use crate::state::AppState;
use crate::websocket::lobby_manager::LobbyManager;

#[tokio::main]
async fn main() {
    // Load .env file if present
    dotenvy::dotenv().ok();

    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .json()
        .init();

    // Load configuration
    let config = AppConfig::from_env().expect("Failed to load configuration");

    // Create database connection pool
    let db = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .expect("Failed to run database migrations");

    let server_addr = config.server_addr();

    // Build application state
    let state = Arc::new(AppState {
        db,
        config,
        lobby_manager: LobbyManager::new(),
        global_ws_manager: crate::websocket::global_ws_manager::GlobalWsManager::new(),
        login_rate_limiter: RateLimiter::new(
            10,
            Duration::from_secs(60),
            "Too many login attempts. Please try again later.",
        ),
        api_rate_limiter: RateLimiter::new(
            100,
            Duration::from_secs(60),
            "Too many API requests. Please try again later.",
        ),
        ws_rate_limiter: RateLimiter::new(
            30,
            Duration::from_secs(60),
            "Too many messages. Please slow down.",
        ),
    });

    // Build router
    let app = routes::create_router(state)
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    // Start server
    let listener = tokio::net::TcpListener::bind(&server_addr)
        .await
        .expect("Failed to bind server address");

    tracing::info!("Server listening on {server_addr}");

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await
    .expect("Server error");
}
