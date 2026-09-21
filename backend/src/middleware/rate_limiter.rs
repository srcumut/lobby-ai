use std::time::{Duration, Instant};

use dashmap::DashMap;

use crate::errors::AppError;

struct AttemptRecord {
    count: u32,
    window_start: Instant,
}

/// In-memory generic rate limiter.
/// Limits to `max_attempts` per `window_duration`.
pub struct RateLimiter {
    attempts: DashMap<String, AttemptRecord>,
    max_attempts: u32,
    window_duration: Duration,
    error_message: String,
}

impl RateLimiter {
    pub fn new(max_attempts: u32, window_duration: Duration, error_message: impl Into<String>) -> Self {
        Self {
            attempts: DashMap::new(),
            max_attempts,
            window_duration,
            error_message: error_message.into(),
        }
    }

    /// Check if the given key is allowed to proceed.
    /// Returns `Ok(())` if allowed, or an error if rate limited.
    pub fn check(&self, key: &str) -> Result<(), AppError> {
        let now = Instant::now();

        let mut entry = self.attempts.entry(key.to_string()).or_insert_with(|| AttemptRecord {
            count: 0,
            window_start: now,
        });

        // Reset window if expired
        if now.duration_since(entry.window_start) >= self.window_duration {
            entry.count = 0;
            entry.window_start = now;
        }

        entry.count += 1;

        if entry.count > self.max_attempts {
            return Err(AppError::TooManyRequests(self.error_message.clone()));
        }

        Ok(())
    }
}

pub async fn api_rate_limit_middleware(
    axum::extract::State(state): axum::extract::State<crate::state::SharedState>,
    auth: crate::middleware::auth_middleware::AuthenticatedUser,
    request: axum::http::Request<axum::body::Body>,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, AppError> {
    state.api_rate_limiter.check(&auth.user_id.to_string())?;
    Ok(next.run(request).await)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_limiter_allows_up_to_max() {
        let limiter = RateLimiter::new(3, Duration::from_secs(60), "Rate limit exceeded");

        assert!(limiter.check("user-1").is_ok());
        assert!(limiter.check("user-1").is_ok());
        assert!(limiter.check("user-1").is_ok());

        // 4th request should be rate limited
        let result = limiter.check("user-1");
        assert!(result.is_err());
        match result {
            Err(AppError::TooManyRequests(msg)) => assert_eq!(msg, "Rate limit exceeded"),
            _ => panic!("Expected TooManyRequests error"),
        }
    }

    #[test]
    fn test_rate_limiter_isolates_different_keys() {
        let limiter = RateLimiter::new(2, Duration::from_secs(60), "Rate limit exceeded");

        assert!(limiter.check("key-a").is_ok());
        assert!(limiter.check("key-a").is_ok());
        assert!(limiter.check("key-a").is_err());

        // key-b should still be allowed
        assert!(limiter.check("key-b").is_ok());
        assert!(limiter.check("key-b").is_ok());
        assert!(limiter.check("key-b").is_err());
    }
}
