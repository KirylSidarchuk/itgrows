import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { auth } from "@/auth"

// Ingestion endpoint for first-party product analytics. Best-effort, never throws to the client.
// Resolves the logged-in user server-side (JWT session — no DB hit); anon_id stitches pre-login.
// Named AI fetchers first: several of these render JavaScript, so they reach this endpoint and
// are indistinguishable from a browser in everything except the agent string they honestly send.
const AI_AGENT = /GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Applebot|Meta-ExternalAgent|Amazonbot|Bytespider|CCBot|DuckAssistBot|YouBot|cohere-ai|MistralAI-User|Diffbot|Timpibot/i
const GENERIC_BOT = /bot\b|crawler|spider|slurp|headless|phantom|puppeteer|playwright|scrapy|curl|wget|python-requests|monitoring|uptime|pingdom|lighthouse/i

function visitorKind(ua: string): string {
  if (!ua) return "unknown"
  if (AI_AGENT.test(ua)) return "ai"
  if (GENERIC_BOT.test(ua)) return "bot"
  return "human"
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as { event?: string; path?: string; anon_id?: string; props?: unknown }
    if (!b?.event) return NextResponse.json({ ok: false })

    let uid: string | null = null
    try {
      const session = await auth()
      uid = session?.user?.id ?? null
    } catch {}

    // Read from the request, not the payload — a client can claim anything, a header is what the
    // caller actually sent.
    const ua = req.headers.get("user-agent") ?? ""

    await db.execute(sql`
      INSERT INTO analytics_events (user_id, anon_id, event, path, props, visitor_kind, user_agent)
      VALUES (
        ${uid},
        ${(b.anon_id ?? "").slice(0, 64) || null},
        ${String(b.event).slice(0, 64)},
        ${String(b.path ?? "").slice(0, 300)},
        ${JSON.stringify(b.props ?? {})}::jsonb,
        ${visitorKind(ua)},
        ${ua.slice(0, 300) || null}
      )`)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
