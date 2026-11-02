import type { ReactNode } from "react"
import PriceProvider from "@/components/geo/PriceProvider"
import { visitorPrice } from "@/lib/geo-price-server"

// A priced page wraps its content once, like LocaleProvider, so that its client components read the
// visitor's price (components/geo/PriceProvider.tsx). At page level and not in app/layout.tsx: the root
// layout is not rendered again on a client-side navigation, so a visitor walking from a page outside the
// test to a priced one would read a stale price there.
export default async function PriceScope({ children }: { children: ReactNode }) {
  const { client } = await visitorPrice()
  return <PriceProvider {...client}>{children}</PriceProvider>
}
