import { mainGuides } from "@/components/geo/guide-data"
import { noteCrawler } from "@/lib/crawler-log"
import { llmsText } from "@/lib/llms-text"
import { MD_NEGOTIATED_HEADER } from "@/lib/md-negotiation"
import { CONTENT_SIGNAL } from "@/lib/site-robots"

// The home page in markdown (Kiryl, 13 Nov 2026), for the agents that ask "/" for it with
// "Accept: text/markdown" (middleware.ts rewrites them here; Cloudflare's isitagentready checks this on the
// home page only). It is the text of llms.txt (lib/llms-text.ts): what ItGrows is, the free check, the plan's
// one price in the articles' price sentences, the growth guarantee with its conditions, the tools, the
// LinkedIn/X product, contact. In place of every article: the main guides the home page shows (English) and
// llms.txt, which lists them all with their markdown copies. English only: /de, /fr, /es and /ru stay pages.
// Not an address of its own: without the marker middleware.ts sets, it is not found.

// Per request: a crawler's visit is recorded, and the answer depends on Accept.
export const dynamic = "force-dynamic"

const BASE = "https://www.itgrows.ai"

export async function GET(req: Request) {
  if (req.headers.get(MD_NEGOTIATED_HEADER) !== "1") {
    return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }
  void noteCrawler("/", { via: "accept" })

  const main = await mainGuides("en")
  const guides = [
    ...main.map((g) => `- [${g.title}](${BASE}/business/blog/${g.slug}) (markdown: ${BASE}/business/blog/${g.slug}.md)`),
    `- All guides: ${BASE}/business/blog; each with its markdown copy in ${BASE}/llms.txt`,
  ].join("\n")
  const posts = `- All articles: ${BASE}/blog; each with its markdown copy in ${BASE}/llms.txt`

  return new Response(llmsText({ guides, posts }), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // "/" answers by Accept: no shared cache may keep this answer.
      "Cache-Control": "private, no-store",
      Vary: "Accept",
      "Content-Language": "en",
      // The same signals as robots.txt (lib/site-robots.ts), as Cloudflare's markdown answers carry them.
      "Content-Signal": CONTENT_SIGNAL,
      // The page this is the markdown of, and the machine-readable versions the page names (middleware.ts).
      Link: `<${BASE}/>; rel="canonical", <${BASE}/sitemap.xml>; rel="sitemap", <${BASE}/llms.txt>; rel="describedby"; type="text/markdown"`,
    },
  })
}
