import { defineMessages } from "../messages"

// app/business/sample-report/page.tsx: the page's metadata (server side only). The sample's domain
// comes in as an argument (SAMPLE_DOMAIN in lib/geo-pricing.ts). The page's own text is in
// sampleReport.ts; the report's body is drawn by the cabinet's components (app/business/dashboard).

const en = {
  metaTitle: (domain: string) => `A real AI visibility report: ${domain} | ItGrows`,
  metaDescription: (domain: string) =>
    `The full detailed report for ${domain}: 20 buyer questions put to ChatGPT, Claude, Gemini and Perplexity, 3 times each.`,
}

export default defineMessages(en, {
  de: {
    metaTitle: (domain) => `Ein echter KI-Sichtbarkeitsbericht: ${domain} | ItGrows`,
    metaDescription: (domain) =>
      `Der vollständige ausführliche Bericht für ${domain}: 20 Kundenfragen an ChatGPT, Claude, Gemini und Perplexity, jede dreimal gestellt.`,
  },
  fr: {
    metaTitle: (domain) => `Un vrai rapport de visibilité IA : ${domain} | ItGrows`,
    metaDescription: (domain) =>
      `Le rapport détaillé complet de ${domain} : 20 questions de clients posées à ChatGPT, Claude, Gemini et Perplexity, 3 fois chacune.`,
  },
  es: {
    metaTitle: (domain) => `Un informe real de visibilidad en IA: ${domain} | ItGrows`,
    metaDescription: (domain) =>
      `El informe detallado completo de ${domain}: 20 preguntas de clientes planteadas a ChatGPT, Claude, Gemini y Perplexity, 3 veces cada una.`,
  },
  ru: {
    metaTitle: (domain) => `Настоящий отчёт о видимости в ИИ: ${domain} | ItGrows`,
    metaDescription: (domain) =>
      `Полный подробный отчёт по ${domain}: 20 вопросов клиентов к ChatGPT, Claude, Gemini и Perplexity, по 3 раза каждый.`,
  },
})
