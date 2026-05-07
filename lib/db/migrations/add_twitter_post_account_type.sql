ALTER TABLE twitter_posts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal';
