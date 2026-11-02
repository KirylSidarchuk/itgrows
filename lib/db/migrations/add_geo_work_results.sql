-- What our work delivered for a client, a month at a time: the cabinet's block above the report
-- (lib/geo-report.ts workResults). Written by the VM, /root/geo_report.py --cabinet, in the client's language.
CREATE TABLE IF NOT EXISTS geo_work_results (
  site_id uuid NOT NULL REFERENCES geo_sites(id) ON DELETE CASCADE,
  month text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, month)
);

-- The email of the 1st, "your month's report is in your account" (app/api/geo/monthly/route.ts). Its own
-- switch: clients turned the two-weekly email off (email_weekly) without asking to lose this one.
ALTER TABLE geo_follows ADD COLUMN IF NOT EXISTS email_monthly boolean NOT NULL DEFAULT true;
