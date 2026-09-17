-- Add notification_preference column to lobby_members
ALTER TABLE lobby_members ADD COLUMN IF NOT EXISTS notification_preference VARCHAR(20) NOT NULL DEFAULT 'MENTIONS_ONLY' CHECK (notification_preference IN ('ALL', 'MENTIONS_ONLY', 'MUTE'));
