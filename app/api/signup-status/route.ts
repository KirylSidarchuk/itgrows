import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/lib/db"

// Whether the signed-in account was created a moment ago, for the sign-up conversions on /signup
// (Google Ads, Meta pixel): auth.ts writes an analytics_events "signup" row when it creates a user.
// An existing user who signs in with a code gets isNew: false, so it is not counted as a sign-up.

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ isNew: false }, { status: 401, headers: { "Cache-Control": "no-store" } })
  let isNew = false
  try {
    const [row] = rows(
      await db.execute(sql`SELECT 1 AS hit FROM analytics_events
                           WHERE user_id = ${userId} AND event = 'signup' AND created_at > now() - interval '60 minutes'
                           LIMIT 1`)
    )
    isNew = Boolean(row)
  } catch {
    // Unknown means not counted.
  }
  return NextResponse.json({ isNew, id: isNew ? userId : undefined }, { headers: { "Cache-Control": "no-store" } })
}
