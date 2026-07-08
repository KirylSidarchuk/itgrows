import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { db } from "@/lib/db"
import { siteVisits } from "@/lib/db/schema"

// First-party page-view logger (see components/VisitBeacon). Best-effort: never throw.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { path?: string }
    const path = typeof body?.path === "string" ? body.path.slice(0, 200) : null
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
    const ua = req.headers.get("user-agent") ?? ""
    // Daily-rotating hash so we can count unique visitors without storing raw IP/UA.
    const day = new Date().toISOString().slice(0, 10)
    const visitorHash = createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 32)
    await db.insert(siteVisits).values({ path, visitorHash })
  } catch { /* best-effort telemetry — swallow */ }
  return NextResponse.json({ ok: true })
}
