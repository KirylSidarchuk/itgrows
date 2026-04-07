import Link from "next/link"

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#f3f2f1] text-[#1b1916]">
      {/* Nav */}
      <nav className="border-b border-black/10 px-6 py-4 bg-[#f3f2f1]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent"
          >
            ItGrows.ai
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="/#features" className="hover:text-[#1b1916] transition-colors">Features</a>
            <a href="/#how-it-works" className="hover:text-[#1b1916] transition-colors">How it works</a>
            <a href="/#pricing" className="hover:text-[#1b1916] transition-colors">Pricing</a>
            <Link href="/blog" className="text-[#1b1916] font-medium">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-slate-600 hover:text-[#1b1916] text-sm transition-colors">Login</button>
            </Link>
            <Link href="/signup">
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors">Get Started</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center relative overflow-hidden bg-[#ebe9e5]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-[#1b1916]">
            ItGrows.ai{" "}
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">Blog</span>
          </h1>
          <p className="text-slate-600 text-lg">AI-generated insights for growing businesses</p>
        </div>
      </section>

      {/* Coming soon */}
      <section className="px-6 pb-24 pt-16">
        <div className="max-w-6xl mx-auto text-center py-16">
          <p className="text-slate-600 text-lg">Coming soon.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm bg-[#ebe9e5]">
        <p>© 2026 ItGrows.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
