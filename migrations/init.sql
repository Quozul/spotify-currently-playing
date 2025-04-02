CREATE TABLE tokens
(
    uuid          UUID PRIMARY KEY,
    user_id TEXT UNIQUE,
    access_token  TEXT,
    token_type    TEXT,
    expires_in    INTEGER,
    refresh_token TEXT,
    scope         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
