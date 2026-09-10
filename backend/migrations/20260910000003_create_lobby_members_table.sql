CREATE TABLE lobby_members (
    lobby_id  UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      VARCHAR(10) NOT NULL DEFAULT 'MEMBER'
              CHECK (role IN ('OWNER', 'MEMBER')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (lobby_id, user_id)
);

CREATE INDEX idx_lobby_members_user_id ON lobby_members (user_id);
