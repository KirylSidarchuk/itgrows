import type { Metadata } from "next"
import { OG_PERSONAL } from "@/lib/entity"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "AI posts for your LinkedIn Company Page | ItGrows",
  description: "ItGrows drafts and publishes posts for your LinkedIn Company Page and X, in your brand's voice, after your approval.",
  alternates: { canonical: "https://www.itgrows.ai/company" },
  openGraph: {
    title: "AI posts for your LinkedIn Company Page | ItGrows",
    description: "ItGrows drafts and publishes posts for your LinkedIn Company Page and X, in your brand's voice, after your approval.",
    url: "https://www.itgrows.ai/company",
    siteName: "ItGrows.ai",
    images: [OG_PERSONAL],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI posts for your LinkedIn Company Page | ItGrows",
    description: "ItGrows drafts and publishes posts for your LinkedIn Company Page and X, in your brand's voice, after your approval.",
    images: [OG_PERSONAL.url],
  },
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return children
}
