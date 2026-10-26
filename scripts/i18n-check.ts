// Checks the language layer without starting Next:   npx tsx scripts/i18n-check.ts
//
// 1. middleware.ts as Next runs it: prefix rewrite + header + cookie, first-visit detection (and
//    its exceptions: ad clicks, the sign-in pages), /en addresses, bots and requests without
//    Accept-Language, and the cabinets still behind the login.
// 2. The matcher covers exactly the public GEO pages in every language, and the cabinets.
// 3. localePath, metadata, sitemap and robots helpers, rich(), the provider, the switcher and
//    LocaleLink rendered to HTML.
// 4. Every namespace in lib/i18n/messages/: same keys, same array lengths, same <tags> in every
//    language as in English, no empty strings. Long strings identical to English are listed as
//    warnings (often untranslated, sometimes a brand name).
// Exit code 1 on any failure.
// 5. At compile time (npx tsc --noEmit -p . checks this file): a language that misses a key of
//    English, adds one, or changes a value's type does not compile (typeProof below).

import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { createElement, type ComponentProps, type ReactNode } from "react"
import { defineMessages } from "../lib/i18n/messages"

// Each @ts-expect-error below must stay an error: if defineMessages ever stopped requiring every
// key of English in every language, tsc would fail here with "Unused @ts-expect-error directive".
function typeProof() {
  const en = { title: "Title", steps: ["One", "Two"], count: (n: number) => `${n} questions` }
  return defineMessages(en, {
    // @ts-expect-error -- "count" is missing in de
    de: { title: "Titel", steps: ["Eins", "Zwei"] },
    // @ts-expect-error -- "extra" is not a key of English
    fr: { title: "Titre", steps: ["Un", "Deux"], count: (n: number) => `${n} questions`, extra: "x" },
    // @ts-expect-error -- a number where English has a string
    es: { title: 1, steps: ["Uno", "Dos"], count: (n: number) => `${n} preguntas` },
    ru: { title: "Заголовок", steps: ["Один", "Два"], count: (n) => `${n} вопросов` },
  })
}

const ROOT = process.cwd()
// The middleware imports @/auth, which needs a secret and builds (but never opens) a DB client.
process.env.AUTH_SECRET ||= "i18n-check-secret-not-used-anywhere-else"
process.env.AUTH_TRUST_HOST ||= "true"
process.env.DATABASE_URL ||= "postgres://check:check@127.0.0.1:1/check"

const failures: string[] = []
const warnings: string[] = []
let passed = 0

async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    passed++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failures.push(name)
    console.log(`  FAIL ${name}\n       ${(e as Error).message.split("\n").join("\n       ")}`)
  }
}

const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
const SITE = "https://www.itgrows.ai"

