"use client"

import { useRouter } from "next/navigation"

const GoogleAdsLogo = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
    <path d="M6 34l10-17.3 6 10.4L16 34z" fill="#FBBC04"/>
    <path d="M28 10L18 27.3H38L28 10z" fill="#4285F4"/>
    <path d="M38 34a6 6 0 100-12 6 6 0 000 12z" fill="#34A853"/>
  </svg>
)

const LinkedInLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#0A66C2"/>
    <path d="M8 12h4v12H8V12zm2-5a2 2 0 110 4 2 2 0 010-4zm6 5h3.8v1.6h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V24h-4v-5.6c0-1.3 0-3-1.8-3-1.9 0-2.2 1.5-2.2 3V24H16V12z" fill="white"/>
  </svg>
)

const InstagramLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="url(#ig-grad)"/>
    <circle cx="16" cy="16" r="5" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="22.5" cy="9.5" r="1.5" fill="white"/>
    <defs>
      <linearGradient id="ig-grad" x1="0" y1="32" x2="32" y2="0">
        <stop offset="0%" stopColor="#F58529"/>
        <stop offset="50%" stopColor="#DD2A7B"/>
        <stop offset="100%" stopColor="#8134AF"/>
      </linearGradient>
    </defs>
  </svg>
)

const XLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#000"/>
    <path d="M18.24 14.56L24.48 7h-1.48l-5.4 6.28L13.2 7H8l6.55 9.54L8 25h1.48l5.73-6.66L19.8 25H25l-6.76-10.44zm-2.03 2.36l-.66-.95-5.3-7.58H12.5l4.27 6.1.66.95 5.54 7.92h-2.26l-4.5-6.44z" fill="white"/>
  </svg>
)

const channelCards = [
  { value: "seo_article", label: "SEO Article", icon: "✍️", svgLogo: null, desc: "AI writes and publishes an SEO-optimized blog post", active: true },
  { value: "google_ads", label: "Google Ads", icon: null, svgLogo: <GoogleAdsLogo />, desc: "Auto-generate ads from your published articles", active: false },
  { value: "linkedin_posts", label: "LinkedIn", icon: null, svgLogo: <LinkedInLogo />, desc: "Schedule LinkedIn posts from your SEO content", active: false },
  { value: "instagram_posts", label: "Instagram", icon: null, svgLogo: <InstagramLogo />, desc: "Turn articles into Instagram-ready visuals", active: false },
  { value: "twitter_x", label: "Twitter / X", icon: null, svgLogo: <XLogo />, desc: "Auto-post threads from your blog content", active: false },
]

export default function NewTaskPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 dashboard-heading">New Task</h1>
          <p className="text-slate-600">Choose what you want to create</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {channelCards.map((card) => {
            if (!card.active) {
              return (
                <div
                  key={card.value}
                  className="relative p-6 rounded-2xl border border-black/10 bg-white/60 cursor-not-allowed"
                >
                  <span className="absolute top-3 right-3 text-xs font-bold bg-violet-100 text-violet-500 rounded-full px-2.5 py-0.5">
                    Soon
                  </span>
                  <div className="mb-3">{card.svgLogo ?? <span className="text-3xl">{card.icon}</span>}</div>
                  <div className="text-[#1b1916] text-base font-semibold mb-1">{card.label}</div>
                  <div className="text-slate-400 text-sm leading-snug">{card.desc}</div>
                </div>
              )
            }
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => router.push("/dashboard/calendar")}
                className="relative p-6 rounded-2xl border text-left transition-all border-violet-400 bg-violet-50/80 shadow-sm hover:border-violet-500 hover:shadow-md"
              >
                <div className="mb-3"><span className="text-3xl">{card.icon}</span></div>
                <div className="text-base font-semibold text-violet-700 mb-1">{card.label}</div>
                <div className="text-slate-500 text-sm leading-snug">{card.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
