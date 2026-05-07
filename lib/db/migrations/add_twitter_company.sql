-- Add account_type to twitter_accounts
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal';

-- Remove unique constraint on user_id if exists, add composite unique
ALTER TABLE twitter_accounts DROP CONSTRAINT IF EXISTS twitter_accounts_user_id_unique;
CREATE UNIQUE INDEX IF NOT EXISTS twitter_accounts_user_account_type_unique ON twitter_accounts(user_id, account_type);

-- Add account_type to oauth_state
ALTER TABLE oauth_state ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal';

-- Create twitter_company_briefs table
CREATE TABLE IF NOT EXISTS twitter_company_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
