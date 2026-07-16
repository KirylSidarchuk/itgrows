import type { Metadata } from "next"
import AsoTabs from "./AsoTabs"

export const metadata: Metadata = {
  title: "ASO Analyzer",
  robots: { index: false, follow: false },
}

export default function AsoPage() {
  return <AsoTabs />
}
