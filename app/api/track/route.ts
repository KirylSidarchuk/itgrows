import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { auth } from "@/auth"

// Ingestion endpoint for first-party product analytics. Best-effort, never throws to the client.
// Resolves the logged-in user server-side (JWT session — no DB hit); anon_id stitches pre-login.
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as { event?: string; path?: string; anon_id?: string; props?: unknown }
    if (!b?.event) return NextResponse.json({ ok: false })

    let uid: string | null = null
    try {
      const session = await auth()
      uid = session?.user?.id ?? null
    } catch {}

    await db.execute(sql`
      INSERT INTO analytics_events (user_id, anon_id, event, path, props)
      VALUES (
        ${uid},
        ${(b.anon_id ?? "").slice(0, 64) || null},
        ${String(b.event).slice(0, 64)},
        ${String(b.path ?? "").slice(0, 300)},
        ${JSON.stringify(b.props ?? {})}::jsonb
      )`)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
