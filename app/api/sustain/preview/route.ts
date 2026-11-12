import { NextRequest, NextResponse } from "next/server"
import { callLLM } from "@/lib/llm-client"
import { sendOwner } from "@/lib/telegram"
import { clientIp } from "@/lib/geo-check"
import { withSustainCors, sustainPreflight } from "@/lib/cors-sustain"

// "Your website, reimagined" on /sustain/de and /sustain/en: a visitor gives the address of their site and gets
// back what a new version of it would say, built from their own site only. This route reads the page (name, logo,
// colours, pictures, contact details, what they offer) and has the model write the new texts in the page's
// language (lang: "de" or "en").
// The page draws the new site from this; the old one is shown through Google PageSpeed, the visibility in
// ChatGPT through /api/geo/teaser.
export const dynamic = "force-dynamic"
export const maxDuration = 30

const HUMAN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// The address is the caller's choice, so only public hosts (the same rule as app/api/business/audit/route.ts).
const PRIVATE_HOST =
  /^(localhost$|.*\.local$|.*\.internal$|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|172\.(1[6-9]|2\d|3[01])\.)/i

const PAGE_BYTES = 600_000
const CSS_BYTES = 300_000

// A light brake per server instance: a few previews per address per hour. The model call is cheap, but
// nobody should be able to run it in a loop.
const recent = new Map<string, number[]>()
const PER_HOUR = 8

function normalise(raw: string): URL | null {
  let s = (raw || "").trim()
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = "https://" + s
  let u: URL
  try {
    u = new URL(s)
  } catch {
    return null
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null
  if (PRIVATE_HOST.test(u.hostname) || !u.hostname.includes(".")) return null
  return u
}

async function grab(url: string, bytes: number, ms = 9000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": HUMAN_UA, Accept: "text/html,text/css,*/*", "Accept-Language": "de,en;q=0.8" },
    })
    if (res.url && PRIVATE_HOST.test(new URL(res.url).hostname)) return { status: 0, text: "", url, frameable: false }
    return { status: res.status, text: (await res.text()).slice(0, bytes), url: res.url || url, frameable: frameable(res.headers) }
  } catch {
    return { status: 0, text: "", url, frameable: false }
  } finally {
    clearTimeout(timer)
  }
}

// Whether the site lets another page show it in a frame: the page falls back to showing it live when
// Google's measurement is not available.
function frameable(h: Headers): boolean {
  if (h.get("x-frame-options")) return false
  const fa = (h.get("content-security-policy") ?? "").match(/frame-ancestors([^;]*)/i)
  return !fa || /\*/.test(fa[1])
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim()

const strip = (s: string) => decode(s.replace(/<[^>]+>/g, " "))

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']*)\\1`, "i")) ?? tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"))
  return m ? decode(m[2] ?? m[1]) : ""
}

function meta(html: string, key: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const k = (attr(tag, "name") || attr(tag, "property")).toLowerCase()
    if (k === key) return attr(tag, "content")
  }
  return ""
}

function absolute(src: string, base: string): string {
  if (!src || src.startsWith("data:")) return ""
  try {
    const u = new URL(src, base)
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : ""
  } catch {
    return ""
  }
}

