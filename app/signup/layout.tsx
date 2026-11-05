import type { Metadata } from "next"
import type { ReactNode } from "react"
import PriceScope from "@/components/geo/PriceScope"
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher"
import { GEO_SANS } from "@/lib/geo-pages"
import LocaleProvider from "@/components/i18n/LocaleProvider"
import { OG_PERSONAL } from "@/lib/entity"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { getLocale } from "@/lib/i18n/server"
import signupNs from "@/lib/i18n/messages/signup"

// The page's language for metadata: the title stays the brand, the description is the root
// layout's, translated; the share image stays the root layout's (/signup serves both products).
// A visitor's price (the price test, lib/geo-pricing.ts): never cached, whatever else this page does.
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, signupNs)
  return localizedMetadata(locale, "/signup", {
    title: "ItGrows.ai",
    description: m.metaDescription,
    openGraph: { images: [OG_PERSONAL] },
    twitter: { images: [OG_PERSONAL.url] },
  })
}

// /signup is a client page, so its language comes from here: /de/signup, /fr/signup … (rewritten by
// middleware.ts) and the NEXT_LOCALE cookie reach the page's useT() through this provider.
// The language switcher sits in the top right corner, out of the centred card's way; it keeps the
// query (callbackUrl, from=ai-check) when it switches. PriceScope gives the page this visitor's price.
export default async function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider locale={await getLocale()}>
      {/* Sign-up sits outside the GEO pages' own wrapper: without this it came out in the browser's serif. */}
      <div style={{ fontFamily: GEO_SANS }}>
        <PriceScope>{children}</PriceScope>
        <LanguageSwitcher className="absolute right-4 top-4 z-20 sm:right-6 sm:top-5" />
      </div>
    </LocaleProvider>
  )
}
