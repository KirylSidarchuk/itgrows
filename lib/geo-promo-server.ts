import { randomInt } from "node:crypto"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { geoPlanBeforeSql } from "@/lib/geo-business"
import {
  PROMO_WHEEL,
  REWARD_INTERVAL,
  WHEEL_REWARDS,
  isWheelReward,
  promoLive,
  type PromoState,
  type PromoView,
  type WheelReward,
} from "@/lib/geo-promo"
import type { GeoInterval } from "@/lib/geo-pricing"

// The launch-rewards wheel on the server (the rules: lib/geo-promo.ts). Who may spin, the spin itself
// (the reward drawn here, uniform, with crypto.randomInt, and written once: users.geo_promo, see
// lib/db/migrations/add_geo_promo.sql), and the reward a checkout applies. /api/geo/promo/spin serves
// the cabinet; /api/geo/checkout reads checkoutReward; the webhook marks a reward used
// (lib/geo-business.ts geoPlanCheckoutCompleted).

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

function stored(v: unknown): PromoState | null {
  const s = (typeof v === "string" ? JSON.parse(v) : v) as PromoState | null
  return s && typeof s === "object" && isWheelReward(s.reward) && s.site && s.expires_at ? s : null
}

interface Account {
  promo: PromoState | null
  /** The site of the account's free report, if it may have a reward: a followed site with a finished
   *  day-0 report that nobody has had the plan for and that is no hand-set client's site. */
  site: string | null
  /** A client set up by hand, or an account that pays or has paid for the plan. */
  excluded: boolean
}

async function account(userId: string): Promise<Account | null> {
  const [r] = rows(
    await db.execute(sql`
      SELECT u.geo_promo AS promo,
             EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = u.id::text)
             OR EXISTS (SELECT 1 FROM geo_follows f
                        WHERE f.user_id = u.id::text
                          AND (f.plan = 'paid' OR f.plan_interval IS NOT NULL
                               OR f.research_session LIKE 'plan:%' OR f.research_session = 'invoice')) AS excluded,
             (SELECT s.domain FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
              WHERE f.user_id = u.id::text
                AND EXISTS (SELECT 1 FROM geo_runs r WHERE r.site_id = s.id AND r.kind = 'baseline' AND r.status = 'done')
                AND NOT EXISTS (SELECT 1 FROM geo_client_sites gcs WHERE gcs.domain = split_part(s.domain, '#', 1))
                AND NOT ${geoPlanBeforeSql(sql.raw("s.domain"))}
              ORDER BY f.created_at LIMIT 1) AS site
      FROM users u WHERE u.id::text = ${userId}`)
  )
  if (!r) return null
  return { promo: stored(r.promo), site: typeof r.site === "string" ? r.site : null, excluded: r.excluded === true }
}

const canSpin = (a: Account) => PROMO_WHEEL.enabled && !a.promo && !a.excluded && a.site !== null

function view(a: Account | null): PromoView {
  if (!a) return { canSpin: false, site: null, reward: null }
  const p = a.promo
  return {
    canSpin: canSpin(a),
    site: p?.site ?? a.site,
    // A client set up by hand, or a payer, has no reward to use (one used for the plan stays as used).
    reward:
      p && (!a.excluded || p.used_at)
        ? { id: p.reward, site: p.site, spunAt: p.spun_at, expiresAt: p.expires_at, used: Boolean(p.used_at), live: !a.excluded && promoLive(p) }
        : null,
  }
}

/** What the cabinet shows: can this account spin, and its reward. */
export async function promoView(userId: string): Promise<PromoView> {
  return view(await account(userId))
}

/** The one spin: the reward drawn here, for the site of the report, valid PROMO_WHEEL.validDays from
 *  now. Written only where nothing is stored yet, so a second spin (two tabs) gets the first one's
 *  reward. `fresh`: this call drew it. */
export async function spinWheel(
  userId: string
): Promise<{ view: PromoView; fresh: boolean; state: PromoState } | { error: "off" | "not_eligible" }> {
  const a = await account(userId)
  if (a?.promo) return { view: view(a), fresh: false, state: a.promo }
  if (!a || !canSpin(a) || !a.site) return { error: PROMO_WHEEL.enabled ? "not_eligible" : "off" }
  const reward: WheelReward = WHEEL_REWARDS[randomInt(WHEEL_REWARDS.length)]
  const now = new Date()
  const state: PromoState = {
    reward,
    site: a.site,
    spun_at: now.toISOString(),
    expires_at: new Date(now.getTime() + PROMO_WHEEL.validDays * 86_400_000).toISOString(),
  }
  const [written] = rows(
    await db.execute(sql`
      UPDATE users SET geo_promo = ${JSON.stringify(state)}::jsonb
      WHERE id::text = ${userId} AND geo_promo IS NULL
      RETURNING id`)
  )
  const after = await account(userId)
  if (!written) return after?.promo ? { view: view(after), fresh: false, state: after.promo } : { error: "not_eligible" }
  return { view: view(after), fresh: true, state }
}

/** The reward a checkout applies for this site and way to pay: won by this account, not used, not past
 *  its date, rewards applying (PROMO_WHEEL), for this site and for this way to pay; else null. An
 *  account that has become a hand-set client or a payer gets none. */
export async function checkoutReward(userId: string, site: string, interval: GeoInterval): Promise<WheelReward | null> {
  const a = await account(userId)
  const p = a?.promo
  if (!a || !p || a.excluded || !promoLive(p)) return null
  return p.site === site && REWARD_INTERVAL[p.reward] === interval ? p.reward : null
}
