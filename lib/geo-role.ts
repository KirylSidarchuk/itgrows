import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Who is a client of the AI-visibility service: someone we publish for (a connected site) or who
// pays for a followed site. Not users.subscriptionStatus or users.plan — those belong to the
// LinkedIn/X product (its payers would get the client menu, and our GEO clients, set up by hand,
// would not). When the query fails the cabinet falls back to the free menu, which exposes nothing.

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export interface GeoRole {
  client: boolean
  hasLinkedin: boolean
  hasReport: boolean
}

export async function geoRole(userId: string | undefined): Promise<GeoRole> {
  if (!userId) return { client: false, hasLinkedin: false, hasReport: false }
  try {
    const [r] = rows(
      await db.execute(sql`
        SELECT
          (EXISTS (SELECT 1 FROM connected_sites c WHERE c.user_id = ${userId}::uuid)
           OR EXISTS (SELECT 1 FROM geo_follows g WHERE g.user_id = ${userId} AND g.plan = 'paid')) AS client,
          EXISTS (SELECT 1 FROM linkedin_accounts la WHERE la.user_id = ${userId}) AS has_linkedin,
          EXISTS (SELECT 1 FROM geo_follows f JOIN geo_runs r ON r.site_id = f.site_id
                  WHERE f.user_id = ${userId} AND r.status = 'done' AND r.kind IN ('baseline', 'weekly')) AS has_report`)
    )
    return { client: Boolean(r?.client), hasLinkedin: Boolean(r?.has_linkedin), hasReport: Boolean(r?.has_report) }
  } catch {
    return { client: false, hasLinkedin: false, hasReport: false }
  }
}
