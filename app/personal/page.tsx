import type { Metadata } from "next"
import PersonalHome from "./PersonalHome"
import { OG_PERSONAL } from "@/lib/entity"

// The LinkedIn/X product's landing, moved here unchanged from "/" on 22 Oct 2026, when the front
// page became the AI-visibility page.
export const metadata: Metadata = {
  title: "AI drafts your LinkedIn & X posts | ItGrows",
  description: "AI drafts LinkedIn and X posts in your voice. You review and publish. Start your 14-day free trial.",
  alternates: { canonical: "https://www.itgrows.ai/personal" },
  openGraph: {
    title: "ItGrows — AI drafts your LinkedIn & X posts",
    description: "AI drafts LinkedIn and X posts in your voice. You review and publish. Start your 14-day free trial.",
    url: "https://www.itgrows.ai/personal",
    siteName: "ItGrows.ai",
    images: [OG_PERSONAL],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ItGrows — AI drafts your LinkedIn & X posts",
    description: "AI drafts LinkedIn and X posts in your voice. You review and publish. Start your 14-day free trial.",
    images: [OG_PERSONAL.url],
  },
}

export default function PersonalPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ItGrows for LinkedIn and X",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://www.itgrows.ai/personal",
    offers: { "@type": "Offer", price: "49", priceCurrency: "USD" },
    provider: { "@id": "https://www.itgrows.ai/#organization" },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PersonalHome />
    </>
  )
}
