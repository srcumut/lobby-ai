// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/queryKeys.ts
// PURPOSE: Centralized TanStack Query keys for cache invalidation & revalidation
// ============================================================================

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
  },
  friends: {
    all: ['friends'] as const,
    pending: ['friends', 'pending'] as const,
    conversations: ['friends', 'conversations'] as const,
    messages: (friendId: string) => ['friends', 'messages', friendId] as const,
  },
  lobbies: {
    all: ['lobbies'] as const,
    detail: (id: string) => ['lobbies', 'detail', id] as const,
    members: (id: string) => ['lobbies', 'members', id] as const,
    bans: (id: string) => ['lobbies', 'bans', id] as const,
    requests: (id: string) => ['lobbies', 'requests', id] as const,
    messages: (id: string) => ['lobbies', 'messages', id] as const,
  },
  agents: {
    all: ['agents'] as const,
    detail: (id: string) => ['agents', 'detail', id] as const,
    credentials: ['agents', 'credentials'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
};
