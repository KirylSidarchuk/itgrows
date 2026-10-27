import { db } from "@/lib/db"
import { sql, type SQL } from "drizzle-orm"
import { REPORT_SITES } from "@/lib/geo-pricing"

// The free detailed report's two limits (since 27 Oct 2026), as /api/geo/follow applies them to a new
// site: REPORT_SITES site(s) per account (a slot held through geo_follow_claims there) and one per
// connection (the VM's rule, geo_check/service.py baseline, from geo_runs.requested_ip). Clients we set
// up by hand (geo_clients) have neither, and a site bought on the plan page is held to neither (it is
// not followed until paid). /api/geo/report sends freeReportLimit so the cabinet can say it before
// anyone types: the hint under "Add a site", and the contact-us state again after a reload.

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

/** SQL, a SELECT of one column (`domain`): the domains that hold the account's free report, its free
 *  follows and claims. A domain with a paid follow, or with a report bought before it became free (a
 *  Stripe session in research_session), does not count. */
export function countedDomainsSql(userId: string): SQL {
  return sql`
    SELECT s.domain FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
    WHERE f.user_id = ${userId} AND f.plan <> 'paid' AND left(coalesce(f.research_session, ''), 3) <> 'cs_'
    UNION
    SELECT c.domain FROM geo_follow_claims c
    WHERE c.user_id = ${userId}
      AND NOT EXISTS (SELECT 1 FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
                      WHERE f.user_id = c.user_id AND s.domain = c.domain
                        AND (f.plan = 'paid' OR left(coalesce(f.research_session, ''), 3) = 'cs_'))`
}

export type FreeReportLimit = "report_limit" | "report_ip_used"

/** What /api/geo/follow would answer now for a new site: "report_limit" when the account's free report
 *  is taken, "report_ip_used" when this connection already had a day-0 report that did not fail, null
 *  when a new site would go through. A hint for the page: the follow itself decides (the VM lets the
 *  site that connection already had through, which this cannot know without the site). */
export async function freeReportLimit(userId: string, ip: string): Promise<FreeReportLimit | null> {
  const ipUsed = ip
    ? sql`EXISTS (SELECT 1 FROM geo_runs r WHERE r.kind = 'baseline' AND r.requested_ip = ${ip} AND r.status <> 'failed')`
    : sql`false`
  const [r] = rows(
    await db.execute(sql`
      SELECT EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = ${userId}) AS client,
             (SELECT count(*) FROM (${countedDomainsSql(userId)}) counted)::int AS counted,
             ${ipUsed} AS ip_used`)
  )
  if (!r || r.client === true) return null
  if (Number(r.counted) >= REPORT_SITES) return "report_limit"
  return r.ip_used === true ? "report_ip_used" : null
}
