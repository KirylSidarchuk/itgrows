import { NextRequest, NextResponse } from "next/server"
import { aaRecord, aaSite, aaClip, assistantFrom, type AaKind, aaAuthorized } from "@/lib/agent-analytics"

// Agent Analytics intake (lib/agent-analytics.ts).
// 1. Browsers (/aa.js on the site): { site, kind: "referral", ref, utm_source, utm_medium, utm_campaign, path } —
//    no key; the request's Origin must be the site itself, and only an arrival from an assistant is stored.
//    Sent with sendBeacon as text/plain, so there is no CORS preflight.
// 2. Our servers (nginx log shipper, middleware, payment code): Authorization: Bearer <VM token>, body
//    { site, events: [{ kind: "bot"|"referral"|"mcp"|"checkout", path, at?, n?, ...props }] }, up to 500 events.

export const dynamic = "force-dynamic"

const KINDS = new Set<AaKind>(["bot", "referral", "mcp", "checkout"])

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  }
}

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return ""
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin")
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(await req.text()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: cors(origin) })
  }
  const site = aaSite(body.site)
  if (!site) return NextResponse.json({ error: "unknown_site" }, { status: 400, headers: cors(origin) })

  if (aaAuthorized(req.headers.get("authorization"))) {
    const events = Array.isArray(body.events) ? (body.events as Record<string, unknown>[]).slice(0, 500) : []
    let stored = 0
    for (const e of events) {
      const kind = String(e?.kind ?? "") as AaKind
      if (!KINDS.has(kind)) continue
      const { kind: _k, path, at, ...props } = e
      const clean: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props).slice(0, 12)) clean[aaClip(k, 40)] = typeof v === "number" || typeof v === "boolean" ? v : aaClip(v, 300)
      await aaRecord(site, kind, aaClip(path, 300) || "/", clean, at ? new Date(String(at)) : undefined)
      stored++
    }
    return NextResponse.json({ ok: true, stored }, { headers: cors(origin) })
  }

  // A browser: only from the site's own pages, only arrivals from an assistant.
  const from = hostOf(origin ?? "") || hostOf(req.headers.get("referer") ?? "")
  if (from !== site && !from.endsWith("." + site)) return NextResponse.json({ error: "origin" }, { status: 403, headers: cors(origin) })
  if (body.kind !== "referral") return NextResponse.json({ error: "kind" }, { status: 400, headers: cors(origin) })
  const ref = hostOf(String(body.ref ?? "")) || aaClip(body.ref, 100).toLowerCase()
  const utm = aaClip(body.utm_source, 60)
  const assistant = assistantFrom(ref, utm)
  if (!assistant) return NextResponse.json({ ok: true, stored: 0 }, { headers: cors(origin) })
  await aaRecord(site, "referral", aaClip(body.path, 300) || "/", {
    assistant,
    ref,
    utm_source: utm,
    utm_medium: aaClip(body.utm_medium, 60),
    utm_campaign: aaClip(body.utm_campaign, 60),
  })
  return NextResponse.json({ ok: true, stored: 1 }, { headers: cors(origin) })
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get("origin")) })
}
