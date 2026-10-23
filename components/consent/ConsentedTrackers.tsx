"use client"

import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { useConsent } from "./consent"

// Optional trackers: rendered only once the visitor has pressed "Accept" (now or on an earlier visit).
// Before that, and after "Decline", none of these scripts is requested.
export default function ConsentedTrackers() {
  const consent = useConsent()
  if (consent !== "accepted") return null

  return (
    <>
      <Analytics />
      <Script id="contentsquare" src="https://t.contentsquare.net/uxa/973805ba839a0.js" strategy="afterInteractive" />
      <Script id="microsoft-clarity" strategy="afterInteractive">{`
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wuncowfl7g");
window.clarity("consentv2",{ad_Storage:"granted",analytics_Storage:"granted"});
`}</Script>
    </>
  )
}
