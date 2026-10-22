-- AI visibility clients we set up by hand (22 Oct 2026). Marked explicitly: a connected_sites row is
-- not enough, since any user can create one. lib/geo-role.ts (isGeoClient, geoRole), lib/geo-report.ts,
-- the /api/geo routes and /root/geo_check (weekly.py, launch.py) read it. A member is the client of the
-- sites their connected_sites rows point at; anything else they follow is an ordinary site.
-- Add a client by hand: INSERT INTO geo_clients (user_id, note) VALUES ('<users.id>', '<who>');
-- Run as the app's database user (itgrows), which owns the table.
CREATE TABLE IF NOT EXISTS geo_clients (
  user_id text PRIMARY KEY,
  note text,
  created_at timestamptz DEFAULT now()
);

-- The owners of the connected sites on 22 Oct 2026, all ours or clients set up by hand.
INSERT INTO geo_clients (user_id, note) VALUES
  ('45dd3f17-3e12-46d6-b9e3-64295ba8f62b', 'MagiScan (magiscan.app, new.magiscan.app), ours'),
  ('00f2505f-dd6c-4d0f-89f4-a1388dfbfabc', 'itgrows.ai, ours'),
  ('557cb8a3-c2f4-47a5-97d6-7a651e351fd9', 'FreightSizer (freightsizer.ai)'),
  ('f2c32017-2d0c-4f4e-b7d9-55dd54ab367b', 'Firma Ausland (firma-ausland.de)')
ON CONFLICT (user_id) DO NOTHING;
