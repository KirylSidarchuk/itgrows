import { defineMessages } from "../messages"
import { ENTITY_ABOUT, ENTITY_ONE_LINER } from "@/lib/entity"

// app/page.tsx ("/", and /de, /fr, /es, /ru): metadata, the page's own sections, the FAQ and the
// human-readable structured data. Paths and the yearly discount come in as arguments; no plan price is
// named: under the price test (lib/geo-pricing.ts PRICE_TEST, since 28 Oct 2026) the price is shown
// only in the cabinet, "you see your price after your free report". The detailed report is free once
// an account is created (since 27 Oct 2026).
// Since 30 Oct 2026 the page's headline promise is the growth guarantee (growthGuarantee.ts,
// /terms#growth-guarantee). No other guarantee word, no invented numbers or cases, no plan price, no
// client results (removed by the owner 30 Oct). The FAQ's only figures are the sourced ones of the
// "why" block (geoSections.ts why), with their sources.
// Terms used the same way across the GEO pages: report = Bericht / rapport / informe / отчёт; the plan
// (paid) = Plan / abonnement / plan / подписка; our plan for a site = Maßnahmenplan / plan d'action /
// plan de acción / план действий; setup = Einrichtung / mise en place / configuración inicial / настройка;
// quick check = Schnellcheck / vérification rapide / comprobación rápida / быстрая проверка.

type FaqVars = {
  /** The sample report's path in this language. */
  sample: string
  /** The yearly discount, already formatted ("20%"). */
  yearOff: string
}
type Faq = { q: string; a: string }[]

const en = {
  metaTitle: "Get recommended by ChatGPT, not your competitors | ItGrows",
  metaDescription:
    "Your customers ask ChatGPT who to choose. ItGrows gets your business into the answers of ChatGPT, Claude, Gemini and Perplexity. Free check in 30 seconds.",
  ogTitle: "Your customers ask ChatGPT who to pick. Make it you.",
  ogDescription: "See in 30 seconds who ChatGPT and Perplexity name instead of you. Free. Then we get you into the answers.",

  // Structured data (JSON-LD)
  orgDescription: ENTITY_ONE_LINER,
  appName: "ItGrows AI visibility check",
  appDescription:
    "A 30-second check of whether ChatGPT and Perplexity name a business when its buyers ask: five buyer questions generated from the site, answered live with web search, with the businesses named instead and the sites cited. Free: two answers show in full right away, all five once you create an account.",
  serviceName: "ItGrows — AI visibility (GEO)",
  serviceType: "Generative engine optimisation and content publishing",
  serviceDescription:
    "Gets a business named when its customers ask ChatGPT, Claude, Gemini and Perplexity: answer articles on the business's own domain, crawler and indexing fixes, profiles prepared on the sites the assistants quote, and the customers' questions re-asked to all four assistants every two weeks.",
  offerReport: "Detailed AI visibility report",

  // Navigation, in the page's order
  navWhy: "Why now",
  navHow: "How it works",
  navPricing: "Pricing",
  navTools: "Tools",
  navGuides: "Guides",
  navLinkedIn: "LinkedIn & X posts",
  checkMySite: "Check my site free",

  // Hero: <g> is the gradient part. The guarantee under it is growthGuarantee.ts.
  h1: "Get named by <g>ChatGPT, Claude, Gemini and Perplexity.</g> Not your competitors.",
  lead: "We get you into the answers: we open your site to the assistants, publish the pages they quote on your own domain, get you onto the sites they cite, and re-ask your customers' questions every two weeks, pushing wherever you're still missing.",

  // The LinkedIn/X product, one line
  founder: (from: string) =>
    `<b>Founder or expert?</b> ItGrows also drafts your LinkedIn and X posts in your own voice — from ${from}/month, 14-day free trial.`,
  founderCta: "LinkedIn & X posts →",
  openCabinet: "Open your cabinet",

  // Pricing section
  talkFirst: "Or talk to us first →",
  liPlans: (personal: string, duo: string, allIn: string) =>
    `LinkedIn & X ghostwriting: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>see plans</link>`,

  // Contact (#apply), with the guarantee above the form
  writeTitle: "Ask a person before you start",
  writeLead: "Your site, your field, who's named in your place, the plan: ask anything. We reply within a day.",

  // FAQ: the same 15 questions in the same order in every language
  faqTitle: "Questions",
  faq: ({ sample, yearOff }: FaqVars): Faq => [
    { q: "What is ItGrows?", a: ENTITY_ABOUT[0] },
    {
      q: "Will ChatGPT name us?",
      a: "That's the job, and we back it. In 90 days, AI assistants will name you more often than on launch day — or we work for free.* We open your site to the assistants' crawlers, get your pages into the index each one searches, publish the answers they quote on your own domain, and prepare your profiles on the sites they cite. Every two weeks we re-ask your customers' questions to ChatGPT, Claude, Gemini and Perplexity, show you the count against day 0, and push wherever you're still missing. Conditions of the guarantee: itgrows.ai/terms#growth-guarantee.",
    },
    {
      q: "What do we lose by waiting?",
      a: "The customers who are asking right now. 45% of US consumers use ChatGPT and other AI tools for local business recommendations, up from 6% a year earlier (BrightLocal, 2026). 69% of B2B software buyers chose a different vendor than they had planned because a chatbot recommended it (G2, March 2026). Each answer names a few businesses. If you're not one of them, the customer goes to whoever is.",
    },
    {
      q: "How will we know it's working?",
      a: "You see it every two weeks. The same questions your customers ask go to ChatGPT, Claude, Gemini and Perplexity, several times each, and we count against day 0 the answers that name you and the sites they cite. On blogs we host, the server log also shows AI crawlers fetching your pages and assistants pulling specific articles into live answers: ChatGPT-User and Perplexity-User only show up mid-conversation.",
    },
    {
      q: "How fast do we start?",
      a: "Setup runs in the first two weeks: your site opened to the AI crawlers and set up in the indexes the assistants search. New articles go out every month after that, and every two weeks you see the count against day 0. The assistants are forming their picks in your field now. Every month you wait, those picks go to someone else.",
    },
    {
      q: "How is this different from an SEO agency?",
      a: "An SEO agency chases rankings in one index. In ChatGPT your customer doesn't see rankings: they read one answer that names a few businesses. Each assistant searches a different index (Bing, Brave, Google or its own), so we work all four and count names, not positions. And we do the work instead of advising: where a fix needs your developer, we hand over the exact lines and check that it worked.",
    },
    {
      q: "Is this AI blog spam on my domain?",
      a: "No. Every article is researched on live search, every source is read before it is cited, and an editor pass checks each claim against your facts. You set the positions, and you see every article 2 days before it goes live: edit it or stop it. Nothing goes out that you wouldn't put your name on.",
    },
    {
      q: "Do you give us a guide to do it ourselves, or do the work?",
      a: "We do the work. The free detailed report is the diagnosis and our plan: where you stand in all four assistants, who is named instead of you, and what we'll do to get you in. On the plan we carry it out: answer pages on your domain, crawler and indexing fixes, your profiles on the sites the assistants quote, and a recount every two weeks. From you: approving articles, and the few logins only you can give.",
    },
    {
      q: "Which assistants do you cover?",
      a: "ChatGPT, Claude, Gemini and Perplexity. We ask each one through its own API with web search on, the way your customers get their answers. On the plan every question is asked three times, because answers vary; the free report asks each question once.",
    },
    {
      q: "What does the detailed report cost?",
      a: `Nothing: the full report is free once you create an account, for one site per account. The quick check on this page is free too and takes about 30 seconds: 5 questions to ChatGPT and Perplexity, with two answers shown in full right away and all five once you create an account. With the account we also build the detailed report for your site — 20 questions to ChatGPT, Claude, Gemini and Perplexity — and all of it is open: every answer, everyone named instead of you, the sites the assistants quote, and our plan to get you in. A real one: itgrows.ai${sample}.`,
    },
    {
      q: "What does the plan cost?",
      a: `You see your price after your free report: it is shown in your account before you pay anything. The plan is billed by the month, month to month, plus a one-time setup (your site and its indexes made ready, delivered as a launch report); the setup is free when you pay for 3 months upfront or for a year, and a year is ${yearOff} off. The detailed report is included.`,
    },
    {
      q: "Who is this for?",
      a: "Any business whose customers ask an AI assistant before they buy: who to hire, which product to pick, who to call nearby. If you have real expertise and competitors who would gladly take your customers, it's for you. The free check shows in 30 seconds whether ChatGPT and Perplexity name you.",
    },
    {
      q: "Will this send us traffic from ChatGPT?",
      a: "The prize is the name, not the click. Assistants usually answer in place: your customer gets a shortlist instead of ten links and picks from it. We get you onto that shortlist, and count every two weeks whether you're named and linked.",
    },
    {
      q: "Is ItGrows a LinkedIn tool or an AI visibility service?",
      a: "An AI visibility (GEO) service for businesses. The LinkedIn and X post drafting you may have seen is a separate product for founders and experts, at itgrows.ai/personal.",
    },
    { q: "I use ItGrows for LinkedIn. Where is my cabinet?", a: "Where it always was: Sign in, then LinkedIn & X cabinet. Nothing changed for your posts, plan or billing." },
  ],

  // The two tools
  toolsTitle: "Two free checks",
  toolsLead: "Find out what's keeping you out of the answer.",
  quickChecks: [
    { title: "Does ChatGPT recommend you, or a competitor?", line: "Five questions your buyers ask, put live to ChatGPT and Perplexity, and who gets named instead of you." },
    { title: "Is your site locking AI out?", line: "Your sitemap pages against robots.txt for GPTBot, ClaudeBot, PerplexityBot and more." },
  ],
  runIt: "Run it free",

  // Latest guides (the guides themselves are in English)
  guidesTitle: "Guides on AI visibility",
  allGuides: "All guides →",
  expertsBlog: "How AI assistants find and name experts →",
}

