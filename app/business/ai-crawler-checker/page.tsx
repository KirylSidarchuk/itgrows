import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import ToolShell from "../_tools/ToolShell"
import Faq, { faqSchema } from "../_tools/Faq"
import CrawlerChecker from "./CrawlerChecker"
import { noteCrawler } from "@/lib/crawler-log"
import { guideFor } from "@/lib/geo-guides"
import AboutItGrows from "@/components/geo/AboutItGrows"
import { LIFT } from "@/components/geo/motion"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { absoluteUrl, localePath } from "@/lib/i18n/paths"
import { rich } from "@/lib/i18n/rich"
import ns from "@/lib/i18n/messages/crawlerCheckerPage"

const PATH = "/business/ai-crawler-checker"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, ns)
  return localizedMetadata(locale, PATH, {
    title: m.metaTitle,
    description: m.metaDescription,
    openGraph: { title: m.ogTitle, description: m.ogDescription },
    twitter: { title: m.ogTitle, description: m.ogDescription },
  })
}

export default async function AiCrawlerCheckerPage() {
  const locale = await getLocale()
  void noteCrawler(localePath(locale, PATH))
  const m = t(locale, ns)
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: m.schemaName,
        url: absoluteUrl(locale, PATH),
        inLanguage: locale,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        description: m.schemaDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        provider: { "@id": "https://www.itgrows.ai/#organization" },
      },
      faqSchema(m.faq),
    ],
  }
  const code = (c: ReactNode) => <code>{c}</code>
  const linkTo = (href: string, c: ReactNode) => (
    <Link className="text-violet-700 underline" href={href}>
      {c}
    </Link>
  )
  return (
    <ToolShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700">{m.eyebrow}</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-3">{m.h1}</h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 max-w-2xl mx-auto">{m.lead}</p>
        </div>
        <div className="mt-8">
          <CrawlerChecker />
        </div>

        <article className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight">{m.whyTitle}</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">{rich(m.whyBody, { code })}</p>

          <h2 className="text-2xl font-extrabold tracking-tight mt-12">{m.whatTitle}</h2>
          <ul className="mt-4 space-y-2 text-slate-700 leading-relaxed list-disc pl-5">
            {/* German pages link the German guide where there is one (lib/geo-guides.ts). */}
            <li>{rich(m.tipRules, { code, link: (c) => linkTo(`/business/blog/${guideFor(locale, "is-your-website-blocking-ai-crawlers")}`, c) })}</li>
            <li>{rich(m.tipServer, { link: (c) => linkTo("/business/blog/gptbot-blocked-by-cloudflare", c) })}</li>
            <li>{rich(m.tipOpen, { link: (c) => linkTo(localePath(locale, "/business/ai-visibility-checker"), c) })}</li>
          </ul>

          <Faq items={m.faq} />
        </article>

        <AboutItGrows locale={locale} current={PATH} className={`max-w-3xl mx-auto mt-16 ${LIFT}`} />
      </main>
    </ToolShell>
  )
}
