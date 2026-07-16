import { NextRequest, NextResponse } from "next/server"

// Self-serve ASO analyzer (iOS / App Store — Phase 1).
// Flow: App Store URL + geos -> app category (iTunes Lookup) -> semantic core
// (Google Ads generateKeywordIdeas, seeded from the app name) -> top-10 by
// search volume -> current rank (iTunes Search) -> installs / CPI / alt cost /
// our top-3 fee. Gated by ASO_TOKEN. Needs GOOGLE_ADS_* env (same as keyword-metrics).
export const runtime = "nodejs"
export const maxDuration = 60

// iOS install shares by rank (CTR 40/24/15% × 70% product-page conversion)
const IOS = { 1: 0.28, 2: 0.168, 3: 0.105 }
// iOS Finance-category anchors + others (US base, from Apple Search Ads benchmarks)
const CPI_CAT: Record<string, number> = {
  Finance: 8.44, Games: 12.28, Shopping: 6.20, "Social Networking": 3.90,
  "Health & Fitness": 3.83, "Graphics & Design": 3.68, Lifestyle: 3.45,
  "Photo & Video": 3.13, Productivity: 3.13, Utilities: 2.90, Business: 2.49,
  Music: 2.11, Education: 1.64, Sports: 26.81,
}
const CPI_DEFAULT = 4.06
// geo -> iTunes country code, Google Ads geo id, language id, iOS CPI index (US=1)
const GEO: Record<string, { itunes: string; gads: number; lang: number; idx: number; name: string }> = {
  US: { itunes: "us", gads: 2840, lang: 1000, idx: 1.0, name: "United States" },
  GB: { itunes: "gb", gads: 2826, lang: 1000, idx: 0.64, name: "United Kingdom" },
  CA: { itunes: "ca", gads: 2124, lang: 1000, idx: 0.55, name: "Canada" },
  AU: { itunes: "au", gads: 2036, lang: 1000, idx: 0.54, name: "Australia" },
  DE: { itunes: "de", gads: 2276, lang: 1001, idx: 0.53, name: "Germany" },
  FR: { itunes: "fr", gads: 2250, lang: 1002, idx: 0.44, name: "France" },
  ES: { itunes: "es", gads: 2724, lang: 1003, idx: 0.48, name: "Spain" },
  IT: { itunes: "it", gads: 2380, lang: 1004, idx: 0.50, name: "Italy" },
  NL: { itunes: "nl", gads: 2528, lang: 1010, idx: 0.55, name: "Netherlands" },
  JP: { itunes: "jp", gads: 2392, lang: 1005, idx: 0.63, name: "Japan" },
  KR: { itunes: "kr", gads: 2410, lang: 1012, idx: 0.45, name: "South Korea" },
  BR: { itunes: "br", gads: 2076, lang: 1014, idx: 0.26, name: "Brazil" },
  MX: { itunes: "mx", gads: 2484, lang: 1003, idx: 0.27, name: "Mexico" },
  IN: { itunes: "in", gads: 2356, lang: 1000, idx: 0.22, name: "India" },
  TR: { itunes: "tr", gads: 2792, lang: 1037, idx: 0.30, name: "Turkey" },
  ID: { itunes: "id", gads: 2360, lang: 1025, idx: 0.26, name: "Indonesia" },
}
const COIN = new Set(["bitcoin","btc","ethereum","eth","dogecoin","doge","solana","sol","xrp","ripple","litecoin","ltc","cardano","ada","bnb","usdt","tether","tron","trx","polygon","matic","shiba","pepe"])
const STOP = new Set(["the","and","app","for","your","a","to","buy","sell","best","free","official","pro","plus","mobile"])

const gm = (xs: number[]) => Math.pow(xs.reduce((a, b) => a * b, 1), 1 / xs.length)
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const usd = (m?: string | number) => (m ? Number(m) / 1_000_000 : 0)

async function accessToken() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!, grant_type: "refresh_token",
    }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error("oauth: " + JSON.stringify(j))
  return j.access_token as string
}

async function itunes(url: string) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  if (!r.ok) throw new Error("itunes " + r.status)
  return r.json()
}

async function keywordIdeas(token: string, seed: string[], gads: number, lang: number) {
  const cust = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "")
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`, "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  }
  const login = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  if (login) headers["login-customer-id"] = login.replace(/-/g, "")
  const r = await fetch(`https://googleads.googleapis.com/v21/customers/${cust}:generateKeywordIdeas`, {
    method: "POST", headers,
    body: JSON.stringify({
      keywordSeed: { keywords: seed }, geoTargetConstants: [`geoTargetConstants/${gads}`],
      keywordPlanNetwork: "GOOGLE_SEARCH", language: `languageConstants/${lang}`, pageSize: 80,
    }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error("ideas " + JSON.stringify(j).slice(0, 300))
  return (j.results || []) as any[]
}

