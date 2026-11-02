import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { PRICE_TEST } from "@/lib/geo-pricing"
import { priceHmac } from "@/lib/geo-price-visitor"

// Has this internet address and browser been here before the test? (Kiryl, 2 Nov 2026: "убедись что все
// кто ранее заходил когда-то на сайт увидят 499".) Asked once, on a first visit without our cookie, in
// one query on the app's own database connection (lib/db: one per function instance), so it adds none.
// Nothing about the visitor is stored: the answer goes into the pin as a flag.
//
//   site_visits       the daily hash of address and browser (app/api/track/visit/route.ts), recomputed for
//                     every day the purge has not cleared yet, with this user agent and with the same one a
//                     few releases back (olderAgents): a browser updates itself, and the hash changes with it;
//   geo_runs          the address of a quick check or a free report;
//   ghost_mode_logs   the address of a free post preview;
//   geo_guest_promos  the keyed hash of the address of a wheel spun on the website: the same HMAC as
//                     lib/geo-promo-server.ts addressHash.
//
// What counts is what happened before the test's first exposure, so a visitor who cleared his cookies
// in the test is not sent out of his arm by his own visits, nor a crawler that ran the beacon. What the
// retention purge (/root/geo_check/purge.py) has cleared after 90 days cannot be recognised here; such a
// visitor is caught by his cookies or his browser's storage, if he kept them.
//
// A request's addresses come from Vercel. No address, a slow database, an error: "doubt", the one price.
// The budget covers a cold connection, and the site is quiet enough that the connection is usually cold
// (it closes after 20 s idle): Vercel in iad1 to the database in us-central1 is about 35 ms each way
// and back, and TCP, TLS, the password exchange and the query take seven or eight round trips, 250 to
// 300 ms. A budget of 300 ms would send most first visits to the one price. Measured on production on
// 2 Nov 2026 a cold connection added about 300 to 370 ms, at times over a second; at 600 ms new visitors
// sometimes fell out of the test, at 1000 ms they did not.

export const LOOKUP_TIMEOUT_MS = 1000
const DAY = 86_400_000
/** When the visit log began. */
const FIRST_DAY = Date.UTC(2026, 6, 8)
/** The purge clears a day's hashes after 90 days; older days cannot match. */
const LOG_DAYS = 100
/** How many releases back a browser may have been at its earlier visit: about three months' worth. */
const RELEASES_BACK = 6

export type Returning = "new" | "returning" | "doubt"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

const enc = new TextEncoder()

const BROWSER_VERSION = /\b(Chrome|Chromium|CriOS|Edg|EdgA|EdgiOS|OPR|Firefox|FxiOS)\/(\d{2,3})\b|\brv:(\d{2,3})\b/g

/** This user agent, and the same browser's a few releases back ("Chrome/131" -> "Chrome/130" ...). Anyone
 *  else this might match is on the same internet address, and the mistake then is only the one price. */
export function olderAgents(ua: string): string[] {
  const agents = [ua]
  if (ua.search(BROWSER_VERSION) >= 0) {
    for (let back = 1; back <= RELEASES_BACK; back++) {
      agents.push(ua.replace(BROWSER_VERSION, (_m, name?: string, major?: string, rv?: string) => (name ? `${name}/${Number(major) - back}` : `rv:${Number(rv) - back}`)))
    }
  }
  return agents
}

/** sha256(ip|ua|day).slice(0, 32), as /api/track/visit writes it. */
async function dayHashes(ip: string, ua: string): Promise<string[]> {
  const days: string[] = []
  for (let t = Math.max(FIRST_DAY, Date.now() - LOG_DAYS * DAY); t <= Date.now(); t += DAY) days.push(new Date(t).toISOString().slice(0, 10))
  const hash = async (agent: string, day: string) => {
    const h = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`${ip}|${agent}|${day}`)))
    return Array.from(h.subarray(0, 16), (x) => x.toString(16).padStart(2, "0")).join("")
  }
  return Promise.all(olderAgents(ua).flatMap((agent) => days.map((day) => hash(agent, day))))
}

async function seenBefore(ip: string, ua: string): Promise<Returning> {
  const [hashes, wheel] = await Promise.all([dayHashes(ip, ua), priceHmac(`geo-guest-wheel:${ip}`, true)])
  const [r] = rows(
    await db.execute(sql`
      WITH cut AS (
        SELECT COALESCE((SELECT min(first_seen) FROM geo_price_exposures WHERE experiment = ${PRICE_TEST.experiment}), now()) AS at
      )
      SELECT EXISTS (SELECT 1 FROM site_visits v, cut WHERE v.visitor_hash = ANY (string_to_array(${hashes.join(",")}::text, ',')) AND v.created_at < cut.at)
          OR EXISTS (SELECT 1 FROM geo_runs g, cut WHERE g.requested_ip = ${ip}::text AND g.created_at < cut.at)
          OR EXISTS (SELECT 1 FROM ghost_mode_logs l, cut WHERE l.ip = ${ip}::text AND l.created_at < cut.at)
          OR EXISTS (SELECT 1 FROM geo_guest_promos p, cut WHERE p.ip_hash = ${wheel}::text AND p.spun_at < cut.at) AS seen`)
  )
  if (typeof r?.seen !== "boolean") return "doubt"
  return r.seen ? "returning" : "new"
}

/** The answer for this address and browser, within LOOKUP_TIMEOUT_MS. Never throws. */
export async function returningVisitor(ip: string, ua: string): Promise<Returning> {
  if (!ip) return "doubt"
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const late = new Promise<Returning>((resolve) => {
      timer = setTimeout(() => resolve("doubt"), LOOKUP_TIMEOUT_MS)
    })
    return await Promise.race([seenBefore(ip, ua).catch((): Returning => "doubt"), late])
  } catch {
    return "doubt"
  } finally {
    if (timer) clearTimeout(timer)
  }
}
