import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI posts for your LinkedIn Company Page | ItGrows",
  description: "ItGrows drafts and publishes posts for your LinkedIn Company Page and X, in your brand's voice, after your approval.",
  alternates: { canonical: "https://www.itgrows.ai/company" },
}

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return children
}
