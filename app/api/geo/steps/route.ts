import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// "Mark as done" for the next steps on the AI-visibility report, kept per user and site so it
// follows the owner across browsers. Only for sites the signed-in user follows.

export const dynamic = "force-dynamic"

const MAX_MARKS = 200

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

const clean = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim() : ""
  return s.length >= 1 && s.length <= max ? s : ""
}

async function follows(userId: string, domain: string) {
  const r = rows(
    await db.execute(sql`
      SELECT 1 FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId} AND s.domain = ${domain} LIMIT 1`)
  )
  return r.length > 0
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const domain = clean(req.nextUrl.searchParams.get("domain"), 300)
  if (!domain) return NextResponse.json({ error: "invalid_domain" }, { status: 400 })
  if (!(await follows(userId, domain))) return NextResponse.json({ error: "not_followed" }, { status: 404 })

  const done = rows(
    await db.execute(sql`
      SELECT step_id, done_at FROM geo_step_done
      WHERE user_id = ${userId} AND domain = ${domain}
      ORDER BY done_at`)
  )
  return NextResponse.json(done.map((d) => ({ step_id: String(d.step_id), done_at: new Date(d.done_at as string).toISOString() })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: { domain?: unknown; step_id?: unknown; done?: unknown } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {}
  const domain = clean(body.domain, 300)
  const stepId = clean(body.step_id, 400)
  if (!domain || !stepId || typeof body.done !== "boolean") return NextResponse.json({ error: "invalid" }, { status: 400 })
  if (!(await follows(userId, domain))) return NextResponse.json({ error: "not_followed" }, { status: 404 })

  if (!body.done) {
    await db.execute(sql`DELETE FROM geo_step_done WHERE user_id = ${userId} AND domain = ${domain} AND step_id = ${stepId}`)
    return NextResponse.json({ step_id: stepId, done_at: null })
  }

  // A site has at most a few dozen steps over its life; the cap keeps a script from filling the table.
  const [count] = rows(
    await db.execute(sql`SELECT count(*)::int AS n FROM geo_step_done WHERE user_id = ${userId} AND domain = ${domain}`)
  )
  if (Number(count?.n ?? 0) >= MAX_MARKS)
    return NextResponse.json({ error: "too_many" }, { status: 429 })

  // Marking a step done twice keeps the first date: that is when the change went in.
  await db.execute(sql`
    INSERT INTO geo_step_done (user_id, domain, step_id) VALUES (${userId}, ${domain}, ${stepId})
    ON CONFLICT (user_id, domain, step_id) DO NOTHING`)
  const [row] = rows(
    await db.execute(sql`
      SELECT done_at FROM geo_step_done WHERE user_id = ${userId} AND domain = ${domain} AND step_id = ${stepId}`)
  )
  return NextResponse.json({ step_id: stepId, done_at: row ? new Date(row.done_at as string).toISOString() : null })
}
