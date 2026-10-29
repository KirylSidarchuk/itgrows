import { createHmac, randomBytes, randomInt } from "node:crypto"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { geoPlanBeforeSql } from "@/lib/geo-business"
import { accountPrices } from "@/lib/geo-price-test"
import { sendOwner } from "@/lib/telegram"
import {
  PROMO_WHEEL,
  REWARD_INTERVAL,
  REWARD_RU,
  WHEEL_REWARDS,
  exitWheelOn,
  isWheelReward,
  promoLive,
  rewardsApply,
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
// The website's wheel, before an account (exit intent): guestSpin draws the same way and keeps the
// reward in geo_guest_promos (lib/db/migrations/add_geo_guest_promos.sql) for the browser's cookie;
// /api/geo/promo/guest-spin serves it. When the account loads its wheel (promoView) or spins
// (spinWheel) with that cookie, the reward moves to it (claim), once its free report is ready.

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

function stored(v: unknown): PromoState | null {
  const s = (typeof v === "string" ? JSON.parse(v) : v) as PromoState | null
  return s && typeof s === "object" && isWheelReward(s.reward) && s.site && s.expires_at ? s : null
}

/** One of the four rewards, each with the same chance: the cabinet's draw and the website's. */
export const drawReward = (): WheelReward => WHEEL_REWARDS[randomInt(WHEEL_REWARDS.length)]

interface Account {
  promo: PromoState | null
  /** The site of the account's free report, if it may have a reward: a followed site with a finished
   *  day-0 report that nobody has had the plan for and that is no hand-set client's site. */
  site: string | null
  /** A finished day-0 report on any site the account follows (`site` can still be null). */
  hasReport: boolean
  /** A client set up by hand, or an account that pays or has paid for the plan. */
  excluded: boolean
  email: string | null
}

async function account(userId: string): Promise<Account | null> {
  const [r] = rows(
    await db.execute(sql`
      SELECT u.geo_promo AS promo, u.email AS email,
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
              ORDER BY f.created_at LIMIT 1) AS site,
             EXISTS (SELECT 1 FROM geo_follows f JOIN geo_runs r ON r.site_id = f.site_id
                     WHERE f.user_id = u.id::text AND r.kind = 'baseline' AND r.status = 'done') AS has_report
      FROM users u WHERE u.id::text = ${userId}`)
  )
  if (!r) return null
  return {
    promo: stored(r.promo),
    site: typeof r.site === "string" ? r.site : null,
    hasReport: r.has_report === true,
    excluded: r.excluded === true,
    email: typeof r.email === "string" ? r.email : null,
  }
}

const canSpin = (a: Account) => PROMO_WHEEL.enabled && !a.promo && !a.excluded && a.site !== null

/** `pending`: a reward won on the website, waiting for this account's free report. */
function view(a: Account | null, pending: Guest | null = null): PromoView {
  if (!a) return { canSpin: false, site: null, reward: null, pending: null }
  const p = a.promo
  return {
    canSpin: canSpin(a),
    site: p?.site ?? a.site,
    // A client set up by hand, or a payer, has no reward to use (one used for the plan stays as used).
    reward:
      p && (!a.excluded || p.used_at)
        ? { id: p.reward, site: p.site, spunAt: p.spun_at, expiresAt: p.expires_at, used: Boolean(p.used_at), live: !a.excluded && promoLive(p) }
        : null,
    pending: pending ? { id: pending.reward, expiresAt: pending.expiresAt } : null,
  }
}

// ---- The website's wheel, before an account ----

/** A reward won on the website (geo_guest_promos), by its browser's token. */
export interface Guest {
  token: string
  reward: WheelReward
  spunAt: string
  expiresAt: string
  /** Moved to an account already. */
  claimed: boolean
}

const TOKEN = /^[0-9a-f]{64}$/
const isoOf = (v: unknown) => (v instanceof Date ? v : new Date(String(v))).toISOString()

function guestOf(r: Row | undefined): Guest | null {
  if (!r || typeof r.token !== "string" || !isWheelReward(r.reward)) return null
  return { token: r.token, reward: r.reward, spunAt: isoOf(r.spun_at), expiresAt: isoOf(r.expires_at), claimed: r.claimed_at != null }
}

/** The reward of a browser's token (its cookie), claimed or not, until its date; else null. No
 *  database without a well-formed token. */
export async function guestReward(token: string | null | undefined): Promise<Guest | null> {
  if (!token || !TOKEN.test(token)) return null
  const [r] = rows(
    await db.execute(sql`
      SELECT token, reward, spun_at, expires_at, claimed_at FROM geo_guest_promos
      WHERE token = ${token} AND expires_at > now()`)
  )
  return guestOf(r)
}

/** The internet address, one-way: HMAC-SHA256 with the server secret. The address is not stored. */
function addressHash(ip: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("no server secret for the website wheel")
  return createHmac("sha256", secret).update(`geo-guest-wheel:${ip}`).digest("hex")
}

/**
 * The website's spin, before an account: this browser's reward if its token has one; else the
 * unclaimed reward this internet address already has (no new draw by clearing cookies, or from another
 * browser on the same address); else a new one, drawn as the cabinet's (drawReward), kept
 * PROMO_WHEEL.validDays. The address check and the insert run under one lock per address, so two
 * spins at once get the same reward. `fresh`: this call drew it.
 */
export async function guestSpin(
  token: string | null | undefined,
  ip: string
): Promise<{ guest: Guest; fresh: boolean } | { error: "off" }> {
  if (!exitWheelOn()) return { error: "off" }
  const mine = await guestReward(token)
  if (mine) return { guest: mine, fresh: false }
  const hash = addressHash(ip)
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`geo_guest_wheel:${hash}`}))`)
    const [same] = rows(
      await tx.execute(sql`
        SELECT token, reward, spun_at, expires_at, claimed_at FROM geo_guest_promos
        WHERE ip_hash = ${hash} AND expires_at > now() AND claimed_at IS NULL
        ORDER BY spun_at DESC LIMIT 1`)
    )
    const kept = guestOf(same)
    if (kept) return { guest: kept, fresh: false }
    const [made] = rows(
      await tx.execute(sql`
        INSERT INTO geo_guest_promos (token, reward, spun_at, expires_at, ip_hash)
        VALUES (${randomBytes(32).toString("hex")}, ${drawReward()}, now(),
                now() + make_interval(days => ${PROMO_WHEEL.validDays}::int), ${hash})
        RETURNING token, reward, spun_at, expires_at, claimed_at`)
    )
    const guest = guestOf(made)
    if (!guest) throw new Error("the website's spin was not stored")
    return { guest, fresh: true }
  })
}

/** The website's reward this account may take: its browser's token holds one, unclaimed and not past
 *  its date; rewards apply (PROMO_WHEEL.enabled, or honourWon); and the account may have a reward (none
 *  yet, not a hand-set client, never had the plan). */
async function claimable(a: Account, token: string | null | undefined): Promise<Guest | null> {
  if (!token || a.promo || a.excluded || !rewardsApply()) return null
  const g = await guestReward(token)
  return g && !g.claimed ? g : null
}

/**
 * Moves a reward won on the website to the account, for the site of its free report, with the
 * website's dates: users.geo_promo { reward, site, spun_at, expires_at, by: "exit-wheel" }. The guest
 * row is claimed and the account written in one transaction, each only where still free, so a reward
 * goes to one account and an account gets one reward (a cabinet spin at the same moment wins or loses
 * as a whole). Counted (geo_wheel_claimed) and told to Kiryl. False if nothing moved.
 */
async function claim(userId: string, a: Account, g: Guest): Promise<boolean> {
  const site = a.site
  if (!site) return false
  const state: PromoState = { reward: g.reward, site, spun_at: g.spunAt, expires_at: g.expiresAt, by: "exit-wheel" }
  try {
    await db.transaction(async (tx) => {
      const [taken] = rows(
        await tx.execute(sql`
          UPDATE geo_guest_promos SET claimed_user_id = ${userId}::uuid, claimed_at = now()
          WHERE token = ${g.token} AND claimed_at IS NULL AND expires_at > now()
          RETURNING token`)
      )
      if (!taken) throw new Error("taken")
      const [written] = rows(
        await tx.execute(sql`
          UPDATE users SET geo_promo = ${JSON.stringify(state)}::jsonb
          WHERE id::text = ${userId} AND geo_promo IS NULL
          RETURNING id`)
      )
      if (!written) throw new Error("taken")
    })
  } catch {
    // Taken by then (another tab, another account, a cabinet spin), or the database refused: nothing moved.
    return false
  }
  const price = await accountPrices(userId).catch(() => null)
  await db
    .execute(sql`INSERT INTO analytics_events (user_id, event, path, props)
      VALUES (${userId}, 'geo_wheel_claimed', '/business/dashboard',
              ${JSON.stringify({ reward: g.reward, source: "exit", domain: site, expires_at: g.expiresAt, variant: price?.variant ?? null })}::jsonb)`)
    .catch(() => {})
  const until = g.expiresAt.slice(0, 16).replace("T", " ")
  void sendOwner(`🎡 Награда с сайта перешла в аккаунт: ${a.email ?? userId} — ${REWARD_RU[g.reward]}\n${site}, действует до ${until} UTC`)
  return true
}

/** What the cabinet shows: can this account spin, its reward, and a reward from the website waiting
 *  for its free report. `guestToken`: the browser's itg_wheel cookie; a reward won with it moves to the
 *  account here once the account has its report. */
export async function promoView(userId: string, guestToken?: string | null): Promise<PromoView> {
  let a = await account(userId)
  if (!a) return view(null)
  const g = await claimable(a, guestToken)
  if (g && a.site && (await claim(userId, a, g))) a = (await account(userId)) ?? a
  // Not moved: the account has no free report yet (the cabinet says the reward is waiting for it).
  return view(a, g && !a.promo && !a.site && !a.hasReport ? g : null)
}

/** The one spin: the reward drawn here, for the site of the report, valid PROMO_WHEEL.validDays from
 *  now. Written only where nothing is stored yet, so a second spin (two tabs) gets the first one's
 *  reward. A reward won on the website with this browser (`guestToken`) is taken instead of a new
 *  draw. `fresh`: this call drew it. */
export async function spinWheel(
  userId: string,
  guestToken?: string | null
): Promise<{ view: PromoView; fresh: boolean; state: PromoState } | { error: "off" | "not_eligible" }> {
  const a = await account(userId)
  if (a?.promo) return { view: view(a), fresh: false, state: a.promo }
  if (a) {
    const g = await claimable(a, guestToken)
    if (g && a.site && (await claim(userId, a, g))) {
      const after = await account(userId)
      if (after?.promo) return { view: view(after), fresh: false, state: after.promo }
    }
  }
  if (!a || !canSpin(a) || !a.site) return { error: PROMO_WHEEL.enabled ? "not_eligible" : "off" }
  const reward = drawReward()
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
