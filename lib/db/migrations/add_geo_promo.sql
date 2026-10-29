-- The launch-rewards wheel of the AI-visibility cabinet (Kiryl, 29 Oct 2026; lib/geo-promo.ts PROMO_WHEEL).
-- geo_promo: the account's one spin, written once by /api/geo/promo/spin (lib/geo-promo-server.ts
-- spinWheel, only where it is NULL): {"reward": "setup_free" | "month_half" | "quarter_plus_month" |
-- "year_30", "site": "<domain of the report>", "spun_at": "<ISO>", "expires_at": "<ISO, spun_at + 7 days>"};
-- once the plan is paid with it the Stripe webhook adds "used_at" and "session"
-- (lib/geo-business.ts geoPlanCheckoutCompleted). NULL: never spun. Rows that exist stay NULL.
-- Run as the table owner: sudo -u postgres psql -d itgrows_db -f add_geo_promo.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS geo_promo jsonb
  CHECK (geo_promo IS NULL OR (jsonb_typeof(geo_promo) = 'object' AND geo_promo ? 'reward' AND geo_promo ? 'expires_at'));
