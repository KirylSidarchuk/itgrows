import Link from "next/link"

// Frame for the signed-in planner pages: the marketing site's colours and logo, nothing else,
// so the work itself gets the screen.
export default function AppShell({ children, email }: { children: React.ReactNode; email?: string }) {
  return (
    <div
      className="min-h-screen text-[#1b1916]"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <nav className="border-b border-black/10 px-4 sm:px-6 py-3.5 sticky top-0 z-40" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 font-bold shrink-0">
              <img src="/logo.jpg" className="h-7 w-7 rounded-lg" alt="ItGrows" />
              <span className="hidden sm:inline bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">ItGrows.ai</span>
            </Link>
            <span className="text-black/20">/</span>
            <Link href="/reddit/app" className="text-sm font-semibold truncate">
              Reddit planner
            </Link>
            <span className="text-[10px] uppercase tracking-wider font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 min-w-0">
            {email && <span className="hidden md:inline truncate">{email}</span>}
            <Link href="/cabinet" className="hover:text-[#1b1916] shrink-0">
              Cabinet
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
