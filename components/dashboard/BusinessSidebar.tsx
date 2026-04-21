"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const navItems = [
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

export default function BusinessSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 min-h-screen flex flex-col" style={{ background: "rgba(255,255,255,0.60)", WebkitBackdropFilter: "blur(24px)", backdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,0.7)" }}>
      <div className="px-7 py-7 border-b border-white/40">
        <Link href="/">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            ItGrows.ai
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-5 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/business/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all ${
                isActive
                  ? "bg-violet-100/80 text-violet-700 shadow-sm"
                  : "text-[#2d3748] hover:bg-white/60 hover:text-violet-700"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/40">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-medium text-[#2d3748] hover:bg-white/60 hover:text-violet-700 transition-all"
        >
          <span className="text-xl">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
