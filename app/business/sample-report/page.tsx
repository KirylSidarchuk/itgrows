import type { Metadata } from "next"
import ToolShell from "../_tools/ToolShell"
import SampleReport from "./SampleReport"
import { SAMPLE_DOMAIN } from "@/lib/geo-pricing"

// The real report shown next to every "buy the report" button. Public, kept out of search: it is
// one company's measurements, not a page to rank.

export const metadata: Metadata = {
  title: `A real AI visibility report: ${SAMPLE_DOMAIN} | ItGrows`,
  description: `The full detailed report for ${SAMPLE_DOMAIN}: 20 buyer questions put to ChatGPT, Claude, Gemini and Perplexity, 3 times each.`,
  robots: { index: false, follow: true },
}

export default function SampleReportPage() {
  return (
    <ToolShell>
      <SampleReport />
    </ToolShell>
  )
}
