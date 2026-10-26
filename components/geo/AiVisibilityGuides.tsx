import Link from "next/link"
import { mainGuides } from "./guide-data"

// The main English AI-visibility guides, as a fixed block on the /blog index and on every /blog post.
// Those posts are the pages assistants and search indexes already know (Copilot cites them); without
// this they linked only to each other, never to the guides (lib/geo-guides.ts, MAIN_GUIDES).
export default async function AiVisibilityGuides({ className = "" }: { className?: string }) {
  const guides = await mainGuides("en")
  if (guides.length === 0) return null
  return (
    <section aria-labelledby="ai-visibility-guides" className={`rounded-2xl bg-white border border-black/10 p-6 ${className}`}>
      <h2 id="ai-visibility-guides" className="text-lg font-extrabold tracking-tight text-[#1b1916]">
        AI visibility guides
      </h2>
      <p className="text-sm text-slate-600 mt-1">How ChatGPT, Claude, Gemini and Perplexity find and name a business.</p>
      <ul className="grid sm:grid-cols-2 gap-3 mt-4">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/business/blog/${g.slug}`}
              className="block h-full rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold leading-snug text-[#1b1916] hover:border-violet-400 transition-colors"
            >
              {g.title}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/business/blog" className="text-violet-700 font-semibold hover:underline">
          All AI visibility guides →
        </Link>
      </p>
    </section>
  )
}
