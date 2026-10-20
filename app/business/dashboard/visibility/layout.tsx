import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI visibility — ItGrows",
  robots: { index: false, follow: false },
}

export default function VisibilityLayout({ children }: { children: React.ReactNode }) {
  return children
}
