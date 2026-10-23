-- One row per instant check whose outcome was sent to the owner's Telegram (app/api/geo/teaser).
-- The page polls GET /api/geo/teaser?id= every few seconds; the first poll that sees the check
-- finished inserts the run here and only that poll sends the alert. No foreign key: geo_runs belongs
-- to the VM service and may be purged on its own schedule.
CREATE TABLE IF NOT EXISTS geo_run_alerts (
  run_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE geo_run_alerts OWNER TO itgrows;
