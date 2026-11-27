import { createHash } from "crypto"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

// Limits on the agent doors of itgrows.ai (/mcp, /api/agent/*), the security norm of 27 Nov 2026
// (/opt/venture_os/playbooks/security.md, "Норма для точек входа агентов"; Kiryl: «Да, делай»). The reason: a public
// surface without limits is a hole (pickaclass, 17–18 Nov), and two tools cost something per call:
//   - every address: at most 30 requests a minute to /mcp and /api/agent/*, then 429;
//   - check_ai_visibility (each new check pays the assistants): 3 new checks a day per address, 30 a day in all; a site
//     checked in the last 24 hours is answered from that check and counts against nothing;
//   - book_call (each one is a Telegram message to Kiryl): 1 per email an hour, 10 a day in all; the same request again
//     sends nothing.
// At a daily ceiling: one row 'agent_limit' (no Telegram per hit); the operator turns a day with such rows into one
// vos owner-add (/api/agent/limits, routine itgrows:agent-limits-daily).
// Everything is counted in analytics_events. Addresses are stored only as a salted hash.

export const LIMITS = { perMinute: 30, checksPerIpDay: 3, checksPerDay: 30, callsPerEmailHour: 1, callsPerDay: 10 }

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const num = async (s: ReturnType<typeof sql>) => Number(rows(await db.execute(s))[0]?.n ?? 0)

export function ipHash(ip: string): string {
  const salt = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "itgrows-agent"
  return createHash("sha256").update(`${salt}|agent|${ip || "unknown"}`).digest("hex").slice(0, 24)
}

/** Counts this request and says whether the address went over the per-minute limit. Fails open: a database hiccup
 *  must not shut the doors. */
export async function overMinuteLimit(ip: string, path: string): Promise<boolean> {
  const h = ipHash(ip)
  try {
    await db.execute(sql`INSERT INTO analytics_events (event, path, props) VALUES ('agent_req', ${path.slice(0, 100)}, ${JSON.stringify({ ip: h })}::jsonb)`)
    if (Math.random() < 0.005) {
      await db.execute(sql`DELETE FROM analytics_events WHERE event = 'agent_req' AND created_at < now() - interval '2 days'`)
    }
    const n = await num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_req' AND props->>'ip' = ${h} AND created_at > now() - interval '60 seconds'`)
    return n > LIMITS.perMinute
  } catch (e) {
    console.warn("[agent-limits] minute:", e instanceof Error ? e.message : e)
    return false
  }
}

export async function noteCeiling(tool: string, scope: string): Promise<void> {
  try {
    await db.execute(sql`INSERT INTO analytics_events (event, path, props) VALUES ('agent_limit', '/mcp', ${JSON.stringify({ tool, scope })}::jsonb)`)
  } catch {}
}

/** "https://www.Example.com/path" -> "example.com": one key per site for the 24-hour reuse. */
export function siteKey(site: string): string {
  return site
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#:].*$/, "")
}

/** A finished or running check of this site in the last 24 hours (run id), started through the agent doors. */
export async function recentCheck(key: string): Promise<string | null> {
  try {
    const r = rows(
      await db.execute(sql`SELECT props->>'run_id' AS id FROM analytics_events WHERE event = 'agent_check' AND props->>'site' = ${key}
                           AND created_at > now() - interval '24 hours' AND props->>'run_id' IS NOT NULL ORDER BY created_at DESC LIMIT 1`)
    )[0]
    return r?.id ? String(r.id) : null
  } catch {
    return null
  }
}

/** Whether a new check may start: null if yes, else which limit stops it. */
export async function checkBlocked(ip: string): Promise<"address" | "daily" | null> {
  try {
    const h = ipHash(ip)
    const [mine, all] = await Promise.all([
      num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_check' AND props->>'new' = 'true' AND props->>'ip' = ${h} AND created_at > now() - interval '24 hours'`),
      num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_check' AND props->>'new' = 'true' AND created_at > now() - interval '24 hours'`),
    ])
    if (all >= LIMITS.checksPerDay) return "daily"
    if (mine >= LIMITS.checksPerIpDay) return "address"
    return null
  } catch {
    return null
  }
}

export async function noteCheck(key: string, ip: string, runId: string | null, isNew: boolean, assistant: string): Promise<void> {
  try {
    await db.execute(sql`INSERT INTO analytics_events (event, path, props) VALUES ('agent_check', '/mcp', ${JSON.stringify({ site: key, run_id: runId, new: isNew, ip: ipHash(ip), assistant })}::jsonb)`)
  } catch {}
}

/** Whether a call request may go to the founder: "ok", "duplicate" (same email and message in 24 h), "email_hour"
 *  (this email already asked in the last hour) or "daily" (10 in 24 h). */
export async function callAllowed(email: string, message: string): Promise<"ok" | "duplicate" | "email_hour" | "daily"> {
  try {
    const e = email.toLowerCase()
    const [dup, hour, day] = await Promise.all([
      num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_call_request' AND lower(props->>'email') = ${e}
              AND coalesce(props->>'message', '') = ${message} AND created_at > now() - interval '24 hours'`),
      num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_call_request' AND lower(props->>'email') = ${e} AND created_at > now() - interval '1 hour'`),
      num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_call_request' AND created_at > now() - interval '24 hours'`),
    ])
    if (dup > 0) return "duplicate"
    if (hour >= LIMITS.callsPerEmailHour) return "email_hour"
    if (day >= LIMITS.callsPerDay) return "daily"
    return "ok"
  } catch {
    return "ok"
  }
}

/** The last 24 hours of limits, for the operator's daily line. */
export async function limitsReport() {
  const q = async (s: ReturnType<typeof sql>) => rows(await db.execute(s))
  const [ceilings, checks, calls, throttled] = await Promise.all([
    q(sql`SELECT props->>'tool' AS tool, props->>'scope' AS scope, count(*)::int AS n, min(created_at) AS first FROM analytics_events
          WHERE event = 'agent_limit' AND created_at > now() - interval '24 hours' GROUP BY 1, 2`),
    num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_check' AND props->>'new' = 'true' AND created_at > now() - interval '24 hours'`),
    num(sql`SELECT count(*)::int AS n FROM analytics_events WHERE event = 'agent_call_request' AND created_at > now() - interval '24 hours'`),
    num(sql`SELECT count(*)::int AS n FROM (SELECT props->>'ip', date_trunc('minute', created_at) FROM analytics_events WHERE event = 'agent_req'
            AND created_at > now() - interval '24 hours' GROUP BY 1, 2 HAVING count(*) > ${LIMITS.perMinute}) t`),
  ])
  return { limits: LIMITS, last_24h: { new_checks: checks, call_requests: calls, minutes_over_limit: throttled, daily_ceilings: ceilings } }
}
