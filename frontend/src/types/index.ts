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
  notification_preference?: string | null;
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

export interface JoinRequest {
  lobby_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  status: string;
  created_at: string;
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

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  friend: UserInfo;
  last_message: DirectMessage | null;
  unread_count: number;
}

export * from './ai';
export * from './notifications';