export default defineMessages(en, {
  de: {
    metaTitle: "Von ChatGPT empfohlen werden, nicht Ihr Wettbewerber | ItGrows",
    metaDescription:
      "Ihre Kunden fragen ChatGPT, wen sie wählen sollen. ItGrows bringt Ihr Unternehmen in die Antworten von ChatGPT, Claude, Gemini und Perplexity. Kostenloser Check, 30 Sekunden.",
    ogTitle: "Ihre Kunden fragen ChatGPT, wen sie wählen sollen. Sorgen Sie dafür, dass Sie es sind.",
    ogDescription: "Sehen Sie in 30 Sekunden, wen ChatGPT und Perplexity statt Ihnen nennen. Kostenlos. Dann bringen wir Sie in die Antworten.",

    orgDescription:
      "ItGrows ist ein Dienst für KI-Sichtbarkeit (Generative Engine Optimization, GEO), der dafür sorgt, dass Unternehmen genannt werden, wenn ihre Kunden ChatGPT, Claude, Gemini und Perplexity fragen: Er veröffentlicht Antwortseiten auf der eigenen Website des Unternehmens, macht die Website für KI-Crawler und Suchindizes lesbar und stellt die Fragen der Kunden alle zwei Wochen erneut allen vier Assistenten.",
    appName: "ItGrows KI-Sichtbarkeitscheck",
    appDescription:
      "Ein 30-Sekunden-Check, ob ChatGPT und Perplexity ein Unternehmen nennen, wenn seine Kunden fragen: fünf Kundenfragen, aus der Website abgeleitet und live mit Websuche beantwortet, dazu die stattdessen genannten Unternehmen und die zitierten Websites. Kostenlos: zwei Antworten sofort vollständig, alle fünf, sobald Sie ein Konto anlegen.",
    serviceName: "ItGrows — KI-Sichtbarkeit (GEO)",
    serviceType: "Generative Engine Optimization und Veröffentlichung von Inhalten",
    serviceDescription:
      "Sorgt dafür, dass ein Unternehmen genannt wird, wenn seine Kunden ChatGPT, Claude, Gemini und Perplexity fragen: Antwortartikel auf der eigenen Domain des Unternehmens, Korrekturen bei Crawler-Zugriff und Indexierung, vorbereitete Profile auf den Websites, die die Assistenten zitieren, und alle zwei Wochen die Fragen der Kunden erneut an alle vier Assistenten.",
    offerReport: "Ausführlicher Bericht zur KI-Sichtbarkeit",

    navWhy: "Warum jetzt",
    navHow: "So funktioniert es",
    navPricing: "Preise",
    navTools: "Tools",
    navGuides: "Leitfäden",
    navLinkedIn: "LinkedIn- & X-Posts",
    checkMySite: "Website kostenlos prüfen",

    h1: "Lassen Sie sich von <g>ChatGPT, Claude, Gemini und Perplexity</g> nennen. Nicht Ihre Wettbewerber.",
    lead: "Wir bringen Sie in die Antworten: Wir öffnen Ihre Website für die Assistenten, veröffentlichen auf Ihrer eigenen Domain die Seiten, die sie zitieren, bringen Sie auf die Websites, auf die sie sich stützen, und stellen alle zwei Wochen die Fragen Ihrer Kunden erneut – und legen überall nach, wo Sie noch fehlen.",

    founder: (from) =>
      `<b>Gründer oder Experte?</b> ItGrows entwirft auch Ihre LinkedIn- und X-Posts in Ihrer eigenen Stimme — ab ${from}/Monat, 14 Tage zum Testen.`,
    founderCta: "LinkedIn- & X-Posts →",
    openCabinet: "Zu Ihrem Bereich",

    talkFirst: "Oder sprechen Sie zuerst mit uns →",
    liPlans: (personal, duo, allIn) =>
      `LinkedIn- & X-Ghostwriting: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>Pläne ansehen</link>`,

    writeTitle: "Fragen Sie einen Menschen, bevor Sie starten",
    writeLead: "Ihre Website, Ihre Branche, wer an Ihrer Stelle genannt wird, der Plan: Fragen Sie, was Sie wollen. Wir antworten innerhalb eines Tages.",

    faqTitle: "Fragen",
    faq: ({ sample, yearOff }) => [
      {
        q: "Was ist ItGrows?",
        a: "ItGrows sorgt dafür, dass ein Unternehmen genannt wird, wenn seine Kunden einen KI-Assistenten fragen. Wir stellen ChatGPT, Claude, Gemini und Perplexity die Fragen, die diese Kunden stellen, jeweils mehrmals, und sehen, wer an seiner Stelle genannt wird und welche Websites zitiert werden. Dann erledigen wir die Arbeit: Wir öffnen die Website für KI-Crawler und Suchindizes, veröffentlichen auf der eigenen Domain des Unternehmens Seiten, die diese Fragen beantworten, und bereiten seine Profile auf den Websites vor, die die Assistenten zitieren. Alle zwei Wochen fragen wir erneut und legen überall nach, wo das Unternehmen noch fehlt.",
      },
      {
        q: "Wird ChatGPT uns nennen?",
        a: "Genau dafür arbeiten wir, und wir stehen dafür ein: In 90 Tagen nennen KI-Assistenten Sie öfter als am Starttag – oder wir arbeiten kostenlos.* Wir öffnen Ihre Website für die Crawler der Assistenten, bringen Ihre Seiten in den Index, den jeder von ihnen durchsucht, veröffentlichen auf Ihrer eigenen Domain die Antworten, die sie zitieren, und bereiten Ihre Profile auf den Websites vor, auf die sie sich stützen. Alle zwei Wochen stellen wir ChatGPT, Claude, Gemini und Perplexity die Fragen Ihrer Kunden erneut, zeigen Ihnen die Zählung im Vergleich zu Tag 0 und legen überall nach, wo Sie noch fehlen. Bedingungen der Garantie (auf Englisch): itgrows.ai/terms#growth-guarantee.",
      },
      {
        q: "Was verlieren wir, wenn wir warten?",
        a: "Die Kunden, die genau jetzt fragen. 45 % der US-Verbraucher nutzen ChatGPT und andere KI-Tools für Empfehlungen zu lokalen Unternehmen, ein Jahr zuvor waren es 6 % (BrightLocal, 2026). 69 % der B2B-Softwarekäufer haben sich für einen anderen Anbieter entschieden als geplant, weil ein Chatbot ihn empfohlen hat (G2, März 2026). Jede Antwort nennt ein paar Unternehmen. Sind Sie nicht dabei, geht der Kunde zu dem, der dabei ist.",
      },
      {
        q: "Woran sehen wir, dass es wirkt?",
        a: "Sie sehen es alle zwei Wochen. Dieselben Fragen, die Ihre Kunden stellen, gehen an ChatGPT, Claude, Gemini und Perplexity, jeweils mehrmals, und wir zählen im Vergleich zu Tag 0 die Antworten, die Sie nennen, und die Websites, die sie zitieren. Bei Blogs, die wir hosten, zeigt das Server-Log außerdem, wie KI-Crawler Ihre Seiten abrufen und Assistenten bestimmte Artikel in Live-Antworten holen: ChatGPT-User und Perplexity-User tauchen nur mitten in einem Gespräch auf.",
      },
      {
        q: "Wie schnell legen wir los?",
        a: "Die Einrichtung läuft in den ersten zwei Wochen: Ihre Website wird für die KI-Crawler geöffnet und in den Indizes eingerichtet, die die Assistenten durchsuchen. Danach gehen jeden Monat neue Artikel live, und alle zwei Wochen sehen Sie die Zählung im Vergleich zu Tag 0. Die Assistenten legen sich gerade jetzt fest, wen sie in Ihrer Branche nennen. Mit jedem Monat, den Sie warten, gehen diese Plätze an jemand anderen.",
      },
      {
        q: "Was unterscheidet das von einer SEO-Agentur?",
        a: "Eine SEO-Agentur jagt Rankings in einem einzigen Index. In ChatGPT sieht Ihr Kunde keine Rankings: Er liest eine Antwort, die ein paar Unternehmen nennt. Jeder Assistent durchsucht einen anderen Index (Bing, Brave, Google oder einen eigenen), also bearbeiten wir alle vier und zählen Nennungen, nicht Positionen. Und wir erledigen die Arbeit, statt zu beraten: Wo eine Korrektur Ihren Entwickler braucht, geben wir ihm die genauen Zeilen und prüfen, ob sie gewirkt hat.",
      },
      {
        q: "Ist das KI-Blog-Spam auf meiner Domain?",
        a: "Nein. Jeder Artikel wird mit Live-Suche recherchiert, jede Quelle wird gelesen, bevor sie zitiert wird, und ein Lektorat prüft jede Aussage anhand Ihrer Fakten. Sie legen die Positionen fest und sehen jeden Artikel 2 Tage vor der Veröffentlichung: Bearbeiten Sie ihn oder stoppen Sie ihn. Es geht nichts raus, was Sie nicht mit Ihrem Namen unterschreiben würden.",
      },
      {
        q: "Geben Sie uns eine Anleitung zum Selbermachen, oder erledigen Sie die Arbeit?",
        a: "Wir erledigen die Arbeit. Der kostenlose ausführliche Bericht ist die Diagnose und unser Maßnahmenplan: wo Sie in allen vier Assistenten stehen, wer statt Ihnen genannt wird und was wir tun, um Sie in die Antworten zu bringen. Im Plan setzen wir ihn um: Antwortseiten auf Ihrer Domain, Korrekturen bei Crawler-Zugriff und Indexierung, Ihre Profile auf den Websites, die die Assistenten zitieren, und alle zwei Wochen eine neue Zählung. Von Ihnen: Artikel freigeben und die wenigen Zugänge, die nur Sie geben können.",
      },
      {
        q: "Welche Assistenten decken Sie ab?",
        a: "ChatGPT, Claude, Gemini und Perplexity. Wir fragen jeden über seine eigene API mit aktivierter Websuche, so wie Ihre Kunden ihre Antworten bekommen. Im Plan stellen wir jede Frage dreimal, weil die Antworten schwanken; der kostenlose Bericht stellt jede Frage einmal.",
      },
      {
        q: "Was kostet der ausführliche Bericht?",
        a: `Nichts: Der vollständige Bericht ist kostenlos, sobald Sie ein Konto anlegen, für eine Website pro Konto. Der Schnellcheck auf dieser Seite ist ebenfalls kostenlos und dauert etwa 30 Sekunden: 5 Fragen an ChatGPT und Perplexity; zwei Antworten sehen Sie sofort vollständig, alle fünf, sobald Sie ein Konto anlegen. Mit dem Konto erstellen wir außerdem den ausführlichen Bericht für Ihre Website — 20 Fragen an ChatGPT, Claude, Gemini und Perplexity —, und alles darin ist offen: jede Antwort, alle, die statt Ihnen genannt werden, die Websites, die die Assistenten zitieren, und unser Maßnahmenplan, mit dem wir Sie in die Antworten bringen. Ein echtes Beispiel (auf Englisch): itgrows.ai${sample}.`,
      },
      {
        q: "Was kostet der Plan?",
        a: `Ihren Preis sehen Sie nach Ihrem kostenlosen Bericht: Er steht in Ihrem Konto, bevor Sie etwas bezahlen. Der Plan wird monatlich abgerechnet und ist monatlich kündbar, dazu kommt eine einmalige Einrichtung (Ihre Website und ihre Indizes werden startklar gemacht, geliefert als Startbericht); die Einrichtungsgebühr entfällt, wenn Sie 3 Monate im Voraus oder ein Jahr zahlen, und ein Jahr kostet ${yearOff} weniger. Der ausführliche Bericht ist inbegriffen.`,
      },
      {
        q: "Für wen ist das?",
        a: "Für jedes Unternehmen, dessen Kunden vor dem Kauf einen KI-Assistenten fragen: wen man beauftragt, welches Produkt man nimmt, wen man in der Nähe anruft. Wenn Sie echte Expertise haben und Wettbewerber, die Ihnen gern die Kunden abnehmen würden, ist es für Sie. Der kostenlose Check zeigt in 30 Sekunden, ob ChatGPT und Perplexity Sie nennen.",
      },
      {
        q: "Bringt uns das Traffic von ChatGPT?",
        a: "Was zählt, ist die Nennung, nicht der Klick. Assistenten antworten meist direkt im Chat: Ihr Kunde bekommt statt zehn Links eine kurze Auswahl und entscheidet sich daraus. Wir bringen Sie in diese Auswahl und zählen alle zwei Wochen, ob Sie genannt und verlinkt werden.",
      },
      {
        q: "Ist ItGrows ein LinkedIn-Tool oder ein Dienst für KI-Sichtbarkeit?",
        a: "Ein Dienst für KI-Sichtbarkeit (GEO) für Unternehmen. Die Entwürfe für LinkedIn- und X-Posts, die Sie vielleicht kennen, sind ein separates Produkt für Gründer und Experten unter itgrows.ai/personal.",
      },
      {
        q: "Ich nutze ItGrows für LinkedIn. Wo ist mein Bereich?",
        a: "Wo er immer war: Anmelden, dann LinkedIn- & X-Bereich. An Ihren Posts, Ihrem Plan und Ihrer Abrechnung hat sich nichts geändert.",
      },
    ],

    toolsTitle: "Zwei kostenlose Checks",
    toolsLead: "Finden Sie heraus, was Sie aus der Antwort heraushält.",
    quickChecks: [
      { title: "Empfiehlt ChatGPT Sie – oder einen Wettbewerber?", line: "Fünf Fragen, die Ihre Kunden stellen, live an ChatGPT und Perplexity – und wer statt Ihnen genannt wird." },
      { title: "Sperrt Ihre Website die KI aus?", line: "Die Seiten Ihrer Sitemap, geprüft gegen robots.txt für GPTBot, ClaudeBot, PerplexityBot und weitere." },
    ],
    runIt: "Kostenlos starten",

    guidesTitle: "Leitfäden zur KI-Sichtbarkeit",
    allGuides: "Alle Leitfäden →",
    expertsBlog: "Wie KI-Assistenten Experten finden und nennen →",
  },

  fr: {
    metaTitle: "Recommandé par ChatGPT, pas vos concurrents | ItGrows",
    metaDescription:
      "Vos clients demandent à ChatGPT qui choisir. ItGrows fait entrer votre entreprise dans les réponses de ChatGPT, Claude, Gemini et Perplexity. Test gratuit en 30 s.",
    ogTitle: "Vos clients demandent à ChatGPT qui choisir. Faites que ce soit vous.",
    ogDescription: "Voyez en 30 secondes qui ChatGPT et Perplexity mentionnent à votre place. Gratuit. Ensuite, nous vous faisons entrer dans les réponses.",

    orgDescription:
      "ItGrows est un service de visibilité dans l’IA (generative engine optimization, GEO) qui fait mentionner les entreprises quand leurs clients interrogent ChatGPT, Claude, Gemini et Perplexity : il publie des pages de réponse sur le propre site de l’entreprise, rend le site lisible pour les robots d’IA et les index de recherche, et repose les questions des clients aux quatre assistants toutes les deux semaines.",
    appName: "Test de visibilité IA ItGrows",
    appDescription:
      "Une vérification en 30 secondes : ChatGPT et Perplexity mentionnent-ils une entreprise quand ses clients posent la question ? Cinq questions de clients générées à partir du site, posées en direct avec la recherche web, avec les entreprises mentionnées à sa place et les sites cités. Gratuit : deux réponses complètes tout de suite, les cinq dès que vous créez un compte.",
    serviceName: "ItGrows — visibilité dans l’IA (GEO)",
    serviceType: "Optimisation pour les moteurs génératifs et publication de contenus",
    serviceDescription:
      "Fait mentionner une entreprise quand ses clients interrogent ChatGPT, Claude, Gemini et Perplexity : des articles de réponse sur le propre domaine de l’entreprise, des corrections de l’accès des robots et de l’indexation, des profils préparés sur les sites que citent les assistants, et les questions des clients reposées aux quatre assistants toutes les deux semaines.",
    offerReport: "Rapport détaillé de visibilité dans l’IA",

    navWhy: "Pourquoi maintenant",
    navHow: "Fonctionnement",
    navPricing: "Tarifs",
    navTools: "Outils",
    navGuides: "Guides",
    navLinkedIn: "LinkedIn et X",
    checkMySite: "Vérifier mon site gratuitement",

    h1: "Faites-vous recommander par <g>ChatGPT, Claude, Gemini et Perplexity.</g> Pas vos concurrents.",
    lead: "Nous vous faisons entrer dans les réponses : nous ouvrons votre site aux assistants, publions sur votre propre domaine les pages qu’ils citent, vous plaçons sur les sites qui leur servent de sources, et reposons les questions de vos clients toutes les deux semaines, en poussant partout où vous manquez encore.",

    founder: (from) =>
      `<b>Fondateur ou expert ?</b> ItGrows rédige aussi vos posts LinkedIn et X dans votre style — à partir de ${from}/mois, 14 jours d’essai.`,
    founderCta: "Posts LinkedIn et X →",
    openCabinet: "Ouvrir votre espace",

    talkFirst: "Ou parlez-nous d’abord →",
    liPlans: (personal, duo, allIn) =>
      `Ghostwriting LinkedIn et X : Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>voir les formules</link>`,

    writeTitle: "Posez vos questions à une personne avant de commencer",
    writeLead: "Votre site, votre secteur, qui est mentionné à votre place, l’abonnement : demandez ce que vous voulez. Nous répondons sous 24 heures.",

    faqTitle: "Questions fréquentes",
    faq: ({ sample, yearOff }) => [
      {
        q: "Qu’est-ce qu’ItGrows ?",
        a: "ItGrows fait mentionner une entreprise quand ses clients interrogent un assistant IA. Nous posons à ChatGPT, Claude, Gemini et Perplexity les questions que posent ces clients, plusieurs fois chacune, et voyons qui est mentionné à sa place et quels sites sont cités. Puis nous faisons le travail : nous ouvrons le site aux robots d’IA et aux index de recherche, publions sur le propre domaine de l’entreprise des pages qui répondent à ces questions, et préparons ses profils sur les sites que citent les assistants. Toutes les deux semaines, nous reposons les questions et poussons partout où l’entreprise manque encore.",
      },
      {
        q: "ChatGPT va-t-il nous mentionner ?",
        a: "C’est notre travail, et nous nous y engageons. Dans 90 jours, les assistants IA vous mentionneront plus souvent qu’au lancement — ou nous travaillons gratuitement.* Nous ouvrons votre site aux robots des assistants, faisons entrer vos pages dans l’index où chacun cherche, publions sur votre propre domaine les réponses qu’ils citent et préparons vos profils sur les sites qui leur servent de sources. Toutes les deux semaines, nous reposons les questions de vos clients à ChatGPT, Claude, Gemini et Perplexity, vous montrons le décompte comparé au jour 0 et poussons partout où vous manquez encore. Conditions de la garantie (en anglais) : itgrows.ai/terms#growth-guarantee.",
      },
      {
        q: "Que perdons-nous à attendre ?",
        a: "Les clients qui posent la question en ce moment. 45 % des consommateurs américains utilisent ChatGPT et d’autres outils d’IA pour obtenir des recommandations d’entreprises locales, contre 6 % un an plus tôt (BrightLocal, 2026). 69 % des acheteurs de logiciels B2B ont choisi un autre fournisseur que prévu parce qu’un chatbot le recommandait (G2, mars 2026). Chaque réponse mentionne quelques entreprises. Si vous n’y figurez pas, le client part chez ceux qui y figurent.",
      },
      {
        q: "Comment saurons-nous que ça marche ?",
        a: "Vous le voyez toutes les deux semaines. Les questions que posent vos clients partent à ChatGPT, Claude, Gemini et Perplexity, plusieurs fois chacune, et nous comptons, par rapport au jour 0, les réponses qui vous mentionnent et les sites qu’elles citent. Sur les blogs que nous hébergeons, le journal serveur montre aussi les robots d’IA qui récupèrent vos pages et les assistants qui puisent des articles précis pour des réponses en direct : ChatGPT-User et Perplexity-User n’apparaissent qu’en pleine conversation.",
      },
      {
        q: "En combien de temps démarre-t-on ?",
        a: "La mise en place se fait dans les deux premières semaines : votre site ouvert aux robots d’IA et configuré dans les index où cherchent les assistants. Ensuite, de nouveaux articles sortent chaque mois, et toutes les deux semaines vous voyez le décompte comparé au jour 0. Les assistants sont en train de faire leurs choix dans votre secteur. Chaque mois d’attente, ces places vont à quelqu’un d’autre.",
      },
      {
        q: "En quoi est-ce différent d’une agence SEO ?",
        a: "Une agence SEO court après des positions dans un seul index. Dans ChatGPT, votre client ne voit pas de classement : il lit une réponse qui mentionne quelques entreprises. Chaque assistant cherche dans un index différent (Bing, Brave, Google ou le sien), alors nous travaillons les quatre et comptons des mentions, pas des positions. Et nous faisons le travail au lieu de conseiller : quand une correction demande votre développeur, nous lui remettons les lignes exactes et vérifions qu’elle a fonctionné.",
      },
      {
        q: "Est-ce du spam de blog généré par IA sur mon domaine ?",
        a: "Non. Chaque article est documenté par une recherche en direct, chaque source est lue avant d’être citée, et une relecture éditoriale vérifie chaque affirmation au regard de vos faits. C’est vous qui fixez vos prises de position, et vous voyez chaque article 2 jours avant sa mise en ligne : modifiez-le ou arrêtez-le. Rien ne sort que vous ne signeriez pas de votre nom.",
      },
      {
        q: "Nous donnez-vous un guide pour le faire nous-mêmes, ou faites-vous le travail ?",
        a: "Nous faisons le travail. Le rapport détaillé gratuit est le diagnostic et notre plan d’action : où vous en êtes dans les quatre assistants, qui est mentionné à votre place et ce que nous ferons pour vous faire entrer dans les réponses. Avec l’abonnement, nous l’exécutons : pages de réponse sur votre domaine, corrections de l’accès des robots et de l’indexation, vos profils sur les sites que citent les assistants, et un nouveau décompte toutes les deux semaines. De votre côté : valider les articles, et les quelques accès que vous seul pouvez donner.",
      },
      {
        q: "Quels assistants couvrez-vous ?",
        a: "ChatGPT, Claude, Gemini et Perplexity. Nous interrogeons chacun via sa propre API avec la recherche web activée, comme vos clients obtiennent leurs réponses. Avec l’abonnement, chaque question est posée trois fois, car les réponses varient ; le rapport gratuit pose chaque question une fois.",
      },
      {
        q: "Combien coûte le rapport détaillé ?",
        a: `Rien : le rapport complet est gratuit dès que vous créez un compte, pour un site par compte. La vérification rapide de cette page est gratuite elle aussi et prend environ 30 secondes : 5 questions à ChatGPT et Perplexity ; deux réponses s’affichent en entier tout de suite, les cinq dès que vous créez un compte. Avec ce compte, nous établissons aussi le rapport détaillé de votre site — 20 questions à ChatGPT, Claude, Gemini et Perplexity —, et tout y est consultable : chaque réponse, tous ceux qui sont mentionnés à votre place, les sites que citent les assistants et notre plan d’action pour vous faire entrer dans les réponses. Un vrai rapport (en anglais) : itgrows.ai${sample}.`,
      },
      {
        q: "Combien coûte l’abonnement ?",
        a: `Vous voyez votre prix après votre rapport gratuit : il s’affiche dans votre compte avant tout paiement. L’abonnement est facturé au mois, sans engagement, plus une mise en place facturée une seule fois (votre site et ses index préparés, livrés sous forme de rapport de lancement) ; la mise en place n’est pas facturée si vous payez 3 mois d’avance ou un an, et l’année bénéficie de ${yearOff} de remise. Le rapport détaillé est inclus.`,
      },
      {
        q: "À qui s’adresse ce service ?",
        a: "À toute entreprise dont les clients interrogent un assistant IA avant d’acheter : qui engager, quel produit choisir, qui appeler près de chez eux. Si vous avez une vraie expertise et des concurrents qui prendraient volontiers vos clients, c’est pour vous. La vérification gratuite montre en 30 secondes si ChatGPT et Perplexity vous mentionnent.",
      },
      {
        q: "Cela nous apportera-t-il du trafic depuis ChatGPT ?",
        a: "Ce qui compte, c’est la mention, pas le clic. Les assistants répondent généralement sur place : votre client reçoit une courte liste au lieu de dix liens, et choisit dedans. Nous vous faisons entrer dans cette liste, et comptons toutes les deux semaines si vous êtes mentionné et cité en lien.",
      },
      {
        q: "ItGrows est-il un outil LinkedIn ou un service de visibilité dans l’IA ?",
        a: "Un service de visibilité dans l’IA (GEO) pour les entreprises. La rédaction de posts LinkedIn et X que vous avez peut-être vue est un produit distinct, pour les fondateurs et les experts, sur itgrows.ai/personal.",
      },
      {
        q: "J’utilise ItGrows pour LinkedIn. Où est mon espace ?",
        a: "Là où il a toujours été : Se connecter, puis Espace LinkedIn et X. Rien n’a changé pour vos posts, votre formule ni votre facturation.",
      },
    ],

    toolsTitle: "Deux vérifications gratuites",
    toolsLead: "Découvrez ce qui vous tient à l’écart de la réponse.",
    quickChecks: [
      { title: "ChatGPT vous recommande-t-il, ou un concurrent ?", line: "Cinq questions que posent vos clients, posées en direct à ChatGPT et Perplexity, et qui est mentionné à votre place." },
      { title: "Votre site ferme-t-il la porte à l’IA ?", line: "Les pages de votre sitemap confrontées au robots.txt pour GPTBot, ClaudeBot, PerplexityBot et d’autres." },
    ],
    runIt: "Lancer gratuitement",

    guidesTitle: "Guides sur la visibilité dans l’IA (en anglais)",
    allGuides: "Tous les guides →",
    expertsBlog: "Comment les assistants IA trouvent et mentionnent les experts →",
  },

  es: {
    metaTitle: "Que ChatGPT le recomiende a usted, no a su competencia | ItGrows",
    metaDescription:
      "Sus clientes preguntan a ChatGPT a quién elegir. ItGrows mete su empresa en las respuestas de ChatGPT, Claude, Gemini y Perplexity. Comprobación gratis en 30 s.",
    ogTitle: "Sus clientes preguntan a ChatGPT a quién elegir. Que la respuesta sea usted.",
    ogDescription: "Vea en 30 segundos a quién mencionan ChatGPT y Perplexity en lugar de usted. Gratis. Después le metemos en las respuestas.",

    orgDescription:
      "ItGrows es un servicio de visibilidad en IA (generative engine optimization, GEO) que consigue que mencionen a las empresas cuando sus clientes preguntan a ChatGPT, Claude, Gemini y Perplexity: publica páginas de respuesta en el propio sitio web de la empresa, hace que el sitio sea legible para los rastreadores de IA y los índices de búsqueda, y vuelve a plantear las preguntas de los clientes a los cuatro asistentes cada dos semanas.",
    appName: "Comprobación de visibilidad en IA de ItGrows",
    appDescription:
      "Una comprobación de 30 segundos de si ChatGPT y Perplexity mencionan a una empresa cuando sus clientes preguntan: cinco preguntas de clientes generadas a partir del sitio, respondidas en directo con búsqueda web, con las empresas mencionadas en su lugar y los sitios citados. Gratis: dos respuestas completas al momento y las cinco en cuanto cree una cuenta.",
    serviceName: "ItGrows — visibilidad en IA (GEO)",
    serviceType: "Optimización para motores generativos y publicación de contenidos",
    serviceDescription:
      "Consigue que mencionen a una empresa cuando sus clientes preguntan a ChatGPT, Claude, Gemini y Perplexity: artículos de respuesta en el propio dominio de la empresa, correcciones del acceso de rastreadores y de la indexación, perfiles preparados en los sitios que citan los asistentes y las preguntas de los clientes planteadas de nuevo a los cuatro asistentes cada dos semanas.",
    offerReport: "Informe detallado de visibilidad en IA",

    navWhy: "Por qué ahora",
    navHow: "Cómo funciona",
    navPricing: "Precios",
    navTools: "Herramientas",
    navGuides: "Guías",
    navLinkedIn: "LinkedIn y X",
    checkMySite: "Comprobar mi sitio gratis",

    h1: "Que <g>ChatGPT, Claude, Gemini y Perplexity</g> le mencionen a usted. No a su competencia.",
    lead: "Le metemos en las respuestas: abrimos su sitio a los asistentes, publicamos en su propio dominio las páginas que citan, le colocamos en los sitios en los que se basan y volvemos a plantear las preguntas de sus clientes cada dos semanas, empujando allí donde aún no aparece.",

    founder: (from) =>
      `<b>¿Fundador o experto?</b> ItGrows también redacta sus publicaciones de LinkedIn y X con su propia voz — desde ${from}/mes, 14 días de prueba.`,
    founderCta: "Publicaciones en LinkedIn y X →",
    openCabinet: "Abrir su panel",

    talkFirst: "O hable antes con nosotros →",
    liPlans: (personal, duo, allIn) =>
      `Ghostwriting para LinkedIn y X: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>ver planes</link>`,

    writeTitle: "Pregunte a una persona antes de empezar",
    writeLead: "Su sitio, su sector, a quién mencionan en su lugar, el plan: pregunte lo que quiera. Respondemos en menos de un día.",

    faqTitle: "Preguntas",
    faq: ({ sample, yearOff }) => [
      {
        q: "¿Qué es ItGrows?",
        a: "ItGrows consigue que mencionen a una empresa cuando sus clientes preguntan a un asistente de IA. Planteamos a ChatGPT, Claude, Gemini y Perplexity las preguntas que hacen esos clientes, varias veces cada una, y vemos a quién mencionan en su lugar y qué sitios citan. Después hacemos el trabajo: abrimos el sitio a los rastreadores de IA y a los índices de búsqueda, publicamos en el propio dominio de la empresa páginas que responden a esas preguntas y preparamos sus perfiles en los sitios que citan los asistentes. Cada dos semanas volvemos a preguntar y empujamos allí donde la empresa aún no aparece.",
      },
      {
        q: "¿Nos mencionará ChatGPT?",
        a: "Ese es nuestro trabajo, y lo respaldamos. En 90 días, los asistentes de IA le mencionarán más veces que el día del lanzamiento — o trabajamos gratis.* Abrimos su sitio a los rastreadores de los asistentes, metemos sus páginas en el índice en el que busca cada uno, publicamos en su propio dominio las respuestas que citan y preparamos sus perfiles en los sitios en los que se basan. Cada dos semanas volvemos a plantear las preguntas de sus clientes a ChatGPT, Claude, Gemini y Perplexity, le mostramos el recuento frente al día 0 y empujamos allí donde aún no aparece. Condiciones de la garantía (en inglés): itgrows.ai/terms#growth-guarantee.",
      },
      {
        q: "¿Qué perdemos si esperamos?",
        a: "Los clientes que están preguntando ahora mismo. El 45 % de los consumidores de EE. UU. usa ChatGPT y otras herramientas de IA para obtener recomendaciones de negocios locales, frente al 6 % un año antes (BrightLocal, 2026). El 69 % de los compradores de software B2B eligió un proveedor distinto del previsto porque se lo recomendó un chatbot (G2, marzo de 2026). Cada respuesta menciona unas pocas empresas. Si usted no es una de ellas, el cliente se va con quien sí lo es.",
      },
      {
        q: "¿Cómo sabremos que funciona?",
        a: "Lo ve cada dos semanas. Las mismas preguntas que hacen sus clientes van a ChatGPT, Claude, Gemini y Perplexity, varias veces cada una, y contamos frente al día 0 las respuestas que le mencionan y los sitios que citan. En los blogs que alojamos, el registro del servidor muestra además a los rastreadores de IA descargando sus páginas y a los asistentes usando artículos concretos en respuestas en directo: ChatGPT-User y Perplexity-User solo aparecen en mitad de una conversación.",
      },
      {
        q: "¿Cuánto tardamos en empezar?",
        a: "La configuración inicial se hace en las dos primeras semanas: su sitio abierto a los rastreadores de IA y configurado en los índices en los que buscan los asistentes. Después salen artículos nuevos cada mes, y cada dos semanas ve el recuento frente al día 0. Los asistentes están eligiendo ahora a quién recomendar en su sector. Cada mes que espera, esos puestos se los lleva otro.",
      },
      {
        q: "¿En qué se diferencia de una agencia SEO?",
        a: "Una agencia SEO persigue posiciones en un solo índice. En ChatGPT su cliente no ve posiciones: lee una respuesta que menciona unas pocas empresas. Cada asistente busca en un índice distinto (Bing, Brave, Google o el suyo propio), así que trabajamos los cuatro y contamos menciones, no posiciones. Y hacemos el trabajo en lugar de asesorar: cuando un cambio necesita a su desarrollador, le entregamos las líneas exactas y comprobamos que ha funcionado.",
      },
      {
        q: "¿Es esto spam de blog hecho con IA en mi dominio?",
        a: "No. Cada artículo se investiga con búsqueda en directo, cada fuente se lee antes de citarla y una revisión editorial contrasta cada afirmación con sus datos. Usted define su punto de vista y ve cada artículo 2 días antes de que se publique: edítelo o deténgalo. No sale nada que usted no firmaría con su nombre.",
      },
      {
        q: "¿Nos dan una guía para hacerlo nosotros mismos o hacen ustedes el trabajo?",
        a: "Hacemos el trabajo. El informe detallado gratuito es el diagnóstico y nuestro plan de acción: dónde está usted en los cuatro asistentes, a quién mencionan en su lugar y qué haremos para que le mencionen. Con el plan lo ejecutamos: páginas de respuesta en su dominio, correcciones del acceso de rastreadores y de la indexación, sus perfiles en los sitios que citan los asistentes y un nuevo recuento cada dos semanas. Por su parte: aprobar artículos y los pocos accesos que solo usted puede dar.",
      },
      {
        q: "¿Qué asistentes cubren?",
        a: "ChatGPT, Claude, Gemini y Perplexity. Preguntamos a cada uno a través de su propia API con la búsqueda web activada, igual que sus clientes obtienen sus respuestas. Con el plan hacemos cada pregunta tres veces, porque las respuestas varían; el informe gratuito hace cada pregunta una vez.",
      },
      {
        q: "¿Cuánto cuesta el informe detallado?",
        a: `Nada: el informe completo es gratuito en cuanto cree una cuenta, para un sitio por cuenta. La comprobación rápida de esta página también es gratuita y tarda unos 30 segundos: 5 preguntas a ChatGPT y Perplexity; dos respuestas se ven completas al momento y las cinco, en cuanto cree una cuenta. Con esa cuenta elaboramos también el informe detallado de su sitio — 20 preguntas a ChatGPT, Claude, Gemini y Perplexity —, y todo queda a la vista: cada respuesta, todas las empresas mencionadas en su lugar, los sitios que citan los asistentes y nuestro plan de acción para que le mencionen. Un ejemplo real (en inglés): itgrows.ai${sample}.`,
      },
      {
        q: "¿Cuánto cuesta el plan?",
        a: `Verá su precio después de su informe gratuito: aparece en su cuenta antes de pagar nada. El plan se factura al mes, mes a mes, más una configuración inicial de pago único (su sitio y sus índices listos, entregados como un informe de lanzamiento); la configuración inicial no se cobra si paga 3 meses por adelantado o un año, y el año tiene un ${yearOff} de descuento. El informe detallado está incluido.`,
      },
      {
        q: "¿Para quién es esto?",
        a: "Para cualquier empresa cuyos clientes pregunten a un asistente de IA antes de comprar: a quién contratar, qué producto elegir, a quién llamar cerca de casa. Si tiene conocimientos reales y competidores que se quedarían encantados con sus clientes, es para usted. La comprobación gratuita muestra en 30 segundos si ChatGPT y Perplexity le mencionan.",
      },
      {
        q: "¿Nos traerá tráfico desde ChatGPT?",
        a: "Lo que cuenta es la mención, no el clic. Los asistentes suelen responder en el propio chat: su cliente recibe una lista corta en lugar de diez enlaces y elige de ella. Le metemos en esa lista y contamos cada dos semanas si le mencionan y le enlazan.",
      },
      {
        q: "¿ItGrows es una herramienta para LinkedIn o un servicio de visibilidad en IA?",
        a: "Un servicio de visibilidad en IA (GEO) para empresas. La redacción de publicaciones de LinkedIn y X que quizá conozca es un producto aparte para fundadores y expertos, en itgrows.ai/personal.",
      },
      {
        q: "Uso ItGrows para LinkedIn. ¿Dónde está mi panel?",
        a: "Donde siempre: Iniciar sesión y luego Panel de LinkedIn y X. Nada ha cambiado en sus publicaciones, su plan ni su facturación.",
      },
    ],

    toolsTitle: "Dos comprobaciones gratuitas",
    toolsLead: "Descubra qué le deja fuera de la respuesta.",
    quickChecks: [
      { title: "¿ChatGPT le recomienda a usted o a un competidor?", line: "Cinco preguntas que hacen sus clientes, planteadas en directo a ChatGPT y Perplexity, y a quién mencionan en su lugar." },
      { title: "¿Su sitio le cierra la puerta a la IA?", line: "Las páginas de su sitemap frente a robots.txt para GPTBot, ClaudeBot, PerplexityBot y otros." },
    ],
    runIt: "Probar gratis",

    guidesTitle: "Guías sobre visibilidad en IA (en inglés)",
    allGuides: "Todas las guías →",
    expertsBlog: "Cómo los asistentes de IA encuentran y mencionan a expertos →",
  },

  ru: {
    metaTitle: "Пусть ChatGPT рекомендует вас, а не конкурентов | ItGrows",
    metaDescription:
      "Ваши клиенты спрашивают ChatGPT, кого выбрать. ItGrows выводит ваш бизнес в ответы ChatGPT, Claude, Gemini и Perplexity. Бесплатная проверка за 30 секунд.",
    ogTitle: "Ваши клиенты спрашивают ChatGPT, кого выбрать. Пусть это будете вы.",
    ogDescription: "За 30 секунд узнайте, кого ChatGPT и Perplexity называют вместо вас. Бесплатно. А дальше мы выведем вас в ответы.",

    orgDescription:
      "ItGrows — сервис видимости в ИИ (generative engine optimization, GEO), который добивается, чтобы бизнес называли, когда его клиенты спрашивают ChatGPT, Claude, Gemini и Perplexity: публикует страницы-ответы на собственном сайте компании, делает сайт доступным для ИИ-краулеров и поисковых индексов и раз в две недели заново задаёт вопросы клиентов всем четырём ассистентам.",
    appName: "Проверка видимости в ИИ от ItGrows",
    appDescription:
      "30-секундная проверка того, называют ли ChatGPT и Perplexity компанию, когда спрашивают её клиенты: пять клиентских вопросов, составленных по сайту, с ответами в реальном времени через веб-поиск, с компаниями, которых называют вместо неё, и процитированными сайтами. Бесплатно: два ответа целиком сразу, все пять — после создания аккаунта.",
    serviceName: "ItGrows — видимость в ИИ (GEO)",
    serviceType: "Оптимизация под генеративные системы и публикация контента",
    serviceDescription:
      "Добивается, чтобы компанию называли, когда её клиенты спрашивают ChatGPT, Claude, Gemini и Perplexity: статьи-ответы на собственном домене компании, исправление доступа краулеров и индексации, подготовленные профили на сайтах, которые цитируют ассистенты, и вопросы клиентов, заново заданные всем четырём ассистентам раз в две недели.",
    offerReport: "Подробный отчёт о видимости в ИИ",

    navWhy: "Зачем",
    navHow: "Как работает",
    navPricing: "Цены",
    navTools: "Инструменты",
    navGuides: "Статьи",
    navLinkedIn: "LinkedIn и X",
    checkMySite: "Проверить сайт бесплатно",

    h1: "Пусть <g>ChatGPT, Claude, Gemini и Perplexity</g> называют вас. А не ваших конкурентов.",
    lead: "Мы выводим вас в ответы: открываем ваш сайт для ассистентов, публикуем на вашем собственном домене страницы, которые они цитируют, размещаем вас на сайтах, на которые они ссылаются, и раз в две недели заново задаём вопросы ваших клиентов — и дожимаем везде, где вас ещё нет.",

    founder: (from) =>
      `<b>Основатель или эксперт?</b> ItGrows также пишет черновики ваших постов в LinkedIn и X вашим собственным голосом — от ${from}/мес., 14 дней пробного периода.`,
    founderCta: "Посты для LinkedIn и X →",
    openCabinet: "Открыть кабинет",

    talkFirst: "Или сначала напишите нам →",
    liPlans: (personal, duo, allIn) =>
      `Гострайтинг для LinkedIn и X: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>смотреть тарифы</link>`,

    writeTitle: "Спросите человека, прежде чем начать",
    writeLead: "Ваш сайт, ваша сфера, кого называют вместо вас, подписка — спрашивайте о чём угодно. Отвечаем в течение дня.",

    faqTitle: "Вопросы",
    faq: ({ sample, yearOff }) => [
      {
        q: "Что такое ItGrows?",
        a: "ItGrows добивается, чтобы компанию называли, когда её клиенты спрашивают ИИ-ассистента. Мы задаём ChatGPT, Claude, Gemini и Perplexity вопросы, которые задают эти клиенты, по нескольку раз каждый, и видим, кого называют вместо неё и какие сайты цитируют. Затем делаем работу: открываем сайт для ИИ-краулеров и поисковых индексов, публикуем на собственном домене компании страницы, отвечающие на эти вопросы, и готовим её профили на сайтах, которые цитируют ассистенты. Раз в две недели спрашиваем снова и дожимаем везде, где компании ещё нет.",
      },
      {
        q: "ChatGPT будет нас называть?",
        a: "Это наша работа, и мы за неё отвечаем. Через 90 дней ИИ-ассистенты будут называть вас чаще, чем в день запуска, — или мы работаем бесплатно.* Мы открываем ваш сайт для краулеров ассистентов, заводим ваши страницы в индекс, по которому ищет каждый из них, публикуем на вашем собственном домене ответы, которые они цитируют, и готовим ваши профили на сайтах, на которые они ссылаются. Раз в две недели мы заново задаём вопросы ваших клиентов ChatGPT, Claude, Gemini и Perplexity, показываем подсчёт в сравнении с днём 0 и дожимаем везде, где вас ещё нет. Условия гарантии (на английском): itgrows.ai/terms#growth-guarantee.",
      },
      {
        q: "Что мы теряем, если подождём?",
        a: "Клиентов, которые спрашивают прямо сейчас. 45 % потребителей в США обращаются к ChatGPT и другим ИИ-инструментам за рекомендациями местных компаний — годом раньше таких было 6 % (BrightLocal, 2026). 69 % покупателей B2B-софта выбрали не того поставщика, которого планировали, потому что его посоветовал чат-бот (G2, март 2026). Каждый ответ называет несколько компаний. Если вас среди них нет, клиент уходит к тем, кто есть.",
      },
      {
        q: "Как мы поймём, что это работает?",
        a: "Вы видите это раз в две недели. Те же вопросы, что задают ваши клиенты, уходят в ChatGPT, Claude, Gemini и Perplexity, по нескольку раз каждый, и мы считаем в сравнении с днём 0 ответы, в которых называют вас, и сайты, которые они цитируют. В блогах, которые хостим мы, лог сервера показывает ещё и то, как ИИ-краулеры забирают ваши страницы, а ассистенты подтягивают конкретные статьи в ответы в реальном времени: ChatGPT-User и Perplexity-User появляются только посреди разговора.",
      },
      {
        q: "Как быстро мы начнём?",
        a: "Настройка проходит в первые две недели: ваш сайт открыт для ИИ-краулеров и настроен в индексах, по которым ищут ассистенты. Дальше каждый месяц выходят новые статьи, а раз в две недели вы видите подсчёт в сравнении с днём 0. Ассистенты прямо сейчас определяются, кого называть в вашей сфере. Каждый месяц ожидания эти места достаются кому-то другому.",
      },
      {
        q: "Чем это отличается от SEO-агентства?",
        a: "SEO-агентство гонится за позициями в одном индексе. В ChatGPT ваш клиент не видит позиций: он читает один ответ, в котором названы несколько компаний. Каждый ассистент ищет по своему индексу (Bing, Brave, Google или собственному), поэтому мы работаем со всеми четырьмя и считаем упоминания, а не позиции. И мы делаем работу, а не советуем: если исправление требует вашего разработчика, мы передаём ему точные строки и проверяем, что всё сработало.",
      },
      {
        q: "Это не ИИ-спам в блоге на моём домене?",
        a: "Нет. Каждая статья готовится через живой поиск, каждый источник мы читаем, прежде чем процитировать, а редакторская вычитка сверяет каждое утверждение с вашими фактами. Позиции задаёте вы, и каждую статью вы видите за 2 дня до публикации: отредактируйте или остановите. Не выходит ничего, под чем вы не подписались бы своим именем.",
      },
      {
        q: "Вы даёте инструкцию, чтобы мы всё сделали сами, или делаете работу?",
        a: "Работу делаем мы. Бесплатный подробный отчёт — это диагноз и наш план действий: где вы находитесь во всех четырёх ассистентах, кого называют вместо вас и что мы сделаем, чтобы называли вас. По подписке мы его выполняем: страницы-ответы на вашем домене, исправление доступа краулеров и индексации, ваши профили на сайтах, которые цитируют ассистенты, и новый подсчёт раз в две недели. От вас — одобрять статьи и дать те немногие доступы, которые можете дать только вы.",
      },
      {
        q: "С какими ассистентами вы работаете?",
        a: "ChatGPT, Claude, Gemini и Perplexity. Мы спрашиваем каждого через его собственный API с включённым веб-поиском — так же, как ответы получают ваши клиенты. По подписке каждый вопрос задаётся три раза, потому что ответы меняются; бесплатный отчёт задаёт каждый вопрос один раз.",
      },
      {
        q: "Сколько стоит подробный отчёт?",
        a: `Ничего: полный отчёт бесплатный — достаточно создать аккаунт, один сайт на аккаунт. Быстрая проверка на этой странице тоже бесплатна и занимает около 30 секунд: 5 вопросов к ChatGPT и Perplexity; два ответа вы видите целиком сразу, все пять — когда создадите аккаунт. С аккаунтом мы также составим подробный отчёт по вашему сайту — 20 вопросов к ChatGPT, Claude, Gemini и Perplexity — и в нём открыто всё: каждый ответ, все, кого называют вместо вас, сайты, которые цитируют ассистенты, и наш план действий, чтобы называли вас. Настоящий отчёт (на английском): itgrows.ai${sample}.`,
      },
      {
        q: "Сколько стоит подписка?",
        a: `Свою цену вы увидите после бесплатного отчёта: она показана в вашем аккаунте до любой оплаты. Подписка оплачивается помесячно, плюс разовая настройка (ваш сайт и его индексы готовятся к работе, результат — отчёт о запуске); плата за настройку не взимается, если вы платите за 3 месяца вперёд или за год, а год — со скидкой ${yearOff}. Подробный отчёт входит в стоимость.`,
      },
      {
        q: "Для кого это?",
        a: "Для любого бизнеса, клиенты которого спрашивают ИИ-ассистента перед покупкой: кого нанять, какой продукт выбрать, кому позвонить поблизости. Если у вас настоящая экспертиза и конкуренты, которые с радостью заберут ваших клиентов, — это для вас. Бесплатная проверка за 30 секунд покажет, называют ли вас ChatGPT и Perplexity.",
      },
      {
        q: "Принесёт ли это нам трафик из ChatGPT?",
        a: "Главное — упоминание, а не клик. Ассистенты обычно отвечают прямо в чате: вместо десяти ссылок ваш клиент получает короткий список и выбирает из него. Мы вносим вас в этот список и раз в две недели считаем, называют ли вас и ставят ли на вас ссылку.",
      },
      {
        q: "ItGrows — это инструмент для LinkedIn или сервис видимости в ИИ?",
        a: "Сервис видимости в ИИ (GEO) для бизнеса. Черновики постов для LinkedIn и X, которые вы могли видеть, — отдельный продукт для основателей и экспертов на itgrows.ai/personal.",
      },
      {
        q: "Я пользуюсь ItGrows для LinkedIn. Где мой кабинет?",
        a: "Там же, где и был: «Войти», затем «Кабинет LinkedIn и X». Для ваших постов, тарифа и оплаты ничего не изменилось.",
      },
    ],

    toolsTitle: "Две бесплатные проверки",
    toolsLead: "Узнайте, что не пускает вас в ответ.",
    quickChecks: [
      { title: "Кого рекомендует ChatGPT — вас или конкурента?", line: "Пять вопросов ваших клиентов — вживую в ChatGPT и Perplexity, и кого называют вместо вас." },
      { title: "Не закрыт ли ваш сайт для ИИ?", line: "Сверка страниц из вашего sitemap с robots.txt для GPTBot, ClaudeBot, PerplexityBot и других." },
    ],
    runIt: "Запустить бесплатно",

    guidesTitle: "Руководства по видимости в ИИ (на английском)",
    allGuides: "Все руководства →",
    expertsBlog: "Как ИИ-ассистенты находят и называют экспертов →",
  },
})
