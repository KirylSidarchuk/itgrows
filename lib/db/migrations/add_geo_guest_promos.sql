-- The launch-rewards wheel on the website, before an account (exit intent; Kiryl, 29 Oct 2026;
-- lib/geo-promo.ts PROMO_WHEEL.exitIntent). One row per reward won there, written by
-- POST /api/geo/promo/guest-spin (lib/geo-promo-server.ts guestSpin):
--   token        the browser's itg_wheel cookie: 32 random bytes, hex;
--   reward       drawn on the server like the cabinet's spin: setup_free | month_half |
--                quarter_plus_month | year_30;
--   spun_at, expires_at   the spin and its end (spun_at + PROMO_WHEEL.validDays, 7 days);
--   ip_hash      HMAC-SHA256 of the visitor's internet address with the server secret (AUTH_SECRET):
--                one unexpired, unclaimed reward per address, so clearing cookies draws nothing new;
--                the address itself is not stored;
--   claimed_user_id, claimed_at   set once, when the reward moves to an account (users.geo_promo,
--                by "exit-wheel", lib/geo-promo-server.ts claim): a reward goes to one account and an
--                account takes one (the unique index). Deleting the account clears claimed_user_id;
--                claimed_at stays, so the reward is never claimed again.
-- Idempotent. Run as the table owner: sudo -u postgres psql -d itgrows_db -f add_geo_guest_promos.sql
CREATE TABLE IF NOT EXISTS geo_guest_promos (
  token text PRIMARY KEY CHECK (token ~ '^[0-9a-f]{64}$'),
  reward text NOT NULL CHECK (reward IN ('setup_free', 'month_half', 'quarter_plus_month', 'year_30')),
  spun_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ip_hash text NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
  claimed_user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  claimed_at timestamptz,
  CHECK (expires_at > spun_at),
  CHECK (claimed_user_id IS NULL OR claimed_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS geo_guest_promos_ip_idx ON geo_guest_promos (ip_hash, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS geo_guest_promos_claimed_user_idx ON geo_guest_promos (claimed_user_id)
  WHERE claimed_user_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON geo_guest_promos TO itgrows;
