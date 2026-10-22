import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { geoCheck } from "@/lib/geo-check"
import { geoClientOwns } from "@/lib/geo-role"

// The launch report on "Your website": what the launch checked, fixed and registered for a site.
// The items live on the VM (/root/geo_check/launch.py): automatic ones re-run daily and on "Check
// again", manual ones (Bing, Search Console, profile, ...) set by us. The plan delivers it, so it is
// shown only for a site the user pays the plan for, or a client's own site (listed for them in
// geo_client_sites, lib/geo-role.ts geoClientOwns; connected_sites is not read); anyone else gets
// not_found, as for a site that is not theirs.

export const dynamic = "force-dynamic"
export const maxDuration = 60

export interface LaunchItem {
  key: string
  title: string
  how: "auto" | "manual"
  status: "ok" | "fixed" | "handed" | "you" | "todo" | "issue" | "tip"
  note: string | null
  updated_at: string | null
}

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const RECHECK_MINUTES = 10

function domainOf(site: string) {
  return site.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]
}

async function owns(userId: string, domain: string) {
  const paid = rows(
    await db.execute(sql`
      SELECT 1 FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${domain} AND f.plan = 'paid'
      LIMIT 1`)
  )
  return paid.length > 0 || (await geoClientOwns(userId, domain))
}

async function read(domain: string) {
  const r = await geoCheck<{ items: LaunchItem[] }>("/launch-items", { domain }, 20_000)
  return r.status === 200 ? (r.data.items ?? []) : null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const domain = domainOf(req.nextUrl.searchParams.get("site") ?? "")
  if (!domain) return NextResponse.json({ error: "site_required" }, { status: 400 })
  if (!(await owns(userId, domain))) return NextResponse.json({ error: "not_found" }, { status: 404 })
  const items = await read(domain).catch(() => null)
  if (!items) return NextResponse.json({ error: "unavailable" }, { status: 502 })
  return NextResponse.json({ domain, items })
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
  const current = await read(domain).catch(() => null)
  const last = Math.max(0, ...(current ?? []).filter((i) => i.how === "auto" && i.updated_at).map((i) => Date.parse(i.updated_at!)))
  if (current && current.length && Date.now() - last < RECHECK_MINUTES * 60_000) {
    return NextResponse.json({ domain, items: current, recent: true })
  }
  const r = await geoCheck<{ items: LaunchItem[] }>("/launch", { domain }, 55_000).catch(() => null)
  if (!r || r.status !== 200) return NextResponse.json({ error: "unavailable" }, { status: 502 })
  return NextResponse.json({ domain, items: r.data.items ?? [] })
}
