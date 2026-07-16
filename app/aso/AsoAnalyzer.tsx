"use client"

// Self-serve ASO analyzer (iOS Phase 1): App Store URL + geos -> top-10 keywords,
// current position, installs at ranks #1-3, alternative cost, our top-3 price.
import { useEffect, useState } from "react"

const GEOS: [string, string][] = [
  ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["AU", "Australia"],
  ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"], ["IT", "Italy"], ["NL", "Netherlands"],
  ["JP", "Japan"], ["KR", "South Korea"], ["BR", "Brazil"], ["MX", "Mexico"], ["IN", "India"],
  ["TR", "Turkey"], ["ID", "Indonesia"],
]

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US")
const fmtUsd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

type Kw = {
  keyword: string; searches: number; position: number | null
  cpi: number; installs: number[]; alt: number[]; altAvg: number; fee: number
}
type GeoRes = { geo: string; name: string; category: string; cpiBase: number; rate: string; keywords: Kw[]; totalFee: number }
type Result = { app: { id: string; name: string; category: string; icon: string | null }; seed: string[]; geos: GeoRes[] }

const ERR: Record<string, string> = {
  forbidden: "Invalid access token.",
  invalid_app_store_url: "Enter a valid Apple App Store link (apps.apple.com/…/idXXXXXXXX).",
  android_not_supported_yet: "Google Play (Android) is coming soon — please use an App Store link for now.",
  google_ads_not_configured: "Keyword data source not connected yet (GOOGLE_ADS_* env missing on the server).",
  app_not_found: "Could not find that app on the App Store.",
}

export default function AsoAnalyzer() {
  const [appUrl, setAppUrl] = useState("")
  const [sel, setSel] = useState<Record<string, boolean>>({ US: true })
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [res, setRes] = useState<Result | null>(null)

  useEffect(() => { setToken(localStorage.getItem("aso_token") ?? "") }, [])

  const geos = Object.keys(sel).filter((k) => sel[k])

  const analyze = async () => {
    setErr(""); setRes(null)
    if (!appUrl.trim()) { setErr("Paste your App Store link."); return }
    if (!geos.length) { setErr("Pick at least one country."); return }
    if (!token.trim()) { setErr("Access token required."); return }
    localStorage.setItem("aso_token", token.trim())
    setLoading(true)
    try {
      const r = await fetch("/api/aso/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appUrl: appUrl.trim(), geos, token: token.trim() }),
      })
      const data = await r.json()
      if (!r.ok) { setErr(ERR[data.error] ?? `Error: ${data.error ?? r.status}${data.detail ? " — " + data.detail : ""}`); return }
      setRes(data)
    } catch (e) { setErr("Network error: " + String(e)) }
    finally { setLoading(false) }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-1 block text-xs font-medium text-slate-500">Apple App Store link</label>
        <input className={inputCls} value={appUrl} onChange={(e) => setAppUrl(e.target.value)}
          placeholder="https://apps.apple.com/us/app/…/id1288339409" autoComplete="off" name="aso-app-url" />

        <label className="mt-4 mb-1 block text-xs font-medium text-slate-500">Countries</label>
        <div className="flex flex-wrap gap-2">
          {GEOS.map(([code, name]) => (
            <button key={code} type="button"
              onClick={() => setSel((s) => ({ ...s, [code]: !s[code] }))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${sel[code] ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              title={name}>{code}</button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-56">
            <label className="mb-1 block text-xs font-medium text-slate-500">Access token</label>
            <input className={`${inputCls} [-webkit-text-security:disc]`} value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="ASO_TOKEN" autoComplete="off" name="aso-access-token" />
          </div>
          <button onClick={analyze} disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
            {loading ? "Analyzing…" : "Analyze app"}
          </button>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <p className="mt-3 text-xs text-slate-400">
          iOS only for now. We read the app category, build a keyword set, pull live search volume (Google Keyword Planner),
          check the app&apos;s current App Store rank per keyword, and estimate the installs & ad-cost value of a top-3 position.
        </p>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-400">Fetching keywords, positions and volumes — this can take ~10–20s per country…</p>}

      {res && (
        <>
          <div className="mt-6 flex items-center gap-3">
            {res.app.icon && <img src={res.app.icon} alt="" className="h-12 w-12 rounded-xl" />}
            <div>
              <div className="text-lg font-bold text-slate-900">{res.app.name}</div>
              <div className="text-xs text-slate-500">Category: {res.app.category} · iOS · seed: {res.seed.join(", ")}</div>
            </div>
          </div>

          {res.geos.map((g) => (
            <div key={g.geo} className="mt-5">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-slate-900">{g.name}
                  <span className="ml-2 font-normal text-slate-400">CPI base ${g.cpiBase} · rate {g.rate}</span>
                </h3>
                <div className="text-sm">
                  <span className="text-slate-500">Top-3 program price: </span>
                  <span className="font-bold text-emerald-700">{fmtUsd(g.totalFee)}</span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="px-3 py-3">Keyword</th>
                      <th className="px-3 py-3 text-right">Searches/mo</th>
                      <th className="px-3 py-3 text-center">Your rank</th>
                      <th className="px-3 py-3 text-right">Installs #1/#2/#3</th>
                      <th className="px-3 py-3 text-right">Ad-cost value #1/#2/#3</th>
                      <th className="px-3 py-3 text-right">Our price (top-3)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.keywords.map((k) => (
                      <tr key={k.keyword} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-3 font-medium text-slate-800">{k.keyword}</td>
                        <td className="px-3 py-3 text-right">{fmtInt(k.searches)}</td>
                        <td className="px-3 py-3 text-center">
                          {k.position == null
                            ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">200+</span>
                            : <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${k.position <= 3 ? "bg-emerald-100 text-emerald-700" : k.position <= 10 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>#{k.position}</span>}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">{k.installs.map(fmtInt).join(" / ")}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{k.alt.map(fmtUsd).join(" / ")}</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-700">{fmtUsd(k.fee)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="px-3 py-3" colSpan={5}>Total (top-3, all keywords)</td>
                      <td className="px-3 py-3 text-right text-emerald-800">{fmtUsd(g.totalFee)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="mt-4 text-xs text-slate-400">
            Search volume from Google Keyword Planner (a close proxy for store search); ranks from the App Store Search API.
            Installs use App Store curves (28% / 16.8% / 10.5% of volume at #1/#2/#3). Ad-cost value = installs × category CPI (bid-adjusted).
            All figures are industry estimates.
          </p>
        </>
      )}
    </div>
  )
}
