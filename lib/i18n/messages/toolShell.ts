import { defineMessages } from "../messages"

// app/business/_tools/ToolShell.tsx (header and footer of the tools: the AI visibility check, the
// crawler check, the sample report) and the FAQ heading of app/business/_tools/Faq.tsx.

const en = {
  navVisibility: "AI visibility check",
  navCrawler: "AI crawler check",
  guides: "Guides",
  footerHome: "AI visibility for businesses",
  faqTitle: "Frequently Asked Questions",
}

export default defineMessages(en, {
  de: {
    navVisibility: "KI-Sichtbarkeitscheck",
    navCrawler: "KI-Crawler-Check",
    guides: "Leitfäden",
    footerHome: "KI-Sichtbarkeit für Unternehmen",
    faqTitle: "Häufige Fragen",
  },
  fr: {
    navVisibility: "Test de visibilité IA",
    navCrawler: "Test des robots d’IA",
    guides: "Guides",
    footerHome: "La visibilité IA pour les entreprises",
    faqTitle: "Questions fréquentes",
  },
  es: {
    navVisibility: "Comprobador de visibilidad",
    navCrawler: "Comprobador de rastreadores",
    guides: "Guías",
    footerHome: "Visibilidad en IA para empresas",
    faqTitle: "Preguntas frecuentes",
  },
  ru: {
    navVisibility: "Проверка видимости в ИИ",
    navCrawler: "Проверка ИИ-краулеров",
    guides: "Руководства",
    footerHome: "Видимость в ИИ для бизнеса",
    faqTitle: "Частые вопросы",
  },
})
