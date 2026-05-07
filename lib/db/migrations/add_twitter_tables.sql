-- Migration: add Twitter/X tables

CREATE TABLE IF NOT EXISTS twitter_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  twitter_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS twitter_accounts_user_id_idx ON twitter_accounts(user_id);

CREATE TABLE IF NOT EXISTS twitter_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_thread BOOLEAN DEFAULT FALSE,
  thread_tweets JSONB,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  twitter_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS twitter_posts_user_id_idx ON twitter_posts(user_id);
CREATE INDEX IF NOT EXISTS twitter_posts_status_idx ON twitter_posts(status);
