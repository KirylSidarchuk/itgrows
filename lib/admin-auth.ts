import { timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"

// Who may call the admin surfaces (status pages, one-off generations, seeding).
//
// Neither key lives in the repository, which is public:
// - CRON_SECRET, already set in the deployment. It also runs every cron, so it is accepted only in
//   a header (x-admin-token or Authorization: Bearer) and never in a URL, where it would end up in
//   request logs and browser history.
// - ADMIN_PAGES_TOKEN, optional, set by the owner in the deployment. Accepted in a header, and as
//   ?token= on the read-only pages so they still open in a browser. Unset means those pages answer
//   only to CRON_SECRET in a header.

const MIN_LENGTH = 16

function matches(given: string | null | undefined, expected: string | undefined): boolean {
  if (!given || !expected || expected.length < MIN_LENGTH) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function isAdminRequest(req: NextRequest, opts: { allowQueryToken?: boolean } = {}): boolean {
  const cronSecret = process.env.CRON_SECRET
  const pagesToken = process.env.ADMIN_PAGES_TOKEN
  const bearer = req.headers.get("authorization")
  const header =
    req.headers.get("x-admin-token") ?? (bearer?.startsWith("Bearer ") ? bearer.slice(7) : null)
  if (matches(header, cronSecret) || matches(header, pagesToken)) return true
  return !!opts.allowQueryToken && matches(req.nextUrl.searchParams.get("token"), pagesToken)
}
