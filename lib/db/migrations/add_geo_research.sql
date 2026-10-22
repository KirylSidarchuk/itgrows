-- AI visibility, paid report and plan terms (22 Oct 2026). geo_follows is created by the VM
-- (/root/geo_check/tables.sql); these columns are the app's: lib/geo-business.ts writes them from the
-- Stripe webhook, lib/geo-report.ts reads them.
--   research_paid_at      the site's detailed report was bought (or grandfathered): shown whole
--   research_session      the Stripe Checkout session that paid for it
--   research_credited_at  the report's price already came off a first plan payment (no second credit)
--   plan_interval         month | quarter | year while plan = 'paid'
-- Run as the table owner: sudo -u postgres psql -d itgrows_db -f add_geo_research.sql
ALTER TABLE geo_follows ADD COLUMN IF NOT EXISTS research_paid_at timestamptz;
ALTER TABLE geo_follows ADD COLUMN IF NOT EXISTS research_session text;
ALTER TABLE geo_follows ADD COLUMN IF NOT EXISTS research_credited_at timestamptz;
ALTER TABLE geo_follows ADD COLUMN IF NOT EXISTS plan_interval text
  CHECK (plan_interval IN ('month', 'quarter', 'year'));

-- Every follow made before this change was internal (itgrows-self, Kiryl's tests): fully unlocked,
-- no credit. The cut-off keeps a re-run from unlocking real sign-ups.
UPDATE geo_follows
SET research_paid_at = created_at, research_session = 'grandfathered-2026-10-22', research_credited_at = now()
WHERE research_paid_at IS NULL AND created_at < '2026-10-22 12:30:00+00';
