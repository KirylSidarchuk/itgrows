import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { RECHECK_MINUTES, domainOf, forClient, lastAutoCheck, owns, readItems, runCheck } from "./_shared"

// The launch report on "Your website": what the launch checked, fixed and registered for a site.
// The items live on the VM (/root/geo_check/launch.py): automatic ones re-run daily and on "Check
// again", manual ones (Bing, Search Console, profile, ...) set by us. Each says who does it: "you"
// items carry the clicks (steps) and are marked done through ./done; ./needs gives the "you" list to
// any follower, for the plan page; ./remind emails it. The report itself is delivered by the plan,
// so it is shown only for a site the user pays the plan for, or a client's own site (listed for them
// in geo_client_sites, lib/geo-role.ts geoClientOwns; connected_sites is not read); anyone else gets
// not_found, as for a site that is not theirs. What goes out never carries our diagnostic notes
// (./_shared.ts forClient): a "you" item is its title, clicks and status.

export const dynamic = "force-dynamic"
export const maxDuration = 60

export type { LaunchItem } from "./_shared"

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const domain = domainOf(req.nextUrl.searchParams.get("site") ?? "")
  if (!domain) return NextResponse.json({ error: "site_required" }, { status: 400 })
  if (!(await owns(userId, domain))) return NextResponse.json({ error: "not_found" }, { status: 404 })
  const items = await readItems(domain).catch(() => null)
  if (!items) return NextResponse.json({ error: "unavailable" }, { status: 502 })
  return NextResponse.json({ domain, items: forClient(items) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { site } = (await req.json().catch(() => ({}))) as { site?: string }
  const domain = domainOf(String(site ?? ""))
  if (!domain) return NextResponse.json({ error: "site_required" }, { status: 400 })
  if (!(await owns(userId, domain))) return NextResponse.json({ error: "not_found" }, { status: 404 })

  // The checks fetch the site as eleven crawlers; once every few minutes is plenty.
  const current = await readItems(domain).catch(() => null)
  if (current && current.length && Date.now() - lastAutoCheck(current) < RECHECK_MINUTES * 60_000) {
    return NextResponse.json({ domain, items: forClient(current), recent: true })
  }
  const items = await runCheck(domain)
  if (!items) return NextResponse.json({ error: "unavailable" }, { status: 502 })
  return NextResponse.json({ domain, items: forClient(items) })
}
