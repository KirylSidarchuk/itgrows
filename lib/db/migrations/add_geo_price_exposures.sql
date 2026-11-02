-- The price test's visitor log (Kiryl, 2 Nov 2026; lib/geo-pricing.ts PRICE_TEST, written by
-- app/api/geo/price/route.ts). One row per visitor per experiment, written once, and its honest denominator:
--   experiment    PRICE_TEST.experiment;
--   visitor_id    the random id of the itg_vid cookie, nothing else: no address, no account;
--   arm           the monthly price in cents the visitor was first shown;
--   status        'test': counts. 'returning': the browser remembered an earlier visit, so he went to the
--                 one price. 'ref': a sales link took him out. 'doubt': the returning check timed out or
--                 failed, so he went to the one price. Only 'test' counts in the report.
--   first_seen    the first exposure;
--   card_seen_at  the price card came into view, once;
--   checked_at    he started a quick check, once;
--   source, utm, path  the referring site (host only), campaign tags, and the page of arrival.
-- Deleted after 24 months like other analytics (/root/geo_check/purge.py).
-- Idempotent. Run as the table owner, BEFORE the deploy: sudo -u postgres psql -d itgrows_db -f add_geo_price_exposures.sql
CREATE TABLE IF NOT EXISTS geo_price_exposures (
  experiment text NOT NULL,
  visitor_id text NOT NULL CHECK (visitor_id ~ '^[0-9a-f]{32}$'),
  arm integer NOT NULL CHECK (arm > 0),
  status text NOT NULL DEFAULT 'test' CHECK (status IN ('test', 'returning', 'ref', 'doubt')),
  first_seen timestamptz NOT NULL DEFAULT now(),
  card_seen_at timestamptz,
  checked_at timestamptz,
  source text,
  utm jsonb,
  path text,
  PRIMARY KEY (experiment, visitor_id)
);
CREATE INDEX IF NOT EXISTS geo_price_exposures_first_seen_idx ON geo_price_exposures (experiment, first_seen);
GRANT SELECT, INSERT, UPDATE, DELETE ON geo_price_exposures TO itgrows;
