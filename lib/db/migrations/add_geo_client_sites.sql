-- The sites of AI-visibility clients we set up by hand, explicit (22 Oct 2026). A geo_clients member
-- is the client of exactly the domains listed here for them; any other site they follow is an ordinary
-- one (preview, no weekly run, no launch report). connected_sites is NOT read for this any more: its
-- url is free text any user can add or change, and it belongs to the blog product.
-- Read by lib/geo-role.ts (clientOwnsSql, geoClientOwns), lib/geo-report.ts, /api/geo/launch,
-- /api/geo/notify, /api/geo/research-checkout and /root/geo_check (weekly.py, launch.py launch_domains).
--
-- domain is spelled the way geo_sites.domain spells a site: lower case, no scheme, no "www.", no port
-- or path ("magiscan.app"). A "#xx" language variant in geo_sites ("itgrows.ai#de") counts as its site,
-- so it is never listed here. A row needs its user in geo_clients and goes when the user leaves it.
--
-- Add a client site by hand (the user must be in geo_clients first, add_geo_clients.sql):
--   INSERT INTO geo_client_sites (user_id, domain, note) VALUES ('<users.id>', 'example.com', '<who>');
-- Take one away:
--   DELETE FROM geo_client_sites WHERE user_id = '<users.id>' AND domain = 'example.com';
-- Run as the app's database user (itgrows), which owns the tables.
CREATE TABLE IF NOT EXISTS geo_client_sites (
  user_id text NOT NULL REFERENCES geo_clients (user_id) ON DELETE CASCADE,
  domain text NOT NULL CHECK (domain = lower(domain) AND domain !~ '^(https?://|www\.)' AND domain !~ '[/?#:@[:space:]]'),
  note text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, domain)
);
CREATE INDEX IF NOT EXISTS geo_client_sites_domain_idx ON geo_client_sites (domain);

-- Seeded from the geo_clients members' connected_sites on 22 Oct 2026 (url normalised), the last time
-- connected_sites decides anything here.
INSERT INTO geo_client_sites (user_id, domain, note) VALUES
  ('00f2505f-dd6c-4d0f-89f4-a1388dfbfabc', 'itgrows.ai', 'itgrows.ai, ours'),
  ('45dd3f17-3e12-46d6-b9e3-64295ba8f62b', 'magiscan.app', 'MagiScan, ours'),
  ('45dd3f17-3e12-46d6-b9e3-64295ba8f62b', 'new.magiscan.app', 'MagiScan, ours'),
  ('557cb8a3-c2f4-47a5-97d6-7a651e351fd9', 'freightsizer.ai', 'FreightSizer'),
  ('f2c32017-2d0c-4f4e-b7d9-55dd54ab367b', 'firma-ausland.de', 'Firma Ausland')
ON CONFLICT (user_id, domain) DO NOTHING;

-- /api/geo/follow: an account without the plan has the day-0 report computed for REPORT_SITES site(s)
-- (lib/geo-pricing.ts). The route holds the slot here, atomically, before it asks the VM for the report,
-- so two sites added at once cannot both get in: under pg_advisory_xact_lock(hashtext(user_id)) one
-- INSERT ... SELECT adds the claim only while the account has fewer than REPORT_SITES counted domains
-- across its geo_follows and its claims (a site on the plan or with a bought report does not count).
-- A claim is removed when the VM call fails and kept when it succeeds (the follow then counts the
-- same domain once). Clients in geo_clients take no claims.
CREATE TABLE IF NOT EXISTS geo_follow_claims (
  user_id text NOT NULL,
  domain text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, domain)
);
