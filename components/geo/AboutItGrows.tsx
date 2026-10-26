import Link from "next/link"
import { SAMPLE_PATH } from "@/lib/geo-pricing"
import type { Locale } from "@/lib/i18n/config"
import { defineMessages, t } from "@/lib/i18n/messages"
import homeMessages from "@/lib/i18n/messages/home"
import { localePath } from "@/lib/i18n/paths"

// "About ItGrows", above the footer of every guide, every /blog post and both checks: what ItGrows is,
// in one paragraph, on the pages an assistant actually lands on (before this only the home page said
// it). AI visibility only, as everywhere machines read who we are (Kiryl, 26 Oct 2026): the
// LinkedIn/X product has its own page, /personal.
// The paragraph is the home page's Organization description (orgDescription in
// lib/i18n/messages/home.ts: ENTITY_ONE_LINER of lib/entity.ts in English, its translations in the
// other languages; /about's lead is the same text), so the box, the home page and /about say one thing.
const ns = defineMessages(
  {
    title: "About ItGrows",
    about: "More about ItGrows",
    sample: "See a real report",
    check: "Check your AI visibility",
    crawlers: "Check AI crawler access",
  },
  {
    de: {
      title: "Über ItGrows",
      about: "Mehr über ItGrows",
      sample: "Einen echten Bericht ansehen",
      check: "KI-Sichtbarkeit prüfen",
      crawlers: "Zugang für KI-Crawler prüfen",
    },
    fr: {
      title: "À propos d’ItGrows",
      about: "En savoir plus sur ItGrows",
      sample: "Voir un vrai rapport",
      check: "Vérifier votre visibilité dans l’IA",
      crawlers: "Vérifier l’accès des robots d’IA",
    },
    es: {
      title: "Acerca de ItGrows",
      about: "Más sobre ItGrows",
      sample: "Ver un informe real",
      check: "Comprobar su visibilidad en IA",
      crawlers: "Comprobar el acceso de los rastreadores de IA",
    },
    ru: {
      title: "О компании ItGrows",
      about: "Подробнее об ItGrows",
      sample: "Посмотреть настоящий отчёт",
      check: "Проверить видимость в ИИ",
      crawlers: "Проверить доступ ИИ-краулеров",
    },
  },
)

const VISIBILITY = "/business/ai-visibility-checker"
const CRAWLERS = "/business/ai-crawler-checker"

/** `current`: the check this box sits on, so it does not link to its own page. */
export default function AboutItGrows({
  locale,
  current,
  className = "",
}: {
  locale: Locale
  current?: typeof VISIBILITY | typeof CRAWLERS
  className?: string
}) {
  const m = t(locale, ns)
  const line = t(locale, homeMessages).orgDescription
  const links = [
    { href: "/about", label: m.about },
    { href: SAMPLE_PATH, label: m.sample },
    { href: VISIBILITY, label: m.check },
    { href: CRAWLERS, label: m.crawlers },
  ].filter((l) => l.href !== current)
  return (
    <aside lang={locale} aria-labelledby="about-itgrows" className={`rounded-2xl bg-white border border-black/10 p-6 ${className}`}>
      <h2 id="about-itgrows" className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">
        {m.title}
      </h2>
      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{line}</p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={localePath(locale, l.href)} className="text-violet-700 hover:underline">
              {l.label} →
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
