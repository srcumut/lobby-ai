use uuid::Uuid;

use crate::errors::AppError;
use crate::repositories::user_repository;
use crate::schemas::auth::{UpdateProfileRequest, UserInfo};
use crate::state::SharedState;

pub async fn update_profile(
    state: &SharedState,
    user_id: Uuid,
    request: UpdateProfileRequest,
) -> Result<UserInfo, AppError> {
    let user = user_repository::update_profile(
        &state.db,
        user_id,
        request.display_name.as_deref(),
        request.avatar_url.as_deref(),
        request.bio.as_deref(),
    )
    .await?;

    Ok(UserInfo {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at,
    })
}
