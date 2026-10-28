import { defineMessages } from "../messages"
import { ENTITY_ABOUT, ENTITY_ONE_LINER } from "@/lib/entity"

// app/page.tsx ("/", and /de, /fr, /es, /ru): metadata, the page's own sections, the FAQ and the
// human-readable structured data. Paths and the yearly discount come in as arguments; no plan price is
// named: under the price test (lib/geo-pricing.ts PRICE_TEST, since 28 Oct 2026) the price is shown
// only in the cabinet, "you see your price after your free report". The detailed report is free once
// an account is created (since 27 Oct 2026).
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
  metaTitle: "AI visibility for businesses: get named by ChatGPT | ItGrows",
  metaDescription:
    "ItGrows is an AI visibility (GEO) service: answer pages on your own website and a check of four AI assistants every two weeks. Check your site free in about 30 seconds.",
  ogTitle: "Get your company named by ChatGPT, Claude, Gemini and Perplexity",
  ogDescription: "Answer pages on your own domain, crawler and indexing fixes, and a check of four assistants every two weeks.",

  // Structured data (JSON-LD)
  orgDescription: ENTITY_ONE_LINER,
  appName: "ItGrows AI visibility check",
  appDescription:
    "A 30-second check of whether ChatGPT and Perplexity name a business when its buyers ask: five buyer questions generated from the site, answered live with web search, with the businesses named instead and the sites cited. Free: two answers show in full right away, all five once you create an account.",
  serviceName: "ItGrows — AI visibility (GEO)",
  serviceType: "Generative engine optimisation and content publishing",
  serviceDescription:
    "Articles published to a customer's own domain that answer the questions buyers ask AI assistants, fixes for crawler access and indexing, and a measurement every two weeks across ChatGPT, Claude, Gemini and Perplexity of whether the business is named.",
  offerReport: "Detailed AI visibility report",

  // Navigation
  navHow: "How it works",
  navResults: "Results",
  navPricing: "Pricing",
  navTools: "Tools",
  navGuides: "Guides",
  navLinkedIn: "LinkedIn & X posts",
  checkMySite: "Check my site",

  // Hero: <g> is the gradient part
  h1: "Get your company named when buyers ask <g>ChatGPT, Claude, Gemini and Perplexity.</g>",
  lead: "We measure what four assistants answer about your field, fix what stops their crawlers and search indexes from reading your site, publish answer pages on your own domain, and count every two weeks whether each one names you.",

  // The LinkedIn/X product, one line
  founder: (from: string) =>
    `<b>Founder or expert?</b> ItGrows also drafts your LinkedIn and X posts in your own voice — from ${from}/month, 14-day free trial.`,
  founderCta: "LinkedIn & X posts →",
  openCabinet: "Open your cabinet",

  // Results
  casesTitle: "Results: two clients and our own marketplace",
  hundreds: "Hundreds",
  cases: [
    { kind: "B2B SaaS", l: "new B2B customers in one month, both from ChatGPT" },
    { kind: "iOS app", l: "of installs a month from ChatGPT, Claude and Gemini" },
    { kind: "Our own course marketplace", l: "fetches of its pages by the answer and search agents of ChatGPT and Perplexity, in two weeks" },
  ],
  casesNote: "freightsizer.ai and magiscan.app: as reported by the clients. pickaclass.com is our own course marketplace: from its server log, 28 July – 11 August 2026.",

  // Pricing section
  talkFirst: "Or talk to us first →",
  liPlans: (personal: string, duo: string, allIn: string) =>
    `LinkedIn & X ghostwriting: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>see plans</link>`,

  // Contact
  writeTitle: "Write to us",
  writeLead: "Questions about your site, the plan or anything else. We reply within a day.",

  // FAQ
  faqTitle: "Questions",
  faq: ({ sample, yearOff }: FaqVars): Faq => [
    { q: "What is ItGrows?", a: ENTITY_ABOUT[0] },
    {
      q: "Is ItGrows a LinkedIn tool or an AI visibility service?",
      a: "An AI visibility (GEO) service for businesses. The LinkedIn and X post drafting you may have seen is a separate product for founders and experts, at itgrows.ai/personal.",
    },
    { q: "Which assistants do you measure?", a: "ChatGPT, Claude, Gemini and Perplexity, through their own APIs with web search on. On the plan every question is asked three times, because their answers vary; the free report asks each question once." },
    { q: "Can you guarantee that ChatGPT will name us?", a: "No, and distrust anyone who does. No assistant sells organic placement or publishes how it chooses. We do the work that makes you findable and quotable, and we show you every two weeks what changed." },
    {
      q: "What can you actually prove?",
      a: "Three things. Whether the assistants name you: every two weeks we put the same questions your buyers ask to ChatGPT, Claude, Gemini and Perplexity, several times each, and count the answers that name you and the sites they cite. And, for blogs we host, from the server log, that crawlers fetched your pages and that assistants retrieved specific articles while answering somebody live — ChatGPT-User and Perplexity-User only appear mid-conversation. Nobody can measure every question anyone might ask; we measure the ones your buyers do.",
    },
    {
      q: "How is this different from an SEO agency?",
      a: "An SEO agency optimises for one index and counts rankings. Each assistant searches a different index — Bing, Brave, Google or its own — and we count the answers, not the rankings. We publish rather than advise; where a fix needs your developer, we give exact instructions and check that it worked.",
    },
    {
      q: "Is this AI blog spam on my domain?",
      a: "That is the right thing to fear — most of this category is exactly that. Two things stop it, neither magic: you define the positions, and you see every article 2 days before it goes live, and can edit or stop it. If you would not put your name on it, it does not go out.",
    },
    {
      q: "How long before anything happens?",
      a: "Once a page is in the right indexes, crawlers usually arrive within a week or two, and we test findability every two weeks so a gap is caught. Becoming a source an assistant reaches for repeatedly takes months and a body of work. If you need attributable revenue this quarter, buy ads — we will say so on the call rather than after your third invoice.",
    },
    {
      q: "Do you give us a guide to do it ourselves, or do the work?",
      a: `We do the work. The detailed report (free once you create an account) is the diagnosis and our plan: where you stand in all four assistants, who is named instead of you, and what we will do about it, step by step. On the plan we do that work: we publish answer pages on your domain, fix crawler access and indexing, and measure every two weeks.`,
    },
    {
      q: "What does the detailed report cost?",
      a: `Nothing: the full report is free once you create an account, for one site per account. The quick check on this page is free too and takes about 30 seconds: 5 questions to ChatGPT and Perplexity, with two answers shown in full right away and all five once you create an account. With the account we also build the detailed report for your site — 20 questions to ChatGPT, Claude, Gemini and Perplexity — and all of it is open: every answer, everyone named instead of you, the sites the assistants quote, and our plan for your site. A real one: itgrows.ai${sample}.`,
    },
    {
      q: "What does the plan cost?",
      a: `You see your price after your free report: it is shown in your account before you pay anything. The plan is billed by the month, month to month, plus a one-time setup (your site and its indexes made ready, delivered as a launch report); the setup is free when you pay for 3 months upfront or for a year, and a year is ${yearOff} off. The detailed report is included.`,
    },
    {
      q: "Who is this wrong for?",
      a: `Anyone without real expertise to publish — the engine amplifies a point of view, it cannot invent one. Anyone needing a signed guarantee. And anyone who wants the work done for the price of a software tool: the plan is priced against a fractional content hire. To see the full picture before deciding, the free report shows where you stand and what we will do.`,
    },
    { q: "Will this send us traffic from ChatGPT?", a: "Often little: assistants usually answer in place. We count whether you are named and cited. Two clients report customers and installs that came from assistants; our own ASO agency, appslift, gets leads from them." },
    { q: "I use ItGrows for LinkedIn. Where is my cabinet?", a: "Where it always was: Sign in, then LinkedIn & X cabinet. Nothing changed for your posts, plan or billing." },
  ],

  // The two tools
  toolsTitle: "Two quick checks",
  toolsLead: "Enter your site, see the answer.",
  quickChecks: [
    { title: "Does ChatGPT name you?", line: "Five questions your buyers would ask, put live to ChatGPT and Perplexity." },
    { title: "Can AI crawlers read your site?", line: "Your sitemap pages against robots.txt for GPTBot, ClaudeBot, PerplexityBot and more." },
  ],
  runIt: "Run it",

  // Latest guides (the guides themselves are in English)
  guidesTitle: "Guides on AI visibility",
  allGuides: "All guides →",
  expertsBlog: "How AI assistants find and name experts →",
}

