"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import { useConsent } from "./consent"

// Meta pixel "ItGrows.ai" (Course4You portfolio, ad account ItGrows). Events: PageView here, Lead on a
// finished quick check (app/business/AuditForm.tsx), CompleteRegistration for a new account
// (app/signup/page.tsx, components/SignupConversion.tsx), Purchase on a GEO payment
// (components/GeoPurchaseConversion.tsx). Declining later revokes it (consent.ts) and the page reloads.
const META_PIXEL = "2681488878935584"

// The inline pixel code sends the first PageView; client-side navigation sends the next ones.
function MetaPageViews() {
  const path = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      window.fbq?.("track", "PageView")
    } catch {
      /* analytics never breaks the page */
    }
  }, [path])
  return null
}

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
      <Script id="meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('consent','grant');
fbq('init','${META_PIXEL}');
fbq('track','PageView');
`}</Script>
      <MetaPageViews />
    </>
  )
}
