import type { Metadata } from "next"
import AsoCalculator from "./AsoCalculator"

export const metadata: Metadata = {
  title: "ASO Offer Calculator",
  robots: { index: false, follow: false },
}

export default function AsoPage() {
  return <AsoCalculator />
}
