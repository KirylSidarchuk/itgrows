"use client"
import { useRouter, usePathname } from "next/navigation"

const TABS = [
  { label: "Generate", icon: "✍️", href: "/dashboard/seo", comingSoon: false },
  { label: "Calendar", icon: "📅", href: "/dashboard/calendar", comingSoon: false },
  { label: "Published", icon: "📝", href: "/dashboard/blog", comingSoon: false },
  { label: "Google Ads", icon: "🎯", href: null, comingSoon: true },
  { label: "LinkedIn", icon: "💼", href: null, comingSoon: true },
  { label: "Instagram", icon: "📸", href: null, comingSoon: true },
  { label: "Twitter / X", icon: "𝕏", href: null, comingSoon: true },
]

export default function SeoHubTabs() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {TABS.map((tab) => {
        const isActive = tab.href === pathname
        if (tab.comingSoon) {
          return (
            <div key={tab.label} className="relative">
              <button disabled className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 cursor-not-allowed">
                <span>{tab.icon}</span> {tab.label}
              </button>
              <span className="absolute -top-1.5 -right-1 text-[9px] font-bold bg-violet-100 text-violet-500 rounded-full px-1.5 leading-4">Soon</span>
            </div>
          )
        }
        return (
          <button
            key={tab.label}
            onClick={() => router.push(tab.href!)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? "bg-violet-100 text-violet-700 border border-violet-200"
                : "text-slate-500 hover:text-[#1b1916] hover:bg-[#ebe9e5]"
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        )
      })}
    </div>
  )
}
