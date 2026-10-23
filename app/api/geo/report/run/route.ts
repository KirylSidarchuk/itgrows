import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { siteRunFor } from "@/lib/geo-report"

// One past report from the history on the AI-visibility page, opened on demand: the page itself
// carries only the latest report, the day-0 one and the counts of the rest. lib/geo-report.ts
// siteRunFor decides who may see it and cuts it exactly as the page does. Every refusal is the same
// 404, so the answer never tells whether a run exists. Never cached: buying the report changes the cut.

export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store" }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE })

  const id = req.nextUrl.searchParams.get("id") ?? ""
  if (!UUID.test(id)) return NextResponse.json({ error: "bad_id" }, { status: 400, headers: NO_STORE })

  const report = await siteRunFor(userId, id)
  if (!report) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE })
  return NextResponse.json({ report }, { headers: NO_STORE })
}
