import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { domainOf, follows, itemsWithHandover, owns } from "../_shared"

// What the launch will need from the client, for the plan page before they pay: any follower of the
// site gets its "you" items, titles and steps only (no notes). A site never checked for them is
// checked now (most of a minute, once).

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const domain = domainOf(req.nextUrl.searchParams.get("site") ?? "")
  if (!domain) return NextResponse.json({ error: "site_required" }, { status: 400 })
  if (!(await follows(userId, domain)) && !(await owns(userId, domain))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
  const items = await itemsWithHandover(domain)
  if (!items) return NextResponse.json({ error: "unavailable" }, { status: 502 })
  const needs = items
    .filter((i) => i.who === "you" && i.status !== "ok" && i.status !== "fixed")
    .map((i) => ({ key: i.key, title: i.title, steps: i.steps ?? [], optional: Boolean(i.optional) }))
  return NextResponse.json({ domain, items: needs })
}
