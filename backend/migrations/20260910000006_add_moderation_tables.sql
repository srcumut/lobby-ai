-- Update role constraint to include MODERATOR
ALTER TABLE lobby_members DROP CONSTRAINT lobby_members_role_check;
ALTER TABLE lobby_members ADD CONSTRAINT lobby_members_role_check CHECK (role IN ('OWNER', 'MODERATOR', 'MEMBER'));

-- Create lobby_bans table
CREATE TABLE lobby_bans (
    lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (lobby_id, user_id)
);

CREATE INDEX idx_lobby_bans_lobby_id ON lobby_bans (lobby_id);

-- Create lobby_mutes table
CREATE TABLE lobby_mutes (
    lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    muted_until TIMESTAMPTZ, -- NULL means permanent mute
    PRIMARY KEY (lobby_id, user_id)
);

CREATE INDEX idx_lobby_mutes_lobby_id ON lobby_mutes (lobby_id);
