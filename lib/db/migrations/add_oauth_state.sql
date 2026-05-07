CREATE TABLE IF NOT EXISTS oauth_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  state TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'twitter',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oauth_state_state ON oauth_state(state);