// The brand colour: the theme colour if the site sets one, else the most used saturated colour in its CSS.
function brandColour(html: string, css: string): string | null {
  const theme = meta(html, "theme-color")
  if (/^#[0-9a-f]{6}$/i.test(theme) && saturated(theme)) return theme.toLowerCase()
  const counts = new Map<string, number>()
  for (const m of (html + css).matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let h = m[1].toLowerCase()
    if (h.length === 3) h = h.split("").map((c) => c + c).join("")
    const hex = "#" + h
    if (saturated(hex)) counts.set(hex, (counts.get(hex) ?? 0) + 1)
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : null
}

function saturated(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const light = (max + min) / 510
  return max - min > 60 && light > 0.15 && light < 0.85
}

interface Facts {
  name: string
  phone: string
  email: string
  address: string
  hours: string
}

// Contact details: schema.org data first (it is what the owner meant to publish), then tel:/mailto: links.
function facts(html: string): Facts {
  const out: Facts = { name: "", phone: "", email: "", address: "", hours: "" }
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1])
      const items: Record<string, unknown>[] = (Array.isArray(data) ? data : [data]).flatMap((d) =>
        Array.isArray(d?.["@graph"]) ? d["@graph"] : [d],
      )
      for (const it of items) {
        if (!it || typeof it !== "object") continue
        if (!out.name && typeof it.name === "string" && it["@type"] !== "WebSite" && it["@type"] !== "WebPage") out.name = it.name
        if (!out.phone && typeof it.telephone === "string") out.phone = it.telephone
        if (!out.email && typeof it.email === "string") out.email = it.email.replace(/^mailto:/, "")
        const a = it.address as Record<string, string> | string | undefined
        if (!out.address && a) {
          out.address = typeof a === "string" ? a : [a.streetAddress, [a.postalCode, a.addressLocality].filter(Boolean).join(" ")].filter(Boolean).join(", ")
        }
        if (!out.hours && typeof it.openingHours === "string") out.hours = it.openingHours
      }
    } catch {
      // A broken block is skipped.
    }
  }
  if (!out.phone) out.phone = decode((html.match(/href=["']tel:([^"']+)["']/i) ?? [])[1] ?? "")
  if (!out.email) out.email = decode((html.match(/href=["']mailto:([^"'?]+)/i) ?? [])[1] ?? "")
  return out
}

// Badges and partner marks that carry "logo" in their names but are not the business's own logo.
const NOT_OWN_LOGO = /amazon|aws|microsoft|nvidia|google|meta-|stripe|shopify|google-?play|app-?store|apple|badge|partner|payment|paypal|visa|mastercard|klarna|trustpilot|trusted|award|siegel|certif|zertifi|facebook|instagram|linkedin|twitter|youtube|whatsapp|tiktok/

// The business's own logo: an image in the header whose name or text says "logo" or carries the site's name.
// Not just the first image there: a header can hold partner marks (magiscan.app: Bambu Lab).
function headerLogo(html: string, base: string, label: string): string {
  const head = (html.match(/<header\b[\s\S]*?<\/header>/i) ?? html.match(/<nav\b[\s\S]*?<\/nav>/i) ?? [""])[0]
  const imgs = (head.match(/<img\b[^>]*>/gi) ?? []).map((tag) => ({
    tag,
    src: absolute(attr(tag, "src") || attr(tag, "data-src") || (attr(tag, "srcset").split(/\s+/)[0] ?? ""), base),
  }))
  const own = imgs.filter((i) => i.src && !NOT_OWN_LOGO.test(`${i.src} ${attr(i.tag, "alt")} ${attr(i.tag, "class")}`.toLowerCase()))
  const hint = (i: { tag: string; src: string }) => `${i.src} ${attr(i.tag, "alt")} ${attr(i.tag, "class")} ${attr(i.tag, "id")}`.toLowerCase()
  const byName = own.find((i) => label.length > 2 && hint(i).replace(/[^a-z0-9]/g, "").includes(label))
  const byWord = own.find((i) => /logo/.test(hint(i)))
  return (byName ?? byWord)?.src ?? ""
}

// Outside the header an image counts as the logo only when its name or text carries the site's own name
// (magiscan.app: the header logo is drawn in code, and the first "logo" image further down is AWS's).
function pictures(html: string, base: string): { logo: string; images: string[] } {
  const label = new URL(base).hostname.replace(/^www\./, "").split(".")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
  let logo = headerLogo(html, base, label)
  const images: string[] = []
  const og = absolute(meta(html, "og:image"), base)
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const src = absolute(attr(tag, "src") || attr(tag, "data-src") || (attr(tag, "srcset").split(/\s+/)[0] ?? ""), base)
    if (!src) continue
    const hint = `${src} ${attr(tag, "alt")} ${attr(tag, "class")} ${attr(tag, "id")}`.toLowerCase()
    if (/logo/.test(hint)) {
      if (!logo && !NOT_OWN_LOGO.test(hint) && label.length > 2 && hint.replace(/[^a-z0-9]/g, "").includes(label)) logo = src
      continue
    }
    if (/\.svg(\?|$)|icon|sprite|pixel|tracking|spacer|avatar|emoji|flag|badge|placeholder|lazy\.gif/.test(hint)) continue
    const w = Number(attr(tag, "width")) || 0
    if (w && w < 240) continue
    if (!images.includes(src)) images.push(src)
  }
  if (og && !images.includes(og)) images.unshift(og)
  if (!logo) {
    const icon = (html.match(/<link\b[^>]*rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/i) ?? [])[0]
    if (icon) logo = absolute(attr(icon, "href"), base)
  }
  return { logo, images: images.slice(0, 6) }
}

function headings(html: string): string[] {
  return [...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => strip(m[2])).filter((t) => t.length > 2 && t.length < 140).slice(0, 18)
}

function bodyText(html: string): string {
  return strip(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " "),
  ).slice(0, 4500)
}

interface Copy {
  business: string
  sector: string
  city: string
  headline: string
  subline: string
  cta: string
  services: { title: string; text: string }[]
  reasons: string[]
  about: string
  proof: string[]
}

const PROMPT_EN = `You are the copywriter of a web agency. From the content of an existing website you write the texts for its new home page, in English, in a clear, modern tone.

Rules:
- Everything in English, even if the website is in another language: you translate what the content says.
- Facts from the content only. No invented numbers, years, awards, ratings or services.
- proof: only claims the text supports (e.g. "Since 1998", "Family business"); otherwise an empty list.
- headline: at most 8 words, says what the customer gets. subline: at most 24 words.
- cta: the obvious action for this kind of business, 2 to 3 words (e.g. "Book an appointment", "Request a quote").
- services: exactly 3, each with title (at most 4 words) and text (at most 18 words).
- reasons: exactly 3 short reasons (at most 6 words) why customers choose this business, drawn from the content.
- about: 2 sentences.
- city: the town if the content names it, else "".

Answer with JSON only: {"business":"","sector":"","city":"","headline":"","subline":"","cta":"","services":[{"title":"","text":""}],"reasons":[""],"about":"","proof":[""]}`

const PROMPT = `Du bist Texter einer Webagentur. Aus dem Inhalt einer bestehenden Website schreibst du die Texte für ihre neue Startseite, auf Deutsch, in klarem, modernem Ton.

Regeln:
- Alles auf Deutsch, auch wenn die Website eine andere Sprache hat: Angaben aus dem Inhalt übersetzt du.
- Nur Fakten aus dem Inhalt. Keine erfundenen Zahlen, Jahre, Auszeichnungen, Bewertungen oder Leistungen.
- proof: nur belegbare Angaben aus dem Text (z. B. "Seit 1998", "Meisterbetrieb"); sonst eine leere Liste.
- headline: höchstens 8 Wörter, sagt, was der Kunde davon hat. subline: höchstens 24 Wörter.
- cta: die naheliegende Handlung für diese Branche, 2 bis 3 Wörter (z. B. "Termin vereinbaren", "Angebot anfragen").
- services: genau 3, je title (höchstens 4 Wörter) und text (höchstens 18 Wörter).
- reasons: genau 3 kurze Gründe (höchstens 6 Wörter), warum Kunden diesen Anbieter wählen, aus dem Inhalt abgeleitet.
- about: 2 Sätze.
- city: der Ort, wenn er im Inhalt steht, sonst "".

Antworte nur mit JSON: {"business":"","sector":"","city":"","headline":"","subline":"","cta":"","services":[{"title":"","text":""}],"reasons":[""],"about":"","proof":[""]}`

function parseCopy(raw: string): Copy | null {
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)
  try {
    const c = JSON.parse(json) as Partial<Copy>
    const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
    const services = (Array.isArray(c.services) ? c.services : [])
      .map((x) => ({ title: s(x?.title, 60), text: s(x?.text, 200) }))
      .filter((x) => x.title)
      .slice(0, 3)
    if (!s(c.headline, 120) || services.length < 2) return null
    return {
      business: s(c.business, 80),
      sector: s(c.sector, 60),
      city: s(c.city, 60),
      headline: s(c.headline, 120),
      subline: s(c.subline, 260),
      cta: s(c.cta, 40),
      services,
      reasons: (Array.isArray(c.reasons) ? c.reasons : []).map((r) => s(r, 70)).filter(Boolean).slice(0, 3),
      about: s(c.about, 400),
      proof: (Array.isArray(c.proof) ? c.proof : []).map((r) => s(r, 50)).filter(Boolean).slice(0, 3),
    }
  } catch {
    return null
  }
}

