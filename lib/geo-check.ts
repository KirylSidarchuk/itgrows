import { createHmac } from "crypto"

// The site check runs on the VM (geo_check/service.py, behind nginx at blogs.itgrows.ai/geo-api):
// it reads a site, works out what its buyers ask, and puts those questions to the assistants. The
// app only relays, trims what a stranger may see, and reads results back for signed-in owners.
// It authenticates with the same VM API token the image store uses.

const BASE = process.env.GEO_CHECK_URL ?? "https://blogs.itgrows.ai/geo-api"
const TOKEN = process.env.IMAGE_STORE_TOKEN ?? ""

export const ENGINE_ORDER = ["chatgpt", "claude", "gemini", "perplexity"]
export const ENGINE_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
}

/** One question put to one assistant, over all samples of a run. */
export interface EngineAnswer {
  named: number
  cited: number
  samples: number
  errors: number
  snippet: string
  sources: string[]
  named_instead: string[]
}

export interface ResultRow {
  q: string
  engines: Record<string, EngineAnswer>
}

export interface RunSummary {
  named: number
  of: number
  engines: Record<string, { named: number; of: number }>
  named_instead: { name: string; count: number }[]
  own_cited?: number
  sources?: { domain: string; count: number; type: string }[]
}

export interface PublicRun {
  run_id: string
  kind: "teaser" | "baseline" | "weekly"
  status: "queued" | "running" | "done" | "failed"
  engines: string[]
  samples: number
  created_at: string
  finished_at: string | null
  summary: RunSummary | null
  error: string | null
  domain?: string
  business?: string | null
  language?: string | null
  city?: string | null
  offering?: string | null
  results?: ResultRow[] | null
  questions?: string[] | null
  progress?: Record<string, unknown> | null
  cached?: boolean
}

export async function geoCheck<T>(
  path: string,
  body?: unknown,
  timeoutMs = 60_000
): Promise<{ status: number; data: Partial<T> & { error?: string } }> {
  if (!TOKEN) return { status: 503, data: { error: "not_configured" } as Partial<T> & { error?: string } }
  const res = await fetch(`${BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  })
  let data: unknown = {}
  try {
    data = await res.json()
  } catch {
    // An HTML error page from nginx; the status says enough.
  }
  return { status: res.status, data: data as Partial<T> & { error?: string } }
}

/** The visitor's address as Vercel reports it — the VM counts instant checks per address. */
export function clientIp(headers: Headers): string {
  return (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || ""
}

export function vmAuthorized(header: string | null): boolean {
  if (!TOKEN || !header?.startsWith("Bearer ")) return false
  const given = header.slice(7).trim()
  if (given.length !== TOKEN.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ TOKEN.charCodeAt(i)
  return diff === 0
}

// One-click unsubscribe from the weekly email: the link carries the follow id and a signature, so
// nobody needs to sign in to stop the mail, and nobody can stop someone else's.

export function unsubscribeToken(followId: string) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? TOKEN
  return createHmac("sha256", secret).update(`geo-weekly:${followId}`).digest("base64url").slice(0, 32)
}

export function unsubscribeUrl(followId: string) {
  return `https://www.itgrows.ai/api/geo/unsubscribe?f=${followId}&t=${unsubscribeToken(followId)}`
}
