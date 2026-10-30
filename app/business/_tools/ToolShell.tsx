import Link from "next/link"
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher"
import LocaleProvider from "@/components/i18n/LocaleProvider"
import { getLocale } from "@/lib/i18n/server"
import { t } from "@/lib/i18n/messages"
import { localePath } from "@/lib/i18n/paths"
import { rich } from "@/lib/i18n/rich"
import growthGuarantee from "@/lib/i18n/messages/growthGuarantee"
import toolShellNs from "@/lib/i18n/messages/toolShell"

// Shared frame for the tools under /business: the same header and footer as the guides, so a
// visitor who lands on a tool can reach the guides and the product in one click.
// It is also the language provider of the pages it frames (the AI visibility check, the crawler
// check, the sample report): everything inside, client components included, reads the language
// that middleware.ts decided for this request (lib/i18n).
// `guaranteeFootnote`: a page that shows the growth guarantee's line (the sample report, through
// YourPlan) gets its footnote as the last line of the footer (growthGuarantee.ts footnote, 30 Oct 2026).
export default async function ToolShell({ children, guaranteeFootnote = false }: { children: React.ReactNode; guaranteeFootnote?: boolean }) {
  const locale = await getLocale()
  const m = t(locale, toolShellNs)
  const g = t(locale, growthGuarantee)
  return (
    <LocaleProvider locale={locale}>
      <div
        className="min-h-screen text-[#1b1916]"
        style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        <header className="border-b border-black/10 px-4 sm:px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <Link href={localePath(locale, "/")} className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" className="h-7 w-7 rounded-lg" alt="ItGrows" />
              <span>ItGrows.ai</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href={localePath(locale, "/business/ai-visibility-checker")} className="hover:text-[#1b1916] hidden sm:inline">{m.navVisibility}</Link>
              <Link href={localePath(locale, "/business/ai-crawler-checker")} className="hover:text-[#1b1916] hidden sm:inline">{m.navCrawler}</Link>
              <Link href="/business/blog" className="hover:text-[#1b1916]">{m.guides}</Link>
              <LanguageSwitcher />
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-black/10 px-6 py-8 text-center text-slate-500 text-sm bg-[#ebe9e5] mt-16">
          © 2026 ItGrows.ai · <Link href={localePath(locale, "/")} className="hover:text-[#1b1916]">{m.footerHome}</Link> ·{" "}
          <Link href="/business/blog" className="hover:text-[#1b1916]">{m.guides}</Link>
          {guaranteeFootnote && (
            <p className="mt-3 text-xs text-slate-600">
              {rich(g.footnote, {
                link: (c) => (
                  <Link href="/terms#growth-guarantee" className="underline hover:text-[#1b1916]">
                    {c}
                  </Link>
                ),
              })}
            </p>
          )}
        </footer>
      </div>
    </LocaleProvider>
  )
}
