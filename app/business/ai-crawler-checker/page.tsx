import type { Metadata } from "next"
import Link from "next/link"
import ToolShell from "../_tools/ToolShell"
import Faq, { faqSchema, type QA } from "../_tools/Faq"
import CrawlerChecker from "./CrawlerChecker"

const URL = "https://www.itgrows.ai/business/ai-crawler-checker"

export const metadata: Metadata = {
  title: "AI crawler checker: is your site blocking GPTBot? | ItGrows",
  description:
    "Free check of your robots.txt and server for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot and Bingbot, including rules that quietly close pages in your sitemap.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Is your site blocking AI crawlers? Free check",
    description: "We test the pages in your sitemap against your robots.txt for each AI crawler, and ask your server as each one.",
    url: URL,
    type: "website",
  },
}

const FAQ: QA[] = [
  {
    q: "How does the check decide whether a page is blocked?",
    a: "It reads your robots.txt the way crawlers do: the group for each crawler (or the * group), the longest matching rule wins, allow wins a tie, * and $ work as wildcards. Then it tests the pages listed in your sitemap against those rules, one crawler at a time.",
  },
  {
    q: "Why would robots.txt block pages I never meant to block?",
    a: "Rules are prefixes. A rule written for one page, such as Disallow: /b, also matches /blog and /business. We made exactly this mistake on itgrows.ai and it closed our guides to every crawler for ten weeks before we noticed.",
  },
  {
    q: "My robots.txt allows everything. Can crawlers still be blocked?",
    a: "Yes. A firewall, CDN or bot-protection setting can refuse a crawler even when robots.txt invites it. The check also asks your server as GPTBot, ClaudeBot and PerplexityBot and shows what it answered.",
  },
  {
    q: "Which crawlers matter for being named in AI answers?",
    a: "The ones that feed search and live answers: OAI-SearchBot and ChatGPT-User for ChatGPT, Bingbot because ChatGPT search and Copilot draw on Bing, Googlebot for Gemini and AI Overviews, PerplexityBot, and Anthropic's crawlers for Claude. GPTBot is OpenAI's training crawler.",
  },
]

export default function AiCrawlerCheckerPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "ItGrows AI crawler checker",
        url: URL,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        description:
          "Free check of robots.txt and server responses for AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot) and search crawlers (Googlebot, Bingbot), testing the site's own sitemap pages against its rules.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        provider: { "@id": "https://www.itgrows.ai/#organization" },
      },
      faqSchema(FAQ),
    ],
  }
  return (
    <ToolShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700">Free AI crawler check</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-3">Is your site blocking AI crawlers?</h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
            Enter your site. We read your robots.txt the way crawlers do, test the pages in your sitemap against it for
            GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot and Bingbot, and ask your server as each AI crawler.
          </p>
        </div>
        <div className="mt-8">
          <CrawlerChecker />
        </div>

        <article className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight">Why we built this</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            On itgrows.ai a robots.txt rule meant to hide one redirect page, <code>/b</code>, was written as a prefix. From
            11 August to 21 October 2026 it also closed <code>/blog</code>, <code>/business</code> and every one of our
            guides to all crawlers. The pages loaded fine in a browser, the rule looked harmless, and Bing listed our
            business page as &ldquo;discovered but not crawled&rdquo; the whole time. Reading the rules did not reveal it;
            testing real URLs against them does.
          </p>

          <h2 className="text-2xl font-extrabold tracking-tight mt-12">What to do with the result</h2>
          <ul className="mt-4 space-y-2 text-slate-700 leading-relaxed list-disc pl-5">
            <li>
              Rules closing pages you want read: rewrite them so they match only what you meant, for example with a
              trailing <code>$</code>. See <Link className="text-violet-700 underline" href="/business/blog/is-your-website-blocking-ai-crawlers">is your website blocking AI crawlers</Link>.
            </li>
            <li>
              A crawler refused by your server: it is your firewall or CDN, not robots.txt. See <Link className="text-violet-700 underline" href="/business/blog/gptbot-blocked-by-cloudflare">GPTBot blocked by Cloudflare</Link>.
            </li>
            <li>
              Everything open: the next question is whether the assistants name you. Run the{" "}
              <Link className="text-violet-700 underline" href="/business/ai-visibility-checker">free AI visibility check</Link>.
            </li>
          </ul>

          <Faq items={FAQ} />
        </article>
      </main>
    </ToolShell>
  )
}
