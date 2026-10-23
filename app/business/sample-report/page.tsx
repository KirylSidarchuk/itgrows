import type { Metadata } from "next"
import ToolShell from "../_tools/ToolShell"
import SampleReport from "./SampleReport"
import { SAMPLE_DOMAIN } from "@/lib/geo-pricing"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { getLocale } from "@/lib/i18n/server"
import sampleReportPageNs from "@/lib/i18n/messages/sampleReportPage"

// The real report shown next to every "buy the report" button. Public, kept out of search: it is
// one company's measurements, not a page to rank. ToolShell provides the page's language.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, sampleReportPageNs)
  return localizedMetadata(locale, "/business/sample-report", {
    title: m.metaTitle(SAMPLE_DOMAIN),
    description: m.metaDescription(SAMPLE_DOMAIN),
    robots: { index: false, follow: true },
  })
}

export default function SampleReportPage() {
  return (
    <ToolShell>
      <SampleReport />
    </ToolShell>
  )
}
