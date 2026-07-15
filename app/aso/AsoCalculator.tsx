"use client"

// Internal ASO offer calculator (noindex, linked from nowhere).
// Model constants agreed with the owner on 2026-07-15:
//   iOS: CTR 40/24/15% × CVR 70%; equivalent via ASA CPI benchmark range.
//   Android: CTR 35/22/14% × CVR 35%; equivalent via Google App Campaigns CPI
//   benchmark range (US avg ~$2.65–4, finance ~$8–12). Keyword Planner bids are
//   evidence of commercial value only, never the CPI basis (CPC÷CVR overstated 3–5×).
// Keyword Planner data auto-fills per keyword via /api/aso/keyword-metrics
// (needs ASO_TOKEN + GOOGLE_ADS_* env on Vercel; silently skipped until then).
import { useEffect, useMemo, useRef, useState } from "react"

type Platform = "ios" | "android"

const MODEL = {
  ios: { ctr: [0.4, 0.24, 0.15], cvr: 0.7, cpiLow: "4", cpiHigh: "8.5" },
  android: { ctr: [0.35, 0.22, 0.14], cvr: 0.35, cpiLow: "2.65", cpiHigh: "4" },
}
const MAX_KEYWORDS = 10

type Kw = {
  id: number
  keyword: string
  sv: string
  targetPos: number
  cpiLow: string
  cpiHigh: string
  gSearches: string
  bidLow: string
  bidHigh: string
  competition: string
  notes: string
  status: string
  pulledFor: string
}

const emptyKw = (id: number, p: Platform): Kw => ({
  id, keyword: "", sv: "", targetPos: 1,
  cpiLow: MODEL[p].cpiLow, cpiHigh: MODEL[p].cpiHigh,
  gSearches: "", bidLow: "", bidHigh: "", competition: "",
  notes: "", status: "", pulledFor: "",
})

const num = (s: string) => {
  const n = parseFloat(s.replace(",", "."))
  return Number.isFinite(n) && n > 0 ? n : 0
}
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US")
const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const fmtUsd2 = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })

type RowCalc = {
  kw: Kw
  positions: { pos: number; share: number; installs: number; clicks: number; eqLow: number; eqBase: number; eqHigh: number }[]
  target: { pos: number; share: number; installs: number; clicks: number; eqLow: number; eqBase: number; eqHigh: number }
  cpis: { low: number; base: number; high: number }
  searchValue: { cpc: number; monthly: number } | null
}

function calcRow(kw: Kw, platform: Platform): RowCalc | null {
  const daily = num(kw.sv)
  const lo = num(kw.cpiLow)
  const hi = num(kw.cpiHigh)
  if (!daily || !lo || !hi) return null
  const m = MODEL[platform]
  const cpis = { low: lo, base: Math.sqrt(lo * hi), high: hi }
  const positions = m.ctr.map((ctr, i) => {
    const installs = daily * ctr * m.cvr * 30
    return {
      pos: i + 1, share: ctr * m.cvr, installs, clicks: daily * ctr * 30,
      eqLow: installs * cpis.low, eqBase: installs * cpis.base, eqHigh: installs * cpis.high,
    }
  })
  const target = positions[kw.targetPos - 1]
  const bLo = num(kw.bidLow)
  const bHi = num(kw.bidHigh)
  const searchValue = bLo && bHi
    ? { cpc: Math.sqrt(bLo * bHi), monthly: target.clicks * Math.sqrt(bLo * bHi) }
    : null
  return { kw, positions, target, cpis, searchValue }
}

