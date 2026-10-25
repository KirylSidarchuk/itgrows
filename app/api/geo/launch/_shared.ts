import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { geoCheck } from "@/lib/geo-check"
import { geoClientOwns } from "@/lib/geo-role"

// The launch report's items, as /root/geo_check/launch.py on the VM keeps them (table geo_launch),
// read through the VM service (/launch-items; /launch re-runs the automatic checks first). Each item
// says who does it: "you" (the client: steps holds the exact clicks, de the same in German) or "us".
// A site never checked comes back with the list every site gets (generic: access per platform,
// Search Console) until its first check; the email can go out on it, the report page never shows it.

export type LaunchStatus = "ok" | "fixed" | "handed" | "you" | "todo" | "issue" | "tip" | "check"

export interface LaunchItem {
  key: string
  title: string
  how: "auto" | "manual"
  who?: "you" | "us"
  status: LaunchStatus
  note: string | null
  /** What the check saw on a "you" item: ours (launch.py show), never sent to the client. */
  detail?: string | null
  updated_at: string | null
  /** For a "you" item: what to do and where to click, in English. */
  steps?: string[]
  /** The same in German. */
  de?: { title: string; steps: string[] } | null
  /** "If you use it" (Search Console): listed, never the reason for a reminder. */
  optional?: boolean
  /** The list every site gets, for a site never checked: not this site's own. */
  generic?: boolean
}

/** A "you" item the client still has to do. "check" is theirs done, ours to verify: launch.py turns
 *  one a check can confirm back to "you" / "issue" when it still fails after the Done. */
export const OPEN_STATUSES = new Set<LaunchStatus>(["you", "issue", "handed", "todo"])

export const RECHECK_MINUTES = 10

type Row = Record<string, unknown>
export const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export function domainOf(site: string) {
  return site.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]
}

/** The site is on the plan for this user, or theirs as a client we set up by hand. */
export async function owns(userId: string, domain: string) {
  const paid = rows(
    await db.execute(sql`
      SELECT 1 FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${domain} AND f.plan = 'paid'
      LIMIT 1`)
  )
  return paid.length > 0 || (await geoClientOwns(userId, domain))
}

/** The user follows the site (on the plan or not). */
export async function follows(userId: string, domain: string) {
  const r = rows(
    await db.execute(sql`
      SELECT 1 FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${domain}
      LIMIT 1`)
  )
  return r.length > 0
}

/** The stored items (no check is run: the VM answers from its table at once). */
export async function readItems(domain: string): Promise<LaunchItem[] | null> {
  const r = await geoCheck<{ items: LaunchItem[] }>("/launch-items", { domain }, 20_000)
  return r.status === 200 ? (r.data.items ?? []) : null
}

/** Re-runs the automatic checks (they fetch the site as eleven crawlers: most of a minute). */
export async function runCheck(domain: string): Promise<LaunchItem[] | null> {
  const r = await geoCheck<{ items: LaunchItem[] }>("/launch", { domain }, 55_000).catch(() => null)
  return r && r.status === 200 ? (r.data.items ?? []) : null
}

/** When the automatic checks last changed an item. A "check" item moved when the client clicked Done. */
export function lastAutoCheck(items: LaunchItem[]) {
  return Math.max(
    0,
    ...items.filter((i) => i.how === "auto" && i.status !== "check" && i.updated_at).map((i) => Date.parse(i.updated_at!)),
  )
}

/** The site has been checked for its own "you" list (the generic one stands in until then). */
export const checkedForYou = (items: LaunchItem[]) => items.some((i) => i.who === "you" && !i.generic)

/** The items, with the "you" list worked out: a site never checked for it is checked first (most of
 *  a minute). Only where a request can wait for it (the plan page); never in the Stripe webhook. */
export async function itemsWithHandover(domain: string): Promise<LaunchItem[] | null> {
  const items = await readItems(domain).catch(() => null)
  if (!items) return null
  if (checkedForYou(items)) return items
  if (items.length && Date.now() - lastAutoCheck(items) < RECHECK_MINUTES * 60_000) return items
  return (await runCheck(domain)) ?? items
}

/** What the client still has to do. */
export function openYou(items: LaunchItem[]) {
  return items.filter((i) => i.who === "you" && OPEN_STATUSES.has(i.status))
}

/** The items as the client sees them ("Your website"): title, who, status and date, plus the ask
 *  (steps, de) on a "you" item. No note ever goes out, on any item: an "us" note is ours. Built field
 *  by field, so a field launch.py adds later stays with us too. The generic list (a site never
 *  checked) is left out: the page shows the site's own items. */
export function forClient(items: LaunchItem[]): LaunchItem[] {
  return items
    .filter((i) => !i.generic)
    .map((i) => {
      const out: LaunchItem = {
        key: i.key,
        title: i.title,
        how: i.how,
        who: i.who,
        status: i.status,
        note: null,
        updated_at: i.updated_at,
      }
      if (i.who === "you") {
        if (i.steps) out.steps = i.steps
        if (i.de) out.de = i.de
        if (i.optional) out.optional = i.optional
      }
      return out
    })
}
