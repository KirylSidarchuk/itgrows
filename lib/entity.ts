// One description of ItGrows, used everywhere a page, a schema or a listing says what we are, so
// search engines and assistants read the same thing on every page.

export const ENTITY_ONE_LINER =
  "ItGrows makes companies visible in AI answers: answer pages on their own domain, fixes for AI crawlers and search indexes, and a weekly check of ChatGPT, Claude, Gemini and Perplexity. It also drafts LinkedIn and X posts for founders and experts."

export const ENTITY_ABOUT = [
  "ItGrows helps a company get named when its buyers ask an AI assistant. We put the questions those buyers ask to ChatGPT, Claude, Gemini and Perplexity, several times each, and record who is named and which sites are cited. Then we publish pages on the company's own domain that answer those questions, fix what stops AI crawlers and search indexes from reading the site, and measure again every week.",
  "Our second product drafts LinkedIn and X posts in a founder's or expert's own voice and publishes them after approval.",
  "No one can guarantee that an assistant will name a business. We promise the work and an honest weekly count.",
]

export const ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://www.itgrows.ai/#organization",
  name: "ItGrows",
  alternateName: "ItGrows.ai",
  url: "https://www.itgrows.ai",
  logo: "https://www.itgrows.ai/logo.jpg",
  email: "kiryl@itgrows.ai",
  description: ENTITY_ONE_LINER,
  knowsAbout: [
    "Generative engine optimization",
    "AI visibility",
    "Answer engine optimization",
    "ChatGPT search",
    "Perplexity",
    "Claude",
    "Google Gemini",
    "AI crawlers",
    "LinkedIn ghostwriting",
  ],
}
