"use client"

import { useRouter } from "next/navigation"

/* eslint-disable @next/next/no-img-element */
const GoogleAdsLogo = () => (
  <img src="/logos/google-ads.jpg" width={32} height={32} className="rounded-lg object-contain" alt="Google Ads" />
)

const LinkedInLogo = () => (
  <img src="/logos/linkedin.png" width={32} height={32} className="rounded-lg object-contain" alt="LinkedIn" />
)

const InstagramLogo = () => (
  <img src="/logos/instagram.jpg" width={32} height={32} className="rounded-xl" alt="Instagram" />
)
/* eslint-enable @next/next/no-img-element */

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
                  className="group relative p-6 rounded-2xl border border-black/10 bg-white/60 cursor-not-allowed opacity-60 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                      Coming Soon
                    </span>
                  </div>
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
                onClick={() => router.push("/business/dashboard/calendar")}
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
