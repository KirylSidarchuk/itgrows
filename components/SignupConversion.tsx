import Script from "next/script"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

// Google Ads "Sign-up" conversion (account ItGrows, tag AW-18160234884, the label the email-code form on
// /signup fires) for the sign-ups that form never sees finish: Google and LinkedIn (the OAuth round trip
// leaves the site and comes back straight to callbackUrl) and a code entered on /login for an address
// that had no account yet. Mounted in the GEO cabinet layout (app/business/dashboard/layout.tsx), so it
// fires on the first cabinet page after the sign-up.
//
// How a sign-up is known, without a flag on the sign-in buttons: auth.ts writes an analytics_events row
// "signup" with props.via (google | linkedin | pin) at the moment it creates the user, whatever page the
// sign-in started from. The server looks for that row from the last hour; for "pin" only when /signup
// recorded no "signup_complete" (it fired the conversion itself then). An account older than an hour,
// or one that only signed in, renders nothing.
//
// Never twice for one account: the browser reports "ads_signup_conversion" to /api/track (stored with the
// user's id) and the server stops rendering this once that row exists; a reload before it lands is held
// by localStorage; the conversion carries the account as transaction_id, which Google counts once; and
// if the /signup code form fired it in this tab a moment ago (a client navigation keeps the dataLayer),
// it is only recorded, not sent again.
// gtag runs in Advanced Consent Mode (app/layout.tsx) and exists from the first line of the page.

const SIGNUP_CONVERSION = "AW-18160234884/SQ7pCN7Sk8gcEITjvNND"
const SENT_EVENT = "ads_signup_conversion"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VIA = new Set(["google", "linkedin", "pin"])

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

/** How the account signed up, when its conversion is still to be sent; null otherwise. */
async function dueVia(userId: string): Promise<string | null> {
  const [row] = rows(
    await db.execute(sql`
      SELECT s.props->>'via' AS via
      FROM analytics_events s
      WHERE s.user_id = ${userId} AND s.event = 'signup'
        AND s.created_at > now() - interval '60 minutes'
        AND NOT EXISTS (SELECT 1 FROM analytics_events d WHERE d.user_id = s.user_id AND d.event = ${SENT_EVENT})
        AND (s.props->>'via' IN ('google', 'linkedin')
             OR (s.props->>'via' = 'pin'
                 AND NOT EXISTS (SELECT 1 FROM analytics_events c WHERE c.user_id = s.user_id AND c.event = 'signup_complete')))
      ORDER BY s.created_at DESC
      LIMIT 1`)
  )
  const via = typeof row?.via === "string" ? row.via : null
  return via && VIA.has(via) ? via : null
}

export default async function SignupConversion({ userId }: { userId: string }) {
  if (!UUID.test(userId)) return null
  let via: string | null = null
  try {
    via = await dueVia(userId)
  } catch {
    // Analytics never breaks the cabinet.
    return null
  }
  if (!via) return null

  // Every value is one of ours (a checked UUID, a known "via", constants), written as JSON literals.
  const v = JSON.stringify
  const code = `(function () {
  var w = window, label = ${v(SIGNUP_CONVERSION)}, uid = ${v(userId)}, via = ${v(via)}, key = "itg_signup_conv_" + uid;
  try { if (w.localStorage.getItem(key)) return; } catch (e) {}
  function done(sent) {
    try { w.localStorage.setItem(key, "1"); } catch (e) {}
    var anon = null;
    try { anon = w.localStorage.getItem("itg_anon"); } catch (e) {}
    try {
      navigator.sendBeacon("/api/track", JSON.stringify({ event: ${v(SENT_EVENT)}, path: w.location.pathname, props: { via: via, sent: sent }, anon_id: anon }));
    } catch (e) {}
  }
  var dl = w.dataLayer || [];
  for (var i = 0; i < dl.length; i++) {
    var a = dl[i];
    if (a && a[0] === "event" && a[1] === "conversion" && a[2] && a[2].send_to === label) { done(false); return; }
  }
  var tries = 0;
  (function go() {
    if (typeof w.gtag === "function") {
      w.gtag("event", "conversion", { send_to: label, transaction_id: "signup_" + uid });
      done(true);
      return;
    }
    if (++tries < 20) setTimeout(go, 300);
  })();
})();`

  return (
    <Script id="itg-signup-conversion" strategy="afterInteractive">
      {code}
    </Script>
  )
}
