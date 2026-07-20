import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: reconstruct what post-generators did after preview_rendered. Token-gated, read-only.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const days = Math.min(Number(req.nextUrl.searchParams.get("days") || 5), 14)
  try {
    // identities (anon or user) that generated a preview in the window
    const ids = rows(await db.execute(sql`
      SELECT DISTINCT coalesce(user_id::text, anon_id) AS id
      FROM analytics_events
      WHERE event = 'preview_rendered' AND created_at > now() - interval '1 day' * ${days}
        AND coalesce(user_id::text, anon_id) IS NOT NULL`))

    const sessions: Row[] = []
    for (const r of ids) {
      const id = r.id as string
      const evts = rows(await db.execute(sql`
        SELECT to_char(created_at,'MM-DD HH24:MI:SS') AS t, event,
               coalesce(props->>'label', '') AS label, path
        FROM analytics_events
        WHERE coalesce(user_id::text, anon_id) = ${id}
        ORDER BY created_at ASC LIMIT 60`))
      const first = evts[0]?.path as string | undefined
      sessions.push({
        id: id.slice(0, 8),
        landing: first,
        n_events: evts.length,
        registered: evts.some((e) => e.event === "signup"),
        reached_signup: evts.some((e) => (e.path as string || "").startsWith("/signup")),
        timeline: evts.map((e) => `${e.t} ${e.event}${e.label ? `[${e.label}]` : ""}`),
      })
    }
    return NextResponse.json({ generator_sessions: sessions.length, sessions })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