async function handlePOST(req: NextRequest) {
  let raw = ""
  let english = false
  try {
    const body = (await req.json()) as { url?: unknown; lang?: unknown }
    raw = String(body.url ?? "")
    english = body.lang === "en"
  } catch {}
  const target = normalise(raw.slice(0, 300))
  if (!target) return NextResponse.json({ error: "invalid_url" }, { status: 400 })

  const ip = clientIp(req.headers) || "?"
  const now = Date.now()
  const seen = (recent.get(ip) ?? []).filter((t) => now - t < 3_600_000)
  if (seen.length >= PER_HOUR) return NextResponse.json({ error: "limit" }, { status: 429 })
  recent.set(ip, [...seen, now])

  const page = await grab(target.href, PAGE_BYTES)
  if (page.status === 0 || page.status >= 400 || page.text.length < 200) {
    void sendOwner(`🪄 Макет по адресу: ${target.hostname} — сайт не открылся (${page.status || "нет ответа"})`)
    return NextResponse.json({ error: "unreachable", status: page.status }, { status: 422 })
  }
  const html = page.text
  const base = page.url

  const sheet = (html.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/i) ?? [])[0]
  const cssUrl = sheet ? absolute(attr(sheet, "href"), base) : ""
  const css = cssUrl && !PRIVATE_HOST.test(new URL(cssUrl).hostname) ? (await grab(cssUrl, CSS_BYTES, 5000)).text : ""

  const title = strip((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? "")
  const description = meta(html, "description") || meta(html, "og:description")
  const siteName = meta(html, "og:site_name")
  const lang = ((html.match(/<html[^>]*\blang=["']?([a-zA-Z-]+)/i) ?? [])[1] ?? "").slice(0, 2).toLowerCase()
  const contact = facts(html)
  const pics = pictures(html, base)
  const heads = headings(html)
  const text = bodyText(html)

  const source = [
    `Adresse: ${base}`,
    `Titel: ${title}`,
    siteName && `Name laut Seite: ${siteName}`,
    contact.name && `Name laut Daten: ${contact.name}`,
    description && `Beschreibung: ${description}`,
    heads.length && `Überschriften: ${heads.join(" | ")}`,
    `Text: ${text}`,
  ]
    .filter(Boolean)
    .join("\n")

  let copy: Copy | null = null
  try {
    const answer = await callLLM(
      [
        { role: "system", content: english ? PROMPT_EN : PROMPT },
        { role: "user", content: source },
      ],
      { caller: "sustain-preview", temperature: 0.4, max_tokens: 1100 },
    )
    copy = parseCopy(answer)
  } catch (e) {
    console.warn("[sustain/preview] model:", e instanceof Error ? e.message : e)
  }
  if (!copy) {
    void sendOwner(`🪄 Макет по адресу: ${target.hostname} — тексты не получились`)
    return NextResponse.json({ error: "copy_failed" }, { status: 502 })
  }

  void sendOwner(`🪄 Макет по адресу: ${target.hostname} — готов (${copy.business || title.slice(0, 40)})`)
  return NextResponse.json({
    url: base,
    frameable: page.frameable,
    host: new URL(base).hostname.replace(/^www\./, ""),
    lang,
    name: copy.business || siteName || contact.name || title.split(/[|–—-]/)[0].trim(),
    colour: brandColour(html, css),
    logo: pics.logo,
    images: pics.images,
    contact,
    copy,
  })
}

// Also callable from the Sustain Impact site (lib/cors-sustain.ts).
export const POST = withSustainCors(handlePOST)
export const OPTIONS = sustainPreflight
