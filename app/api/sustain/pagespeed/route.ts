import { NextRequest, NextResponse } from "next/server"

// Google's own measurement of a site on a phone, for the "Heute" panel on /sustain/de. Without a key the
// PageSpeed API shares one daily quota with everyone and is usually used up, so the key (PAGESPEED_API_KEY,
// free in Google Cloud) is read here on the server and never reaches the page.
export const dynamic = "force-dynamic"
export const maxDuration = 60

const PRIVATE_HOST =
  /^(localhost$|.*\.local$|.*\.internal$|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|172\.(1[6-9]|2\d|3[01])\.)/i

function normalise(raw: string): URL | null {
  let s = (raw || "").trim()
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = "https://" + s
  try {
    const u = new URL(s)
    if ((u.protocol !== "https:" && u.protocol !== "http:") || PRIVATE_HOST.test(u.hostname) || !u.hostname.includes(".")) return null
    return u
  } catch {
    return null
  }
}

interface Lighthouse {
  categories?: Record<string, { score?: number | null }>
  audits?: Record<string, { displayValue?: string; numericValue?: number; details?: { data?: string } }>
}

export async function GET(req: NextRequest) {
  const target = normalise(req.nextUrl.searchParams.get("url") ?? "")
  if (!target) return NextResponse.json({ error: "invalid_url" }, { status: 400 })

  const params = new URLSearchParams([
    ["url", target.href],
    ["strategy", "mobile"],
    ["locale", req.nextUrl.searchParams.get("lang") === "en" ? "en" : "de"],
    ["category", "PERFORMANCE"],
    ["category", "SEO"],
    ["category", "ACCESSIBILITY"],
    ["category", "BEST_PRACTICES"],
  ])
  const key = process.env.PAGESPEED_API_KEY
  if (key) params.set("key", key)

  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
      signal: AbortSignal.timeout(55_000),
      cache: "no-store",
    })
    if (!res.ok) return NextResponse.json({ error: res.status === 429 ? "quota" : "failed" }, { status: 502 })
    const lh = ((await res.json()) as { lighthouseResult?: Lighthouse }).lighthouseResult
    if (!lh) return NextResponse.json({ error: "failed" }, { status: 502 })
    const score = (k: string) => {
      const v = lh.categories?.[k]?.score
      return typeof v === "number" ? Math.round(v * 100) : null
    }
    return NextResponse.json({
      performance: score("performance"),
      seo: score("seo"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      lcp: lh.audits?.["largest-contentful-paint"]?.displayValue ?? null,
      lcpMs: lh.audits?.["largest-contentful-paint"]?.numericValue ?? null,
      screenshot: lh.audits?.["final-screenshot"]?.details?.data ?? null,
    })
  } catch {
    return NextResponse.json({ error: "timeout" }, { status: 504 })
  }
}
