import { NextRequest, NextResponse } from "next/server"

// Google Ads Keyword Planner metrics for the /aso calculator.
// INERT until env is set (returns 501): GOOGLE_ADS_DEVELOPER_TOKEN,
// GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN,
// GOOGLE_ADS_CUSTOMER_ID (digits only; optional GOOGLE_ADS_LOGIN_CUSTOMER_ID for MCC).
// Access is gated by ASO_TOKEN (?token=) so the endpoint can't be farmed publicly.

const GEO: Record<string, number> = {
  US: 2840, GB: 2826, UK: 2826, CA: 2124, AU: 2036, IE: 2372,
  DE: 2276, FR: 2250, ES: 2724, IT: 2380, NL: 2528, PL: 2616,
  PT: 2620, BR: 2076, MX: 2484, AR: 2032, IN: 2356, UA: 2804,
}
// Only IDs we are sure of; anything else falls back to English.
const LANG: Record<string, number> = {
  DE: 1001, FR: 1002, ES: 1003, MX: 1003, AR: 1003, IT: 1004,
  NL: 1010, PT: 1014, BR: 1014, PL: 1030, UA: 1031,
}

const API_VER = "v21" // keep in sync with courses-vm gads scripts

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const gate = process.env.ASO_TOKEN
  if (!gate || p.get("token") !== gate) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const keyword = (p.get("keyword") || "").trim()
  const geo = (p.get("geo") || "US").trim().toUpperCase()
  if (!keyword) return NextResponse.json({ error: "keyword required" }, { status: 400 })
  const geoId = GEO[geo]
  if (!geoId) return NextResponse.json({ error: `unknown geo ${geo}` }, { status: 400 })

  const {
    GOOGLE_ADS_DEVELOPER_TOKEN: devToken,
    GOOGLE_ADS_CLIENT_ID: clientId,
    GOOGLE_ADS_CLIENT_SECRET: clientSecret,
    GOOGLE_ADS_REFRESH_TOKEN: refreshToken,
    GOOGLE_ADS_CUSTOMER_ID: customerId,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: loginCustomerId,
  } = process.env
  if (!devToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    return NextResponse.json(
      { error: "google_ads_not_configured", hint: "set GOOGLE_ADS_* env vars on Vercel" },
      { status: 501 },
    )
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })
    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok) {
      return NextResponse.json({ error: "oauth_failed", detail: tokenJson }, { status: 502 })
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokenJson.access_token}`,
      "developer-token": devToken,
      "Content-Type": "application/json",
    }
    if (loginCustomerId) headers["login-customer-id"] = loginCustomerId.replace(/-/g, "")

    const adsRes = await fetch(
      `https://googleads.googleapis.com/${API_VER}/customers/${customerId.replace(/-/g, "")}:generateKeywordHistoricalMetrics`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          keywords: [keyword],
          geoTargetConstants: [`geoTargetConstants/${geoId}`],
          keywordPlanNetwork: "GOOGLE_SEARCH",
          language: `languageConstants/${LANG[geo] ?? 1000}`,
          historicalMetricsOptions: { includeAverageCpc: true },
        }),
      },
    )
    const adsJson = await adsRes.json()
    if (!adsRes.ok) {
      return NextResponse.json({ error: "ads_api_failed", detail: adsJson }, { status: 502 })
    }

    const m = adsJson.results?.[0]?.keywordMetrics ?? {}
    const usd = (micros?: string | number) =>
      micros ? Math.round((Number(micros) / 1_000_000) * 100) / 100 : null
    return NextResponse.json({
      keyword,
      geo,
      avgMonthlySearches: m.avgMonthlySearches ? Number(m.avgMonthlySearches) : null,
      competition: m.competition ?? null,
      lowTopOfPageBid: usd(m.lowTopOfPageBidMicros),
      highTopOfPageBid: usd(m.highTopOfPageBidMicros),
      averageCpc: usd(m.averageCpcMicros),
    })
  } catch (e) {
    return NextResponse.json({ error: "request_failed", detail: String(e) }, { status: 502 })
  }
}
