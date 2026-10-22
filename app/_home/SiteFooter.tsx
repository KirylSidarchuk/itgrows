import Link from "next/link"

// The footer of the public pages ("/", /business). Short on purpose: what ItGrows is in one line,
// then the way around the site. The long description lives on /about.

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "AI visibility",
    links: [
      { href: "/#geo-check", label: "Check your site" },
      { href: "/#geo-pricing", label: "Pricing" },
      { href: "/business", label: "For businesses" },
      { href: "/business/blog", label: "Guides" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/business/ai-visibility-checker", label: "AI visibility checker" },
      { href: "/business/ai-crawler-checker", label: "AI crawler checker" },
    ],
  },
  {
    title: "LinkedIn & X",
    links: [
      { href: "/personal", label: "Posts for founders" },
      { href: "/company", label: "Company Pages" },
      { href: "/reddit", label: "Reddit planner (beta)" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "mailto:kiryl@itgrows.ai", label: "kiryl@itgrows.ai" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/llms.txt", label: "llms.txt" },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="bg-[#1b1916] text-slate-400 px-4 sm:px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="" />
              ItGrows.ai
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              We get companies ready to be named by ChatGPT, Claude, Gemini and Perplexity, and count every week whether they are.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:contents">
            {COLUMNS.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">{c.title}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      {l.href.startsWith("mailto:") || l.href.endsWith(".txt") ? (
                        <a href={l.href} className="hover:text-white transition-colors">{l.label}</a>
                      ) : (
                        <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:justify-between text-xs text-slate-500">
          <p>© 2026 ItGrows.ai</p>
          <p>No one can guarantee that an assistant will name a business. We promise the work and an honest weekly count.</p>
        </div>
      </div>
    </footer>
  )
}
