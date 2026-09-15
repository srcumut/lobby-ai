use std::env;

use crate::errors::AppError;

#[derive(Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub jwt_access_secret: String,
    pub jwt_refresh_secret: String,
    pub server_host: String,
    pub server_port: u16,
    pub encryption_key: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, AppError> {
        Ok(Self {
            database_url: require_env("DATABASE_URL")?,
            jwt_access_secret: require_env("JWT_ACCESS_SECRET")?,
            jwt_refresh_secret: require_env("JWT_REFRESH_SECRET")?,
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .map_err(|_| AppError::Internal("Invalid SERVER_PORT".to_string()))?,
            encryption_key: require_env("ENCRYPTION_KEY")?,
        })
    }

    pub fn server_addr(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }
}

fn require_env(key: &str) -> Result<String, AppError> {
    env::var(key).map_err(|_| AppError::Internal(format!("Missing environment variable: {key}")))
}
