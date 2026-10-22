"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

// The AI-visibility cabinet. Two menus: a free account sees its report and the paid plan; a client
// we publish for sees its articles, the report and its website. Everything else lives in the footer.

type Item = { href: string; label: string; icon: keyof typeof ICONS }

const FREE: Item[] = [
  { href: "/business/dashboard/visibility", label: "AI visibility report", icon: "search" },
  { href: "/business/dashboard/plan", label: "Articles written for you", icon: "pen" },
]

const CLIENT: Item[] = [
  { href: "/business/dashboard/articles", label: "Your articles", icon: "file" },
  { href: "/business/dashboard/visibility", label: "AI visibility report", icon: "search" },
  { href: "/business/dashboard/settings", label: "Your website", icon: "globe" },
]

const ICONS = {
  search: "M11 4a7 7 0 105.2 11.7L20 19.5M11 4a7 7 0 010 14",
  pen: "M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4zM13.5 6.5l4 4",
  file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  arrow: "M14 5h5v5M19 5l-8 8M10 5H5v14h14v-5",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
}

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  )
}

const glass = { background: "rgba(255,255,255,0.60)", WebkitBackdropFilter: "blur(24px)", backdropFilter: "blur(24px)" }

export default function BusinessSidebar({ client = false, hasLinkedin = false }: { client?: boolean; hasLinkedin?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const items = client ? CLIENT : FREE

  const row = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all ${
      active ? "bg-violet-100/80 text-violet-700 shadow-sm" : "text-[#2d3748] hover:bg-white/60 hover:text-violet-700"
    }`

  const links = (
    <nav className="flex-1 px-4 py-5 space-y-1">
      {items.map((item) => (
        <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={row(pathname.startsWith(item.href))}>
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  )

  const footer = (
    <div className="px-4 py-4 border-t border-white/40 space-y-1">
      <Link href="/business/dashboard/support" onClick={() => setOpen(false)} className={row(pathname.startsWith("/business/dashboard/support"))}>
        <Icon name="mail" />
        Contact us
      </Link>
      {hasLinkedin && (
        <Link href="/cabinet" className={row(false)}>
          <Icon name="arrow" />
          LinkedIn &amp; X cabinet
        </Link>
      )}
      <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={`w-full ${row(false)}`}>
        <Icon name="out" />
        Log out
      </button>
    </div>
  )

  const logo = (
    <Link href="/business/dashboard">
      <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">ItGrows.ai</span>
    </Link>
  )

  return (
    <>
      {/* Phones and tablets: a slim bar; the menu opens as a sheet. */}
      <header className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between border-b border-white/50" style={glass}>
        {logo}
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-[#2d3748] hover:bg-white/60">
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
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="w-10 h-10 -mr-3 text-2xl text-slate-500">×</button>
            </div>
            {links}
            {footer}
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex w-72 min-h-screen flex-col shrink-0" style={{ ...glass, borderRight: "1px solid rgba(255,255,255,0.7)" }}>
        <div className="px-7 py-7 border-b border-white/40">{logo}</div>
        {links}
        {footer}
      </aside>
    </>
  )
}