function buildSeed(name: string, genre: string) {
  const parts = name.split(/[:\-|–—]/)
  const base = (parts.length > 1 ? parts.slice(1).join(" ") : parts[0]).replace(/[^A-Za-z ]/g, " ").toLowerCase()
  const words = base.split(/\s+/).filter((w) => w && !STOP.has(w) && !COIN.has(w))
  let seed: string[] = []
  if (words.length >= 2) seed = [words.slice(0, 3).join(" "), words.slice(0, 2).join(" "), words.slice(-2).join(" ")]
  else if (words.length) seed = [words[0]]
  seed = [...new Set(seed)].filter((s) => s.length > 2).slice(0, 3)
  return seed.length ? seed : [genre.toLowerCase()]
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  async function worker() { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]) } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

export async function POST(req: NextRequest) {
  const gate = process.env.ASO_TOKEN
  const body = await req.json().catch(() => ({}))
  if (!gate || body.token !== gate) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url: string = (body.appUrl || "").trim()
  const geos: string[] = Array.isArray(body.geos) && body.geos.length ? body.geos : ["US"]
  const m = url.match(/id(\d+)/)
  if (/play\.google\.com/.test(url)) return NextResponse.json({ error: "android_not_supported_yet" }, { status: 400 })
  if (!m) return NextResponse.json({ error: "invalid_app_store_url" }, { status: 400 })
  const appId = m[1]
  const urlCc = (url.match(/apple\.com\/([a-z]{2})\//)?.[1] || "us")

  if (!process.env.GOOGLE_ADS_REFRESH_TOKEN)
    return NextResponse.json({ error: "google_ads_not_configured" }, { status: 501 })

  try {
    const token = await accessToken()
    const look = (await itunes(`https://itunes.apple.com/lookup?id=${appId}&country=${urlCc}`)).results?.[0]
    if (!look) return NextResponse.json({ error: "app_not_found" }, { status: 404 })
    const name: string = look.trackName
    const genre: string = look.primaryGenreName
    const seed = buildSeed(name, genre)

    const outGeos = []
    for (const code of geos) {
      const g = GEO[code]
      if (!g) continue
      let ideas: any[] = []
      try {
        ideas = await keywordIdeas(token, seed, g.gads, g.lang)
        if (!ideas.length) ideas = await keywordIdeas(token, [genre.toLowerCase()], g.gads, g.lang)
      } catch { ideas = [] }
      let rows = ideas.map((x) => {
        const mm = x.keywordIdeaMetrics || {}
        return { kw: x.text as string, v: Number(mm.avgMonthlySearches || 0),
          bl: usd(mm.lowTopOfPageBidMicros), bh: usd(mm.highTopOfPageBidMicros) }
      }).filter((r) => r.v > 0)
      rows.sort((a, b) => b.v - a.v)
      const top = rows.slice(0, 10)
      const cpiBase = (CPI_CAT[genre] ?? CPI_DEFAULT) * g.idx
      const mids = top.filter((r) => r.bl > 0 && r.bh > 0).map((r) => Math.sqrt(r.bl * r.bh))
      const anchor = mids.length ? gm(mids) : 1
      const rate = code === "US" ? 0.30 : 0.50

      const kws = await mapLimit(top, 4, async (r) => {
        let position: number | null = null
        try {
          const s = await itunes(`https://itunes.apple.com/search?term=${encodeURIComponent(r.kw)}&country=${g.itunes}&entity=software&limit=200`)
          const i = (s.results || []).findIndex((a: any) => String(a.trackId) === appId)
          position = i >= 0 ? i + 1 : null
        } catch { position = null }
        const mid = r.bl > 0 ? Math.sqrt(r.bl * r.bh) : anchor
        const cpi = cpiBase * clamp(Math.pow(mid / anchor, 0.5), 0.4, 2.5)
        const installs = [r.v * IOS[1], r.v * IOS[2], r.v * IOS[3]].map(Math.round)
        const alt = [installs[0] * cpi, installs[1] * cpi, installs[2] * cpi]
        const altAvg = (alt[0] + alt[1] + alt[2]) / 3
        const fee = Math.max(rate * altAvg, 1000)
        return { keyword: r.kw, searches: r.v, position, bidLow: r.bl || null, bidHigh: r.bh || null,
          cpi: Math.round(cpi * 100) / 100, installs, alt: alt.map(Math.round), altAvg: Math.round(altAvg), fee: Math.round(fee) }
      })
      outGeos.push({ geo: code, name: g.name, platform: "ios", category: genre,
        cpiBase: Math.round(cpiBase * 100) / 100, rate: `${rate * 100}%`,
        keywords: kws, totalFee: kws.reduce((a, k) => a + k.fee, 0) })
    }

    return NextResponse.json({
      app: { id: appId, name, category: genre, icon: look.artworkUrl100 || null }, seed,
      geos: outGeos,
    })
  } catch (e) {
    return NextResponse.json({ error: "analyze_failed", detail: String(e).slice(0, 300) }, { status: 502 })
  }
}
