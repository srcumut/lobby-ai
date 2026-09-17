use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    Validation(String),

    #[error("{0}")]
    NotFound(String),

    #[error("{0}")]
    Unauthorized(String),

    #[error("{0}")]
    Forbidden(String),

    #[error("{0}")]
    Conflict(String),

    #[error("{0}")]
    TooManyRequests(String),

    #[error("{0}")]
    Internal(String),

    #[error("{0}")]
    BadRequest(String),

    #[error("{0}")]
    DatabaseError(String),
}

#[derive(Serialize)]
struct ErrorBody {
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: &'static str,
    message: String,
}

impl AppError {
    fn status_and_code(&self) -> (StatusCode, &'static str) {
        match self {
            Self::Validation(_) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR"),
            Self::BadRequest(_) => (StatusCode::BAD_REQUEST, "BAD_REQUEST"),
            Self::NotFound(_) => (StatusCode::NOT_FOUND, "NOT_FOUND"),
            Self::Unauthorized(_) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
            Self::Forbidden(_) => (StatusCode::FORBIDDEN, "FORBIDDEN"),
            Self::Conflict(_) => (StatusCode::CONFLICT, "CONFLICT"),
            Self::TooManyRequests(_) => (StatusCode::TOO_MANY_REQUESTS, "TOO_MANY_REQUESTS"),
            Self::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"),
            Self::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR"),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code) = self.status_and_code();

        // Don't expose internal error details in production
        let message = match &self {
            Self::Internal(_) => "An internal error occurred.".to_string(),
            other => other.to_string(),
        };

        let body = ErrorBody {
            error: ErrorDetail { code, message },
        };

        (status, axum::Json(body)).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!(error = %err, "Database error");
        Self::Internal("Database error".to_string())
    }
}
