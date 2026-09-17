export type NotificationType = 
  | 'KICKED'
  | 'BANNED'
  | 'MUTED'
  | 'NEW_REACTION'
  | 'JOIN_REQUEST'
  | 'JOIN_REQUEST_APPROVED'
  | 'JOIN_REQUEST_REJECTED'
  | 'FRIEND_REQUEST'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_MESSAGE'
  | string;

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}
