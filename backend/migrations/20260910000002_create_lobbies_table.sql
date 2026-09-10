CREATE TABLE lobbies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id    UUID NOT NULL REFERENCES users(id),
    visibility  VARCHAR(10) NOT NULL DEFAULT 'PUBLIC'
                CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lobbies_owner_id ON lobbies (owner_id);
CREATE INDEX idx_lobbies_visibility ON lobbies (visibility);