export default defineMessages(en, {
  de: {
    metaTitle: "KI-Sichtbarkeit: von ChatGPT genannt werden | ItGrows",
    metaDescription:
      "ItGrows, Dienst für KI-Sichtbarkeit (GEO): Antwortseiten auf Ihrer Website, alle zwei Wochen ein Check von vier KI-Assistenten. Kostenlos prüfen, etwa 30 Sekunden.",
    ogTitle: "Damit ChatGPT, Claude, Gemini und Perplexity Ihr Unternehmen nennen",
    ogDescription: "Antwortseiten auf Ihrer eigenen Domain, Korrekturen für Crawler und Indexierung und alle zwei Wochen ein Check von vier Assistenten.",

    orgDescription:
      "ItGrows ist ein Dienst für KI-Sichtbarkeit (Generative Engine Optimization, GEO) für Unternehmen: Er veröffentlicht Antwortseiten auf der eigenen Website des Unternehmens, macht die Website für KI-Crawler und Suchindizes lesbar und prüft alle zwei Wochen, ob ChatGPT, Claude, Gemini und Perplexity das Unternehmen nennen.",
    appName: "ItGrows KI-Sichtbarkeitscheck",
    appDescription:
      "Ein 30-Sekunden-Check, ob ChatGPT und Perplexity ein Unternehmen nennen, wenn seine Kunden fragen: fünf Kundenfragen, aus der Website abgeleitet und live mit Websuche beantwortet, dazu die stattdessen genannten Unternehmen und die zitierten Websites. Kostenlos: zwei Antworten sofort vollständig, alle fünf, sobald Sie ein Konto anlegen.",
    serviceName: "ItGrows — KI-Sichtbarkeit (GEO)",
    serviceType: "Generative Engine Optimization und Veröffentlichung von Inhalten",
    serviceDescription:
      "Artikel auf der eigenen Domain des Kunden, die die Fragen beantworten, die Kunden KI-Assistenten stellen, Korrekturen bei Crawler-Zugriff und Indexierung sowie alle zwei Wochen eine Messung über ChatGPT, Claude, Gemini und Perplexity, ob das Unternehmen genannt wird.",
    offerReport: "Ausführlicher Bericht zur KI-Sichtbarkeit",

    navHow: "So funktioniert es",
    navResults: "Ergebnisse",
    navPricing: "Preise",
    navTools: "Tools",
    navGuides: "Leitfäden",
    navLinkedIn: "LinkedIn- & X-Posts",
    checkMySite: "Website prüfen",

    h1: "Damit Ihr Unternehmen genannt wird, wenn Kunden <g>ChatGPT, Claude, Gemini und Perplexity</g> fragen.",
    lead: "Wir messen, was vier Assistenten zu Ihrem Fachgebiet antworten, beheben, was ihre Crawler und Suchindizes am Lesen Ihrer Website hindert, veröffentlichen Antwortseiten auf Ihrer eigenen Domain und zählen alle zwei Wochen, ob jeder von ihnen Sie nennt.",

    founder: (from) =>
      `<b>Gründer oder Experte?</b> ItGrows entwirft auch Ihre LinkedIn- und X-Posts in Ihrer eigenen Stimme — ab ${from}/Monat, 14 Tage zum Testen.`,
    founderCta: "LinkedIn- & X-Posts →",
    openCabinet: "Zu Ihrem Bereich",

    casesTitle: "Ergebnisse: zwei Kunden und unser eigener Marktplatz",
    hundreds: "Hunderte",
    cases: [
      { kind: "B2B-SaaS", l: "neue B2B-Kunden in einem Monat, beide über ChatGPT" },
      { kind: "iOS-App", l: "Installationen pro Monat über ChatGPT, Claude und Gemini" },
      { kind: "Unser eigener Kursmarktplatz", l: "Abrufe seiner Seiten durch die Antwort- und Such-Agenten von ChatGPT und Perplexity, in zwei Wochen" },
    ],
    casesNote: "freightsizer.ai und magiscan.app: nach Angaben der Kunden. pickaclass.com ist unser eigener Kursmarktplatz: laut seinem Server-Log, 28. Juli – 11. August 2026.",

    talkFirst: "Oder sprechen Sie zuerst mit uns →",
    liPlans: (personal, duo, allIn) =>
      `LinkedIn- & X-Ghostwriting: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>Pläne ansehen</link>`,

    writeTitle: "Schreiben Sie uns",
    writeLead: "Fragen zu Ihrer Website, zum Plan oder zu etwas anderem. Wir antworten innerhalb eines Tages.",

    faqTitle: "Fragen",
    faq: ({ sample, yearOff }) => [
      {
        q: "Was ist ItGrows?",
        a: "ItGrows hilft einem Unternehmen, genannt zu werden, wenn seine Kunden einen KI-Assistenten fragen. Wir stellen ChatGPT, Claude, Gemini und Perplexity die Fragen, die diese Kunden stellen, jeweils mehrmals, und halten fest, wer genannt wird und welche Websites zitiert werden. Dann veröffentlichen wir auf der eigenen Domain des Unternehmens Seiten, die diese Fragen beantworten, beheben, was KI-Crawler und Suchindizes am Lesen der Website hindert, und messen alle zwei Wochen erneut.",
      },
      {
        q: "Ist ItGrows ein LinkedIn-Tool oder ein Dienst für KI-Sichtbarkeit?",
        a: "Ein Dienst für KI-Sichtbarkeit (GEO) für Unternehmen. Die Entwürfe für LinkedIn- und X-Posts, die Sie vielleicht kennen, sind ein separates Produkt für Gründer und Experten unter itgrows.ai/personal.",
      },
      { q: "Welche Assistenten messen Sie?", a: "ChatGPT, Claude, Gemini und Perplexity, über ihre eigenen APIs mit aktivierter Websuche. Im Plan stellen wir jede Frage dreimal, weil ihre Antworten schwanken; der kostenlose Bericht stellt jede Frage einmal." },
      {
        q: "Können Sie garantieren, dass ChatGPT uns nennt?",
        a: "Nein, und misstrauen Sie jedem, der das tut. Kein Assistent verkauft organische Platzierungen oder legt offen, wie er auswählt. Wir erledigen die Arbeit, die Sie auffindbar und zitierfähig macht, und zeigen Ihnen alle zwei Wochen, was sich verändert hat.",
      },
      {
        q: "Was können Sie tatsächlich belegen?",
        a: "Drei Dinge. Ob die Assistenten Sie nennen: Alle zwei Wochen stellen wir ChatGPT, Claude, Gemini und Perplexity dieselben Fragen, die Ihre Kunden stellen, jeweils mehrmals, und zählen die Antworten, die Sie nennen, sowie die Websites, die sie zitieren. Und bei Blogs, die wir hosten, anhand des Server-Logs: dass Crawler Ihre Seiten abgerufen haben und dass Assistenten bestimmte Artikel geöffnet haben, während sie jemandem live antworteten — ChatGPT-User und Perplexity-User tauchen nur mitten in einem Gespräch auf. Niemand kann jede Frage messen, die irgendwer stellen könnte; wir messen die Fragen, die Ihre Kunden stellen.",
      },
      {
        q: "Was unterscheidet das von einer SEO-Agentur?",
        a: "Eine SEO-Agentur optimiert für einen einzigen Index und zählt Rankings. Jeder Assistent durchsucht einen anderen Index — Bing, Brave, Google oder einen eigenen —, und wir zählen die Antworten, nicht die Rankings. Wir veröffentlichen, statt nur zu beraten; wo eine Korrektur Ihren Entwickler braucht, geben wir genaue Anweisungen und prüfen, ob sie gewirkt hat.",
      },
      {
        q: "Ist das KI-Blog-Spam auf meiner Domain?",
        a: "Genau das sollten Sie befürchten — der Großteil dieser Branche ist genau das. Zwei Dinge verhindern es, beide ohne Zauberei: Sie legen die Positionen fest, und Sie sehen jeden Artikel 2 Tage vor der Veröffentlichung und können ihn bearbeiten oder stoppen. Was Sie nicht mit Ihrem Namen unterschreiben würden, geht nicht raus.",
      },
      {
        q: "Wie lange dauert es, bis sich etwas tut?",
        a: "Sobald eine Seite in den richtigen Indizes ist, kommen Crawler meist innerhalb von ein, zwei Wochen, und wir testen alle zwei Wochen die Auffindbarkeit, damit eine Lücke auffällt. Eine Quelle zu werden, auf die ein Assistent immer wieder zurückgreift, dauert Monate und braucht einen Fundus an Inhalten. Wenn Sie in diesem Quartal zurechenbaren Umsatz brauchen, schalten Sie Anzeigen — das sagen wir Ihnen im Gespräch und nicht erst nach Ihrer dritten Rechnung.",
      },
      {
        q: "Geben Sie uns eine Anleitung zum Selbermachen, oder erledigen Sie die Arbeit?",
        a: `Wir erledigen die Arbeit. Der ausführliche Bericht (kostenlos, sobald Sie ein Konto anlegen) ist die Diagnose und unser Maßnahmenplan: wo Sie in allen vier Assistenten stehen, wer statt Ihnen genannt wird und was wir Schritt für Schritt dagegen tun. Im Plan erledigen wir diese Arbeit: Wir veröffentlichen Antwortseiten auf Ihrer Domain, beheben Probleme bei Crawler-Zugriff und Indexierung und messen alle zwei Wochen.`,
      },
      {
        q: "Was kostet der ausführliche Bericht?",
        a: `Nichts: Der vollständige Bericht ist kostenlos, sobald Sie ein Konto anlegen, für eine Website pro Konto. Der Schnellcheck auf dieser Seite ist ebenfalls kostenlos und dauert etwa 30 Sekunden: 5 Fragen an ChatGPT und Perplexity; zwei Antworten sehen Sie sofort vollständig, alle fünf, sobald Sie ein Konto anlegen. Mit dem Konto erstellen wir außerdem den ausführlichen Bericht für Ihre Website — 20 Fragen an ChatGPT, Claude, Gemini und Perplexity —, und alles darin ist offen: jede Antwort, alle, die statt Ihnen genannt werden, die Websites, die die Assistenten zitieren, und unser Maßnahmenplan für Ihre Website. Ein echtes Beispiel (auf Englisch): itgrows.ai${sample}.`,
      },
      {
        q: "Was kostet der Plan?",
        a: `Ihren Preis sehen Sie nach Ihrem kostenlosen Bericht: Er steht in Ihrem Konto, bevor Sie etwas bezahlen. Der Plan wird monatlich abgerechnet und ist monatlich kündbar, dazu kommt eine einmalige Einrichtung (Ihre Website und ihre Indizes werden startklar gemacht, geliefert als Startbericht); die Einrichtungsgebühr entfällt, wenn Sie 3 Monate im Voraus oder ein Jahr zahlen, und ein Jahr kostet ${yearOff} weniger. Der ausführliche Bericht ist inbegriffen.`,
      },
      {
        q: "Für wen ist das nicht das Richtige?",
        a: `Für alle ohne echte Expertise, die sie veröffentlichen könnten — die Engine verstärkt einen Standpunkt, sie kann keinen erfinden. Für alle, die eine unterschriebene Garantie brauchen. Und für alle, die diese Arbeit zum Preis eines Software-Tools wollen: Der Plan ist an einer Teilzeitkraft für Content bemessen. Wenn Sie vor der Entscheidung das ganze Bild sehen möchten, zeigt der kostenlose Bericht, wo Sie stehen und was wir tun werden.`,
      },
      {
        q: "Bringt uns das Traffic von ChatGPT?",
        a: "Oft wenig: Assistenten antworten meist direkt im Chat. Wir zählen, ob Sie genannt und zitiert werden. Zwei Kunden berichten von Kunden und Installationen, die über Assistenten kamen; unsere eigene ASO-Agentur appslift erhält über sie Leads.",
      },
      {
        q: "Ich nutze ItGrows für LinkedIn. Wo ist mein Bereich?",
        a: "Wo er immer war: Anmelden, dann LinkedIn- & X-Bereich. An Ihren Posts, Ihrem Plan und Ihrer Abrechnung hat sich nichts geändert.",
      },
    ],

    toolsTitle: "Zwei Schnellchecks",
    toolsLead: "Website eingeben, Antwort sehen.",
    quickChecks: [
      { title: "Nennt ChatGPT Sie?", line: "Fünf Fragen, die Ihre Kunden stellen würden, live an ChatGPT und Perplexity gestellt." },
      { title: "Können KI-Crawler Ihre Website lesen?", line: "Die Seiten Ihrer Sitemap, geprüft gegen robots.txt für GPTBot, ClaudeBot, PerplexityBot und weitere." },
    ],
    runIt: "Starten",

    guidesTitle: "Leitfäden zur KI-Sichtbarkeit",
    allGuides: "Alle Leitfäden →",
    expertsBlog: "Wie KI-Assistenten Experten finden und nennen →",
  },

  fr: {
    metaTitle: "Visibilité dans l’IA : être mentionné par ChatGPT | ItGrows",
    metaDescription:
      "ItGrows, visibilité dans l’IA (GEO) : des pages de réponse sur votre site et une vérification de quatre assistants toutes les deux semaines. Test gratuit, 30 s environ.",
    ogTitle: "Faites mentionner votre entreprise par ChatGPT, Claude, Gemini et Perplexity",
    ogDescription: "Des pages de réponse sur votre propre domaine, des corrections pour les robots et l’indexation, et une vérification de quatre assistants toutes les deux semaines.",

    orgDescription:
      "ItGrows est un service de visibilité dans l’IA (generative engine optimization, GEO) pour les entreprises : il publie des pages de réponse sur le propre site de l’entreprise, rend le site lisible pour les robots d’IA et les index de recherche, et vérifie toutes les deux semaines si ChatGPT, Claude, Gemini et Perplexity mentionnent l’entreprise.",
    appName: "Test de visibilité IA ItGrows",
    appDescription:
      "Une vérification en 30 secondes : ChatGPT et Perplexity mentionnent-ils une entreprise quand ses clients posent la question ? Cinq questions de clients générées à partir du site, posées en direct avec la recherche web, avec les entreprises mentionnées à sa place et les sites cités. Gratuit : deux réponses complètes tout de suite, les cinq dès que vous créez un compte.",
    serviceName: "ItGrows — visibilité dans l’IA (GEO)",
    serviceType: "Optimisation pour les moteurs génératifs et publication de contenus",
    serviceDescription:
      "Des articles publiés sur le propre domaine du client qui répondent aux questions que les clients posent aux assistants IA, des corrections de l’accès des robots et de l’indexation, et une mesure toutes les deux semaines sur ChatGPT, Claude, Gemini et Perplexity de la mention de l’entreprise.",
    offerReport: "Rapport détaillé de visibilité dans l’IA",

    navHow: "Fonctionnement",
    navResults: "Résultats",
    navPricing: "Tarifs",
    navTools: "Outils",
    navGuides: "Guides",
    navLinkedIn: "Posts LinkedIn et X",
    checkMySite: "Vérifier mon site",

    h1: "Faites mentionner votre entreprise quand vos clients interrogent <g>ChatGPT, Claude, Gemini et Perplexity.</g>",
    lead: "Nous mesurons ce que quatre assistants répondent sur votre secteur, corrigeons ce qui empêche leurs robots et leurs index de recherche de lire votre site, publions des pages de réponse sur votre propre domaine et comptons toutes les deux semaines si chacun d’eux vous mentionne.",

    founder: (from) =>
      `<b>Fondateur ou expert ?</b> ItGrows rédige aussi vos posts LinkedIn et X dans votre style — à partir de ${from}/mois, 14 jours d’essai.`,
    founderCta: "Posts LinkedIn et X →",
    openCabinet: "Ouvrir votre espace",

    casesTitle: "Résultats : deux clients et notre propre marketplace",
    hundreds: "Des centaines",
    cases: [
      { kind: "SaaS B2B", l: "nouveaux clients B2B en un mois, tous deux venus de ChatGPT" },
      { kind: "App iOS", l: "d’installations par mois venues de ChatGPT, Claude et Gemini" },
      { kind: "Notre propre marketplace de cours", l: "consultations de ses pages par les agents de réponse et de recherche de ChatGPT et Perplexity, en deux semaines" },
    ],
    casesNote: "freightsizer.ai et magiscan.app : selon les clients. pickaclass.com est notre propre marketplace de cours : d’après son journal serveur, du 28 juillet au 11 août 2026.",

    talkFirst: "Ou parlez-nous d’abord →",
    liPlans: (personal, duo, allIn) =>
      `Ghostwriting LinkedIn et X : Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>voir les formules</link>`,

    writeTitle: "Écrivez-nous",
    writeLead: "Une question sur votre site, l’abonnement ou autre chose ? Nous répondons sous 24 heures.",

    faqTitle: "Questions fréquentes",
    faq: ({ sample, yearOff }) => [
      {
        q: "Qu’est-ce qu’ItGrows ?",
        a: "ItGrows aide une entreprise à être mentionnée quand ses clients interrogent un assistant IA. Nous posons à ChatGPT, Claude, Gemini et Perplexity les questions que posent ces clients, plusieurs fois chacune, et relevons qui est mentionné et quels sites sont cités. Puis nous publions sur le propre domaine de l’entreprise des pages qui répondent à ces questions, corrigeons ce qui empêche les robots d’IA et les index de recherche de lire le site, et mesurons de nouveau toutes les deux semaines.",
      },
      {
        q: "ItGrows est-il un outil LinkedIn ou un service de visibilité dans l’IA ?",
        a: "Un service de visibilité dans l’IA (GEO) pour les entreprises. La rédaction de posts LinkedIn et X que vous avez peut-être vue est un produit distinct, pour les fondateurs et les experts, sur itgrows.ai/personal.",
      },
      { q: "Quels assistants mesurez-vous ?", a: "ChatGPT, Claude, Gemini et Perplexity, via leurs propres API avec la recherche web activée. Avec l’abonnement, chaque question est posée trois fois, car leurs réponses varient ; le rapport gratuit pose chaque question une fois." },
      {
        q: "Pouvez-vous garantir que ChatGPT nous mentionnera ?",
        a: "Non, et méfiez-vous de quiconque le promet. Aucun assistant ne vend de placement organique ni ne publie la façon dont il choisit. Nous faisons le travail qui vous rend trouvable et citable, et nous vous montrons toutes les deux semaines ce qui a changé.",
      },
      {
        q: "Que pouvez-vous réellement prouver ?",
        a: "Trois choses. Si les assistants vous mentionnent : toutes les deux semaines, nous posons à ChatGPT, Claude, Gemini et Perplexity les mêmes questions que vos clients, plusieurs fois chacune, et comptons les réponses qui vous mentionnent et les sites qu’elles citent. Et, pour les blogs que nous hébergeons, d’après le journal serveur : que les robots ont bien récupéré vos pages et que des assistants ont consulté des articles précis en répondant en direct à quelqu’un — ChatGPT-User et Perplexity-User n’apparaissent qu’en pleine conversation. Personne ne peut mesurer toutes les questions que n’importe qui pourrait poser ; nous mesurons celles que posent vos clients.",
      },
      {
        q: "En quoi est-ce différent d’une agence SEO ?",
        a: "Une agence SEO optimise pour un seul index et compte des positions. Chaque assistant cherche dans un index différent — Bing, Brave, Google ou le sien — et nous comptons les réponses, pas les positions. Nous publions au lieu de conseiller ; quand une correction demande votre développeur, nous lui donnons des instructions précises et vérifions qu’elle a fonctionné.",
      },
      {
        q: "Est-ce du spam de blog généré par IA sur mon domaine ?",
        a: "C’est exactement ce qu’il faut craindre — l’essentiel de ce secteur, c’est précisément cela. Deux choses l’empêchent, sans magie : c’est vous qui définissez vos prises de position, et vous voyez chaque article 2 jours avant sa mise en ligne, avec la possibilité de le modifier ou de l’arrêter. Un article que vous ne signeriez pas de votre nom n’est pas publié.",
      },
      {
        q: "Combien de temps avant que quelque chose se passe ?",
        a: "Une fois qu’une page est dans les bons index, les robots arrivent en général en une ou deux semaines, et nous testons la trouvabilité toutes les deux semaines pour repérer tout manque. Devenir une source vers laquelle un assistant revient régulièrement prend des mois et demande un vrai corpus. Si vous avez besoin d’un chiffre d’affaires attribuable ce trimestre, achetez de la publicité — nous vous le dirons pendant l’appel plutôt qu’après votre troisième facture.",
      },
      {
        q: "Nous donnez-vous un guide pour le faire nous-mêmes, ou faites-vous le travail ?",
        a: `Nous faisons le travail. Le rapport détaillé (gratuit dès que vous créez un compte) est le diagnostic et notre plan d’action : où vous en êtes dans les quatre assistants, qui est mentionné à votre place et ce que nous allons faire, étape par étape. Avec l’abonnement, nous faisons ce travail : nous publions des pages de réponse sur votre domaine, corrigeons l’accès des robots et l’indexation, et mesurons toutes les deux semaines.`,
      },
      {
        q: "Combien coûte le rapport détaillé ?",
        a: `Rien : le rapport complet est gratuit dès que vous créez un compte, pour un site par compte. La vérification rapide de cette page est gratuite elle aussi et prend environ 30 secondes : 5 questions à ChatGPT et Perplexity ; deux réponses s’affichent en entier tout de suite, les cinq dès que vous créez un compte. Avec ce compte, nous établissons aussi le rapport détaillé de votre site — 20 questions à ChatGPT, Claude, Gemini et Perplexity —, et tout y est consultable : chaque réponse, tous ceux qui sont mentionnés à votre place, les sites que citent les assistants et notre plan d’action pour votre site. Un vrai rapport (en anglais) : itgrows.ai${sample}.`,
      },
      {
        q: "Combien coûte l’abonnement ?",
        a: `Vous voyez votre prix après votre rapport gratuit : il s’affiche dans votre compte avant tout paiement. L’abonnement est facturé au mois, sans engagement, plus une mise en place facturée une seule fois (votre site et ses index préparés, livrés sous forme de rapport de lancement) ; la mise en place n’est pas facturée si vous payez 3 mois d’avance ou un an, et l’année bénéficie de ${yearOff} de remise. Le rapport détaillé est inclus.`,
      },
      {
        q: "À qui ce service ne convient-il pas ?",
        a: `Pour ceux qui n’ont pas de véritable expertise à publier — le moteur amplifie un point de vue, il ne peut pas en inventer un. Pour ceux qui exigent une garantie signée. Et pour ceux qui veulent ce travail au prix d’un logiciel : l’abonnement se compare au coût d’un rédacteur à temps partiel. Pour avoir une vue complète avant de décider, le rapport gratuit montre où vous en êtes et ce que nous ferons.`,
      },
      {
        q: "Cela nous apportera-t-il du trafic depuis ChatGPT ?",
        a: "Souvent peu : les assistants répondent généralement sur place. Nous comptons si vous êtes mentionné et cité. Deux de nos clients font état de nouveaux clients et d’installations venus des assistants ; notre propre agence ASO, appslift, en reçoit des leads.",
      },
      {
        q: "J’utilise ItGrows pour LinkedIn. Où est mon espace ?",
        a: "Là où il a toujours été : Se connecter, puis Espace LinkedIn et X. Rien n’a changé pour vos posts, votre formule ni votre facturation.",
      },
    ],

    toolsTitle: "Deux vérifications rapides",
    toolsLead: "Saisissez votre site, voyez la réponse.",
    quickChecks: [
      { title: "ChatGPT vous mentionne-t-il ?", line: "Cinq questions que poseraient vos clients, posées en direct à ChatGPT et Perplexity." },
      { title: "Les robots d’IA peuvent-ils lire votre site ?", line: "Les pages de votre sitemap confrontées au robots.txt pour GPTBot, ClaudeBot, PerplexityBot et d’autres." },
    ],
    runIt: "Lancer",

    guidesTitle: "Guides sur la visibilité dans l’IA (en anglais)",
    allGuides: "Tous les guides →",
    expertsBlog: "Comment les assistants IA trouvent et mentionnent les experts →",
  },

  es: {
    metaTitle: "Visibilidad en IA: que ChatGPT le mencione | ItGrows",
    metaDescription:
      "ItGrows, visibilidad en IA (GEO): páginas de respuesta en su sitio web y una comprobación de cuatro asistentes cada dos semanas. Compruebe su sitio gratis, unos 30 s.",
    ogTitle: "Haga que ChatGPT, Claude, Gemini y Perplexity mencionen su empresa",
    ogDescription: "Páginas de respuesta en su propio dominio, correcciones de rastreo e indexación y una comprobación de cuatro asistentes cada dos semanas.",

    orgDescription:
      "ItGrows es un servicio de visibilidad en IA (generative engine optimization, GEO) para empresas: publica páginas de respuesta en el propio sitio web de la empresa, hace que el sitio sea legible para los rastreadores de IA y los índices de búsqueda, y comprueba cada dos semanas si ChatGPT, Claude, Gemini y Perplexity mencionan a la empresa.",
    appName: "Comprobación de visibilidad en IA de ItGrows",
    appDescription:
      "Una comprobación de 30 segundos de si ChatGPT y Perplexity mencionan a una empresa cuando sus clientes preguntan: cinco preguntas de clientes generadas a partir del sitio, respondidas en directo con búsqueda web, con las empresas mencionadas en su lugar y los sitios citados. Gratis: dos respuestas completas al momento y las cinco en cuanto cree una cuenta.",
    serviceName: "ItGrows — visibilidad en IA (GEO)",
    serviceType: "Optimización para motores generativos y publicación de contenidos",
    serviceDescription:
      "Artículos publicados en el propio dominio del cliente que responden a las preguntas que los clientes hacen a los asistentes de IA, correcciones del acceso de rastreadores y de la indexación, y una medición cada dos semanas en ChatGPT, Claude, Gemini y Perplexity de si se menciona a la empresa.",
    offerReport: "Informe detallado de visibilidad en IA",

    navHow: "Cómo funciona",
    navResults: "Resultados",
    navPricing: "Precios",
    navTools: "Herramientas",
    navGuides: "Guías",
    navLinkedIn: "Publicaciones en LinkedIn y X",
    checkMySite: "Comprobar mi sitio",

    h1: "Haga que mencionen su empresa cuando sus clientes pregunten a <g>ChatGPT, Claude, Gemini y Perplexity.</g>",
    lead: "Medimos lo que cuatro asistentes responden sobre su sector, corregimos lo que impide a sus rastreadores e índices de búsqueda leer su sitio, publicamos páginas de respuesta en su propio dominio y contamos cada dos semanas si cada uno de ellos menciona su empresa.",

    founder: (from) =>
      `<b>¿Fundador o experto?</b> ItGrows también redacta sus publicaciones de LinkedIn y X con su propia voz — desde ${from}/mes, 14 días de prueba.`,
    founderCta: "Publicaciones en LinkedIn y X →",
    openCabinet: "Abrir su panel",

    casesTitle: "Resultados: dos clientes y nuestro propio marketplace",
    hundreds: "Cientos",
    cases: [
      { kind: "SaaS B2B", l: "clientes B2B nuevos en un mes, los dos desde ChatGPT" },
      { kind: "App de iOS", l: "de instalaciones al mes desde ChatGPT, Claude y Gemini" },
      { kind: "Nuestro propio marketplace de cursos", l: "consultas de sus páginas por los agentes de respuesta y de búsqueda de ChatGPT y Perplexity, en dos semanas" },
    ],
    casesNote: "freightsizer.ai y magiscan.app: según los propios clientes. pickaclass.com es nuestro propio marketplace de cursos: según el registro de su servidor, del 28 de julio al 11 de agosto de 2026.",

    talkFirst: "O hable antes con nosotros →",
    liPlans: (personal, duo, allIn) =>
      `Ghostwriting para LinkedIn y X: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>ver planes</link>`,

    writeTitle: "Escríbanos",
    writeLead: "Preguntas sobre su sitio, el plan o cualquier otra cosa. Respondemos en menos de un día.",

    faqTitle: "Preguntas",
    faq: ({ sample, yearOff }) => [
      {
        q: "¿Qué es ItGrows?",
        a: "ItGrows ayuda a una empresa a que la mencionen cuando sus clientes preguntan a un asistente de IA. Planteamos a ChatGPT, Claude, Gemini y Perplexity las preguntas que hacen esos clientes, varias veces cada una, y registramos a quién mencionan y qué sitios citan. Después publicamos en el propio dominio de la empresa páginas que responden a esas preguntas, corregimos lo que impide a los rastreadores de IA y a los índices de búsqueda leer el sitio, y volvemos a medir cada dos semanas.",
      },
      {
        q: "¿ItGrows es una herramienta para LinkedIn o un servicio de visibilidad en IA?",
        a: "Un servicio de visibilidad en IA (GEO) para empresas. La redacción de publicaciones de LinkedIn y X que quizá conozca es un producto aparte para fundadores y expertos, en itgrows.ai/personal.",
      },
      { q: "¿Qué asistentes miden?", a: "ChatGPT, Claude, Gemini y Perplexity, a través de sus propias API con la búsqueda web activada. Con el plan hacemos cada pregunta tres veces, porque sus respuestas varían; el informe gratuito hace cada pregunta una vez." },
      {
        q: "¿Pueden garantizar que ChatGPT nos mencione?",
        a: "No, y desconfíe de quien lo haga. Ningún asistente vende posiciones orgánicas ni publica cómo elige. Hacemos el trabajo que permite encontrarle y citarle, y cada dos semanas le mostramos qué ha cambiado.",
      },
      {
        q: "¿Qué pueden demostrar realmente?",
        a: "Tres cosas. Si los asistentes le mencionan: cada dos semanas planteamos a ChatGPT, Claude, Gemini y Perplexity las mismas preguntas que hacen sus clientes, varias veces cada una, y contamos las respuestas que le mencionan y los sitios que citan. Y, en los blogs que alojamos, a partir del registro del servidor: que los rastreadores descargaron sus páginas y que los asistentes consultaron artículos concretos mientras respondían a alguien en directo — ChatGPT-User y Perplexity-User solo aparecen en mitad de una conversación. Nadie puede medir todas las preguntas que cualquiera podría hacer; medimos las que hacen sus clientes.",
      },
      {
        q: "¿En qué se diferencia de una agencia SEO?",
        a: "Una agencia SEO optimiza para un solo índice y cuenta posiciones. Cada asistente busca en un índice distinto — Bing, Brave, Google o el suyo propio — y nosotros contamos respuestas, no posiciones. Publicamos en lugar de asesorar; cuando un cambio necesita a su desarrollador, le damos instrucciones exactas y comprobamos que ha funcionado.",
      },
      {
        q: "¿Es esto spam de blog hecho con IA en mi dominio?",
        a: "Es justo lo que hay que temer — la mayor parte de este sector es exactamente eso. Dos cosas lo impiden, ninguna mágica: usted define su punto de vista, y ve cada artículo 2 días antes de que se publique y puede editarlo o detenerlo. Lo que usted no firmaría con su nombre no se publica.",
      },
      {
        q: "¿Cuánto tarda en notarse algo?",
        a: "Una vez que una página está en los índices adecuados, los rastreadores suelen llegar en una o dos semanas, y comprobamos cada dos semanas si se puede encontrar, para detectar cualquier hueco. Convertirse en una fuente a la que un asistente recurre una y otra vez lleva meses y un buen volumen de contenido. Si necesita ingresos atribuibles este trimestre, compre publicidad — se lo diremos en la llamada y no después de su tercera factura.",
      },
      {
        q: "¿Nos dan una guía para hacerlo nosotros mismos o hacen ustedes el trabajo?",
        a: `Hacemos el trabajo. El informe detallado (gratuito en cuanto cree una cuenta) es el diagnóstico y nuestro plan de acción: dónde está usted en los cuatro asistentes, a quién mencionan en su lugar y qué haremos al respecto, paso a paso. Con el plan hacemos ese trabajo: publicamos páginas de respuesta en su dominio, corregimos el acceso de los rastreadores y la indexación, y medimos cada dos semanas.`,
      },
      {
        q: "¿Cuánto cuesta el informe detallado?",
        a: `Nada: el informe completo es gratuito en cuanto cree una cuenta, para un sitio por cuenta. La comprobación rápida de esta página también es gratuita y tarda unos 30 segundos: 5 preguntas a ChatGPT y Perplexity; dos respuestas se ven completas al momento y las cinco, en cuanto cree una cuenta. Con esa cuenta elaboramos también el informe detallado de su sitio — 20 preguntas a ChatGPT, Claude, Gemini y Perplexity —, y todo queda a la vista: cada respuesta, todas las empresas mencionadas en su lugar, los sitios que citan los asistentes y nuestro plan de acción para su sitio. Un ejemplo real (en inglés): itgrows.ai${sample}.`,
      },
      {
        q: "¿Cuánto cuesta el plan?",
        a: `Verá su precio después de su informe gratuito: aparece en su cuenta antes de pagar nada. El plan se factura al mes, mes a mes, más una configuración inicial de pago único (su sitio y sus índices listos, entregados como un informe de lanzamiento); la configuración inicial no se cobra si paga 3 meses por adelantado o un año, y el año tiene un ${yearOff} de descuento. El informe detallado está incluido.`,
      },
      {
        q: "¿Para quién no es esto?",
        a: `Para quien no tenga conocimientos especializados reales que publicar — el motor amplifica un punto de vista, no puede inventarlo. Para quien necesite una garantía firmada. Y para quien quiera este trabajo al precio de una herramienta de software: el plan se compara con contratar a un redactor a tiempo parcial. Para ver el panorama completo antes de decidir, el informe gratuito muestra dónde está usted y qué haremos.`,
      },
      {
        q: "¿Nos traerá tráfico desde ChatGPT?",
        a: "A menudo poco: los asistentes suelen responder en el propio chat. Contamos si le mencionan y le citan. Dos clientes nos cuentan que han conseguido clientes e instalaciones a través de los asistentes; nuestra propia agencia de ASO, appslift, recibe leads de ellos.",
      },
      {
        q: "Uso ItGrows para LinkedIn. ¿Dónde está mi panel?",
        a: "Donde siempre: Iniciar sesión y luego Panel de LinkedIn y X. Nada ha cambiado en sus publicaciones, su plan ni su facturación.",
      },
    ],

    toolsTitle: "Dos comprobaciones rápidas",
    toolsLead: "Introduzca su sitio y vea la respuesta.",
    quickChecks: [
      { title: "¿ChatGPT menciona su empresa?", line: "Cinco preguntas que harían sus clientes, planteadas en directo a ChatGPT y Perplexity." },
      { title: "¿Pueden los rastreadores de IA leer su sitio?", line: "Las páginas de su sitemap frente a robots.txt para GPTBot, ClaudeBot, PerplexityBot y otros." },
    ],
    runIt: "Probar",

    guidesTitle: "Guías sobre visibilidad en IA (en inglés)",
    allGuides: "Todas las guías →",
    expertsBlog: "Cómo los asistentes de IA encuentran y mencionan a expertos →",
  },

  ru: {
    metaTitle: "Видимость в ИИ: пусть ChatGPT называет вас | ItGrows",
    metaDescription:
      "ItGrows — сервис видимости в ИИ (GEO): страницы-ответы на вашем сайте и проверка четырёх ассистентов раз в две недели. Проверьте сайт бесплатно, около 30 секунд.",
    ogTitle: "Пусть ChatGPT, Claude, Gemini и Perplexity называют вашу компанию",
    ogDescription: "Страницы-ответы на вашем собственном домене, исправления для краулеров и индексации и проверка четырёх ассистентов раз в две недели.",

    orgDescription:
      "ItGrows — сервис видимости в ИИ (generative engine optimization, GEO) для бизнеса: публикует страницы-ответы на собственном сайте компании, делает сайт доступным для ИИ-краулеров и поисковых индексов и раз в две недели проверяет, называют ли компанию ChatGPT, Claude, Gemini и Perplexity.",
    appName: "Проверка видимости в ИИ от ItGrows",
    appDescription:
      "30-секундная проверка того, называют ли ChatGPT и Perplexity компанию, когда спрашивают её клиенты: пять клиентских вопросов, составленных по сайту, с ответами в реальном времени через веб-поиск, с компаниями, которых называют вместо неё, и процитированными сайтами. Бесплатно: два ответа целиком сразу, все пять — после создания аккаунта.",
    serviceName: "ItGrows — видимость в ИИ (GEO)",
    serviceType: "Оптимизация под генеративные системы и публикация контента",
    serviceDescription:
      "Статьи на собственном домене клиента, отвечающие на вопросы, которые клиенты задают ИИ-ассистентам, исправление доступа краулеров и индексации и измерение раз в две недели в ChatGPT, Claude, Gemini и Perplexity того, называют ли компанию.",
    offerReport: "Подробный отчёт о видимости в ИИ",

    navHow: "Как это работает",
    navResults: "Результаты",
    navPricing: "Цены",
    navTools: "Инструменты",
    navGuides: "Руководства",
    navLinkedIn: "Посты для LinkedIn и X",
    checkMySite: "Проверить мой сайт",

    h1: "Пусть вашу компанию называют, когда клиенты спрашивают <g>ChatGPT, Claude, Gemini и Perplexity.</g>",
    lead: "Мы измеряем, что четыре ассистента отвечают о вашей сфере, устраняем то, что мешает их краулерам и поисковым индексам читать ваш сайт, публикуем страницы-ответы на вашем собственном домене и раз в две недели считаем, называет ли вас каждый из них.",

    founder: (from) =>
      `<b>Основатель или эксперт?</b> ItGrows также пишет черновики ваших постов в LinkedIn и X вашим собственным голосом — от ${from}/мес., 14 дней пробного периода.`,
    founderCta: "Посты для LinkedIn и X →",
    openCabinet: "Открыть кабинет",

    casesTitle: "Результаты: два клиента и наш собственный маркетплейс",
    hundreds: "Сотни",
    cases: [
      { kind: "B2B SaaS", l: "новых B2B-клиента за один месяц, оба — из ChatGPT" },
      { kind: "iOS-приложение", l: "установок в месяц из ChatGPT, Claude и Gemini" },
      { kind: "Наш собственный маркетплейс курсов", l: "обращений к его страницам агентов ответа и поиска ChatGPT и Perplexity — за две недели" },
    ],
    casesNote: "freightsizer.ai и magiscan.app — по данным клиентов. pickaclass.com — наш собственный маркетплейс курсов: по логу его сервера, 28 июля — 11 августа 2026.",

    talkFirst: "Или сначала напишите нам →",
    liPlans: (personal, duo, allIn) =>
      `Гострайтинг для LinkedIn и X: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>смотреть тарифы</link>`,

    writeTitle: "Напишите нам",
    writeLead: "Вопросы о вашем сайте, подписке или о чём угодно ещё. Отвечаем в течение дня.",

    faqTitle: "Вопросы",
    faq: ({ sample, yearOff }) => [
      {
        q: "Что такое ItGrows?",
        a: "ItGrows помогает компании добиться того, чтобы её называли, когда её клиенты спрашивают ИИ-ассистента. Мы задаём ChatGPT, Claude, Gemini и Perplexity вопросы, которые задают эти клиенты, по нескольку раз каждый, и фиксируем, кого называют и какие сайты цитируют. Затем публикуем на собственном домене компании страницы, отвечающие на эти вопросы, устраняем то, что мешает ИИ-краулерам и поисковым индексам читать сайт, и раз в две недели измеряем снова.",
      },
      {
        q: "ItGrows — это инструмент для LinkedIn или сервис видимости в ИИ?",
        a: "Сервис видимости в ИИ (GEO) для бизнеса. Черновики постов для LinkedIn и X, которые вы могли видеть, — отдельный продукт для основателей и экспертов на itgrows.ai/personal.",
      },
      { q: "Какие ассистенты вы измеряете?", a: "ChatGPT, Claude, Gemini и Perplexity — через их собственные API с включённым веб-поиском. По подписке мы задаём каждый вопрос три раза, потому что их ответы меняются; бесплатный отчёт задаёт каждый вопрос один раз." },
      {
        q: "Можете ли вы гарантировать, что ChatGPT будет нас называть?",
        a: "Нет, и не доверяйте тем, кто это гарантирует. Ни один ассистент не продаёт органические места и не раскрывает, как делает выбор. Мы делаем работу, благодаря которой вас можно найти и процитировать, и раз в две недели показываем, что изменилось.",
      },
      {
        q: "Что вы можете доказать на деле?",
        a: "Три вещи. Называют ли вас ассистенты: раз в две недели мы задаём ChatGPT, Claude, Gemini и Perplexity те же вопросы, что задают ваши клиенты, по нескольку раз каждый, и считаем ответы, в которых называют вас, и сайты, которые они цитируют. А для блогов, которые хостим мы, — по логу сервера: что краулеры забирали ваши страницы и что ассистенты открывали конкретные статьи, отвечая кому-то в реальном времени, — ChatGPT-User и Perplexity-User появляются только посреди разговора. Никто не может измерить все вопросы, которые кто угодно может задать; мы измеряем те, что задают ваши клиенты.",
      },
      {
        q: "Чем это отличается от SEO-агентства?",
        a: "SEO-агентство оптимизирует под один индекс и считает позиции. Каждый ассистент ищет по своему индексу — Bing, Brave, Google или собственному, — и мы считаем ответы, а не позиции. Мы публикуем, а не советуем; если исправление требует вашего разработчика, мы даём точные инструкции и проверяем, что всё сработало.",
      },
      {
        q: "Это не ИИ-спам в блоге на моём домене?",
        a: "Бояться стоит именно этого — большая часть рынка ровно это и есть. Это предотвращают две вещи, никакой магии: позиции задаёте вы, и вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить. Если вы не готовы подписаться под ней своим именем, она не выходит.",
      },
      {
        q: "Когда что-то начнёт происходить?",
        a: "Как только страница попадает в нужные индексы, краулеры обычно приходят в течение одной-двух недель, а мы раз в две недели проверяем находимость, чтобы вовремя заметить пробел. Стать источником, к которому ассистент обращается снова и снова, — это месяцы и солидный объём работы. Если вам нужна выручка с понятным источником уже в этом квартале, покупайте рекламу — мы скажем это на звонке, а не после вашего третьего счёта.",
      },
      {
        q: "Вы даёте инструкцию, чтобы мы всё сделали сами, или делаете работу?",
        a: `Мы делаем работу. Подробный отчёт (бесплатный, достаточно создать аккаунт) — это диагноз и наш план действий: где вы находитесь во всех четырёх ассистентах, кого называют вместо вас и что мы будем с этим делать, шаг за шагом. По подписке мы делаем эту работу: публикуем страницы-ответы на вашем домене, исправляем доступ краулеров и индексацию и измеряем раз в две недели.`,
      },
      {
        q: "Сколько стоит подробный отчёт?",
        a: `Ничего: полный отчёт бесплатный — достаточно создать аккаунт, один сайт на аккаунт. Быстрая проверка на этой странице тоже бесплатна и занимает около 30 секунд: 5 вопросов к ChatGPT и Perplexity; два ответа вы видите целиком сразу, все пять — когда создадите аккаунт. С аккаунтом мы также составим подробный отчёт по вашему сайту — 20 вопросов к ChatGPT, Claude, Gemini и Perplexity — и в нём открыто всё: каждый ответ, все, кого называют вместо вас, сайты, которые цитируют ассистенты, и наш план действий для вашего сайта. Настоящий отчёт (на английском): itgrows.ai${sample}.`,
      },
      {
        q: "Сколько стоит подписка?",
        a: `Свою цену вы увидите после бесплатного отчёта: она показана в вашем аккаунте до любой оплаты. Подписка оплачивается помесячно, плюс разовая настройка (ваш сайт и его индексы готовятся к работе, результат — отчёт о запуске); плата за настройку не взимается, если вы платите за 3 месяца вперёд или за год, а год — со скидкой ${yearOff}. Подробный отчёт входит в стоимость.`,
      },
      {
        q: "Кому это не подойдёт?",
        a: `Тем, у кого нет настоящей экспертизы, которую можно публиковать, — движок усиливает точку зрения, но не может её придумать. Тем, кому нужна подписанная гарантия. И тем, кто хочет получить эту работу по цене программы: подписка сопоставима с контент-специалистом на неполный день. Чтобы увидеть полную картину до решения, бесплатный отчёт покажет, где вы находитесь и что мы будем делать.`,
      },
      {
        q: "Принесёт ли это нам трафик из ChatGPT?",
        a: "Часто немного: ассистенты обычно отвечают прямо в чате. Мы считаем, называют ли вас и цитируют ли. Два клиента сообщают о покупателях и установках, пришедших из ассистентов; наше собственное ASO-агентство appslift получает из них лиды.",
      },
      {
        q: "Я пользуюсь ItGrows для LinkedIn. Где мой кабинет?",
        a: "Там же, где и был: «Войти», затем «Кабинет LinkedIn и X». Для ваших постов, тарифа и оплаты ничего не изменилось.",
      },
    ],

    toolsTitle: "Две быстрые проверки",
    toolsLead: "Введите адрес сайта — и увидите ответ.",
    quickChecks: [
      { title: "Называет ли вас ChatGPT?", line: "Пять вопросов, которые задали бы ваши клиенты, — вживую в ChatGPT и Perplexity." },
      { title: "Могут ли ИИ-краулеры читать ваш сайт?", line: "Сверка страниц из вашего sitemap с robots.txt для GPTBot, ClaudeBot, PerplexityBot и других." },
    ],
    runIt: "Запустить",

    guidesTitle: "Руководства по видимости в ИИ (на английском)",
    allGuides: "Все руководства →",
    expertsBlog: "Как ИИ-ассистенты находят и называют экспертов →",
  },
})
