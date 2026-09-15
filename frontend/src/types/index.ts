export interface UserInfo {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_bot: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserInfo;
}

export interface Lobby {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  visibility: string;
  member_count: number;
  created_at: string;
}

export interface LobbyMember {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  is_bot: boolean;
  joined_at: string;
}

export interface BannedUser {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banned_at: string;
  banned_by: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_bot: boolean;
  created_at: string;
}
export * from './ai';  
 