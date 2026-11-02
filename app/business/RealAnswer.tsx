"use client"

import { useEffect, useState } from "react"

// Under the check form on the English home, before any check (02.11, Kiryl agreed): a real ChatGPT answer, so a visitor sees what the
// check looks at before typing anything. Asked on 2 Nov 2026 through the same call the check uses (geo_check/engines.py ask_chatgpt);
// the first three names of each answer, nothing edited; the answers are kept in geo_check/state/site_samples_1102.json on the VM.
// The ad decides which one shows: its utm_content names the niche. Same height in all three, so nothing moves when it switches.
const SAMPLES = {
  general: { q: "Who is the best plumber in Manchester, UK?", names: ["Gibson Plumbing and Heating Limited", "Drainage Solutions", "Easy Plumbing"] },
  dental: { q: "Which family dental practice should I go to in Austin, Texas?", names: ["Lake Travis Family Dentistry", "Lake Creek Family Dental", "Northwest Austin Family Dentistry"] },
  law: { q: "Which family law firm should I call in Denver, Colorado?", names: ["Hogan Omidi, PC", "Burnham Law", "Littman Family Law"] },
}

export default function RealAnswer() {
  const [niche, setNiche] = useState<keyof typeof SAMPLES>("general")
  useEffect(() => {
    const ad = (new URLSearchParams(window.location.search).get("utm_content") ?? "").toLowerCase()
    if (ad.includes("dent")) setNiche("dental")
    else if (ad.includes("law")) setNiche("law")
  }, [])
  const s = SAMPLES[niche]
  return (
    <div className="mt-5 rounded-2xl border border-black/10 bg-white/80 px-5 py-4 text-left">
      <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500">Real ChatGPT answer, Nov 2, 2026</p>
      <p className="mt-2 text-sm font-semibold">&ldquo;{s.q}&rdquo;</p>
      <ol className="mt-2 space-y-1 text-sm text-slate-700 list-decimal list-inside">
        {s.names.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ol>
      <p className="mt-3 text-sm font-bold text-rose-600">Not on the list? Those customers call them, not you.</p>
    </div>
  )
}
