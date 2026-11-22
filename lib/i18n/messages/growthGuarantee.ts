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
  footnote: "* Growth guarantee: counted on your day-0 questions, 4 assistants, 3 asks each — the average of the last two measurements before day 90 against day 0. If it is not higher, we keep working for free until it is. Conditions: <link>Terms</link>.",
}

export default defineMessages(en, {
  de: {
    label: "Wachstumsgarantie",
    line: "In 90 Tagen nennen KI-Assistenten Sie öfter als am Starttag – oder wir arbeiten kostenlos.*",
    footnote: "* Wachstumsgarantie: gezählt mit Ihren Fragen von Tag 0, 4 Assistenten, je 3 Durchläufe — der Durchschnitt der letzten zwei Messungen vor Tag 90 gegenüber Tag 0. Liegt er nicht höher, arbeiten wir kostenlos weiter, bis er es tut. Bedingungen: <link>Nutzungsbedingungen (auf Englisch)</link>.",
  },
  fr: {
    label: "Garantie de croissance",
    line: "Dans 90 jours, les assistants IA vous mentionneront plus souvent qu’au lancement — ou nous travaillons gratuitement.*",
    footnote: "* Garantie de croissance : comptée sur vos questions du jour 0, 4 assistants, 3 passages chacune — la moyenne des deux dernières mesures avant le jour 90 face au jour 0. Si elle n’est pas plus haute, nous continuons gratuitement jusqu’à ce qu’elle le soit. Détails : <link>conditions d’utilisation (en anglais)</link>.",
  },
  es: {
    label: "Garantía de crecimiento",
    line: "En 90 días, los asistentes de IA le mencionarán más veces que el día del lanzamiento — o trabajamos gratis.*",
    footnote: "* Garantía de crecimiento: contada con sus preguntas del día 0, 4 asistentes, 3 repeticiones cada una — la media de las dos últimas mediciones antes del día 90 frente al día 0. Si no es mayor, seguimos trabajando gratis hasta que lo sea. Condiciones: <link>Términos (en inglés)</link>.",
  },
  ru: {
    label: "Гарантия роста",
    line: "Через 90 дней ИИ-ассистенты будут называть вас чаще, чем в день запуска, — или мы работаем бесплатно.*",
    footnote: "* Гарантия роста: считаем по вопросам дня 0, 4 ассистента, по 3 захода — среднее двух последних замеров до 90-го дня против дня 0. Если оно не выше, работаем бесплатно, пока не станет выше. Условия: <link>Terms of Service (на английском)</link>.",
  },
})
