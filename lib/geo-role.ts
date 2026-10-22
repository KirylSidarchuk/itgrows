import { db } from "@/lib/db"
import { sql, type SQL } from "drizzle-orm"

// Who is a client of the AI-visibility service: a user we set up by hand, marked explicitly in
// geo_clients (lib/db/migrations/add_geo_clients.sql), or a user who pays for a followed site. A
// connected_sites row proves nothing: any user can create one. Not users.subscriptionStatus or
// users.plan either — those belong to the LinkedIn/X product (its payers would get the client menu,
// and our GEO clients, set up by hand, would not). When the query fails the cabinet falls back to the
// menu of an account without the plan, which exposes nothing.
//
// A geo client is the client of the domains listed for them in geo_client_sites
// (lib/db/migrations/add_geo_client_sites.sql, clientOwnsSql), never of whatever connected_sites.url
// says; any other site they follow is an ordinary one.

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

/** SQL: the user is a geo client of the domain (a geo_client_sites row; its user_id references
 *  geo_clients, so a member who leaves takes their sites along). `user` is a users.id (any type,
 *  compared as text), `domain` a geo_sites.domain; a "#xx" language variant counts as its site. */
export function clientOwnsSql(user: SQL, domain: SQL): SQL {
  return sql`EXISTS (SELECT 1 FROM geo_client_sites gcs
                     WHERE gcs.user_id = (${user})::text AND gcs.domain = split_part(${domain}, '#', 1))`
}

/** Whether the user is a client we set up by hand. */
export async function isGeoClient(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  try {
    const [r] = rows(await db.execute(sql`SELECT EXISTS (SELECT 1 FROM geo_clients WHERE user_id = ${userId}) AS client`))
    return Boolean(r?.client)
  } catch {
    return false
  }
}

/** Whether the user is a geo client of this domain (geo_client_sites), i.e. the site is theirs as a client. */
export async function geoClientOwns(userId: string, domain: string): Promise<boolean> {
  const [r] = rows(await db.execute(sql`SELECT ${clientOwnsSql(sql`${userId}`, sql`${domain}`)} AS owns`))
  return Boolean(r?.owns)
}

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
          (EXISTS (SELECT 1 FROM geo_clients gc WHERE gc.user_id = ${userId})
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
