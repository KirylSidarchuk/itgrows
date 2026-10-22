import type { Metadata } from "next"
import Link from "next/link"
import { ENTITY_ABOUT, ORGANIZATION } from "@/lib/entity"
import { GEO_PRICES } from "@/lib/geo-pricing"

export const metadata: Metadata = {
  title: "About ItGrows: AI visibility and LinkedIn ghostwriting",
  description: "What ItGrows does: makes companies visible in AI answers, and drafts LinkedIn and X posts for founders and experts.",
  alternates: { canonical: "https://www.itgrows.ai/about" },
}

export default function AboutPage() {
  const schema = { "@context": "https://schema.org", "@graph": [ORGANIZATION, { "@type": "AboutPage", url: "https://www.itgrows.ai/about", about: { "@id": ORGANIZATION["@id"] } }] }
  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <Link href="/" className="text-sm text-violet-700 font-semibold">← ItGrows</Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4">About ItGrows</h1>
        {ENTITY_ABOUT.map((p) => (
          <p key={p} className="mt-4 text-slate-700 leading-relaxed">{p}</p>
        ))}
        <h2 className="text-xl font-bold mt-10">Products</h2>
        <ul className="mt-3 space-y-2 text-slate-700">
          <li><Link href="/" className="text-violet-700 font-semibold">AI visibility for businesses</Link> — answer pages, crawler fixes, a weekly check of four assistants. {GEO_PRICES.month.label} a month plus a one-time {GEO_PRICES.setup.label} setup (free with 3 months or a year); the detailed report {GEO_PRICES.research.label}; a 30-second check with no signup.</li>
          <li><Link href="/personal" className="text-violet-700 font-semibold">LinkedIn &amp; X posts</Link> — drafts in your own voice, published after your approval. From $49 a month.</li>
        </ul>
        <h2 className="text-xl font-bold mt-10">Contact</h2>
        <p className="mt-3 text-slate-700"><a href="mailto:kiryl@itgrows.ai" className="text-violet-700">kiryl@itgrows.ai</a></p>
      </main>
    </div>
  )
}
