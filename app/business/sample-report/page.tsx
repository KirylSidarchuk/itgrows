import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import ToolShell from "../_tools/ToolShell"
import SampleReport from "./SampleReport"
import type { SiteReport } from "../dashboard/visibility/parts"
import { noteCrawler } from "@/lib/crawler-log"
import { SAMPLE_DOMAIN } from "@/lib/geo-pricing"
import { sampleSiteReport } from "@/lib/geo-report"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { localePath } from "@/lib/i18n/paths"
import { getLocale } from "@/lib/i18n/server"
import sampleReportPageNs from "@/lib/i18n/messages/sampleReportPage"

// The real report shown next to every "get the free report" button: the whole detailed report of our own
// appslift.com. Indexed since 26 Oct 2026 (it was noindex): it is the proof of what the report is,
// so the report itself is drawn on the server and is in the HTML a crawler reads, not fetched by the
// browser afterwards. ToolShell provides the page's language.

// The same data /api/geo/sample serves, read here directly. Cached for an hour, as that route is at
// the edge; a failed read throws inside and is not cached (the page then says the sample is not
// available this time). Through JSON, so the component gets exactly the shape the route sends.
const cachedSample = unstable_cache(
  async (): Promise<SiteReport | null> => {
    const site = await sampleSiteReport()
    return site?.latest ? (JSON.parse(JSON.stringify(site)) as SiteReport) : null
  },
  ["geo-sample-report"],
  { revalidate: 3600 },
)

async function sample(): Promise<SiteReport | null> {
  try {
    return await cachedSample()
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, sampleReportPageNs)
  return localizedMetadata(locale, "/business/sample-report", {
    title: m.metaTitle(SAMPLE_DOMAIN),
    description: m.metaDescription(SAMPLE_DOMAIN),
  })
}

export default async function SampleReportPage() {
  const locale = await getLocale()
  void noteCrawler(localePath(locale, "/business/sample-report"))
  const site = await sample()
  return (
    <ToolShell guaranteeFootnote={site !== null}>
      <SampleReport site={site} />
    </ToolShell>
  )
}
