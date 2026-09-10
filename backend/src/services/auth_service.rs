use crate::auth::{jwt, password};
use crate::errors::AppError;
use crate::models::user::User;
use crate::repositories::user_repository;
use crate::schemas::auth::{AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, UserInfo};
use crate::state::SharedState;

pub async fn register(
    state: &SharedState,
    request: RegisterRequest,
) -> Result<AuthResponse, AppError> {
    // Check username uniqueness
    if user_repository::find_by_username(&state.db, &request.username)
        .await?
        .is_some()
    {
        return Err(AppError::Conflict("Username is already taken".to_string()));
    }

    // Check email uniqueness
    if user_repository::find_by_email(&state.db, &request.email)
        .await?
        .is_some()
    {
        return Err(AppError::Conflict(
            "Email is already registered".to_string(),
        ));
    }

    let password_hash = password::hash_password(&request.password)?;

    let user = user_repository::create_user(
        &state.db,
        &request.username,
        &request.email,
        &password_hash,
        request.display_name.as_deref(),
    )
    .await?;

    build_auth_response(
        &state.config.jwt_access_secret,
        &state.config.jwt_refresh_secret,
        &user,
    )
}

pub async fn login(state: &SharedState, request: LoginRequest) -> Result<AuthResponse, AppError> {
    let user = user_repository::find_by_email(&state.db, &request.email)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    let valid = password::verify_password(&request.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized(
            "Invalid email or password".to_string(),
        ));
    }

    build_auth_response(
        &state.config.jwt_access_secret,
        &state.config.jwt_refresh_secret,
        &user,
    )
}

pub async fn refresh(
    state: &SharedState,
    request: RefreshRequest,
) -> Result<AuthResponse, AppError> {
    let claims = jwt::validate_token(&request.refresh_token, &state.config.jwt_refresh_secret)?;

    let user = user_repository::find_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

    build_auth_response(
        &state.config.jwt_access_secret,
        &state.config.jwt_refresh_secret,
        &user,
    )
}

fn build_auth_response(
    access_secret: &str,
    refresh_secret: &str,
    user: &User,
) -> Result<AuthResponse, AppError> {
    let access_token = jwt::generate_access_token(user.id, access_secret)?;
    let refresh_token = jwt::generate_refresh_token(user.id, refresh_secret)?;

    Ok(AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username.clone(),
            email: user.email.clone(),
            display_name: user.display_name.clone(),
            avatar_url: user.avatar_url.clone(),
            bio: user.bio.clone(),
            created_at: user.created_at,
        },
    })
}
