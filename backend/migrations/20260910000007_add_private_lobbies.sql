ALTER TABLE lobbies ADD COLUMN password_hash VARCHAR(255);

CREATE TABLE lobby_join_requests (
    lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (lobby_id, user_id)
);

CREATE INDEX idx_lobby_join_requests_lobby_id ON lobby_join_requests(lobby_id);
