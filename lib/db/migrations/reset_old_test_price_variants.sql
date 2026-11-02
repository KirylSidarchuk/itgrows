-- The two accounts given $599 by the test of 28-30 Oct 2026 have been shown $499 since 30 Oct, when it ended.
-- With the test on again they would jump to $599 (lib/geo-price-test.ts): NULL keeps them on the one price.
-- Only those two: a variant from that test, on an account made before the new one. Idempotent.
-- Run BEFORE the deploy: sudo -u postgres psql -d itgrows_db -f reset_old_test_price_variants.sql
UPDATE users SET geo_price_variant = NULL
WHERE geo_price_variant = 59900 AND created_at < '2026-11-01';
