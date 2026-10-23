import { cookies } from "next/headers"

// The Google Ads click id that components/AdsConversion.tsx keeps in the itg_gclid cookie. Checkout
// routes add it to the Stripe metadata, so a payment can be tied to the ad click that brought it
// (the owner's Telegram notice, a later offline conversion import). No cookie, nothing added.
export async function adsClickMeta(): Promise<{ gclid?: string }> {
  try {
    const gclid = (await cookies()).get("itg_gclid")?.value
    return gclid ? { gclid: gclid.slice(0, 200) } : {}
  } catch {
    return {}
  }
}
