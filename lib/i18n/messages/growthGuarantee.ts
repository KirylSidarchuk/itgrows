import { defineMessages } from "../messages"

// Owner's decisions 30 Oct 2026: the one guarantee the site makes. Wherever `line` is shown it keeps
// its "*" and nothing is put under or next to it. The condition is `footnote`, shown once, at the very
// bottom of the page: the last line of app/_home/SiteFooter.tsx (and of the sample report's frame,
// app/business/_tools/ToolShell.tsx); <link> goes to /terms#growth-guarantee. No other guarantee, number
// or timeframe around it. The qualifier ('until they do') lives only in `footnote`, llms.txt and the
// Terms (the /about paragraph gives the line and the link to the conditions).
// Used by app/page.tsx (the hero and #apply), app/business/PricingPlans.tsx (the plan card) and the two
// footers. The cabinet (plan page, visibility/parts.tsx YourPlan) carries the same line in English, with
// GuaranteeFootnote (visibility/parts.tsx) as the last line of the page. The Terms are English only, so
// the link label in the other languages says so.

const en = {
  label: "Growth guarantee",
  line: "In 90 days, AI assistants will name you more often than on launch day — or we work for free.*",
  footnote: "* Growth guarantee: we keep working for free until they do. Conditions: <link>Terms</link>.",
}

export default defineMessages(en, {
  de: {
    label: "Wachstumsgarantie",
    line: "In 90 Tagen nennen KI-Assistenten Sie öfter als am Starttag – oder wir arbeiten kostenlos.*",
    footnote: "* Wachstumsgarantie: Wir arbeiten kostenlos weiter, bis KI-Assistenten Sie öfter nennen. Bedingungen: <link>Nutzungsbedingungen (auf Englisch)</link>.",
  },
  fr: {
    label: "Garantie de croissance",
    line: "Dans 90 jours, les assistants IA vous mentionneront plus souvent qu’au lancement — ou nous travaillons gratuitement.*",
    footnote: "* Garantie de croissance : nous continuons gratuitement jusqu’à ce que les assistants IA vous mentionnent plus souvent. Détails : <link>conditions d’utilisation (en anglais)</link>.",
  },
  es: {
    label: "Garantía de crecimiento",
    line: "En 90 días, los asistentes de IA le mencionarán más veces que el día del lanzamiento — o trabajamos gratis.*",
    footnote: "* Garantía de crecimiento: seguimos trabajando gratis hasta que los asistentes de IA le mencionen más veces. Condiciones: <link>Términos (en inglés)</link>.",
  },
  ru: {
    label: "Гарантия роста",
    line: "Через 90 дней ИИ-ассистенты будут называть вас чаще, чем в день запуска, — или мы работаем бесплатно.*",
    footnote: "* Гарантия роста: мы продолжаем работать бесплатно, пока ИИ-ассистенты не начнут называть вас чаще. Условия: <link>Terms of Service (на английском)</link>.",
  },
})
