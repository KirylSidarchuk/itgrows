import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP experiment: prove (not infer) that a second LinkedIn authorisation revokes the token we
// already hold. The old token is stashed server-side rather than returned, so no credential ever
// leaves the database. Remove once the question is answered.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

async function introspect(token: string) {
  const id = process.env.LINKEDIN_PERSONAL_CLIENT_ID
  const secret = process.env.LINKEDIN_PERSONAL_CLIENT_SECRET
  if (!id || !secret) return { error: "missing personal app credentials" }
  const res = await fetch("https://www.linkedin.com/oauth/v2/introspectToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, token }),
  })
  const text = await res.text()
  try {
    const j = JSON.parse(text) as Record<string, unknown>
    return {
      status: j.status, active: j.active, client_id: j.client_id,
      created_at: j.created_at ? new Date((j.created_at as number) * 1000).toISOString().slice(0, 16).replace("T", " ") : null,
    }
  } catch { return { http: res.status, raw: text.slice(0, 200) } }
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const email = p.get("email") ?? ""
  const stage = p.get("stage") ?? "check"
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS tmp_token_probe (k text PRIMARY KEY, v text NOT NULL)`)

    if (stage === "cleanup") {
      await db.execute(sql`DROP TABLE IF EXISTS tmp_token_probe`)
      return NextResponse.json({ cleaned: true })
    }

    const cur = rows(await db.execute(sql`
      SELECT la.access_token FROM linkedin_accounts la JOIN users u ON u.id::text = la.user_id
      WHERE lower(u.email) = lower(${email}) AND la.page_type = 'personal'
      ORDER BY la.created_at DESC LIMIT 1`))[0]
    if (!cur) return NextResponse.json({ error: "no personal account" })
    const current = cur.access_token as string

    if (stage === "stash") {
      await db.execute(sql`
        INSERT INTO tmp_token_probe (k, v) VALUES ('before', ${current})
        ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v`)
      return NextResponse.json({
        stashed_head: current.slice(0, 10),
        stashed_introspection: await introspect(current),
      })
    }

    const before = rows(await db.execute(sql`SELECT v FROM tmp_token_probe WHERE k = 'before'`))[0]
    return NextResponse.json({
      token_changed: before ? (before.v as string) !== current : null,
      old_token_head: before ? (before.v as string).slice(0, 10) : null,
      old_token_introspection: before ? await introspect(before.v as string) : "nothing stashed",
      current_token_head: current.slice(0, 10),
      current_token_introspection: await introspect(current),
    })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