export default function AsoCalculator() {
  const [platform, setPlatform] = useState<Platform>("ios")
  const [geo, setGeo] = useState("US")
  const [minFee, setMinFee] = useState("")
  const [token, setToken] = useState("")
  const [kws, setKws] = useState<Kw[]>([emptyKw(1, "ios")])
  useEffect(() => {
    setToken(localStorage.getItem("aso_token") ?? "")
  }, [])
  const [copied, setCopied] = useState(false)
  const nextId = useRef(2)

  const update = (id: number, patch: Partial<Kw>) =>
    setKws((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)))

  const switchPlatform = (p: Platform) => {
    setPlatform(p)
    // reset CPI fields the user hasn't customized away from either platform default
    setKws((prev) => prev.map((k) => {
      const untouched = (k.cpiLow === MODEL.ios.cpiLow && k.cpiHigh === MODEL.ios.cpiHigh) ||
        (k.cpiLow === MODEL.android.cpiLow && k.cpiHigh === MODEL.android.cpiHigh)
      return untouched ? { ...k, cpiLow: MODEL[p].cpiLow, cpiHigh: MODEL[p].cpiHigh } : k
    }))
  }

  const pullRow = async (id: number, force = false) => {
    const kw = kws.find((k) => k.id === id)
    if (!kw) return
    const q = kw.keyword.trim()
    const key = `${q}|${geo}`
    if (!q || !token.trim()) return
    if (!force && kw.pulledFor === key) return
    localStorage.setItem("aso_token", token.trim())
    update(id, { status: "Fetching Google Ads data…" })
    try {
      const res = await fetch(
        `/api/aso/keyword-metrics?keyword=${encodeURIComponent(q)}&geo=${encodeURIComponent(geo)}&token=${encodeURIComponent(token.trim())}`
      )
      const data = await res.json()
      if (!res.ok) {
        update(id, {
          status: data.error === "google_ads_not_configured"
            ? "Google Ads API not connected yet (GOOGLE_ADS_* env missing)"
            : `Error: ${data.error ?? res.status}`,
        })
        return
      }
      update(id, {
        pulledFor: key,
        gSearches: data.avgMonthlySearches ? String(data.avgMonthlySearches) : kw.gSearches,
        bidLow: data.lowTopOfPageBid ? String(data.lowTopOfPageBid) : kw.bidLow,
        bidHigh: data.highTopOfPageBid ? String(data.highTopOfPageBid) : kw.bidHigh,
        competition: data.competition ?? "",
        status: `Google Ads: ~${data.avgMonthlySearches?.toLocaleString("en-US") ?? "?"} searches/mo, bids $${data.lowTopOfPageBid ?? "?"}–$${data.highTopOfPageBid ?? "?"}${data.competition ? `, competition ${data.competition}` : ""}`,
      })
    } catch (e) {
      update(id, { status: `Network error: ${String(e)}` })
    }
  }

  const pullAll = () => kws.forEach((k) => pullRow(k.id, true))

  const rows = useMemo(
    () => kws.map((k) => calcRow(k, platform)).filter(Boolean) as RowCalc[],
    [kws, platform]
  )
  const totals = useMemo(() => {
    if (!rows.length) return null
    const sum = (f: (r: RowCalc) => number) => rows.reduce((a, r) => a + f(r), 0)
    const installs = sum((r) => r.target.installs)
    const eqLow = sum((r) => r.target.eqLow)
    const eqBase = sum((r) => r.target.eqBase)
    const eqHigh = sum((r) => r.target.eqHigh)
    const rawFee = eqBase * 0.2
    const fee = Math.max(rawFee, num(minFee))
    return { installs, eqLow, eqBase, eqHigh, fee, support: fee * 0.2, minApplied: fee > rawFee }
  }, [rows, minFee])

  const clientText = useMemo(() => {
    if (!totals || !rows.length) return ""
    const store = platform === "ios" ? "App Store" : "Google Play"
    const lines: string[] = [
      `ASO opportunity — ${platform === "ios" ? "iOS" : "Android"}, ${geo}`,
      ``,
    ]
    rows.forEach((r, i) => {
      const k = r.kw
      lines.push(`${i + 1}. "${k.keyword || "…"}" — ~${fmtInt(num(k.sv))} ${store} searches/day, target rank #${k.targetPos}`)
      lines.push(`   Estimated organic installs: ~${fmtInt(r.target.installs)}/month (${(r.target.share * 100).toFixed(1).replace(/\.0$/, "")}% of search volume)`)
      lines.push(`   Paid acquisition equivalent: ${fmtUsd(r.target.eqLow)}–${fmtUsd(r.target.eqHigh)}/month (base ${fmtUsd(r.target.eqBase)} at CPI ${fmtUsd2(r.cpis.base)})`)
      const ev: string[] = []
      if (num(k.gSearches)) ev.push(`~${fmtInt(num(k.gSearches))} Google searches/month`)
      if (r.searchValue) ev.push(`top-of-page bids $${num(k.bidLow)}–$${num(k.bidHigh)} (the same click volume in Google Search would cost ~${fmtUsd(r.searchValue.monthly)}/month)`)
      if (k.competition) ev.push(`competition: ${k.competition.toLowerCase()}`)
      if (ev.length) lines.push(`   Commercial value evidence: ${ev.join("; ")}`)
      if (k.notes.trim()) lines.push(`   Rationale: ${k.notes.trim()}`)
      lines.push(``)
    })
    lines.push(`Total at target rankings: ~${fmtInt(totals.installs)} organic installs/month, paid acquisition equivalent ${fmtUsd(totals.eqLow)}–${fmtUsd(totals.eqHigh)}/month (base ${fmtUsd(totals.eqBase)}).`)
    lines.push(``)
    lines.push(
      platform === "ios"
        ? `Methodology: estimated installs are calculated from App Store search demand, the expected tap-through rate of the target ranking, and the product page conversion rate. The paid acquisition equivalent uses Apple Search Ads CPI benchmarks for the app's category and country (open industry data).`
        : `Methodology: estimated installs are calculated using Google Play search demand, the expected CTR of the target ranking, and the store listing conversion rate. The paid acquisition equivalent uses real Google App Campaigns CPI benchmarks for the app's category and country (open industry data). Google Keyword Planner bid data is cited only as evidence of each keyword's commercial value in Google Search.`
    )
    lines.push(``)
    lines.push(`One-time success fee: ${fmtUsd(totals.fee)} (20% of one month's paid acquisition equivalent${totals.minApplied ? ", minimum project fee applied" : ""}).`)
    lines.push(`Monthly support: ${fmtUsd(totals.support)}.`)
    return lines.join("\n")
  }, [rows, totals, platform, geo])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clientText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
  const labelCls = "mb-1 block text-xs font-medium text-slate-500"

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">ASO Offer Calculator</h1>
      <p className="mt-1 text-sm text-slate-500">
        Internal tool: organic installs from search rankings + paid acquisition equivalent + success fee.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            {(["ios", "android"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => switchPlatform(p)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  platform === p ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p === "ios" ? "iOS / App Store" : "Android / Google Play"}
              </button>
            ))}
          </div>
          <div className="w-20">
            <label className={labelCls}>Country</label>
            <input className={inputCls} value={geo} onChange={(e) => setGeo(e.target.value.toUpperCase())} placeholder="US" autoComplete="off" name="aso-country" />
          </div>
          <div className="w-36">
            <label className={labelCls}>Min. project fee, $</label>
            <input className={inputCls} value={minFee} onChange={(e) => setMinFee(e.target.value)} placeholder="0" inputMode="decimal" autoComplete="off" name="aso-min-fee" />
          </div>
          <div className="w-44">
            <label className={labelCls}>Access token (Google Ads)</label>
            {/* text + off, not type=password: password inputs trigger browser credential autofill */}
            <input className={`${inputCls} [-webkit-text-security:disc]`} value={token} onChange={(e) => setToken(e.target.value)} placeholder="ASO_TOKEN" autoComplete="off" name="aso-access-token" />
          </div>
          <button
            onClick={pullAll}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Refresh all Google Ads data
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {platform === "ios"
            ? "Model: CTR 40/24/15% × CVR 70% for ranks #1–3. CPI = Apple Search Ads benchmark range for the category and country (US overall ~$4, Finance ~$8.5); base = √(low × high)."
            : "Model: CTR 35/22/14% × CVR 35% for ranks #1–3. CPI = real Google App Campaigns benchmark range (US avg $2.65–4, Finance $8–12). Keyword Planner bids are commercial-value evidence only, never the CPI basis."}
          {" "}Bids and Google search demand auto-fill per keyword once the Google Ads API env is configured.
        </p>
      </div>

      {kws.map((k, idx) => {
        const r = calcRow(k, platform)
        return (
          <div key={k.id} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Keyword {idx + 1}</h2>
              {kws.length > 1 && (
                <button onClick={() => setKws((prev) => prev.filter((x) => x.id !== k.id))}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500">
                  Remove
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <label className={labelCls}>Keyword</label>
                <input className={inputCls} value={k.keyword} placeholder="wallet"
                  onChange={(e) => update(k.id, { keyword: e.target.value })}
                  onBlur={() => pullRow(k.id)} />
              </div>
              <div>
                <label className={labelCls}>{platform === "ios" ? "App Store" : "Play"} searches/day</label>
                <input className={inputCls} value={k.sv} placeholder="9000" inputMode="decimal"
                  onChange={(e) => update(k.id, { sv: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Target rank</label>
                <select className={inputCls} value={k.targetPos}
                  onChange={(e) => update(k.id, { targetPos: Number(e.target.value) })}>
                  <option value={1}>#1</option>
                  <option value={2}>#2</option>
                  <option value={3}>#3</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>CPI low, $ ({platform === "ios" ? "ASA" : "UAC"} benchmark)</label>
                <input className={inputCls} value={k.cpiLow} inputMode="decimal"
                  onChange={(e) => update(k.id, { cpiLow: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>CPI high, $ ({platform === "ios" ? "ASA" : "UAC"} benchmark)</label>
                <input className={inputCls} value={k.cpiHigh} inputMode="decimal"
                  onChange={(e) => update(k.id, { cpiHigh: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Google searches/mo (evidence)</label>
                <input className={inputCls} value={k.gSearches} placeholder="—" inputMode="decimal"
                  onChange={(e) => update(k.id, { gSearches: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Top-of-page bids low / high, $</label>
                <div className="flex gap-2">
                  <input className={inputCls} value={k.bidLow} placeholder="low" inputMode="decimal"
                    onChange={(e) => update(k.id, { bidLow: e.target.value })} />
                  <input className={inputCls} value={k.bidHigh} placeholder="high" inputMode="decimal"
                    onChange={(e) => update(k.id, { bidHigh: e.target.value })} />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <label className={labelCls}>Rationale for the client (optional, goes into the offer)</label>
                <input className={inputCls} value={k.notes}
                  placeholder="e.g. core category query with the strongest purchase intent"
                  onChange={(e) => update(k.id, { notes: e.target.value })} />
              </div>
            </div>
            {k.status && <p className="mt-2 text-xs text-slate-500">{k.status}</p>}
            {r && (
              <p className="mt-2 text-xs text-slate-600">
                Rank #{k.targetPos}: <b>{fmtInt(r.target.installs)}</b> installs/mo ·
                equivalent <b>{fmtUsd(r.target.eqLow)}–{fmtUsd(r.target.eqHigh)}</b>/mo (base {fmtUsd(r.target.eqBase)}, CPI {fmtUsd2(r.cpis.base)})
                {r.searchValue && <> · Google Search click value ~{fmtUsd(r.searchValue.monthly)}/mo (CPC {fmtUsd2(r.searchValue.cpc)})</>}
              </p>
            )}
          </div>
        )
      })}

      {kws.length < MAX_KEYWORDS && (
        <button
          onClick={() => setKws((prev) => [...prev, emptyKw(nextId.current++, platform)])}
          className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          + Add keyword ({kws.length}/{MAX_KEYWORDS})
        </button>
      )}

      {totals && rows.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3 text-right">Searches/day</th>
                  <th className="px-4 py-3 text-right">Target</th>
                  <th className="px-4 py-3 text-right">Installs/mo</th>
                  <th className="px-4 py-3 text-right">Equivalent low</th>
                  <th className="px-4 py-3 text-right">Equivalent base</th>
                  <th className="px-4 py-3 text-right">Equivalent high</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.kw.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">{r.kw.keyword || "…"}</td>
                    <td className="px-4 py-3 text-right">{fmtInt(num(r.kw.sv))}</td>
                    <td className="px-4 py-3 text-right">#{r.kw.targetPos}</td>
                    <td className="px-4 py-3 text-right">{fmtInt(r.target.installs)}</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(r.target.eqLow)}</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(r.target.eqBase)}</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(r.target.eqHigh)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right">{fmtInt(totals.installs)}</td>
                  <td className="px-4 py-3 text-right">{fmtUsd(totals.eqLow)}</td>
                  <td className="px-4 py-3 text-right">{fmtUsd(totals.eqBase)}</td>
                  <td className="px-4 py-3 text-right">{fmtUsd(totals.eqHigh)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs text-slate-500">One-time success fee (20% of monthly base equivalent{totals.minApplied ? ", minimum applied" : ""})</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{fmtUsd(totals.fee)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs text-slate-500">Monthly support (20% of the fee)</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{fmtUsd(totals.support)}/mo</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Client-facing offer text</h2>
              <button onClick={copy} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">{clientText}</pre>
          </div>
        </>
      )}

      {(!totals || !rows.length) && (
        <p className="mt-6 text-sm text-slate-400">
          Fill in search volume and the CPI range for at least one keyword — results will appear here.
        </p>
      )}
    </main>
  )
}
