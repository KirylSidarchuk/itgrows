// One description of ItGrows, used everywhere a page, a schema or a listing says what we are, so
// search engines and assistants read the same thing on every page.
//
// Owner's decision, 26 Oct 2026: wherever machines read who we are (this Organization, knowsAbout,
// /about, llms.txt, directory texts) ItGrows is described as AI visibility (GEO) only. The LinkedIn/X
// product is a separate product with its own pages (/personal) and its own line in the navigation
// and the footer; it is not part of this description. Assistants were answering "a LinkedIn tool".

// Since 30 Oct 2026 (owner's decision) ENTITY_ABOUT[1] states the growth guarantee's line and the link
// to its conditions (/terms#growth-guarantee), without the qualifier ('until they do' is only in the
// footnote, llms.txt and the Terms): it renders only on /about, as plain text. No other guarantee,
// number or client result belongs here.

export const ENTITY_ONE_LINER =
  "ItGrows is an AI visibility (generative engine optimization, GEO) service that gets businesses named when their customers ask ChatGPT, Claude, Gemini and Perplexity: it publishes answer pages on the company's own website, makes the site readable for AI crawlers and search indexes, and re-asks the customers' questions to all four assistants every two weeks."

export const ENTITY_ABOUT = [
  "ItGrows gets a company named when its customers ask an AI assistant. We put the questions those customers ask to ChatGPT, Claude, Gemini and Perplexity, several times each, and see who is named in its place and which sites are cited. Then we do the work: we open the site to AI crawlers and search indexes, publish pages on the company's own domain that answer those questions, and prepare its profiles on the sites the assistants quote. Every two weeks we ask again and push wherever the company is still missing.",
  "Every paid plan carries a growth guarantee: in 90 days, AI assistants will name you more often than on launch day, or we work for free (conditions: itgrows.ai/terms#growth-guarantee).",
]

// Share images. The GEO one is drawn by app/og/geo; og-image.png shows the LinkedIn/X product.
export const OG_GEO = { url: "https://www.itgrows.ai/og/geo", width: 1200, height: 630 }
export const OG_PERSONAL = { url: "https://www.itgrows.ai/og-image.png", width: 1200, height: 630 }

// No sameAs yet: on 26 Oct 2026 ItGrows had no profile of its own (OMR Reviews, LinkedIn
// /company/itgrows-ai: 404; Clutch, Product Hunt, SaaSHub: 404 in a browser; Wikidata: no item; G2:
// none found), and linkedin.com/company/itgrows is another company. Add each profile here once it
// exists and opens.
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
    "AI search optimization",
    "ChatGPT search",
    "Perplexity",
    "Claude",
    "Google Gemini",
    "AI crawlers",
  ],
}
