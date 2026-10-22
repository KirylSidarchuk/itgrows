import Link from "next/link"

// Shared frame for the tools under /business: the same header and footer as the guides, so a
// visitor who lands on a tool can reach the guides and the product in one click.
export default function ToolShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen text-[#1b1916]"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <header className="border-b border-black/10 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" className="h-7 w-7 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/business/ai-visibility-checker" className="hover:text-[#1b1916] hidden sm:inline">AI visibility check</Link>
            <Link href="/business/ai-crawler-checker" className="hover:text-[#1b1916] hidden sm:inline">AI crawler check</Link>
            <Link href="/business/blog" className="hover:text-[#1b1916]">Guides</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm bg-[#ebe9e5] mt-16">
        © 2026 ItGrows.ai · <Link href="/" className="hover:text-[#1b1916]">AI visibility for businesses</Link> ·{" "}
        <Link href="/business/blog" className="hover:text-[#1b1916]">Guides</Link>
      </footer>
    </div>
  )
}
