-- The A/B test of the AI-visibility plan's monthly price (Kiryl, 27 Oct 2026; lib/geo-pricing.ts
-- PRICE_TEST). geo_price_variant: the monthly price in cents an account was given at random in the
-- insert that created it (auth.ts, app/api/register/route.ts), kept for good. NULL: an account from
-- before the test, or created while it is off: the one price, $499 a month (ONE_PRICE_MONTH). Clients
-- set up by hand (geo_clients) are on the one price whatever it says (lib/geo-price-test.ts).
-- Rows that exist stay NULL: nobody is re-priced.
-- Run as the table owner: sudo -u postgres psql -d itgrows_db -f add_geo_price_variant.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS geo_price_variant integer
  CHECK (geo_price_variant IS NULL OR geo_price_variant > 0);
