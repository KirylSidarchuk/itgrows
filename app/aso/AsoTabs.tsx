"use client"

import { useState } from "react"
import AsoAnalyzer from "./AsoAnalyzer"
import AsoCalculator from "./AsoCalculator"

export default function AsoTabs() {
  const [tab, setTab] = useState<"analyze" | "manual">("analyze")
  const btn = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">ASO Analyzer</h1>
      <p className="mt-1 text-sm text-slate-500">
        Paste an App Store link, pick countries, and see the top keywords, your current ranks, and the top-3 opportunity.
      </p>
      <div className="mt-5 flex gap-2">
        <button className={btn(tab === "analyze")} onClick={() => setTab("analyze")}>App analysis</button>
        <button className={btn(tab === "manual")} onClick={() => setTab("manual")}>Manual calculator</button>
      </div>
      <div className="mt-6">{tab === "analyze" ? <AsoAnalyzer /> : <AsoCalculator />}</div>
    </main>
  )
}
