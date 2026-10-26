import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { unsubscribeToken } from "@/lib/geo-check"

// Stop the weekly AI-visibility email for one followed site. GET shows a button (mail scanners open
// links, and must not unsubscribe anyone by doing so); POST does it — from that button, or from the
// mail client's one-click unsubscribe (RFC 8058). The report stays in the account either way.

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))

function valid(f: string, t: string) {
  return /^[0-9a-f-]{36}$/i.test(f) && t.length === 32 && unsubscribeToken(f) === t
}

function page(title: string, body: string) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;background:#f3f2f1;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1b1916">
<main style="max-width:440px;margin:12vh auto;padding:28px;background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,.08)">${body}</main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}

async function domainOf(f: string) {
  const [r] = rows(await db.execute(sql`SELECT s.domain FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id WHERE f.id = ${f}::uuid`))
  return r ? String(r.domain) : null
}

export async function GET(req: NextRequest) {
  const f = req.nextUrl.searchParams.get("f") ?? ""
  const t = req.nextUrl.searchParams.get("t") ?? ""
  if (!valid(f, t)) return page("Link not valid", "<p>This unsubscribe link is not valid.</p>")
  const domain = await domainOf(f)
  if (!domain) return page("Not found", "<p>We couldn't find this subscription.</p>")
  return page(
    "Unsubscribe",
    `<h1 style="font-size:20px;margin:0 0 8px">Stop the update emails for ${esc(domain)}?</h1>
<p style="color:#555;font-size:14px;line-height:1.6">Your report stays in your account; we just stop emailing what changed every two weeks.</p>
<form method="post" action="/api/geo/unsubscribe?f=${f}&t=${t}"><button style="margin-top:12px;background:#7c3aed;color:#fff;border:0;border-radius:10px;padding:12px 18px;font-size:15px;font-weight:600;cursor:pointer">Unsubscribe</button></form>`
  )
}

export async function POST(req: NextRequest) {
  const f = req.nextUrl.searchParams.get("f") ?? ""
  const t = req.nextUrl.searchParams.get("t") ?? ""
  if (!valid(f, t)) return page("Link not valid", "<p>This unsubscribe link is not valid.</p>")
  await db.execute(sql`UPDATE geo_follows SET email_weekly = false WHERE id = ${f}::uuid`)
  const domain = (await domainOf(f)) ?? "this site"
  return page(
    "Unsubscribed",
    `<h1 style="font-size:20px;margin:0 0 8px">Done.</h1>
<p style="color:#555;font-size:14px;line-height:1.6">No more update emails for ${esc(domain)}. Your report is still in your account: <a href="/business/dashboard/visibility" style="color:#7c3aed">open it</a>.</p>`
  )
}
