// What a browser itself remembers of an earlier visit (the price test, lib/geo-pricing.ts), read once, when
// the visit begins. Later in the visit it proves nothing: a new visitor on a page outside the test answers
// the cookie banner or spins the wheel, and then walks to a priced page holding what someone from last month
// holds. So the root layout (app/layout.tsx) runs EARLIER_VISIT_SCRIPT first thing on a tab's first page,
// before anything on the page can write:
//   sessionStorage itg_had_storage  "1" if one of EARLIER_VISIT_KEYS was there, else "0". Set once per tab;
//                                   components/geo/PriceProvider.tsx sends it with the settle. Cookies are
//                                   not in it: a first page in another language sets NEXT_LOCALE on its own
//                                   response, and the proxy has already judged the cookies of that request.
//   cookie itg_fresh                a session cookie, set only when neither a key nor a cookie of VISIT_COOKIE
//                                   was there. The proxy can read it where it cannot read the storage: with
//                                   it, a cookie of VISIT_COOKIE comes from this visit (lib/geo-price-visitor.ts
//                                   hasOlderCookie). Another tab of the same browser session is the same visit.
// Neither holds an id or anything about the visitor, only yes or no.
//
// Not on /cabinet and /dashboard: they are the LinkedIn/X product, not part of the test. The check loses nothing:
// without a sign-in the proxy sends those addresses to /login (middleware.ts), where this runs; with one, the
// session cookie alone makes the browser an earlier visitor (lib/geo-price-visitor.ts hasOlderCookie). What the
// cabinet writes to the storage can only count as an earlier visit later, which means the one price.

/** Browser storage that proves an earlier visit. */
export const EARLIER_VISIT_KEYS = [
  "cookie_consent",
  "itg_anon",
  "itg_exit_wheel",
  "itg_geo_checked",
  "itg_geo_handoff",
  "itgrows_ghost_handoff",
  "ge_user",
  "itgrows_onboarding_done",
  "itgrows_guide_seen",
  "x_onboarding_seen",
] as const

export const EARLIER_VISIT_STAMP = "itg_had_storage"
export const FRESH_VISIT_COOKIE = "itg_fresh"

/** Cookies from an earlier visit, unless the visit began without any: all of these can also come up during
 *  this visit, on a page outside the test (the optional ones after "Accept", the wheel's, the language). */
export const VISIT_COOKIE = /^(?:itg_wheel|itg_exit_wheel|itg_gclid|NEXT_LOCALE|_gcl_.+|_fbp|_fbc|_clck|_clsk|_cs_.+)$/

export const EARLIER_VISIT_SCRIPT = `
(function () {
  try {
    if (/^\\/(cabinet|dashboard)(\\/|$)/.test(location.pathname)) return;
    var stamp = ${JSON.stringify(EARLIER_VISIT_STAMP)}, fresh = ${JSON.stringify(FRESH_VISIT_COOKIE)};
    if (sessionStorage.getItem(stamp) !== null) return;
    var names = document.cookie.split(/;\\s*/).map(function (c) { return c.split('=')[0]; });
    var clean = names.indexOf(fresh) >= 0;
    var had = !clean && ${JSON.stringify(EARLIER_VISIT_KEYS)}.some(function (k) { return localStorage.getItem(k) !== null; });
    sessionStorage.setItem(stamp, had ? '1' : '0');
    var visit = new RegExp(${JSON.stringify(VISIT_COOKIE.source)});
    if (!had && !clean && !names.some(function (n) { return visit.test(n); })) {
      document.cookie = fresh + '=1; path=/; samesite=lax' + (location.protocol === 'https:' ? '; secure' : '');
    }
  } catch (e) {}
})();
`
