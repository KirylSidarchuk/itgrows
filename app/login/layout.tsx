import type { Metadata } from "next"
import type { ReactNode } from "react"
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher"
import LocaleProvider from "@/components/i18n/LocaleProvider"
import { OG_PERSONAL } from "@/lib/entity"
import { t } from "@/lib/i18n/messages"
import { localizedMetadata } from "@/lib/i18n/metadata"
import { getLocale } from "@/lib/i18n/server"
import loginNs from "@/lib/i18n/messages/login"

// The page's language for metadata: the title stays the brand, the description is the root
// layout's, translated; the share image stays the root layout's (/login serves both products).
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = t(locale, loginNs)
  return localizedMetadata(locale, "/login", {
    title: "ItGrows.ai",
    description: m.metaDescription,
    openGraph: { images: [OG_PERSONAL] },
    twitter: { images: [OG_PERSONAL.url] },
  })
}

// /login is a client page, so its language comes from here: /de/login, /fr/login … (rewritten by
// middleware.ts) and the NEXT_LOCALE cookie reach the page's useT() through this provider.
// The language switcher sits in the top right corner, out of the centred card's way; it keeps the
// query (callbackUrl, from=ai-check) when it switches.
export default async function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider locale={await getLocale()}>
      {children}
      <LanguageSwitcher className="absolute right-4 top-4 z-20 sm:right-6 sm:top-5" />
    </LocaleProvider>
  )
}
