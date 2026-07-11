import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP one-shot migration: create the analytics_events table on prod (additive, IF NOT EXISTS).
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN)
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        anon_id text,
        event text NOT NULL,
        path text,
        props jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON analytics_events (user_id, created_at)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS analytics_events_anon_idx ON analytics_events (anon_id, created_at)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS analytics_events_event_idx ON analytics_events (event, created_at)`)
    const check = await db.execute(sql`SELECT count(*)::int AS n FROM analytics_events`)
    return NextResponse.json({ ok: true, table: "analytics_events", rows: check })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
