// The QA links of the price test: each arm's price on the real pages, for that one request, with nothing
// recorded (lib/geo-price-visitor.ts readQaLink). They hold only while PRICE_TEST.enabled is true.
//
//   AUTH_SECRET=<the site's secret> npx tsx scripts/price-qa-links.ts    computed here
//   IMAGE_STORE_TOKEN=$(cat /root/secrets/image_upload_token) npx tsx scripts/price-qa-links.ts
//                                                                        asked from the live site (on the VM)
//
// Prints the links only, never a secret. Add a page: npx tsx scripts/price-qa-links.ts /about

import { PRICE_TEST } from "../lib/geo-pricing"
import { qaLinkValue } from "../lib/geo-price-visitor"

const SITE = "https://www.itgrows.ai"

async function queries(): Promise<{ cents: number; query: string }[]> {
  if (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) {
    return Promise.all(PRICE_TEST.variants.map(async (cents) => ({ cents, query: `?price_qa=${await qaLinkValue(cents)}` })))
  }
  const token = process.env.IMAGE_STORE_TOKEN
  if (!token) throw new Error("Set AUTH_SECRET, or IMAGE_STORE_TOKEN to ask the live site.")
  const res = await fetch(`${SITE}/api/geo/price/vm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "qa" }),
  })
  if (!res.ok) throw new Error(`the live site answered ${res.status} (not deployed yet?)`)
  return ((await res.json()) as { links: { cents: number; query: string }[] }).links
}

async function main() {
  const page = process.argv[2] ?? "/"
  for (const { cents, query } of await queries()) console.log(`$${cents / 100}\t${SITE}${page}${query}`)
}

main().catch((e) => {
  console.error((e as Error).message)
  process.exit(1)
})