async function main() {
  // Next's server sets up this global before any of its modules load, and they read it once, at
  // load time; Next's own matcher compiler (used below, as the build uses it) needs a real one.
  const { AsyncLocalStorage } = await import("node:async_hooks")
  ;(globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage ??= AsyncLocalStorage
  const { NextRequest } = await import("next/server")
  const { encode } = await import("next-auth/jwt")
  const { renderToStaticMarkup } = await import("react-dom/server")
  const mw = await import("../middleware")
  const cfg = await import("../lib/i18n/config")
  const { localePath, hreflangAlternates } = await import("../lib/i18n/paths")
  const { localizedMetadata, localizedSitemapEntries } = await import("../lib/i18n/metadata")
  const { rich } = await import("../lib/i18n/rich")
  const { plural, formatNumber } = await import("../lib/i18n/format")

  type Opts = { lang?: string | null; ua?: string; cookie?: string; method?: string; headers?: Record<string, string> }
  const call = async (pathAndQuery: string, o: Opts = {}) => {
    const headers: Record<string, string> = { "user-agent": o.ua ?? BROWSER, ...o.headers }
    if (o.lang !== null) headers["accept-language"] = o.lang ?? "en-US,en;q=0.9"
    if (o.cookie) headers.cookie = o.cookie
    const req = new NextRequest(`${SITE}${pathAndQuery}`, { method: o.method ?? "GET", headers })
    const res = (await mw.default(req, { waitUntil() {} } as never)) as Response
    const rel = (u: string | null) => (u ? new URL(u, SITE).pathname + new URL(u, SITE).search : null)
    const setCookie = res.headers.get("set-cookie") ?? ""
    return {
      status: res.status,
      location: rel(res.headers.get("location")),
      rewrite: rel(res.headers.get("x-middleware-rewrite")),
      next: res.headers.get("x-middleware-next") === "1",
      locale: res.headers.get("x-middleware-request-x-itg-locale"),
      cookie: /NEXT_LOCALE=([^;]*)/.exec(setCookie)?.[1] ?? null,
      contentLanguage: res.headers.get("content-language"),
    }
  }

  console.log("middleware: prefixed addresses")
  await check("/de/business/ai-visibility-checker -> rewrite, x-itg-locale de, cookie de", async () => {
    const r = await call("/de/business/ai-visibility-checker", { lang: "de-DE,de;q=0.9" })
    assert.equal(r.rewrite, "/business/ai-visibility-checker")
    assert.equal(r.locale, "de")
    assert.equal(r.cookie, "de")
    assert.equal(r.contentLanguage, "de")
    assert.equal(r.location, null)
  })
  await check("/ru -> rewrite to /, locale ru", async () => {
    const r = await call("/ru", { lang: "ru" })
    assert.equal(r.rewrite, "/")
    assert.equal(r.locale, "ru")
    assert.equal(r.cookie, "ru")
  })
  await check("/fr/about?x=1 keeps the query", async () => {
    const r = await call("/fr/about?x=1")
    assert.equal(r.rewrite, "/about?x=1")
    assert.equal(r.locale, "fr")
  })
  await check("/es/signup?from=ai-check&site=a.com -> /signup, locale es", async () => {
    const r = await call("/es/signup?from=ai-check&site=a.com")
    assert.equal(r.rewrite, "/signup?from=ai-check&site=a.com")
    assert.equal(r.locale, "es")
  })
  await check("prefix overrides the cookie (cookie en, /de/about -> de, cookie rewritten)", async () => {
    const r = await call("/de/about", { cookie: "NEXT_LOCALE=en" })
    assert.equal(r.locale, "de")
    assert.equal(r.cookie, "de")
  })
  await check("same cookie already set -> no Set-Cookie", async () => {
    const r = await call("/de/about", { cookie: "NEXT_LOCALE=de" })
    assert.equal(r.locale, "de")
    assert.equal(r.cookie, null)
  })
  await check("a client-sent x-itg-locale is overwritten", async () => {
    const r = await call("/de/about", { headers: { "x-itg-locale": "ru" } })
    assert.equal(r.locale, "de")
  })
  await check("bot on /de/about -> German page, no cookie", async () => {
    const r = await call("/de/about", { ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", lang: null })
    assert.equal(r.rewrite, "/about")
    assert.equal(r.locale, "de")
    assert.equal(r.cookie, null)
  })
  await check("prefetch of /de/about -> German page, no cookie", async () => {
    const r = await call("/de/about", { headers: { "next-router-prefetch": "1" } })
    assert.equal(r.locale, "de")
    assert.equal(r.cookie, null)
  })
  await check("POST /de/login (a server action on a German page) -> rewritten, not redirected", async () => {
    const r = await call("/de/login", { method: "POST", lang: "de" })
    assert.equal(r.rewrite, "/login")
    assert.equal(r.locale, "de")
    assert.equal(r.location, null)
  })
  await check("/de/business -> 308 /de; /de/business?gclid=1 keeps the query", async () => {
    const r = await call("/de/business?gclid=1")
    assert.equal(r.status, 308)
    assert.equal(r.location, "/de?gclid=1")
  })
  await check("/de/personal (English-only product) -> 307 /personal", async () => {
    const r = await call("/de/personal")
    assert.equal(r.status, 307)
    assert.equal(r.location, "/personal")
  })
  await check("/fr/business/blog/x -> 307 /business/blog/x", async () => {
    const r = await call("/fr/business/blog/x")
    assert.equal(r.location, "/business/blog/x")
  })

  console.log("middleware: unprefixed addresses and first-visit detection")
  await check("German Accept-Language, no cookie, GET / -> 307 /de, no cookie on the redirect", async () => {
    const r = await call("/", { lang: "de-DE,de;q=0.9,en;q=0.8" })
    assert.equal(r.status, 307)
    assert.equal(r.location, "/de")
    assert.equal(r.cookie, null)
  })
  await check("French (Canada) on a tool keeps the query -> /fr/business/ai-crawler-checker?site=a.com", async () => {
    const r = await call("/business/ai-crawler-checker?site=a.com", { lang: "fr-CA,fr;q=0.9" })
    assert.equal(r.location, "/fr/business/ai-crawler-checker?site=a.com")
  })
  await check("q-order: 'pl, es;q=0.8, en;q=0.6' -> /es", async () => {
    const r = await call("/about", { lang: "pl, es;q=0.8, en;q=0.6" })
    assert.equal(r.location, "/es/about")
  })
  await check("English first ('en-US, de;q=0.9') -> no redirect, en", async () => {
    const r = await call("/", { lang: "en-US, de;q=0.9" })
    assert.equal(r.status, 200)
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
  })
  await check("unsupported only ('ja, zh;q=0.8') -> no redirect, en", async () => {
    const r = await call("/", { lang: "ja, zh;q=0.8" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
  })
  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    "curl/8.5.0",
    "",
  ]) {
    await check(`bot with German Accept-Language gets English, no redirect: ${ua.slice(0, 60) || "(empty UA)"}`, async () => {
      const r = await call("/", { ua, lang: "de-DE,de;q=0.9" })
      assert.equal(r.status, 200)
      assert.equal(r.location, null)
      assert.equal(r.locale, "en")
    })
  }
  await check("bot with a NEXT_LOCALE=de cookie still gets English on /", async () => {
    const r = await call("/", { ua: "Googlebot/2.1", cookie: "NEXT_LOCALE=de", lang: "de" })
    assert.equal(r.locale, "en")
  })
  await check("browser without Accept-Language -> English, no redirect", async () => {
    const r = await call("/", { lang: null })
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
  })
  await check("cookie de on / -> German at the unprefixed address, no redirect", async () => {
    const r = await call("/", { cookie: "NEXT_LOCALE=de", lang: "de" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "de")
    assert.equal(r.contentLanguage, "de")
  })
  await check("cookie en + German Accept-Language -> English, no redirect (the visitor chose EN)", async () => {
    const r = await call("/about", { cookie: "NEXT_LOCALE=en", lang: "de" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
  })
  await check("invalid cookie value is ignored (detection runs)", async () => {
    const r = await call("/", { cookie: "NEXT_LOCALE=xx", lang: "de" })
    assert.equal(r.location, "/de")
  })
  await check("HEAD / with German -> redirected like GET", async () => {
    const r = await call("/", { method: "HEAD", lang: "de" })
    assert.equal(r.location, "/de")
  })
  await check("the first-visit redirect is never cached by a CDN", async () => {
    const req = new NextRequest(`${SITE}/about`, { headers: { "user-agent": BROWSER, "accept-language": "es-ES,es;q=0.9" } })
    const res = (await mw.default(req, { waitUntil() {} } as never)) as Response
    assert.equal(res.status, 307)
    assert.match(res.headers.get("cache-control") ?? "", /no-store/)
    assert.match(res.headers.get("vary") ?? "", /Accept-Language/)
  })
  await check("pages outside the GEO site are untouched (no locale header)", async () => {
    // The matcher keeps them out of the middleware anyway; this is the second line of defence.
    const { localeMiddleware } = await import("../lib/i18n/middleware")
    const req = new NextRequest(`${SITE}/personal`, { headers: { "user-agent": BROWSER, "accept-language": "de" } })
    const res = localeMiddleware(req)
    assert.equal(res.headers.get("x-middleware-request-x-itg-locale"), null)
    assert.equal(res.headers.get("location"), null)
  })
  await check("POST / (a form or server action) is never redirected", async () => {
    const r = await call("/", { method: "POST", lang: "de" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
  })
  await check("router prefetch of / is never redirected", async () => {
    const r = await call("/", { lang: "de", headers: { "next-router-prefetch": "1" } })
    assert.equal(r.location, null)
  })

  console.log("middleware: ad clicks and the sign-in pages skip first-visit detection")
  for (const q of ["gclid=X", "gbraid=X", "wbraid=X", "gad_source=1", "fbclid=Y", "msclkid=Z", "utm_medium=cpc", "utm_medium=paid&utm_source=meta", "utm_medium=paid_social&utm_source=facebook"]) {
    await check(`ad click (${q}) with Spanish Accept-Language -> English, no redirect, no cookie`, async () => {
      const r = await call(`/business/ai-crawler-checker?${q}`, { lang: "es-US,es;q=0.9,en;q=0.8" })
      assert.equal(r.status, 200)
      assert.equal(r.location, null)
      assert.equal(r.locale, "en")
      assert.equal(r.cookie, null)
    })
  }
  await check("Meta click on / (?fbclid) with German -> English, no redirect, no cookie", async () => {
    const r = await call("/?fbclid=Y", { lang: "de-DE,de;q=0.9" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
    assert.equal(r.cookie, null)
  })
  await check("ad click with NEXT_LOCALE=de -> German (the visitor's own choice still counts)", async () => {
    const r = await call("/about?gclid=X", { cookie: "NEXT_LOCALE=de", lang: "de" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "de")
  })
  await check("utm_medium=email is not an ad click -> redirected as usual", async () => {
    const r = await call("/about?utm_medium=email", { lang: "de" })
    assert.equal(r.location, "/de/about?utm_medium=email")
  })
  await check("/login?callbackUrl=%2Fcabinet with Russian -> English, no redirect, no cookie", async () => {
    const r = await call("/login?callbackUrl=%2Fcabinet", { lang: "ru-RU,ru;q=0.9,en-US;q=0.8" })
    assert.equal(r.status, 200)
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
    assert.equal(r.cookie, null)
  })
  await check("/signup?from=ai-check with German -> English, no redirect", async () => {
    const r = await call("/signup?from=ai-check", { lang: "de-DE,de;q=0.9" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "en")
  })
  await check("/signup with NEXT_LOCALE=fr -> French at the unprefixed address", async () => {
    const r = await call("/signup", { cookie: "NEXT_LOCALE=fr", lang: "de" })
    assert.equal(r.location, null)
    assert.equal(r.locale, "fr")
  })
  await check("/ru/login?callbackUrl=%2Fcabinet -> Russian (an explicit prefix still decides)", async () => {
    const r = await call("/ru/login?callbackUrl=%2Fcabinet", { lang: "en-US" })
    assert.equal(r.rewrite, "/login?callbackUrl=%2Fcabinet")
    assert.equal(r.locale, "ru")
  })

  console.log("middleware: /en addresses")
  await check("/en -> 308 /, NEXT_LOCALE=en", async () => {
    const r = await call("/en", { lang: "de" })
    assert.equal(r.status, 308)
    assert.equal(r.location, "/")
    assert.equal(r.cookie, "en")
  })
  await check("/en/about?x=1 with NEXT_LOCALE=de -> 308 /about?x=1, cookie rewritten to en", async () => {
    const r = await call("/en/about?x=1", { cookie: "NEXT_LOCALE=de", lang: "de" })
    assert.equal(r.status, 308)
    assert.equal(r.location, "/about?x=1")
    assert.equal(r.cookie, "en")
  })
  await check("/en/business/ai-crawler-checker -> 308 /business/ai-crawler-checker, cookie en", async () => {
    const r = await call("/en/business/ai-crawler-checker")
    assert.equal(r.status, 308)
    assert.equal(r.location, "/business/ai-crawler-checker")
    assert.equal(r.cookie, "en")
  })
  await check("/en/business -> 308 / (as /business goes to /)", async () => {
    const r = await call("/en/business")
    assert.equal(r.status, 308)
    assert.equal(r.location, "/")
  })
  await check("/en/login with NEXT_LOCALE=en already -> 308 /login, no Set-Cookie", async () => {
    const r = await call("/en/login", { cookie: "NEXT_LOCALE=en" })
    assert.equal(r.location, "/login")
    assert.equal(r.cookie, null)
  })
  await check("bot on /en/about -> 308 /about, no cookie", async () => {
    const r = await call("/en/about", { ua: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", lang: null })
    assert.equal(r.status, 308)
    assert.equal(r.location, "/about")
    assert.equal(r.cookie, null)
  })
  await check("/en/personal (not a GEO page) -> 307 /personal, no cookie", async () => {
    const r = await call("/en/personal")
    assert.equal(r.status, 307)
    assert.equal(r.location, "/personal")
    assert.equal(r.cookie, null)
  })
  await check("the /en redirect is never cached by a CDN", async () => {
    const req = new NextRequest(`${SITE}/en/about`, { headers: { "user-agent": BROWSER, "accept-language": "de" } })
    const res = (await mw.default(req, { waitUntil() {} } as never)) as Response
    assert.equal(res.status, 308)
    assert.match(res.headers.get("cache-control") ?? "", /no-store/)
  })

  console.log("middleware: cabinets still require login")
  for (const p of ["/business/dashboard", "/business/dashboard/visibility", "/cabinet", "/cabinet/posts", "/dashboard", "/dashboard/x"]) {
    await check(`${p} without a session -> /login?callbackUrl=${encodeURIComponent(p)}`, async () => {
      const r = await call(p, { lang: "de-DE,de;q=0.9" })
      assert.equal(r.status, 307)
      assert.equal(r.location, `/login?callbackUrl=${encodeURIComponent(p)}`)
    })
  }
  await check("/de/business/dashboard -> /business/dashboard (which then requires login)", async () => {
    const r = await call("/de/business/dashboard")
    assert.equal(r.location, "/business/dashboard")
  })
  await check("/business/dashboard with a valid session -> passes, no locale work", async () => {
    const name = "__Secure-authjs.session-token"
    const token = await encode({
      token: { sub: "u-check", id: "u-check", email: "check@example.com", name: "Check", plan: "starter" },
      secret: process.env.AUTH_SECRET!,
      salt: name,
    })
    const r = await call("/business/dashboard/visibility", { cookie: `${name}=${token}`, lang: "de" })
    assert.equal(r.location, null, `redirected to ${r.location}`)
    assert.equal(r.next, true)
    assert.equal(r.locale, null)
  })

  console.log("middleware: the guides (/business/blog/<slug>)")
  const { GERMAN_GUIDE_SLUGS, GUIDE_SLUGS } = await import("../lib/geo-guides")
  await check("German guide -> x-itg-locale de, Content-Language de, no redirect, no cookie (browser and bot)", async () => {
    for (const ua of [BROWSER, "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"]) {
      const r = await call("/business/blog/geo-agentur-auswaehlen", { ua, lang: "en-US,en;q=0.9" })
      assert.equal(r.status, 200)
      assert.equal(r.location, null)
      assert.equal(r.rewrite, null)
      assert.equal(r.next, true)
      assert.equal(r.locale, "de")
      assert.equal(r.contentLanguage, "de")
      assert.equal(r.cookie, null)
    }
  })
  await check("every de-* guide of lib/geo-guides.ts is German at the edge, no English one is", async () => {
    const wrong = Object.entries(GUIDE_SLUGS).filter(([k, s]) => GERMAN_GUIDE_SLUGS.has(s) !== k.startsWith("de-"))
    assert.deepEqual(wrong, [])
    for (const s of GERMAN_GUIDE_SLUGS) assert.equal((await call(`/business/blog/${s}`)).locale, "de", s)
  })
  await check("English guide with German Accept-Language and a client-sent x-itg-locale -> English, untouched", async () => {
    const r = await call("/business/blog/geo-vs-seo", { lang: "de-DE,de;q=0.9", headers: { "x-itg-locale": "de" } })
    assert.equal(r.location, null)
    assert.equal(r.next, true)
    assert.equal(r.locale, null)
    assert.equal(r.contentLanguage, null)
    assert.equal(r.cookie, null)
  })
  await check("German guide's markdown (.md) is left alone", async () => {
    const r = await call("/business/blog/geo-agentur-auswaehlen.md")
    assert.equal(r.next, true)
    assert.equal(r.locale, null)
  })
  await check("/de/business/blog/<German guide> -> 307 to the unprefixed guide (unchanged)", async () => {
    const r = await call("/de/business/blog/geo-agentur-auswaehlen", { lang: "de" })
    assert.equal(r.status, 307)
    assert.equal(r.location, "/business/blog/geo-agentur-auswaehlen")
  })

  console.log("matcher")
  const requireFromRoot = createRequire(path.join(ROOT, "package.json"))
  const { getMiddlewareMatchers } = requireFromRoot("next/dist/build/analysis/get-page-static-info.js") as {
    getMiddlewareMatchers: (m: unknown, c: unknown) => { regexp: string }[]
  }
  const matchers = getMiddlewareMatchers(mw.config.matcher, { basePath: "" }).map((m) => new RegExp(m.regexp))
  const matched = (p: string) => matchers.some((re) => re.test(p))
  await check("every public GEO page is matched in every language", () => {
    const missing = cfg.PUBLIC_GEO_PATHS.flatMap((p) => cfg.LOCALES.map((l) => localePath(l, p))).filter((p) => !matched(p))
    assert.deepEqual(missing, [])
  })
  await check("/en addresses are matched", () => {
    const missing = ["/en", "/en/about", "/en/business/ai-crawler-checker", "/en/login"].filter((p) => !matched(p))
    assert.deepEqual(missing, [])
  })
  await check("cabinets are matched", () => {
    const missing = ["/dashboard", "/dashboard/a", "/business/dashboard", "/business/dashboard/plan", "/cabinet", "/cabinet/a"].filter((p) => !matched(p))
    assert.deepEqual(missing, [])
  })
  await check("the guides are matched (for the German ones' language)", () => {
    const missing = ["/business/blog/geo-agentur-auswaehlen", "/business/blog/geo-vs-seo"].filter((p) => !matched(p))
    assert.deepEqual(missing, [])
  })
  await check("English-only and system paths are not matched", () => {
    const extra = [
      "/personal", "/company", "/reddit", "/blog", "/blog/x", "/business", "/business/blog", "/business/blog/x/y",
      "/api/geo/teaser", "/_next/static/chunks/a.js", "/og/geo", "/privacy", "/terms", "/sitemap.xml", "/robots.txt",
      "/deutsch", "/rus", "/english", "/enterprise",
    ].filter(matched)
    assert.deepEqual(extra, [])
  })

  console.log("links, metadata, sitemap")
  await check("localePath", () => {
    assert.equal(localePath("de", "/"), "/de")
    assert.equal(localePath("en", "/"), "/")
    assert.equal(localePath("de", "/#geo-check"), "/de#geo-check")
    assert.equal(localePath("fr", "/signup?from=ai-check&site=a.com"), "/fr/signup?from=ai-check&site=a.com")
    assert.equal(localePath("ru", "/business/ai-crawler-checker"), "/ru/business/ai-crawler-checker")
    assert.equal(localePath("en", "/ru/about"), "/about")
    assert.equal(localePath("es", "/de/about"), "/es/about")
    assert.equal(localePath("de", "/personal"), "/personal")
    assert.equal(localePath("de", "/business/blog/how-to"), "/business/blog/how-to")
    assert.equal(localePath("de", "/business/dashboard"), "/business/dashboard")
    assert.equal(localePath("de", "#apply"), "#apply")
    assert.equal(localePath("de", "https://www.pickaclass.com"), "https://www.pickaclass.com")
    assert.equal(localePath("de", "mailto:kiryl@itgrows.ai"), "mailto:kiryl@itgrows.ai")
    assert.equal(localePath("de", "//cdn.example.com/x"), "//cdn.example.com/x")
  })
  await check("localizedMetadata: canonical, hreflang x5 + x-default, og url/locale", () => {
    const md = localizedMetadata("de", "/business/ai-crawler-checker", { title: "T", description: "D", robots: { index: false } })
    assert.equal(md.alternates?.canonical, `${SITE}/de/business/ai-crawler-checker`)
    assert.deepEqual(md.alternates?.languages, {
      en: `${SITE}/business/ai-crawler-checker`,
      de: `${SITE}/de/business/ai-crawler-checker`,
      fr: `${SITE}/fr/business/ai-crawler-checker`,
      es: `${SITE}/es/business/ai-crawler-checker`,
      ru: `${SITE}/ru/business/ai-crawler-checker`,
      "x-default": `${SITE}/business/ai-crawler-checker`,
    })
    const og = md.openGraph as { url?: string; locale?: string; title?: string; images?: unknown[] }
    assert.equal(og.url, `${SITE}/de/business/ai-crawler-checker`)
    assert.equal(og.locale, "de_DE")
    assert.equal(og.title, "T")
    assert.equal(og.images?.length, 1)
    assert.deepEqual(md.robots, { index: false })
    const tw = md.twitter as { title?: string; description?: string; card?: string; images?: unknown[] }
    assert.equal(tw.title, "T")
    assert.equal(tw.description, "D")
    assert.equal(tw.card, "summary_large_image")
    assert.equal(tw.images?.length, 1)
    assert.equal(localizedMetadata("en", "/", { title: "T", description: "D" }).alternates?.canonical, `${SITE}/`)
  })
  await check("robots.txt keeps the sign-in pages closed in every language", async () => {
    const robots = (await import("../app/robots")).default()
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules]
    const disallow = ([] as string[]).concat(rules[0].disallow ?? [])
    for (const l of cfg.LOCALES) {
      assert.ok(disallow.includes(localePath(l, "/login")), `${localePath(l, "/login")} not disallowed`)
      assert.ok(disallow.includes(localePath(l, "/signup")), `${localePath(l, "/signup")} not disallowed`)
    }
    // The indexed GEO pages themselves stay open: no disallow rule is a prefix of them.
    for (const p of cfg.INDEXED_GEO_PATHS.flatMap((x) => cfg.LOCALES.map((l) => localePath(l, x)))) {
      const blocked = disallow.filter((d) => (d.endsWith("$") ? p === d.slice(0, -1) : p.startsWith(d)))
      assert.deepEqual(blocked, [], `${p} blocked by ${blocked.join(", ")}`)
    }
  })
  await check("localizedSitemapEntries: 5 urls, each with all alternates", () => {
    const e = localizedSitemapEntries("/", { priority: 1 })
    assert.deepEqual(e.map((x) => x.url), [`${SITE}/`, `${SITE}/de`, `${SITE}/fr`, `${SITE}/es`, `${SITE}/ru`])
    assert.deepEqual(e[2].alternates?.languages, hreflangAlternates("/"))
    assert.equal(e[3].priority, 1)
  })

  console.log("rich text and formats")
  const html = (n: ReactNode) => renderToStaticMarkup(createElement("p", null, n))
  const tags = {
    b: (c: ReactNode) => createElement("b", null, c),
    link: (c: ReactNode) => createElement("a", { href: "/x" }, c),
    br: () => createElement("br"),
  }
  await check("rich: tags, nesting, self-closing, unknown and unclosed tags", () => {
    assert.equal(html(rich("Start <b>here</b>, then <link>the check</link>.<br/>Done", tags)), '<p>Start <b>here</b>, then <a href="/x">the check</a>.<br/>Done</p>')
    assert.equal(html(rich("<b>bold <link>both</link></b>", tags)), '<p><b>bold <a href="/x">both</a></b></p>')
    assert.equal(html(rich("plain <i>italic</i>", tags)), "<p>plain italic</p>")
    assert.equal(html(rich("a <b>c", tags)), "<p>a &lt;b&gt;c</p>")
    assert.equal(html(rich("no tags", tags)), "<p>no tags</p>")
  })
  await check("rich: a renderer may call rich() again", () => {
    const out = html(rich("<b>outer</b> and <link>x</link>", { b: (c) => createElement("b", null, c), link: () => rich("<b>inner</b>", tags) }))
    assert.equal(out, "<p><b>outer</b> and <b>inner</b></p>")
  })
  const LocaleProvider = (await import("../components/i18n/LocaleProvider")).default
  const LanguageSwitcher = (await import("../components/i18n/LanguageSwitcher")).default
  const LocaleLink = (await import("../components/i18n/LocaleLink")).default
  const inLocale = (locale: (typeof cfg.LOCALES)[number], node: ReactNode) =>
    // children go in the third argument; the cast only satisfies the props type, which requires them.
    renderToStaticMarkup(createElement(LocaleProvider, { locale } as ComponentProps<typeof LocaleProvider>, node))
  await check("LocaleProvider labels the content with its language (no JavaScript needed)", () => {
    assert.equal(inLocale("de", "Hallo"), '<div lang="de" class="contents">Hallo</div>')
  })
  await check("LocaleLink: prefixes GEO pages in the page's language, leaves the rest", () => {
    const a = (href: string, locale?: (typeof cfg.LOCALES)[number]) =>
      /href="([^"]*)"/.exec(inLocale("fr", createElement(LocaleLink, { href, locale }, "x")))?.[1]
    assert.equal(a("/business/ai-crawler-checker"), "/fr/business/ai-crawler-checker")
    assert.equal(a("/signup?from=ai-check"), "/fr/signup?from=ai-check")
    assert.equal(a("/#geo-pricing"), "/fr#geo-pricing")
    assert.equal(a("#apply"), "#apply")
    assert.equal(a("/personal"), "/personal")
    assert.equal(a("/business/blog"), "/business/blog")
    assert.equal(a("/about", "en"), "/about")
  })
  await check("LanguageSwitcher: five links to the same page, the current one marked, labels translated", () => {
    // Outside the app router usePathname() is null, which the switcher reads as "/".
    const out = inLocale("de", createElement(LanguageSwitcher))
    const hrefs = [...new Set([...out.matchAll(/href="([^"]*)"/g)].map((m) => m[1]))]
    assert.deepEqual(hrefs, ["/", "/de", "/fr", "/es", "/ru"])
    assert.match(out, /aria-label="Sprache"/)
    assert.match(out, /aria-label="Sprache: Deutsch"/)
    assert.match(out, /href="\/de" hrefLang="de" lang="de" title="Deutsch" aria-current="true"/)
    assert.equal((out.match(/aria-current/g) ?? []).length, 1, "one menu, the current language marked once")
    assert.match(inLocale("ru", createElement(LanguageSwitcher)), /aria-label="Язык"/)
  })
  await check("plural and formatNumber", () => {
    const ru = (n: number) => plural("ru", n, { one: "вопрос", few: "вопроса", many: "вопросов", other: "вопроса" })
    assert.deepEqual([1, 3, 5, 21, 22, 25].map(ru), ["вопрос", "вопроса", "вопросов", "вопрос", "вопроса", "вопросов"])
    assert.equal(plural("fr", 0, { one: "question", other: "questions" }), "question")
    assert.equal(formatNumber("de", 1918), "1.918")
    assert.equal(formatNumber("en", 1918), "1,918")
  })

  await check("defineMessages: the compile-time proof (typeProof) builds all five languages", () => {
    assert.deepEqual(Object.keys(typeProof()), ["en", "de", "fr", "es", "ru"])
  })

  console.log("message namespaces (lib/i18n/messages/)")
  const dir = path.join(ROOT, "lib/i18n/messages")
  const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).sort()
  const tagsOf = (s: string) => [...s.matchAll(/<\/?([a-zA-Z][\w-]*)\s*\/?>/g)].map((m) => m[0]).sort().join(" ")
  const compare = (a: unknown, b: unknown, at: string, errs: string[], locale: string) => {
    if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
      errs.push(`${at}: ${Array.isArray(a) ? "array" : typeof a} in en, ${Array.isArray(b) ? "array" : typeof b} in ${locale}`)
    } else if (Array.isArray(a)) {
      const bb = b as unknown[]
      if (a.length !== bb.length) errs.push(`${at}: ${a.length} items in en, ${bb.length} in ${locale}`)
      a.forEach((x, i) => i < bb.length && compare(x, bb[i], `${at}[${i}]`, errs, locale))
    } else if (a && typeof a === "object") {
      const ka = Object.keys(a)
      const kb = Object.keys(b as object)
      for (const k of ka) if (!kb.includes(k)) errs.push(`${at}.${k}: missing in ${locale}`)
      for (const k of kb) if (!ka.includes(k)) errs.push(`${at}.${k}: not in en (${locale})`)
      for (const k of ka) if (kb.includes(k)) compare((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${at}.${k}`, errs, locale)
    } else if (typeof a === "string") {
      const s = b as string
      if (a.trim() && !s.trim()) errs.push(`${at}: empty in ${locale}`)
      if (tagsOf(a) !== tagsOf(s)) errs.push(`${at}: tags "${tagsOf(a)}" in en, "${tagsOf(s)}" in ${locale}`)
      if (a === s && a.length >= 24 && /\s\S+\s/.test(a)) warnings.push(`${at} (${locale}) is the English text`)
    } else if (typeof a === "function" && a.length !== (b as (...x: unknown[]) => unknown).length) {
      errs.push(`${at}: function takes ${a.length} argument(s) in en, ${(b as (...x: unknown[]) => unknown).length} in ${locale}`)
    }
  }
  for (const f of files) {
    await check(`messages/${f}`, async () => {
      const mod = (await import(path.join(dir, f))) as { default?: Record<string, unknown> }
      const ns = mod.default
      assert.ok(ns && typeof ns === "object", "no default export (export default defineMessages(en, {…}))")
      const errs: string[] = []
      for (const l of cfg.LOCALES) if (!(l in ns)) errs.push(`locale ${l} missing`)
      for (const l of cfg.PREFIXED) if (l in ns) compare(ns.en, ns[l], f.replace(/\.tsx?$/, ""), errs, l)
      assert.deepEqual(errs, [])
    })
  }

  console.log(`\n${passed} passed, ${failures.length} failed${warnings.length ? `, ${warnings.length} warning(s)` : ""}`)
  for (const w of warnings) console.log(`  warn ${w}`)
  if (failures.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
