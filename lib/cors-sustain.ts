import type { NextRequest } from "next/server"

// The Sustain Impact site (sustain-impact.de / .ai, hosted elsewhere) runs the free AI-visibility check
// against three of our public APIs from the visitor’s browser: /api/geo/teaser, /api/sustain/pagespeed and
// /api/sustain/preview. Browsers only allow that when the response names the calling origin, so these
// routes answer those four origins, and only them. No cookies or credentials are involved.
const ALLOWED = new Set([
  "https://sustain-impact.de",
  "https://www.sustain-impact.de",
  "https://sustain-impact.ai",
  "https://www.sustain-impact.ai",
])

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED.has(origin)) return {}
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}

export function withSustainCors<A extends unknown[]>(handler: (req: NextRequest, ...rest: A) => Promise<Response>) {
  return async (req: NextRequest, ...rest: A): Promise<Response> => {
    const res = await handler(req, ...rest)
    for (const [k, v] of Object.entries(corsHeaders(req.headers.get("origin")))) res.headers.set(k, v)
    return res
  }
}

export function sustainPreflight(req: NextRequest): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) })
}
