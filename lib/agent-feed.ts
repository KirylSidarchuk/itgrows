import { GEO_PRICES, PRO_PRICES, SAMPLE_PATH } from "@/lib/geo-pricing"
import { BASE, aiLink } from "@/lib/agent-tools"

// The services feed (ALG step 06, Kiryl 27 Nov 2026): what ItGrows sells, machine-readable, with the prices on the
// site. Field names follow the OpenAI commerce product feed (developers.openai.com/commerce/specs/feed, read
// 27 Nov 2026): item_id, title, description, url, brand, seller_name, image_url, availability, price ("499.00 USD").
// That schema has no field for a monthly plan or a setup fee, so the price is the first payment's recurring part
// and the rest is said in the description and in our own fields (billing_*). Checkout through an agent is off
// (is_eligible_checkout false) until a platform accepts us: applying is Kiryl's call (vos owner-add).
// The detailed report is free since 27 Oct 2026 (app/api/geo/research-checkout), so its price is 0.

const money = (cents: number) => `${(cents / 100).toFixed(2)} USD`

export function serviceFeed() {
  const common = {
    brand: "ItGrows",
    seller_name: "ItGrows",
    seller_url: BASE,
    seller_privacy_policy: `${BASE}/privacy`,
    seller_tos: `${BASE}/terms`,
    image_url: `${BASE}/og-image.png`,
    availability: "in_stock",
    is_digital: true,
    is_eligible_search: true,
    is_eligible_checkout: false,
    target_countries: ["US"],
    product_category: "Business & Industrial > Advertising & Marketing",
  }
  const b = GEO_PRICES
  const p = PRO_PRICES
  return [
    {
      ...common,
      item_id: "itgrows-business-monthly",
      title: "ItGrows Business: get recommended by ChatGPT, Claude, Gemini and Perplexity",
      description: `Done-for-you AI visibility for one business location: up to 12 articles a month on your site written for the questions buyers ask AI assistants, profiles and letters to editors on the sites AI quotes, and all four assistants checked every 2 weeks. ${b.month.label} a month plus a one-time ${b.setup.label} setup; or ${b.quarter.label} for 3 months with setup free. Month to month.`,
      url: aiLink("/pricing", "other", "feed"),
      price: money(b.month.cents),
      billing_interval: "month",
      billing_setup_fee: money(b.setup.cents),
      billing_alternative: `${money(b.quarter.cents)} for 3 months, no setup fee`,
      pay_url: `${BASE}/pay/998`,
    },
    {
      ...common,
      item_id: "itgrows-pro-monthly",
      title: "ItGrows Pro: AI visibility for several locations, ready for AI agents",
      description: `Everything in Business for up to 3 locations or practice areas, answers re-checked every week, business data in Google, Bing and Apple kept accurate, services and prices machine-readable on your site, a booking or quote page assistants can link to, and a call with the founder every 3 months. ${p.month.label} a month plus a one-time ${p.setup.label} setup; or ${p.quarter.label} for 3 months with setup free. Starts after a 15-minute call.`,
      url: aiLink("/pricing", "other", "feed"),
      price: money(p.month.cents),
      billing_interval: "month",
      billing_setup_fee: money(p.setup.cents),
      billing_alternative: `${money(p.quarter.cents)} for 3 months, no setup fee`,
      pay_url: `${BASE}/pay/2000`,
    },
    {
      ...common,
      item_id: "itgrows-ai-visibility-report",
      title: "ItGrows detailed AI visibility report (free)",
      description:
        "20 questions your buyers ask, each put to ChatGPT, Claude, Gemini and Perplexity: whether your business is named, who is named instead, which sites the assistants cite, and the plan to change it. Free once an account is created, one site per account.",
      url: aiLink(SAMPLE_PATH, "other", "feed"),
      price: money(0),
      billing_interval: "once",
      pay_url: aiLink("/signup", "other", "feed"),
    },
  ]
}
