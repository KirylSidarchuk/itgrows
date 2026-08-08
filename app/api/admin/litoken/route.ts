import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: ask LinkedIn itself what it thinks of the stored token. Introspection returns the owning
// client_id, the scopes and the real status, which is the only way to tell "the member revoked it"
// apart from "we issued it with the wrong app". Read-only. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const EMAIL = "eamcguire67.em@gmail.com"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

async function introspect(token: string, id?: string, secret?: string) {
  if (!id || !secret) return { skipped: "missing credentials" }
  const body = new URLSearchParams({ client_id: id, client_secret: secret, token })
  const res = await fetch("https://www.linkedin.com/oauth/v2/introspectToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const text = await res.text()
  try { return { http: res.status, ...(JSON.parse(text) as Record<string, unknown>) } }
  catch { return { http: res.status, raw: text.slice(0, 300) } }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  try {
    const acc = rows(await db.execute(sql`
      SELECT la.id, la.access_token, la.page_type, to_char(la.created_at,'MM-DD HH24:MI') AS created
      FROM linkedin_accounts la JOIN users u ON u.id::text = la.user_id
      WHERE lower(u.email) = ${EMAIL} ORDER BY la.created_at DESC LIMIT 1`))[0]
    if (!acc) return NextResponse.json({ error: "no account row" })

    const personalId = process.env.LINKEDIN_PERSONAL_CLIENT_ID
    const personalSecret = process.env.LINKEDIN_PERSONAL_CLIENT_SECRET
    const companyId = process.env.LINKEDIN_CLIENT_ID
    const companySecret = process.env.LINKEDIN_CLIENT_SECRET

    return NextResponse.json({
      account: { id: acc.id, page_type: acc.page_type, created: acc.created, token_head: (acc.access_token as string).slice(0, 10) },
      env: {
        LINKEDIN_PERSONAL_CLIENT_ID: personalId ? personalId : "(unset)",
        LINKEDIN_PERSONAL_CLIENT_SECRET: personalSecret ? "set" : "(unset)",
        LINKEDIN_CLIENT_ID: companyId ? companyId : "(unset)",
        LINKEDIN_CLIENT_SECRET: companySecret ? "set" : "(unset)",
        personal_falls_back_to_company: !personalId,
      },
      introspect_as_personal_app: await introspect(acc.access_token as string, personalId, personalSecret),
      introspect_as_company_app: await introspect(acc.access_token as string, companyId, companySecret),
    })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
