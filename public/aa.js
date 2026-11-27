/* ItGrows Agent Analytics: counts visitors who arrive from an AI assistant (ChatGPT, Perplexity, Claude, Gemini,
   Copilot, …) by referrer or utm_source. Nothing else is sent: no cookies, no personal data, no page views of
   other visitors. Install: <script async src="https://www.itgrows.ai/aa.js" data-site="example.com"></script> */
(function () {
  try {
    var s = document.currentScript;
    var site = (s && s.getAttribute("data-site")) || location.hostname.replace(/^www\./, "");
    var q = new URLSearchParams(location.search);
    var utm = q.get("utm_source") || "";
    var refHost = "";
    try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
    var re = /chatgpt|openai|perplexity|claude|anthropic|gemini|bard|copilot|meta\.ai|grok|deepseek|you\.com|phind|mistral/i;
    if (!re.test(refHost) && !re.test(utm)) return;
    var key = "aa_sent:" + location.pathname;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch (e) {}
    var body = JSON.stringify({
      site: site, kind: "referral", ref: refHost, path: location.pathname,
      utm_source: utm, utm_medium: q.get("utm_medium") || "", utm_campaign: q.get("utm_campaign") || ""
    });
    var url = "https://www.itgrows.ai/api/aa/collect";
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }));
    else fetch(url, { method: "POST", body: body, keepalive: true, mode: "no-cors" });
  } catch (e) {}
})();
