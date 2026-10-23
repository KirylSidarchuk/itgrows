import { defineMessages } from "../messages"
import { plural } from "../format"
import { ENTITY_ABOUT, ENTITY_ONE_LINER } from "@/lib/entity"

// app/page.tsx ("/", and /de, /fr, /es, /ru): metadata, the page's own sections, the FAQ and the
// human-readable structured data. Prices, days and paths come in as arguments (lib/geo-pricing.ts).
// Terms used the same way across the GEO pages: report = Bericht / rapport / informe / отчёт; the plan
// (paid) = Plan / abonnement / plan / подписка; our plan for a site = Maßnahmenplan / plan d'action /
// plan de acción / план действий; setup = Einrichtung / mise en place / configuración inicial / настройка;
// quick check = Schnellcheck / vérification rapide / comprobación rápida / быстрая проверка.

type FaqVars = {
  /** The detailed report's price label. */
  report: string
  /** Days within which the report's price comes off the plan. */
  days: number
  /** The sample report's path in this language. */
  sample: string
  month: string
  setup: string
  quarter: string
  year: string
  yearPerMonth: string
  /** The yearly discount, already formatted ("20%"). */
  yearOff: string
}
type Faq = { q: string; a: string }[]

// "в течение 30 дней", "в течение 21 дня".
const ruDays = (n: number) => plural("ru", n, { one: `${n} дня`, other: `${n} дней` })

