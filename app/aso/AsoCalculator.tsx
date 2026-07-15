"use client"

// Internal ASO offer calculator (noindex, linked from nowhere).
// Model constants agreed with the owner on 2026-07-15 (Android CPI reworked
// 2026-07-15 to real UAC benchmarks — the earlier CPC÷CVR derivation overstated
// CPI 3–5× vs real Google App Campaigns costs):
//   iOS: CTR 40/24/15% × CVR 70%; equivalent via ASA CPI benchmark range.
//   Android: CTR 35/22/14% × CVR 35%; equivalent via Google App Campaigns CPI
//   benchmark range (US avg ~$2.65–4, finance ~$8–12). Keyword Planner bids are
//   shown only as evidence of the keyword's commercial value in Google Search.
import { useEffect, useMemo, useState } from "react"

type Platform = "ios" | "android"

const MODEL = {
  ios: { ctr: [0.4, 0.24, 0.15], cvr: 0.7 },
  android: { ctr: [0.35, 0.22, 0.14], cvr: 0.35 },
}

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US")
const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const fmtUsd2 = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })

export default function AsoCalculator() {
  const [platform, setPlatform] = useState<Platform>("ios")
  const [keyword, setKeyword] = useState("")
  const [geo, setGeo] = useState("US")
  const [sv, setSv] = useState("")
  const [targetPos, setTargetPos] = useState(1)
  // CPI benchmark range (open industry data): ASA benchmarks for iOS,
  // Google App Campaigns benchmarks for Android.
  const [cpiLow, setCpiLow] = useState("4")
  const [cpiHigh, setCpiHigh] = useState("8.5")
  // Reference-only: Keyword Planner top-of-page bids + Google search demand.
  const [bidLow, setBidLow] = useState("")
  const [bidHigh, setBidHigh] = useState("")
  const [gSearches, setGSearches] = useState("")
  const [minFee, setMinFee] = useState("")
  const [copied, setCopied] = useState(false)
  // Google Ads API pull
  const [asoToken, setAsoToken] = useState("")
  const [pulling, setPulling] = useState(false)
  const [pullMsg, setPullMsg] = useState("")

  useEffect(() => {
    setAsoToken(localStorage.getItem("aso_token") ?? "")
  }, [])

  const switchPlatform = (p: Platform) => {
    setPlatform(p)
    // sensible benchmark defaults per platform (US, editable)
    if (p === "ios") { setCpiLow("4"); setCpiHigh("8.5") }
    else { setCpiLow("2.65"); setCpiHigh("4") }
  }

  const num = (s: string) => {
    const n = parseFloat(s.replace(",", "."))
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  const calc = useMemo(() => {
    const daily = num(sv)
    const m = MODEL[platform]
    const lo = num(cpiLow)
    const hi = num(cpiHigh)
    if (!daily || !lo || !hi) return null
    const cpis = { low: lo, base: Math.sqrt(lo * hi), high: hi }

    const rows = m.ctr.map((ctr, i) => {
      const installs = daily * ctr * m.cvr * 30
      return {
        pos: i + 1,
        share: ctr * m.cvr,
        installs,
        clicks: daily * ctr * 30,
        eqLow: installs * cpis.low,
        eqBase: installs * cpis.base,
        eqHigh: installs * cpis.high,
      }
    })

    const target = rows[targetPos - 1]
    // reference: what the same demand would cost as Google Search clicks
    const bLo = num(bidLow)
    const bHi = num(bidHigh)
    const searchValue =
      platform === "android" && bLo && bHi
        ? { cpc: Math.sqrt(bLo * bHi), monthly: target.clicks * Math.sqrt(bLo * bHi) }
        : null

    const rawFee = target.eqBase * 0.2
    const fee = Math.max(rawFee, num(minFee))
    return { rows, cpis, target, searchValue, fee, support: fee * 0.2, minApplied: fee > rawFee }
  }, [platform, sv, cpiLow, cpiHigh, bidLow, bidHigh, targetPos, minFee])

  const clientText = useMemo(() => {
    if (!calc) return ""
    const t = calc.target
    const store = platform === "ios" ? "App Store" : "Google Play"
    const lines = [
      `ASO opportunity — "${keyword || "…"}" (${platform === "ios" ? "iOS" : "Android"}, ${geo})`,
      ``,
      `Search demand: ~${fmtInt(num(sv))} ${store} searches per day.` +
        (num(gSearches) ? ` Google Search demand for the same query: ~${fmtInt(num(gSearches))} searches/month.` : ""),
      ``,
      `Estimated organic installs per month at target rankings:`,
      ...calc.rows.map(
        (r) => `  #${r.pos}: ~${fmtInt(r.installs)} installs/month (${(r.share * 100).toFixed(1).replace(/\.0$/, "")}% of search volume)`
      ),
      ``,
      `Paid acquisition equivalent at rank #${t.pos}: ${fmtUsd(t.eqLow)}–${fmtUsd(t.eqHigh)} per month` +
        ` (base scenario ${fmtUsd(t.eqBase)}, at an estimated CPI of ${fmtUsd2(calc.cpis.base)}).`,
      ...(calc.searchValue
        ? [
            ``,
            `For reference, buying the same volume of clicks in Google Search at current top-of-page bids would cost ~${fmtUsd(calc.searchValue.monthly)} per month (CPC ~${fmtUsd2(calc.searchValue.cpc)}).`,
          ]
        : []),
      ``,
      platform === "ios"
        ? `Methodology: estimated installs are calculated from App Store search demand, the expected tap-through rate of the target ranking, and the product page conversion rate. The paid acquisition equivalent uses Apple Search Ads CPI benchmarks for the app's category and country (open industry data).`
        : `Methodology: estimated installs are calculated using Google Play search demand, the expected CTR of the target ranking, and the store listing conversion rate. The paid acquisition equivalent uses real Google App Campaigns CPI benchmarks for the app's category and country (open industry data). Google Keyword Planner bid data is cited only as evidence of the keyword's commercial value in Google Search.`,
      ``,
      `One-time success fee: ${fmtUsd(calc.fee)} (20% of one month's paid acquisition equivalent${calc.minApplied ? ", minimum project fee applied" : ""}).`,
      `Monthly support: ${fmtUsd(calc.support)}.`,
    ]
    return lines.join("\n")
  }, [calc, keyword, geo, sv, gSearches, platform])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clientText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const pullFromGoogleAds = async () => {
    if (!keyword.trim()) { setPullMsg("Сначала укажи ключевой запрос"); return }
    if (!asoToken.trim()) { setPullMsg("Нужен токен доступа (ASO_TOKEN)"); return }
    localStorage.setItem("aso_token", asoToken.trim())
    setPulling(true)
    setPullMsg("")
    try {
      const res = await fetch(
        `/api/aso/keyword-metrics?keyword=${encodeURIComponent(keyword.trim())}&geo=${encodeURIComponent(geo)}&token=${encodeURIComponent(asoToken.trim())}`
      )
      const data = await res.json()
      if (!res.ok) {
        setPullMsg(
          data.error === "google_ads_not_configured"
            ? "Google Ads API ещё не подключён (нет GOOGLE_ADS_* env на Vercel)"
            : `Ошибка: ${data.error ?? res.status}`
        )
        return
      }
      if (data.avgMonthlySearches) setGSearches(String(data.avgMonthlySearches))
      if (data.lowTopOfPageBid) setBidLow(String(data.lowTopOfPageBid))
      if (data.highTopOfPageBid) setBidHigh(String(data.highTopOfPageBid))
      setPullMsg(
        `OK: ~${data.avgMonthlySearches?.toLocaleString("en-US") ?? "?"} поисков/мес в Google, ` +
          `биды $${data.lowTopOfPageBid ?? "?"}–$${data.highTopOfPageBid ?? "?"}` +
          (data.competition ? `, конкуренция ${data.competition}` : "")
      )
    } catch (e) {
      setPullMsg(`Ошибка сети: ${String(e)}`)
    } finally {
      setPulling(false)
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
  const labelCls = "mb-1 block text-xs font-medium text-slate-500"

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">ASO Offer Calculator</h1>
      <p className="mt-1 text-sm text-slate-500">
        Внутренний инструмент: установки из позиции в поиске + рекламный эквивалент + Success Fee.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2">
            <label className={labelCls}>Ключевой запрос</label>
            <input className={inputCls} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="wallet" />
          </div>
          <div>
            <label className={labelCls}>GEO</label>
            <input className={inputCls} value={geo} onChange={(e) => setGeo(e.target.value.toUpperCase())} placeholder="US" />
          </div>
          <div>
            <label className={labelCls}>Поисков в день{platform === "android" ? " (Play)" : " (App Store)"}</label>
            <input className={inputCls} value={sv} onChange={(e) => setSv(e.target.value)} placeholder="9000" inputMode="decimal" />
          </div>

          <div>
            <label className={labelCls}>CPI low, $ ({platform === "ios" ? "ASA" : "UAC"} бенчмарк)</label>
            <input className={inputCls} value={cpiLow} onChange={(e) => setCpiLow(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>CPI high, $ ({platform === "ios" ? "ASA" : "UAC"} бенчмарк)</label>
            <input className={inputCls} value={cpiHigh} onChange={(e) => setCpiHigh(e.target.value)} inputMode="decimal" />
          </div>

          <div>
            <label className={labelCls}>Целевая позиция</label>
            <select className={inputCls} value={targetPos} onChange={(e) => setTargetPos(Number(e.target.value))}>
              <option value={1}>#1</option>
              <option value={2}>#2</option>
              <option value={3}>#3</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Мин. цена проекта, $</label>
            <input className={inputCls} value={minFee} onChange={(e) => setMinFee(e.target.value)} placeholder="0" inputMode="decimal" />
          </div>

          <div>
            <label className={labelCls}>Google searches/мес (справочно)</label>
            <input className={inputCls} value={gSearches} onChange={(e) => setGSearches(e.target.value)} placeholder="—" inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>Top-of-page bid low, $ (справочно)</label>
            <input className={inputCls} value={bidLow} onChange={(e) => setBidLow(e.target.value)} placeholder="—" inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>Top-of-page bid high, $ (справочно)</label>
            <input className={inputCls} value={bidHigh} onChange={(e) => setBidHigh(e.target.value)} placeholder="—" inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>Токен доступа (для Google Ads)</label>
            <input className={inputCls} value={asoToken} onChange={(e) => setAsoToken(e.target.value)} placeholder="ASO_TOKEN" type="password" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={pullFromGoogleAds}
            disabled={pulling}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {pulling ? "Тяну из Google Ads…" : "Подтянуть спрос и биды из Google Ads"}
          </button>
          {pullMsg && <span className="text-xs text-slate-500">{pullMsg}</span>}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          {platform === "ios"
            ? "Модель: CTR 40/24/15% × CVR 70%. CPI — вилка из открытых ASA-бенчмарков по категории и гео (AppTweak / SplitMetrics / Business of Apps); US общий ~$4, Finance ~$8.5. Base = √(low × high)."
            : "Модель: CTR 35/22/14% × CVR 35%. CPI — реальные бенчмарки Google App Campaigns по категории и гео (US в среднем $2.65–4, Finance $8–12). Биды Keyword Planner — только справка о ценности клика в Google Search, НЕ основа CPI."}
        </p>
      </div>

      {calc && (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Позиция</th>
                  <th className="px-4 py-3 text-right">Доля SV</th>
                  <th className="px-4 py-3 text-right">Установок/мес</th>
                  <th className="px-4 py-3 text-right">Эквивалент low</th>
                  <th className="px-4 py-3 text-right">Эквивалент base</th>
                  <th className="px-4 py-3 text-right">Эквивалент high</th>
                </tr>
              </thead>
              <tbody>
                {calc.rows.map((r) => (
                  <tr key={r.pos} className={`border-b border-slate-100 last:border-0 ${r.pos === targetPos ? "bg-slate-50 font-semibold" : ""}`}>
                    <td className="px-4 py-3">#{r.pos}</td>
                    <td className="px-4 py-3 text-right">{(r.share * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right">{fmtInt(r.installs)}</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(r.eqLow)}/мес</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(r.eqBase)}/мес</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(r.eqHigh)}/мес</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              <span>CPI low/base/high: <b>{fmtUsd2(calc.cpis.low)} / {fmtUsd2(calc.cpis.base)} / {fmtUsd2(calc.cpis.high)}</b></span>
              {calc.searchValue && (
                <span>
                  Справочно, ценность спроса в Google Search: <b>{fmtUsd(calc.searchValue.monthly)}/мес</b> кликов (CPC {fmtUsd2(calc.searchValue.cpc)})
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs text-slate-500">One-time Success Fee (20% base-эквивалента #{targetPos}{calc.minApplied ? ", применена минималка" : ""})</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{fmtUsd(calc.fee)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs text-slate-500">Monthly support (20% от fee)</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{fmtUsd(calc.support)}/мес</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Текст для клиента (EN)</h2>
              <button onClick={copy} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                {copied ? "Скопировано ✓" : "Копировать"}
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">{clientText}</pre>
          </div>
        </>
      )}

      {!calc && (
        <p className="mt-6 text-sm text-slate-400">
          Заполни объём поиска и вилку CPI — расчёт появится здесь.
        </p>
      )}
    </main>
  )
}
