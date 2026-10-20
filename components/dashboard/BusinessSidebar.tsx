"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const fullNav = [
  { href: "/business/dashboard/visibility", label: "AI visibility", icon: "🔎" },
  { href: "/business/dashboard", label: "Overview", icon: "🏠" },
  { href: "/business/dashboard/tasks", label: "Tasks", icon: "✅" },
  { href: "/business/dashboard/new-task", label: "New Task", icon: "➕" },
  { href: "/business/dashboard/seo", label: "SEO Autopilot", icon: "🔍" },
  { href: "/business/dashboard/linkedin", label: "LinkedIn", icon: "💼" },
  { href: "/business/dashboard/billing", label: "Billing", icon: "💳" },
  { href: "/business/dashboard/subscription", label: "Subscription", icon: "📋" },
  { href: "/business/dashboard/support", label: "Support", icon: "💬" },
  { href: "/business/dashboard/settings", label: "Settings", icon: "⚙️" },
]

// Free AI-visibility accounts: the report and the few things around it, nothing they cannot use.
const simpleNav = [
  { href: "/business/dashboard/visibility", label: "AI visibility", icon: "🔎" },
  { href: "/business#pricing", label: "Plans", icon: "💎" },
  { href: "/business/dashboard/support", label: "Support", icon: "💬" },
  { href: "/business/dashboard/settings", label: "Settings", icon: "⚙️" },
]

const glass = { background: "rgba(255,255,255,0.60)", WebkitBackdropFilter: "blur(24px)", backdropFilter: "blur(24px)" }

export default function BusinessSidebar({ fullAccess = true, follows = false }: { fullAccess?: boolean; follows?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const simple = !fullAccess && (follows || pathname.startsWith("/business/dashboard/visibility"))
  const navItems = simple ? simpleNav : fullNav

  const links = (
    <nav className="flex-1 px-4 py-5 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/business/dashboard" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all ${
              isActive ? "bg-violet-100/80 text-violet-700 shadow-sm" : "text-[#2d3748] hover:bg-white/60 hover:text-violet-700"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const logout = (
    <div className="px-4 py-4 border-t border-white/40">
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-medium text-[#2d3748] hover:bg-white/60 hover:text-violet-700 transition-all"
      >
        <span className="text-xl">🚪</span>
        Logout
      </button>
    </div>
  )

  const logo = (
    <Link href="/">
      <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">ItGrows.ai</span>
    </Link>
  )

  return (
    <>
      {/* Phones and tablets: a slim bar; the menu opens as a sheet. */}
      <header className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between border-b border-white/50" style={glass}>
        {logo}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-[#2d3748] hover:bg-white/60"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] flex flex-col bg-white/95 shadow-2xl">
            <div className="px-7 h-14 flex items-center justify-between border-b border-black/5">
              {logo}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="w-10 h-10 -mr-3 text-2xl text-slate-500">
                ×
              </button>
            </div>
            {links}
            {logout}
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex w-72 min-h-screen flex-col shrink-0" style={{ ...glass, borderRight: "1px solid rgba(255,255,255,0.7)" }}>
        <div className="px-7 py-7 border-b border-white/40">{logo}</div>
        {links}
        {logout}
      </aside>
    </>
  )
}
