import { defineMessages } from "../messages"

// app/_home/SiteFooter.tsx: the footer of the public pages. Column titles and link labels by key;
// the addresses stay in the component. Since 30 Oct 2026 the last line is the growth guarantee's
// footnote (growthGuarantee.ts footnote, linked to /terms#growth-guarantee), in place of the old disclaimer.

const en = {
  tagline: "We get businesses named by ChatGPT, Claude, Gemini and Perplexity, and recount every two weeks.",
  titles: {
    geo: "AI visibility",
    tools: "Tools",
    linkedin: "LinkedIn & X",
    company: "Company",
  },
  links: {
    check: "Check your site free",
    pricing: "Pricing",
    sample: "A real report",
    guides: "Guides",
    visibilityChecker: "AI visibility checker",
    crawlerChecker: "AI crawler checker",
    posts: "Posts for founders",
    companyPages: "Company Pages",
    reddit: "Reddit planner (beta)",
    blog: "Blog",
    about: "About",
    privacy: "Privacy",
    terms: "Terms",
  },
}

export default defineMessages(en, {
  de: {
    tagline: "Wir sorgen dafür, dass ChatGPT, Claude, Gemini und Perplexity Unternehmen nennen, und zählen alle zwei Wochen nach.",
    titles: {
      geo: "KI-Sichtbarkeit",
      tools: "Tools",
      linkedin: "LinkedIn & X",
      company: "Unternehmen",
    },
    links: {
      check: "Website kostenlos prüfen",
      pricing: "Preise",
      sample: "Ein echter Bericht",
      guides: "Leitfäden",
      visibilityChecker: "KI-Sichtbarkeitscheck",
      crawlerChecker: "KI-Crawler-Check",
      posts: "Posts für Gründer",
      companyPages: "Unternehmensseiten",
      reddit: "Reddit-Planer (Beta)",
      blog: "Blog",
      about: "Über uns",
      privacy: "Datenschutz",
      terms: "Nutzungsbedingungen",
    },
  },
  fr: {
    tagline: "Nous faisons mentionner les entreprises par ChatGPT, Claude, Gemini et Perplexity, et refaisons le décompte toutes les deux semaines.",
    titles: {
      geo: "Visibilité IA",
      tools: "Outils",
      linkedin: "LinkedIn et X",
      company: "Entreprise",
    },
    links: {
      check: "Vérifier votre site gratuitement",
      pricing: "Tarifs",
      sample: "Un vrai rapport",
      guides: "Guides",
      visibilityChecker: "Test de visibilité IA",
      crawlerChecker: "Test des robots d’IA",
      posts: "Posts pour fondateurs",
      companyPages: "Pages entreprise",
      reddit: "Planificateur Reddit (bêta)",
      blog: "Blog",
      about: "À propos",
      privacy: "Confidentialité",
      terms: "Conditions",
    },
  },
  es: {
    tagline: "Conseguimos que ChatGPT, Claude, Gemini y Perplexity mencionen a las empresas, y volvemos a contar cada dos semanas.",
    titles: {
      geo: "Visibilidad en IA",
      tools: "Herramientas",
      linkedin: "LinkedIn y X",
      company: "Empresa",
    },
    links: {
      check: "Comprobar su sitio gratis",
      pricing: "Precios",
      sample: "Un informe real",
      guides: "Guías",
      visibilityChecker: "Comprobador de visibilidad en IA",
      crawlerChecker: "Comprobador de rastreadores de IA",
      posts: "Publicaciones para fundadores",
      companyPages: "Páginas de empresa",
      reddit: "Planificador de Reddit (beta)",
      blog: "Blog",
      about: "Quiénes somos",
      privacy: "Privacidad",
      terms: "Términos",
    },
  },
  ru: {
    tagline: "Мы добиваемся, чтобы бизнес называли ChatGPT, Claude, Gemini и Perplexity, и пересчитываем раз в две недели.",
    titles: {
      geo: "Видимость в ИИ",
      tools: "Инструменты",
      linkedin: "LinkedIn и X",
      company: "Компания",
    },
    links: {
      check: "Проверить сайт бесплатно",
      pricing: "Цены",
      sample: "Настоящий отчёт",
      guides: "Руководства",
      visibilityChecker: "Проверка видимости в ИИ",
      crawlerChecker: "Проверка ИИ-краулеров",
      posts: "Посты для основателей",
      companyPages: "Страницы компаний",
      reddit: "Планировщик Reddit (бета)",
      blog: "Блог",
      about: "О нас",
      privacy: "Конфиденциальность",
      terms: "Условия",
    },
  },
})