const en = {
  metaTitle: "AI visibility for businesses: get named by ChatGPT | ItGrows",
  metaDescription:
    "ItGrows makes companies visible in AI answers and drafts LinkedIn and X posts for founders. Check your site in about 30 seconds, no signup.",
  ogTitle: "Get your company named by ChatGPT, Claude, Gemini and Perplexity",
  ogDescription: "Answer pages on your own domain, crawler and indexing fixes, and a weekly check of four assistants.",

  // Structured data (JSON-LD)
  orgDescription: ENTITY_ONE_LINER,
  appName: "ItGrows AI visibility check",
  appDescription:
    "A 30-second check of whether ChatGPT and Perplexity name a business when its buyers ask: five buyer questions generated from the site, answered live with web search, with the businesses named instead and the sites cited. No signup.",
  serviceName: "ItGrows — AI visibility (GEO)",
  serviceType: "Generative engine optimisation and content publishing",
  serviceDescription:
    "Articles published to a customer's own domain that answer the questions buyers ask AI assistants, fixes for crawler access and indexing, and a weekly measurement across ChatGPT, Claude, Gemini and Perplexity of whether the business is named.",
  offerReport: "Detailed AI visibility report",
  offerPlan: "AI visibility plan, monthly",

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
  lead: "We measure what four assistants answer about your field, fix what stops their crawlers and search indexes from reading your site, publish answer pages on your own domain, and count every week whether each one names you.",
  heroNote: "No signup · about 30 seconds",

  // The LinkedIn/X product, one line
  founder: (from: string) =>
    `<b>Founder or expert?</b> ItGrows also drafts your LinkedIn and X posts in your own voice — from ${from}/month, 14-day free trial.`,
  founderCta: "LinkedIn & X posts →",
  openCabinet: "Open your cabinet",

  // Results
  casesTitle: "What clients report",
  hundreds: "Hundreds",
  cases: [
    { kind: "B2B SaaS", l: "new B2B customers in one month, both from ChatGPT" },
    { kind: "iOS app", l: "of installs a month from ChatGPT, Claude and Gemini" },
    { kind: "Course marketplace", l: "times AI assistants opened its pages while answering someone, in two weeks" },
  ],
  casesNote: "As reported by the clients; pickaclass.com from its server log, August 2026.",

  // Pricing section
  talkFirst: "Or talk to us first →",
  liPlans: (personal: string, duo: string, allIn: string) =>
    `LinkedIn & X ghostwriting: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>see plans</link>`,

  // Contact
  writeTitle: "Write to us",
  writeLead: "Questions about your site, the plan or anything else. We reply within a day.",

  // FAQ
  faqTitle: "Questions",
  faq: ({ report, days, sample, month, setup, quarter, year, yearPerMonth, yearOff }: FaqVars): Faq => [
    { q: "What is ItGrows?", a: ENTITY_ABOUT[0] },
    {
      q: "Is ItGrows a LinkedIn tool or an AI visibility service?",
      a: "Both, as two products. For companies, ItGrows is an AI visibility (GEO) service. For founders and experts, it drafts LinkedIn and X posts in their own voice; that product is at itgrows.ai/personal.",
    },
    { q: "Which assistants do you measure?", a: "ChatGPT, Claude, Gemini and Perplexity, through their own APIs with web search on, three asks per question, because their answers vary." },
    { q: "Can you guarantee that ChatGPT will name us?", a: "No, and distrust anyone who does. No assistant sells organic placement or publishes how it chooses. We do the work that makes you findable and quotable, and we show you every week what changed." },
    {
      q: "What can you actually prove?",
      a: "Three things. Whether the assistants name you: every week we put the same questions your buyers ask to ChatGPT, Claude, Gemini and Perplexity, several times each, and count the answers that name you and the sites they cite. And, for blogs we host, from the server log, that crawlers fetched your pages and that assistants retrieved specific articles while answering somebody live — ChatGPT-User, OAI-SearchBot and Perplexity-User only appear mid-conversation. Nobody can measure every question anyone might ask; we measure the ones your buyers do.",
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
      a: "Once a page is in the right indexes, crawlers usually arrive within a week or two, and we test findability every week so a gap is caught. Becoming a source an assistant reaches for repeatedly takes months and a body of work. If you need attributable revenue this quarter, buy ads — we will say so on the call rather than after your third invoice.",
    },
    {
      q: "Do you give us a guide to do it ourselves, or do the work?",
      a: `We do the work. The detailed report (${report}) is the diagnosis and our plan: where you stand in all four assistants, who is named instead of you, and what we will do about it, step by step. On the plan we do that work: we publish answer pages on your domain, fix crawler access and indexing, and measure every week. The report's price comes off the plan within ${days} days.`,
    },
    {
      q: "What does the detailed report cost?",
      a: `${report}, one payment per site. The quick check on this page needs no signup and takes about 30 seconds: 5 questions to ChatGPT and Perplexity. Create an account and we build the detailed report for your site — 20 questions to ChatGPT, Claude, Gemini and Perplexity, 3 asks each — with its totals and the 5 questions of the quick check open. The whole report is ${report}: every answer, everyone named instead of you, the sites the assistants quote, and our plan for your site. If you start the plan within ${days} days, the ${report} comes off your first payment. A real one: itgrows.ai${sample}.`,
    },
    {
      q: "What does the plan cost?",
      a: `${month} a month, month to month, plus a one-time ${setup} setup: your site and its indexes made ready, delivered as a launch report. The setup is free when you pay ${quarter} for 3 months upfront or ${year} for a year (${yearPerMonth} a month, ${yearOff} off). The detailed report is included.`,
    },
    {
      q: "Who is this wrong for?",
      a: `Anyone without real expertise to publish — the engine amplifies a point of view, it cannot invent one. Anyone needing a signed guarantee. And anyone who wants the work done for the price of a software tool: at ${month} a month the plan is priced against a fractional content hire. To see the full picture before deciding, the ${report} report shows where you stand and what we will do, and its price comes off the plan.`,
    },
    { q: "Will this send us traffic from ChatGPT?", a: "Often little: assistants usually answer in place. We count whether you are named and cited. Some clients report customers, installs and leads that came from assistants." },
    { q: "I use ItGrows for LinkedIn. Where is my cabinet?", a: "Where it always was: Sign in, then LinkedIn & X cabinet. Nothing changed for your posts, plan or billing." },
  ],

  // The two tools
  toolsTitle: "Two quick checks",
  toolsLead: "Enter your site, see the answer. No signup.",
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
    metaTitle: "KI-Sichtbarkeit für Unternehmen: von ChatGPT genannt werden | ItGrows",
    metaDescription:
      "ItGrows macht Unternehmen in KI-Antworten sichtbar und schreibt LinkedIn- und X-Posts für Gründer. Prüfen Sie Ihre Website in etwa 30 Sekunden, ohne Anmeldung.",
    ogTitle: "Damit ChatGPT, Claude, Gemini und Perplexity Ihr Unternehmen nennen",
    ogDescription: "Antwortseiten auf Ihrer eigenen Domain, Korrekturen für Crawler und Indexierung und ein wöchentlicher Check von vier Assistenten.",

    orgDescription:
      "ItGrows macht Unternehmen in KI-Antworten sichtbar: Antwortseiten auf der eigenen Domain, Korrekturen für KI-Crawler und Suchindizes und ein wöchentlicher Check von ChatGPT, Claude, Gemini und Perplexity. Außerdem entwirft ItGrows LinkedIn- und X-Posts für Gründer und Experten.",
    appName: "ItGrows KI-Sichtbarkeitscheck",
    appDescription:
      "Ein 30-Sekunden-Check, ob ChatGPT und Perplexity ein Unternehmen nennen, wenn seine Kunden fragen: fünf Kundenfragen, aus der Website abgeleitet und live mit Websuche beantwortet, dazu die stattdessen genannten Unternehmen und die zitierten Websites. Ohne Anmeldung.",
    serviceName: "ItGrows — KI-Sichtbarkeit (GEO)",
    serviceType: "Generative Engine Optimization und Veröffentlichung von Inhalten",
    serviceDescription:
      "Artikel auf der eigenen Domain des Kunden, die die Fragen beantworten, die Kunden KI-Assistenten stellen, Korrekturen bei Crawler-Zugriff und Indexierung sowie eine wöchentliche Messung über ChatGPT, Claude, Gemini und Perplexity, ob das Unternehmen genannt wird.",
    offerReport: "Ausführlicher Bericht zur KI-Sichtbarkeit",
    offerPlan: "Plan für KI-Sichtbarkeit, monatlich",

    navHow: "So funktioniert es",
    navResults: "Ergebnisse",
    navPricing: "Preise",
    navTools: "Tools",
    navGuides: "Leitfäden",
    navLinkedIn: "LinkedIn- & X-Posts",
    checkMySite: "Website prüfen",

    h1: "Damit Ihr Unternehmen genannt wird, wenn Kunden <g>ChatGPT, Claude, Gemini und Perplexity</g> fragen.",
    lead: "Wir messen, was vier Assistenten zu Ihrem Fachgebiet antworten, beheben, was ihre Crawler und Suchindizes am Lesen Ihrer Website hindert, veröffentlichen Antwortseiten auf Ihrer eigenen Domain und zählen jede Woche, ob jeder von ihnen Sie nennt.",
    heroNote: "Ohne Anmeldung · etwa 30 Sekunden",

    founder: (from) =>
      `<b>Gründer oder Experte?</b> ItGrows entwirft auch Ihre LinkedIn- und X-Posts in Ihrer eigenen Stimme — ab ${from}/Monat, 14 Tage zum Testen.`,
    founderCta: "LinkedIn- & X-Posts →",
    openCabinet: "Zu Ihrem Bereich",

    casesTitle: "Was Kunden berichten",
    hundreds: "Hunderte",
    cases: [
      { kind: "B2B-SaaS", l: "neue B2B-Kunden in einem Monat, beide über ChatGPT" },
      { kind: "iOS-App", l: "Installationen pro Monat über ChatGPT, Claude und Gemini" },
      { kind: "Kursmarktplatz", l: "Mal öffneten KI-Assistenten in zwei Wochen seine Seiten, während sie jemandem antworteten" },
    ],
    casesNote: "Nach Angaben der Kunden; pickaclass.com laut eigenem Server-Log, August 2026.",

    talkFirst: "Oder sprechen Sie zuerst mit uns →",
    liPlans: (personal, duo, allIn) =>
      `LinkedIn- & X-Ghostwriting: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>Pläne ansehen</link>`,

    writeTitle: "Schreiben Sie uns",
    writeLead: "Fragen zu Ihrer Website, zum Plan oder zu etwas anderem. Wir antworten innerhalb eines Tages.",

    faqTitle: "Fragen",
    faq: ({ report, days, sample, month, setup, quarter, year, yearPerMonth, yearOff }) => [
      {
        q: "Was ist ItGrows?",
        a: "ItGrows hilft einem Unternehmen, genannt zu werden, wenn seine Kunden einen KI-Assistenten fragen. Wir stellen ChatGPT, Claude, Gemini und Perplexity die Fragen, die diese Kunden stellen, jeweils mehrmals, und halten fest, wer genannt wird und welche Websites zitiert werden. Dann veröffentlichen wir auf der eigenen Domain des Unternehmens Seiten, die diese Fragen beantworten, beheben, was KI-Crawler und Suchindizes am Lesen der Website hindert, und messen jede Woche erneut.",
      },
      {
        q: "Ist ItGrows ein LinkedIn-Tool oder ein Dienst für KI-Sichtbarkeit?",
        a: "Beides, als zwei Produkte. Für Unternehmen ist ItGrows ein Dienst für KI-Sichtbarkeit (GEO). Für Gründer und Experten entwirft es LinkedIn- und X-Posts in ihrer eigenen Stimme; dieses Produkt finden Sie unter itgrows.ai/personal.",
      },
      { q: "Welche Assistenten messen Sie?", a: "ChatGPT, Claude, Gemini und Perplexity, über ihre eigenen APIs mit aktivierter Websuche, drei Anfragen pro Frage, weil ihre Antworten schwanken." },
      {
        q: "Können Sie garantieren, dass ChatGPT uns nennt?",
        a: "Nein, und misstrauen Sie jedem, der das tut. Kein Assistent verkauft organische Platzierungen oder legt offen, wie er auswählt. Wir erledigen die Arbeit, die Sie auffindbar und zitierfähig macht, und zeigen Ihnen jede Woche, was sich verändert hat.",
      },
      {
        q: "Was können Sie tatsächlich belegen?",
        a: "Drei Dinge. Ob die Assistenten Sie nennen: Jede Woche stellen wir ChatGPT, Claude, Gemini und Perplexity dieselben Fragen, die Ihre Kunden stellen, jeweils mehrmals, und zählen die Antworten, die Sie nennen, sowie die Websites, die sie zitieren. Und bei Blogs, die wir hosten, anhand des Server-Logs: dass Crawler Ihre Seiten abgerufen haben und dass Assistenten bestimmte Artikel geöffnet haben, während sie jemandem live antworteten — ChatGPT-User, OAI-SearchBot und Perplexity-User tauchen nur mitten in einem Gespräch auf. Niemand kann jede Frage messen, die irgendwer stellen könnte; wir messen die Fragen, die Ihre Kunden stellen.",
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
        a: "Sobald eine Seite in den richtigen Indizes ist, kommen Crawler meist innerhalb von ein, zwei Wochen, und wir testen jede Woche die Auffindbarkeit, damit eine Lücke auffällt. Eine Quelle zu werden, auf die ein Assistent immer wieder zurückgreift, dauert Monate und braucht einen Fundus an Inhalten. Wenn Sie in diesem Quartal zurechenbaren Umsatz brauchen, schalten Sie Anzeigen — das sagen wir Ihnen im Gespräch und nicht erst nach Ihrer dritten Rechnung.",
      },
      {
        q: "Geben Sie uns eine Anleitung zum Selbermachen, oder erledigen Sie die Arbeit?",
        a: `Wir erledigen die Arbeit. Der ausführliche Bericht (${report}) ist die Diagnose und unser Maßnahmenplan: wo Sie in allen vier Assistenten stehen, wer statt Ihnen genannt wird und was wir Schritt für Schritt dagegen tun. Im Plan erledigen wir diese Arbeit: Wir veröffentlichen Antwortseiten auf Ihrer Domain, beheben Probleme bei Crawler-Zugriff und Indexierung und messen jede Woche. Der Preis des Berichts wird auf den Plan angerechnet, wenn Sie ihn innerhalb von ${days} Tagen starten.`,
      },
      {
        q: "Was kostet der ausführliche Bericht?",
        a: `${report}, eine Zahlung pro Website. Der Schnellcheck auf dieser Seite funktioniert ohne Anmeldung und dauert etwa 30 Sekunden: 5 Fragen an ChatGPT und Perplexity. Legen Sie ein Konto an, und wir erstellen den ausführlichen Bericht für Ihre Website — 20 Fragen an ChatGPT, Claude, Gemini und Perplexity, je 3 Anfragen —; die Gesamtwerte und die 5 Fragen des Schnellchecks sind darin offen einsehbar. Der vollständige Bericht kostet ${report}: jede Antwort, alle, die statt Ihnen genannt werden, die Websites, die die Assistenten zitieren, und unser Maßnahmenplan für Ihre Website. Wenn Sie den Plan innerhalb von ${days} Tagen starten, werden die ${report} von Ihrer ersten Zahlung abgezogen. Ein echtes Beispiel (auf Englisch): itgrows.ai${sample}.`,
      },
      {
        q: "Was kostet der Plan?",
        a: `${month} pro Monat, monatlich kündbar, plus eine einmalige Einrichtung für ${setup}: Ihre Website und ihre Indizes werden startklar gemacht, geliefert als Startbericht. Die Einrichtungsgebühr entfällt, wenn Sie ${quarter} für 3 Monate im Voraus oder ${year} für ein Jahr zahlen (${yearPerMonth} pro Monat, ${yearOff} Rabatt). Der ausführliche Bericht ist inbegriffen.`,
      },
      {
        q: "Für wen ist das nicht das Richtige?",
        a: `Für alle ohne echte Expertise, die sie veröffentlichen könnten — die Engine verstärkt einen Standpunkt, sie kann keinen erfinden. Für alle, die eine unterschriebene Garantie brauchen. Und für alle, die diese Arbeit zum Preis eines Software-Tools wollen: Mit ${month} pro Monat ist der Plan an einer Teilzeitkraft für Content bemessen. Wenn Sie vor der Entscheidung das ganze Bild sehen möchten, zeigt der Bericht für ${report}, wo Sie stehen und was wir tun werden, und sein Preis wird auf den Plan angerechnet.`,
      },
      {
        q: "Bringt uns das Traffic von ChatGPT?",
        a: "Oft wenig: Assistenten antworten meist direkt im Chat. Wir zählen, ob Sie genannt und zitiert werden. Einige Kunden berichten von Kunden, Installationen und Leads, die über Assistenten kamen.",
      },
      {
        q: "Ich nutze ItGrows für LinkedIn. Wo ist mein Bereich?",
        a: "Wo er immer war: Anmelden, dann LinkedIn- & X-Bereich. An Ihren Posts, Ihrem Plan und Ihrer Abrechnung hat sich nichts geändert.",
      },
    ],

    toolsTitle: "Zwei Schnellchecks",
    toolsLead: "Website eingeben, Antwort sehen. Ohne Anmeldung.",
    quickChecks: [
      { title: "Nennt ChatGPT Sie?", line: "Fünf Fragen, die Ihre Kunden stellen würden, live an ChatGPT und Perplexity gestellt." },
      { title: "Können KI-Crawler Ihre Website lesen?", line: "Die Seiten Ihrer Sitemap, geprüft gegen robots.txt für GPTBot, ClaudeBot, PerplexityBot und weitere." },
    ],
    runIt: "Starten",

    guidesTitle: "Leitfäden zur KI-Sichtbarkeit (auf Englisch)",
    allGuides: "Alle Leitfäden →",
    expertsBlog: "Wie KI-Assistenten Experten finden und nennen →",
  },

  fr: {
    metaTitle: "Visibilité dans l’IA pour les entreprises : soyez mentionné par ChatGPT | ItGrows",
    metaDescription:
      "ItGrows rend les entreprises visibles dans les réponses de l’IA et rédige des posts LinkedIn et X pour les fondateurs. Vérifiez votre site en 30 secondes environ, sans inscription.",
    ogTitle: "Faites mentionner votre entreprise par ChatGPT, Claude, Gemini et Perplexity",
    ogDescription: "Des pages de réponse sur votre propre domaine, des corrections pour les robots et l’indexation, et une vérification hebdomadaire de quatre assistants.",

    orgDescription:
      "ItGrows rend les entreprises visibles dans les réponses de l’IA : des pages de réponse sur leur propre domaine, des corrections pour les robots d’IA et les index de recherche, et une vérification hebdomadaire de ChatGPT, Claude, Gemini et Perplexity. ItGrows rédige aussi des posts LinkedIn et X pour les fondateurs et les experts.",
    appName: "Test de visibilité IA ItGrows",
    appDescription:
      "Une vérification en 30 secondes : ChatGPT et Perplexity mentionnent-ils une entreprise quand ses clients posent la question ? Cinq questions de clients générées à partir du site, posées en direct avec la recherche web, avec les entreprises mentionnées à sa place et les sites cités. Sans inscription.",
    serviceName: "ItGrows — visibilité dans l’IA (GEO)",
    serviceType: "Optimisation pour les moteurs génératifs et publication de contenus",
    serviceDescription:
      "Des articles publiés sur le propre domaine du client qui répondent aux questions que les clients posent aux assistants IA, des corrections de l’accès des robots et de l’indexation, et une mesure hebdomadaire sur ChatGPT, Claude, Gemini et Perplexity de la mention de l’entreprise.",
    offerReport: "Rapport détaillé de visibilité dans l’IA",
    offerPlan: "Abonnement visibilité IA, mensuel",

    navHow: "Fonctionnement",
    navResults: "Résultats",
    navPricing: "Tarifs",
    navTools: "Outils",
    navGuides: "Guides",
    navLinkedIn: "Posts LinkedIn et X",
    checkMySite: "Vérifier mon site",

    h1: "Faites mentionner votre entreprise quand vos clients interrogent <g>ChatGPT, Claude, Gemini et Perplexity.</g>",
    lead: "Nous mesurons ce que quatre assistants répondent sur votre secteur, corrigeons ce qui empêche leurs robots et leurs index de recherche de lire votre site, publions des pages de réponse sur votre propre domaine et comptons chaque semaine si chacun d’eux vous mentionne.",
    heroNote: "Sans inscription · environ 30 secondes",

    founder: (from) =>
      `<b>Fondateur ou expert ?</b> ItGrows rédige aussi vos posts LinkedIn et X dans votre style — à partir de ${from}/mois, 14 jours d’essai.`,
    founderCta: "Posts LinkedIn et X →",
    openCabinet: "Ouvrir votre espace",

    casesTitle: "Ce que rapportent nos clients",
    hundreds: "Des centaines",
    cases: [
      { kind: "SaaS B2B", l: "nouveaux clients B2B en un mois, tous deux venus de ChatGPT" },
      { kind: "App iOS", l: "d’installations par mois venues de ChatGPT, Claude et Gemini" },
      { kind: "Marketplace de cours", l: "fois où des assistants IA ont ouvert ses pages en répondant à quelqu’un, en deux semaines" },
    ],
    casesNote: "Selon les clients ; pickaclass.com d’après son journal serveur, août 2026.",

    talkFirst: "Ou parlez-nous d’abord →",
    liPlans: (personal, duo, allIn) =>
      `Ghostwriting LinkedIn et X : Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>voir les formules</link>`,

    writeTitle: "Écrivez-nous",
    writeLead: "Une question sur votre site, l’abonnement ou autre chose ? Nous répondons sous 24 heures.",

    faqTitle: "Questions fréquentes",
    faq: ({ report, days, sample, month, setup, quarter, year, yearPerMonth, yearOff }) => [
      {
        q: "Qu’est-ce qu’ItGrows ?",
        a: "ItGrows aide une entreprise à être mentionnée quand ses clients interrogent un assistant IA. Nous posons à ChatGPT, Claude, Gemini et Perplexity les questions que posent ces clients, plusieurs fois chacune, et relevons qui est mentionné et quels sites sont cités. Puis nous publions sur le propre domaine de l’entreprise des pages qui répondent à ces questions, corrigeons ce qui empêche les robots d’IA et les index de recherche de lire le site, et mesurons de nouveau chaque semaine.",
      },
      {
        q: "ItGrows est-il un outil LinkedIn ou un service de visibilité dans l’IA ?",
        a: "Les deux, sous forme de deux produits. Pour les entreprises, ItGrows est un service de visibilité dans les réponses de l’IA (GEO). Pour les fondateurs et les experts, il rédige des posts LinkedIn et X dans leur propre style ; ce produit se trouve sur itgrows.ai/personal.",
      },
      { q: "Quels assistants mesurez-vous ?", a: "ChatGPT, Claude, Gemini et Perplexity, via leurs propres API avec la recherche web activée, trois requêtes par question, car leurs réponses varient." },
      {
        q: "Pouvez-vous garantir que ChatGPT nous mentionnera ?",
        a: "Non, et méfiez-vous de quiconque le promet. Aucun assistant ne vend de placement organique ni ne publie la façon dont il choisit. Nous faisons le travail qui vous rend trouvable et citable, et nous vous montrons chaque semaine ce qui a changé.",
      },
      {
        q: "Que pouvez-vous réellement prouver ?",
        a: "Trois choses. Si les assistants vous mentionnent : chaque semaine, nous posons à ChatGPT, Claude, Gemini et Perplexity les mêmes questions que vos clients, plusieurs fois chacune, et comptons les réponses qui vous mentionnent et les sites qu’elles citent. Et, pour les blogs que nous hébergeons, d’après le journal serveur : que les robots ont bien récupéré vos pages et que des assistants ont consulté des articles précis en répondant en direct à quelqu’un — ChatGPT-User, OAI-SearchBot et Perplexity-User n’apparaissent qu’en pleine conversation. Personne ne peut mesurer toutes les questions que n’importe qui pourrait poser ; nous mesurons celles que posent vos clients.",
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
        a: "Une fois qu’une page est dans les bons index, les robots arrivent en général en une ou deux semaines, et nous testons la trouvabilité chaque semaine pour repérer tout manque. Devenir une source vers laquelle un assistant revient régulièrement prend des mois et demande un vrai corpus. Si vous avez besoin d’un chiffre d’affaires attribuable ce trimestre, achetez de la publicité — nous vous le dirons pendant l’appel plutôt qu’après votre troisième facture.",
      },
      {
        q: "Nous donnez-vous un guide pour le faire nous-mêmes, ou faites-vous le travail ?",
        a: `Nous faisons le travail. Le rapport détaillé (${report}) est le diagnostic et notre plan d’action : où vous en êtes dans les quatre assistants, qui est mentionné à votre place et ce que nous allons faire, étape par étape. Avec l’abonnement, nous faisons ce travail : nous publions des pages de réponse sur votre domaine, corrigeons l’accès des robots et l’indexation, et mesurons chaque semaine. Le prix du rapport est déduit de l’abonnement s’il démarre dans les ${days} jours.`,
      },
      {
        q: "Combien coûte le rapport détaillé ?",
        a: `${report}, en un seul paiement par site. La vérification rapide de cette page se fait sans inscription et prend environ 30 secondes : 5 questions à ChatGPT et Perplexity. Créez un compte et nous établissons le rapport détaillé de votre site — 20 questions à ChatGPT, Claude, Gemini et Perplexity, 3 requêtes chacune —, dont les totaux et les 5 questions de la vérification rapide sont consultables. Le rapport complet coûte ${report} : chaque réponse, tous ceux qui sont mentionnés à votre place, les sites que citent les assistants et notre plan d’action pour votre site. Si vous démarrez l’abonnement dans les ${days} jours, les ${report} sont déduits de votre premier paiement. Un vrai rapport (en anglais) : itgrows.ai${sample}.`,
      },
      {
        q: "Combien coûte l’abonnement ?",
        a: `${month} par mois, sans engagement, plus une mise en place de ${setup}, facturée une seule fois : votre site et ses index préparés, livrés sous forme de rapport de lancement. La mise en place n’est pas facturée si vous payez 3 mois d’avance (${quarter}) ou un an (${year}, soit ${yearPerMonth} par mois, ${yearOff} de remise). Le rapport détaillé est inclus.`,
      },
      {
        q: "À qui ce service ne convient-il pas ?",
        a: `Pour ceux qui n’ont pas de véritable expertise à publier — le moteur amplifie un point de vue, il ne peut pas en inventer un. Pour ceux qui exigent une garantie signée. Et pour ceux qui veulent ce travail au prix d’un logiciel : à ${month} par mois, l’abonnement se compare au coût d’un rédacteur à temps partiel. Pour avoir une vue complète avant de décider, le rapport à ${report} montre où vous en êtes et ce que nous ferons, et son prix est déduit de l’abonnement.`,
      },
      {
        q: "Cela nous apportera-t-il du trafic depuis ChatGPT ?",
        a: "Souvent peu : les assistants répondent généralement sur place. Nous comptons si vous êtes mentionné et cité. Certains de nos clients font état de nouveaux clients, d’installations et de leads venus des assistants.",
      },
      {
        q: "J’utilise ItGrows pour LinkedIn. Où est mon espace ?",
        a: "Là où il a toujours été : Se connecter, puis Espace LinkedIn et X. Rien n’a changé pour vos posts, votre formule ni votre facturation.",
      },
    ],

    toolsTitle: "Deux vérifications rapides",
    toolsLead: "Saisissez votre site, voyez la réponse. Sans inscription.",
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
    metaTitle: "Visibilidad en IA para empresas: que ChatGPT le mencione | ItGrows",
    metaDescription:
      "ItGrows hace visibles a las empresas en las respuestas de la IA y redacta publicaciones de LinkedIn y X para fundadores. Compruebe su sitio en unos 30 segundos, sin registro.",
    ogTitle: "Haga que ChatGPT, Claude, Gemini y Perplexity mencionen su empresa",
    ogDescription: "Páginas de respuesta en su propio dominio, correcciones de rastreo e indexación y una comprobación semanal de cuatro asistentes.",

    orgDescription:
      "ItGrows hace visibles a las empresas en las respuestas de la IA: páginas de respuesta en su propio dominio, correcciones para rastreadores de IA e índices de búsqueda, y una comprobación semanal de ChatGPT, Claude, Gemini y Perplexity. También redacta publicaciones de LinkedIn y X para fundadores y expertos.",
    appName: "Comprobación de visibilidad en IA de ItGrows",
    appDescription:
      "Una comprobación de 30 segundos de si ChatGPT y Perplexity mencionan a una empresa cuando sus clientes preguntan: cinco preguntas de clientes generadas a partir del sitio, respondidas en directo con búsqueda web, con las empresas mencionadas en su lugar y los sitios citados. Sin registro.",
    serviceName: "ItGrows — visibilidad en IA (GEO)",
    serviceType: "Optimización para motores generativos y publicación de contenidos",
    serviceDescription:
      "Artículos publicados en el propio dominio del cliente que responden a las preguntas que los clientes hacen a los asistentes de IA, correcciones del acceso de rastreadores y de la indexación, y una medición semanal en ChatGPT, Claude, Gemini y Perplexity de si se menciona a la empresa.",
    offerReport: "Informe detallado de visibilidad en IA",
    offerPlan: "Plan de visibilidad en IA, mensual",

    navHow: "Cómo funciona",
    navResults: "Resultados",
    navPricing: "Precios",
    navTools: "Herramientas",
    navGuides: "Guías",
    navLinkedIn: "Publicaciones en LinkedIn y X",
    checkMySite: "Comprobar mi sitio",

    h1: "Haga que mencionen su empresa cuando sus clientes pregunten a <g>ChatGPT, Claude, Gemini y Perplexity.</g>",
    lead: "Medimos lo que cuatro asistentes responden sobre su sector, corregimos lo que impide a sus rastreadores e índices de búsqueda leer su sitio, publicamos páginas de respuesta en su propio dominio y contamos cada semana si cada uno de ellos menciona su empresa.",
    heroNote: "Sin registro · unos 30 segundos",

    founder: (from) =>
      `<b>¿Fundador o experto?</b> ItGrows también redacta sus publicaciones de LinkedIn y X con su propia voz — desde ${from}/mes, 14 días de prueba.`,
    founderCta: "Publicaciones en LinkedIn y X →",
    openCabinet: "Abrir su panel",

    casesTitle: "Lo que cuentan los clientes",
    hundreds: "Cientos",
    cases: [
      { kind: "SaaS B2B", l: "clientes B2B nuevos en un mes, los dos desde ChatGPT" },
      { kind: "App de iOS", l: "de instalaciones al mes desde ChatGPT, Claude y Gemini" },
      { kind: "Marketplace de cursos", l: "veces que los asistentes de IA abrieron sus páginas mientras respondían a alguien, en dos semanas" },
    ],
    casesNote: "Según los propios clientes; pickaclass.com, según el registro de su servidor, agosto de 2026.",

    talkFirst: "O hable antes con nosotros →",
    liPlans: (personal, duo, allIn) =>
      `Ghostwriting para LinkedIn y X: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>ver planes</link>`,

    writeTitle: "Escríbanos",
    writeLead: "Preguntas sobre su sitio, el plan o cualquier otra cosa. Respondemos en menos de un día.",

    faqTitle: "Preguntas",
    faq: ({ report, days, sample, month, setup, quarter, year, yearPerMonth, yearOff }) => [
      {
        q: "¿Qué es ItGrows?",
        a: "ItGrows ayuda a una empresa a que la mencionen cuando sus clientes preguntan a un asistente de IA. Planteamos a ChatGPT, Claude, Gemini y Perplexity las preguntas que hacen esos clientes, varias veces cada una, y registramos a quién mencionan y qué sitios citan. Después publicamos en el propio dominio de la empresa páginas que responden a esas preguntas, corregimos lo que impide a los rastreadores de IA y a los índices de búsqueda leer el sitio, y volvemos a medir cada semana.",
      },
      {
        q: "¿ItGrows es una herramienta para LinkedIn o un servicio de visibilidad en IA?",
        a: "Ambas cosas, como dos productos. Para empresas, ItGrows es un servicio de visibilidad en las respuestas de la IA (GEO). Para fundadores y expertos, redacta publicaciones de LinkedIn y X con su propia voz; ese producto está en itgrows.ai/personal.",
      },
      { q: "¿Qué asistentes miden?", a: "ChatGPT, Claude, Gemini y Perplexity, a través de sus propias API con la búsqueda web activada, tres consultas por pregunta, porque sus respuestas varían." },
      {
        q: "¿Pueden garantizar que ChatGPT nos mencione?",
        a: "No, y desconfíe de quien lo haga. Ningún asistente vende posiciones orgánicas ni publica cómo elige. Hacemos el trabajo que permite encontrarle y citarle, y cada semana le mostramos qué ha cambiado.",
      },
      {
        q: "¿Qué pueden demostrar realmente?",
        a: "Tres cosas. Si los asistentes le mencionan: cada semana planteamos a ChatGPT, Claude, Gemini y Perplexity las mismas preguntas que hacen sus clientes, varias veces cada una, y contamos las respuestas que le mencionan y los sitios que citan. Y, en los blogs que alojamos, a partir del registro del servidor: que los rastreadores descargaron sus páginas y que los asistentes consultaron artículos concretos mientras respondían a alguien en directo — ChatGPT-User, OAI-SearchBot y Perplexity-User solo aparecen en mitad de una conversación. Nadie puede medir todas las preguntas que cualquiera podría hacer; medimos las que hacen sus clientes.",
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
        a: "Una vez que una página está en los índices adecuados, los rastreadores suelen llegar en una o dos semanas, y comprobamos cada semana si se puede encontrar, para detectar cualquier hueco. Convertirse en una fuente a la que un asistente recurre una y otra vez lleva meses y un buen volumen de contenido. Si necesita ingresos atribuibles este trimestre, compre publicidad — se lo diremos en la llamada y no después de su tercera factura.",
      },
      {
        q: "¿Nos dan una guía para hacerlo nosotros mismos o hacen ustedes el trabajo?",
        a: `Hacemos el trabajo. El informe detallado (${report}) es el diagnóstico y nuestro plan de acción: dónde está usted en los cuatro asistentes, a quién mencionan en su lugar y qué haremos al respecto, paso a paso. Con el plan hacemos ese trabajo: publicamos páginas de respuesta en su dominio, corregimos el acceso de los rastreadores y la indexación, y medimos cada semana. El precio del informe se descuenta del plan si lo inicia en un plazo de ${days} días.`,
      },
      {
        q: "¿Cuánto cuesta el informe detallado?",
        a: `${report}, un único pago por sitio. La comprobación rápida de esta página no requiere registro y tarda unos 30 segundos: 5 preguntas a ChatGPT y Perplexity. Cree una cuenta y elaboraremos el informe detallado de su sitio — 20 preguntas a ChatGPT, Claude, Gemini y Perplexity, 3 consultas cada una —, con sus totales y las 5 preguntas de la comprobación rápida a la vista. El informe completo cuesta ${report}: cada respuesta, todas las empresas mencionadas en su lugar, los sitios que citan los asistentes y nuestro plan de acción para su sitio. Si inicia el plan en un plazo de ${days} días, los ${report} se descuentan de su primer pago. Un ejemplo real (en inglés): itgrows.ai${sample}.`,
      },
      {
        q: "¿Cuánto cuesta el plan?",
        a: `${month} al mes, mes a mes, más una configuración inicial de ${setup} (pago único): su sitio y sus índices listos, entregados como un informe de lanzamiento. La configuración inicial no se cobra si paga 3 meses por adelantado (${quarter}) o un año (${year}, ${yearPerMonth} al mes, un ${yearOff} de descuento). El informe detallado está incluido.`,
      },
      {
        q: "¿Para quién no es esto?",
        a: `Para quien no tenga conocimientos especializados reales que publicar — el motor amplifica un punto de vista, no puede inventarlo. Para quien necesite una garantía firmada. Y para quien quiera este trabajo al precio de una herramienta de software: a ${month} al mes, el plan se compara con contratar a un redactor a tiempo parcial. Para ver el panorama completo antes de decidir, el informe de ${report} muestra dónde está usted y qué haremos, y su precio se descuenta del plan.`,
      },
      {
        q: "¿Nos traerá tráfico desde ChatGPT?",
        a: "A menudo poco: los asistentes suelen responder en el propio chat. Contamos si le mencionan y le citan. Algunos clientes nos cuentan que han conseguido clientes, instalaciones y leads a través de los asistentes.",
      },
      {
        q: "Uso ItGrows para LinkedIn. ¿Dónde está mi panel?",
        a: "Donde siempre: Iniciar sesión y luego Panel de LinkedIn y X. Nada ha cambiado en sus publicaciones, su plan ni su facturación.",
      },
    ],

    toolsTitle: "Dos comprobaciones rápidas",
    toolsLead: "Introduzca su sitio y vea la respuesta. Sin registro.",
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
    metaTitle: "Видимость в ИИ для бизнеса: пусть ChatGPT называет вас | ItGrows",
    metaDescription:
      "ItGrows делает компании видимыми в ответах ИИ и пишет посты в LinkedIn и X для основателей. Проверьте свой сайт примерно за 30 секунд, без регистрации.",
    ogTitle: "Пусть ChatGPT, Claude, Gemini и Perplexity называют вашу компанию",
    ogDescription: "Страницы-ответы на вашем собственном домене, исправления для краулеров и индексации и еженедельная проверка четырёх ассистентов.",

    orgDescription:
      "ItGrows делает компании видимыми в ответах ИИ: страницы-ответы на их собственном домене, исправления для ИИ-краулеров и поисковых индексов и еженедельная проверка ChatGPT, Claude, Gemini и Perplexity. Также ItGrows пишет черновики постов в LinkedIn и X для основателей и экспертов.",
    appName: "Проверка видимости в ИИ от ItGrows",
    appDescription:
      "30-секундная проверка того, называют ли ChatGPT и Perplexity компанию, когда спрашивают её клиенты: пять клиентских вопросов, составленных по сайту, с ответами в реальном времени через веб-поиск, с компаниями, которых называют вместо неё, и процитированными сайтами. Без регистрации.",
    serviceName: "ItGrows — видимость в ИИ (GEO)",
    serviceType: "Оптимизация под генеративные системы и публикация контента",
    serviceDescription:
      "Статьи на собственном домене клиента, отвечающие на вопросы, которые клиенты задают ИИ-ассистентам, исправление доступа краулеров и индексации и еженедельное измерение в ChatGPT, Claude, Gemini и Perplexity того, называют ли компанию.",
    offerReport: "Подробный отчёт о видимости в ИИ",
    offerPlan: "Подписка на видимость в ИИ, помесячно",

    navHow: "Как это работает",
    navResults: "Результаты",
    navPricing: "Цены",
    navTools: "Инструменты",
    navGuides: "Руководства",
    navLinkedIn: "Посты для LinkedIn и X",
    checkMySite: "Проверить мой сайт",

    h1: "Пусть вашу компанию называют, когда клиенты спрашивают <g>ChatGPT, Claude, Gemini и Perplexity.</g>",
    lead: "Мы измеряем, что четыре ассистента отвечают о вашей сфере, устраняем то, что мешает их краулерам и поисковым индексам читать ваш сайт, публикуем страницы-ответы на вашем собственном домене и каждую неделю считаем, называет ли вас каждый из них.",
    heroNote: "Без регистрации · около 30 секунд",

    founder: (from) =>
      `<b>Основатель или эксперт?</b> ItGrows также пишет черновики ваших постов в LinkedIn и X вашим собственным голосом — от ${from}/мес., 14 дней пробного периода.`,
    founderCta: "Посты для LinkedIn и X →",
    openCabinet: "Открыть кабинет",

    casesTitle: "Что сообщают клиенты",
    hundreds: "Сотни",
    cases: [
      { kind: "B2B SaaS", l: "новых B2B-клиента за один месяц, оба — из ChatGPT" },
      { kind: "iOS-приложение", l: "установок в месяц из ChatGPT, Claude и Gemini" },
      { kind: "Маркетплейс курсов", l: "раз ИИ-ассистенты открывали его страницы, отвечая кому-то, — за две недели" },
    ],
    casesNote: "По данным клиентов; pickaclass.com — по логу своего сервера, август 2026.",

    talkFirst: "Или сначала напишите нам →",
    liPlans: (personal, duo, allIn) =>
      `Гострайтинг для LinkedIn и X: Personal ${personal} · Duo ${duo} · All-in ${allIn} — <link>смотреть тарифы</link>`,

    writeTitle: "Напишите нам",
    writeLead: "Вопросы о вашем сайте, подписке или о чём угодно ещё. Отвечаем в течение дня.",

    faqTitle: "Вопросы",
    faq: ({ report, days, sample, month, setup, quarter, year, yearPerMonth, yearOff }) => [
      {
        q: "Что такое ItGrows?",
        a: "ItGrows помогает компании добиться того, чтобы её называли, когда её клиенты спрашивают ИИ-ассистента. Мы задаём ChatGPT, Claude, Gemini и Perplexity вопросы, которые задают эти клиенты, по нескольку раз каждый, и фиксируем, кого называют и какие сайты цитируют. Затем публикуем на собственном домене компании страницы, отвечающие на эти вопросы, устраняем то, что мешает ИИ-краулерам и поисковым индексам читать сайт, и каждую неделю измеряем снова.",
      },
      {
        q: "ItGrows — это инструмент для LinkedIn или сервис видимости в ИИ?",
        a: "И то и другое — это два продукта. Для компаний ItGrows — сервис видимости в ответах ИИ (GEO). Для основателей и экспертов он пишет черновики постов в LinkedIn и X их собственным голосом; этот продукт находится на itgrows.ai/personal.",
      },
      { q: "Какие ассистенты вы измеряете?", a: "ChatGPT, Claude, Gemini и Perplexity — через их собственные API с включённым веб-поиском, по три запроса на вопрос, потому что их ответы меняются." },
      {
        q: "Можете ли вы гарантировать, что ChatGPT будет нас называть?",
        a: "Нет, и не доверяйте тем, кто это гарантирует. Ни один ассистент не продаёт органические места и не раскрывает, как делает выбор. Мы делаем работу, благодаря которой вас можно найти и процитировать, и каждую неделю показываем, что изменилось.",
      },
      {
        q: "Что вы можете доказать на деле?",
        a: "Три вещи. Называют ли вас ассистенты: каждую неделю мы задаём ChatGPT, Claude, Gemini и Perplexity те же вопросы, что задают ваши клиенты, по нескольку раз каждый, и считаем ответы, в которых называют вас, и сайты, которые они цитируют. А для блогов, которые хостим мы, — по логу сервера: что краулеры забирали ваши страницы и что ассистенты открывали конкретные статьи, отвечая кому-то в реальном времени, — ChatGPT-User, OAI-SearchBot и Perplexity-User появляются только посреди разговора. Никто не может измерить все вопросы, которые кто угодно может задать; мы измеряем те, что задают ваши клиенты.",
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
        a: "Как только страница попадает в нужные индексы, краулеры обычно приходят в течение одной-двух недель, а мы каждую неделю проверяем находимость, чтобы вовремя заметить пробел. Стать источником, к которому ассистент обращается снова и снова, — это месяцы и солидный объём работы. Если вам нужна выручка с понятным источником уже в этом квартале, покупайте рекламу — мы скажем это на звонке, а не после вашего третьего счёта.",
      },
      {
        q: "Вы даёте инструкцию, чтобы мы всё сделали сами, или делаете работу?",
        a: `Мы делаем работу. Подробный отчёт (${report}) — это диагноз и наш план действий: где вы находитесь во всех четырёх ассистентах, кого называют вместо вас и что мы будем с этим делать, шаг за шагом. По подписке мы делаем эту работу: публикуем страницы-ответы на вашем домене, исправляем доступ краулеров и индексацию и измеряем каждую неделю. Стоимость отчёта засчитывается в подписку, если вы оформите её в течение ${ruDays(days)}.`,
      },
      {
        q: "Сколько стоит подробный отчёт?",
        a: `${report}, один платёж за сайт. Быстрая проверка на этой странице проходит без регистрации и занимает около 30 секунд: 5 вопросов к ChatGPT и Perplexity. Создайте аккаунт, и мы составим подробный отчёт по вашему сайту — 20 вопросов к ChatGPT, Claude, Gemini и Perplexity, по 3 запроса на каждый, — итоги и 5 вопросов быстрой проверки в нём открыты. Весь отчёт стоит ${report}: каждый ответ, все, кого называют вместо вас, сайты, которые цитируют ассистенты, и наш план действий для вашего сайта. Если вы оформите подписку в течение ${ruDays(days)}, ${report} вычитаются из первого платежа. Настоящий отчёт (на английском): itgrows.ai${sample}.`,
      },
      {
        q: "Сколько стоит подписка?",
        a: `${month} в месяц с помесячной оплатой, плюс разовая настройка за ${setup}: ваш сайт и его индексы готовятся к работе, результат — отчёт о запуске. Плата за настройку не взимается, если вы платите ${quarter} за 3 месяца вперёд или ${year} за год (${yearPerMonth} в месяц, скидка ${yearOff}). Подробный отчёт входит в стоимость.`,
      },
      {
        q: "Кому это не подойдёт?",
        a: `Тем, у кого нет настоящей экспертизы, которую можно публиковать, — движок усиливает точку зрения, но не может её придумать. Тем, кому нужна подписанная гарантия. И тем, кто хочет получить эту работу по цене программы: при ${month} в месяц подписка сопоставима с контент-специалистом на неполный день. Чтобы увидеть полную картину до решения, отчёт за ${report} покажет, где вы находитесь и что мы будем делать, а его стоимость засчитывается в подписку.`,
      },
      {
        q: "Принесёт ли это нам трафик из ChatGPT?",
        a: "Часто немного: ассистенты обычно отвечают прямо в чате. Мы считаем, называют ли вас и цитируют ли. Некоторые клиенты сообщают о покупателях, установках и лидах, пришедших из ассистентов.",
      },
      {
        q: "Я пользуюсь ItGrows для LinkedIn. Где мой кабинет?",
        a: "Там же, где и был: «Войти», затем «Кабинет LinkedIn и X». Для ваших постов, тарифа и оплаты ничего не изменилось.",
      },
    ],

    toolsTitle: "Две быстрые проверки",
    toolsLead: "Введите адрес сайта — и увидите ответ. Без регистрации.",
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
