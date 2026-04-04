"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { logout } from "@/lib/auth"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "🏠" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "✅" },
  { href: "/dashboard/new-task", label: "New Task", icon: "➕" },
  { href: "/dashboard/subscription", label: "Subscription", icon: "💳" },
  { href: "/dashboard/support", label: "Support", icon: "💬" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <Link href="/">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            itgrows.ai
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
