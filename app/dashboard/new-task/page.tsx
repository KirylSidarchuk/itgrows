"use client"

import { useRouter } from "next/navigation"

// ─── Channel cards ────────────────────────────────────────────────────────────

const channelCards = [
  { value: "seo_article", label: "SEO Article", icon: "✍️", desc: "AI writes and publishes an SEO-optimized blog post", active: true },
  { value: "google_ads", label: "Google Ads", icon: "🎯", desc: "Configure and launch a Google Ads campaign", active: false },
  { value: "linkedin_posts", label: "LinkedIn Posts", icon: "💼", desc: "Create and schedule LinkedIn content", active: false },
  { value: "instagram_posts", label: "Instagram Posts", icon: "📸", desc: "Generate and schedule Instagram posts", active: false },
  { value: "twitter_x", label: "Twitter / X", icon: "𝕏", desc: "Compose and schedule tweets", active: false },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTaskPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 dashboard-heading">New Task</h1>
          <p className="text-slate-600">Choose what you want to create</p>
        </div>

        {/* Channel selector */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 mb-8">
          {channelCards.map((card) => {
            if (!card.active) {
              return (
                <div
                  key={card.value}
                  className="relative p-5 rounded-2xl border border-black/10 bg-white opacity-60 cursor-not-allowed"
                >
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-violet-100 text-violet-500 rounded-full px-1.5 leading-4">
                    Soon
                  </span>
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="text-[#1b1916] text-sm font-medium">{card.label}</div>
                  <div className="text-slate-500 text-xs mt-1 leading-snug">{card.desc}</div>
                </div>
              )
            }
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => router.push("/dashboard/calendar")}
                className="relative p-5 rounded-2xl border text-left transition-all border-violet-400 bg-violet-50 shadow-sm hover:border-violet-500 hover:shadow-md"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="text-sm font-medium text-violet-700">{card.label}</div>
                <div className="text-slate-500 text-xs mt-1 leading-snug">{card.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
