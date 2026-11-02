-- The returning-visitor check of the price test (lib/geo-price-returning.ts) looks a first-time request up
-- by these, in one query with a short time budget. geo_runs (requested_ip) and geo_guest_promos (ip_hash)
-- already have theirs.
-- Idempotent; CONCURRENTLY does not block the page-view log. Run as the table owner, BEFORE the deploy,
-- outside a transaction: sudo -u postgres psql -d itgrows_db -f add_price_test_lookup_indexes.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS site_visits_visitor_hash_idx ON site_visits (visitor_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ghost_mode_logs_ip_idx ON ghost_mode_logs (ip);
