import { defineMessages } from "../messages"

// app/business/GeoSections.tsx: WorkSystem (work), WhyThisMatters (why), VersusArticles (versus) and
// what the plan includes (included). The big numbers of the five stages stay in the component; the
// findings' numbers carry words, so they are here. No plan price is named: under the price test
// (lib/geo-pricing.ts PRICE_TEST) the price is shown only in the cabinet.

const en = {
  work: {
    kicker: "What we run for you",
    h2: "An article is the last step, not the product",
    lead: "Five stages. We do the work, every week. You see every article 2 days before it goes live, and can edit or stop it.",
    stages: [
      {
        step: "Measure",
        l: "answers read before we write a word",
        d: "Twenty questions your buyers ask, put to all four assistants three times each, because their answers change from one ask to the next. Who is named, which pages are quoted, and what kind of site each source is: a competitor, a review site, a directory and an official source each call for a different move. Some questions no article on your own site can win; we find out which before your budget goes into them.",
      },
      {
        step: "Open the doors",
        l: "crawlers your site is tested as",
        d: "Before the first article, on every domain you own: certificates, redirects, your host's firewall, robots.txt, sitemaps. Whatever stops GPTBot, ClaudeBot, PerplexityBot and the rest, we find and fix with you.",
      },
      {
        step: "Get indexed",
        l: "search indexes, one per assistant",
        d: "ChatGPT searches through Bing, Claude through Brave, Gemini through Google, Perplexity through its own. A page Google has indexed can still be invisible to the other three. On blogs we host, every new page is submitted to Bing within half an hour, and every article keeps one address.",
      },
      {
        step: "Write",
        l: "sources read and cited per article",
        d: "Research on live search, and every source is read before it is cited. An editor pass checks each claim against your product facts and the sources, then automated checks go over the rest. A topic too close to one you already have is not written. You see every article 2 days before it goes live, and can edit or stop it.",
      },
      {
        step: "Re-measure",
        l: "full recounts a year, against day 0",
        d: "The same questions against day 0, every two weeks. A separate test tells us whether each assistant can find your published articles at all, so a gap in indexing is caught and fixed instead of being mistaken for weak writing. Once a month, a report in your language, read by a person before it reaches you.",
      },
    ],
    inside: "What runs inside each stage",
    closing: "None of this shows in an article. All of it decides whether an assistant ever reads one.",
    seePlan: "See the plan →",
  },
  // WhyThisMatters (why): third-party figures, each linked to its source in the component. The
  // numbers are formatted per language there (formatNumber), and the source names stay there too.
  why: {
    kicker: "Why this matters",
    h2: "Your customers ask AI who to pick. It names a few businesses. If it's not you, it's your competitor.",
    lead: "Not on page two. Not in an ad. In the answer, the first thing they read.",
    users: { n: "1 billion+", l: "people use ChatGPT every week.", src: "August 2026" },
    local: {
      l: (was: string) => `of US consumers use ChatGPT and other AI tools for local business recommendations. A year earlier: ${was}.`,
      src: (n: string) => `2026 (${n} US adults)`,
    },
    vendor: {
      l: "of B2B software buyers chose a different vendor than they had planned because a chatbot recommended it.",
      src: (n: string) => `March 2026 (${n} buyers)`,
    },
    clicks: {
      vs: "vs",
      l: "When Google shows its AI answer, people click a regular result about half as often.",
      src: (n: string) => `March 2025 browsing data (${n} US adults)`,
    },
    compare: {
      h3: "Paid ads vs. being the answer",
      colA: "Paid search ads",
      colB: "Named in the AI answer",
      lead: {
        k: "One lead costs",
        a: (avg: string, law: string, home: string, dent: string) =>
          `<b>${avg}</b> on average in the US. Lawyers ${law} · home improvement ${home} · dentists ${dent}.`,
        b: "No price per click, lead or customer. You pay for the work.",
      },
      customer: {
        k: "One customer costs",
        a: (legal: string, logistics: string, construction: string) => `Legal ${legal} · logistics ${logistics} · construction ${construction} (B2B).`,
        none: "No price per customer.",
      },
      stop: { k: "You stop paying", a: "The leads stop that day.", b: "Doesn't depend on your ad budget." },
      buy: {
        k: "Can money buy the spot?",
        a: "Yes. That's the auction.",
        b: "Not in ChatGPT: <en>“Advertising does not influence the answers ChatGPT provides.”</en>",
      },
    },
    costs: (cpc: string, perAd: string) =>
      `Clicks keep getting pricier: <g>Google's cost per click rose ${cpc} in 2025</g>, <m>Meta's average price per ad rose ${perAd}</m>.`,
    closing:
      "Nobody can guarantee a mention, and anyone who promises one is lying. We don't promise. We count: your customers' questions, four assistants, every two weeks.",
    cta: "Check my site →",
    footnote:
      "Ad costs: WordStream by LocaliQ 2026, US Google and Microsoft search campaigns, April 2025 – March 2026; the publisher's averages are medians; a lead is an inquiry, not a sale. Cost per customer: First Page Sage's own B2B client data, January 2022 – August 2025; “paid” there means mainly search ads and paid social. Each survey figure shows who was asked and when.",
    newTab: "(opens in a new tab)",
  },
  versus: {
    h2: "Why this is not paying for articles",
    colA: "Article-only service",
    colB: "ItGrows plan",
    // a: what an article-only service does; b: what the plan does; k + d: the detail (k is followed by ".").
    rows: [
      { a: "A keyword list", b: "240 answers read first", k: "Before writing", d: "Who ChatGPT, Claude, Gemini and Perplexity name today, and who they quote." },
      { a: "Crawlers not checked", b: "Tested as 11 crawlers", k: "Can assistants reach your site?", d: "Blockers are found and fixed with you before the first article." },
      {
        a: "Publish and hope",
        b: "Findability tested every two weeks",
        k: "Is each page in the index each assistant searches?",
        d: "New pages are submitted to Bing on publication (blogs we host), and every two weeks we test whether each assistant can find them.",
      },
      { a: "Duplicates not checked", b: "Duplicates found, fixed", k: "Duplicate addresses, sitemaps that miss new pages", d: "We find them on your site and fix them." },
      { a: "Unwinnable topics written", b: "Spotted before you spend", k: "Questions no own-site article can win", d: "Found before your budget goes into them." },
      { a: "Facts up to the writer", b: "3–5 sources, each read", k: "Facts and sources", d: "Every source read before it is cited; an editor pass and automated checks on every article." },
      { a: "Proof: articles, traffic", b: "Proof: count vs day 0", k: "Proof", d: "The same questions against day 0, every two weeks, across four assistants." },
      { a: "You pay for words", b: "You pay to be findable", k: "What you pay for", d: "Being findable, readable and quotable, and an honest count of whether you are named." },
    ],
    footnote: "Some agencies do more than write. Ask them for their latest count against day 0.",
  },
  included: [
    "Setup: your site tested as 11 crawlers, blockers fixed, Bing and Google set up — one-time, free with 3 months or a year",
    "Day 0: the full detailed report — 240 answers from ChatGPT, Claude, Gemini and Perplexity — included",
    "Every two weeks: the same count against day 0, whether the assistants can find your articles, and who is quoted instead",
    "Up to 12 researched articles a month on your own domain, 3–5 sources each",
    "The sites the assistants quote instead of you: we prepare the profiles and the letters to editors",
    "Blog hosting with the machine-readable layer built in — one DNS record",
    "You see every article 2 days before it goes live, and can edit or stop it",
    "A monthly report in your language, read by a person first",
    "A human who knows your account",
  ],
}

export default defineMessages(en, {
  de: {
    work: {
      kicker: "Was wir für Sie leisten",
      h2: "Ein Artikel ist der letzte Schritt, nicht das Produkt",
      lead: "Fünf Stufen. Wir erledigen die Arbeit, jede Woche. Sie sehen jeden Artikel 2 Tage vor der Veröffentlichung und können ihn bearbeiten oder stoppen.",
      stages: [
        {
          step: "Messen",
          l: "Antworten gelesen, bevor wir ein Wort schreiben",
          d: "Zwanzig Fragen, die Ihre Kunden stellen, an alle vier Assistenten, jeweils dreimal, weil sich ihre Antworten von Anfrage zu Anfrage ändern. Wer genannt wird, welche Seiten zitiert werden und welche Art von Website jede Quelle ist: Ein Wettbewerber, ein Bewertungsportal, ein Verzeichnis und eine offizielle Quelle verlangen jeweils einen anderen Schritt. Manche Fragen kann kein Artikel auf Ihrer eigenen Website gewinnen; wir finden heraus, welche, bevor Ihr Budget hineinfließt.",
        },
        {
          step: "Türen öffnen",
          l: "Crawler-Kennungen, mit denen wir Ihre Website testen",
          d: "Vor dem ersten Artikel, auf jeder Ihrer Domains: Zertifikate, Weiterleitungen, die Firewall Ihres Hosters, robots.txt, Sitemaps. Was GPTBot, ClaudeBot, PerplexityBot und die anderen aufhält, finden und beheben wir gemeinsam mit Ihnen.",
        },
        {
          step: "Indexiert werden",
          l: "Suchindizes, einer pro Assistent",
          d: "ChatGPT sucht über Bing, Claude über Brave, Gemini über Google, Perplexity über einen eigenen Index. Eine Seite, die Google indexiert hat, kann für die anderen drei trotzdem unsichtbar sein. Bei Blogs, die wir hosten, wird jede neue Seite innerhalb einer halben Stunde bei Bing eingereicht, und jeder Artikel behält eine einzige Adresse.",
        },
        {
          step: "Schreiben",
          l: "Quellen pro Artikel gelesen und zitiert",
          d: "Recherche mit Live-Suche, und jede Quelle wird gelesen, bevor sie zitiert wird. Ein Lektorat prüft jede Aussage anhand Ihrer Produktfakten und der Quellen, danach übernehmen automatische Prüfungen den Rest. Ein Thema, das einem vorhandenen zu nahe kommt, wird nicht geschrieben. Sie sehen jeden Artikel 2 Tage vor der Veröffentlichung und können ihn bearbeiten oder stoppen.",
        },
        {
          step: "Neu messen",
          l: "vollständige Nachzählungen pro Jahr, im Vergleich zu Tag 0",
          d: "Dieselben Fragen im Vergleich zu Tag 0, alle zwei Wochen. Ein separater Test zeigt uns, ob jeder Assistent Ihre veröffentlichten Artikel überhaupt finden kann, damit eine Indexierungslücke erkannt und behoben wird, statt für schwache Texte gehalten zu werden. Einmal im Monat ein Bericht in Ihrer Sprache, von einem Menschen gelesen, bevor er Sie erreicht.",
        },
      ],
      inside: "Was in jeder Stufe passiert",
      closing: "Nichts davon sieht man einem Artikel an. All das entscheidet, ob ein Assistent ihn je liest.",
      seePlan: "Zum Plan →",
    },
    why: {
      kicker: "Warum das zählt",
      h2: "Ihre Kunden fragen die KI, wen sie wählen sollen. Die KI nennt ein paar Unternehmen. Sind Sie es nicht, ist es Ihr Wettbewerber.",
      lead: "Nicht auf Seite zwei. Nicht in einer Anzeige. In der Antwort – das Erste, was sie lesen.",
      users: { n: "1 Milliarde+", l: "Menschen nutzen ChatGPT jede Woche.", src: "August 2026" },
      local: {
        l: (was) => `der US-Verbraucher nutzen ChatGPT und andere KI-Tools für Empfehlungen zu lokalen Unternehmen. Ein Jahr zuvor: ${was}.`,
        src: (n) => `2026 (${n} Erwachsene in den USA)`,
      },
      vendor: {
        l: "der B2B-Softwarekäufer haben sich für einen anderen Anbieter entschieden als geplant, weil ein Chatbot ihn empfohlen hat.",
        src: (n) => `März 2026 (${n} Käufer)`,
      },
      clicks: {
        vs: "vs.",
        l: "Wenn Google seine KI-Antwort zeigt, klicken Menschen nur etwa halb so oft auf ein normales Suchergebnis.",
        src: (n) => `Browserdaten März 2025 (${n} Erwachsene in den USA)`,
      },
      compare: {
        h3: "Anzeigen kaufen vs. selbst die Antwort sein",
        colA: "Bezahlte Suchanzeigen",
        colB: "In der KI-Antwort genannt",
        lead: {
          k: "Ein Lead kostet",
          a: (avg, law, home, dent) => `<b>${avg}</b> im Schnitt in den USA. Anwälte ${law} · Haus und Renovierung ${home} · Zahnärzte ${dent}.`,
          b: "Kein Preis pro Klick, Lead oder Kunde. Sie bezahlen die Arbeit.",
        },
        customer: {
          k: "Ein Kunde kostet",
          a: (legal, logistics, construction) => `Rechtsdienstleistungen ${legal} · Logistik ${logistics} · Bau ${construction} (B2B).`,
          none: "Kein Preis pro Kunde.",
        },
        stop: { k: "Wenn Sie nicht mehr zahlen", a: "Die Leads bleiben am selben Tag aus.", b: "Hängt nicht von Ihrem Werbebudget ab." },
        buy: {
          k: "Lässt sich der Platz kaufen?",
          a: "Ja. Genau das ist die Auktion.",
          b: "Nicht bei ChatGPT: „<en>Advertising does not influence the answers ChatGPT provides.</en>“ [Übersetzung: Werbung beeinflusst nicht die Antworten, die ChatGPT gibt.]",
        },
      },
      costs: (cpc, perAd) =>
        `Klicks werden immer teurer: <g>Googles Kosten pro Klick stiegen 2025 um ${cpc}</g>, <m>der durchschnittliche Preis pro Anzeige bei Meta um ${perAd}</m>.`,
      closing:
        "Niemand kann eine Nennung garantieren, und wer eine verspricht, lügt. Wir versprechen nichts. Wir zählen: die Fragen Ihrer Kunden, vier Assistenten, alle zwei Wochen.",
      cta: "Website prüfen →",
      footnote:
        "Werbekosten: WordStream by LocaliQ 2026, Suchkampagnen bei Google und Microsoft in den USA, April 2025 – März 2026; die Durchschnittswerte des Herausgebers sind Mediane; ein Lead ist eine Anfrage, kein Verkauf. Kosten pro Kunde: eigene B2B-Kundendaten von First Page Sage, Januar 2022 – August 2025; „bezahlt“ heißt dort vor allem Suchanzeigen und bezahlte Social-Media-Werbung. Bei jeder Umfragezahl steht, wer wann befragt wurde.",
      newTab: "(öffnet in neuem Tab)",
    },
    versus: {
      h2: "Warum Sie hier nicht für Artikel bezahlen",
      colA: "Reiner Artikeldienst",
      colB: "ItGrows-Plan",
      rows: [
        { a: "Eine Keyword-Liste", b: "Zuerst 240 Antworten gelesen", k: "Vor dem Schreiben", d: "Wen ChatGPT, Claude, Gemini und Perplexity heute nennen und wen sie zitieren." },
        { a: "Crawler nicht geprüft", b: "Mit 11 Crawler-Kennungen getestet", k: "Erreichbarkeit für Assistenten", d: "Blockaden werden vor dem ersten Artikel gefunden und mit Ihnen behoben." },
        {
          a: "Veröffentlichen und hoffen",
          b: "Auffindbarkeit alle zwei Wochen getestet",
          k: "Jede Seite im Index jedes Assistenten",
          d: "Neue Seiten werden bei Veröffentlichung bei Bing eingereicht (bei Blogs, die wir hosten), und alle zwei Wochen testen wir, ob jeder Assistent sie finden kann.",
        },
        { a: "Duplikate nicht geprüft", b: "Duplikate gefunden, behoben", k: "Doppelte Adressen, Sitemaps ohne neue Seiten", d: "Wir finden sie auf Ihrer Website und beheben sie." },
        { a: "Aussichtslose Themen geschrieben", b: "Erkannt, bevor Sie zahlen", k: "Fragen, die kein Artikel auf der eigenen Website gewinnen kann", d: "Erkannt, bevor Ihr Budget hineinfließt." },
        { a: "Fakten nach Gutdünken des Autors", b: "3–5 Quellen, jede gelesen", k: "Fakten und Quellen", d: "Jede Quelle wird gelesen, bevor sie zitiert wird; Lektorat und automatische Prüfungen bei jedem Artikel." },
        { a: "Beleg: Artikel, Traffic", b: "Beleg: Zählung vs. Tag 0", k: "Belege", d: "Dieselben Fragen im Vergleich zu Tag 0, alle zwei Wochen, über vier Assistenten." },
        { a: "Sie zahlen für Wörter", b: "Sie zahlen für Auffindbarkeit", k: "Wofür Sie zahlen", d: "Auffindbar, lesbar und zitierfähig zu sein, und eine ehrliche Zählung, ob Sie genannt werden." },
      ],
      footnote: "Manche Agenturen tun mehr als schreiben. Fragen Sie sie nach ihrer letzten Zählung im Vergleich zu Tag 0.",
    },
    included: [
      "Einrichtung: Ihre Website mit 11 Crawler-Kennungen getestet, Blockaden behoben, Bing und Google eingerichtet — einmalig, entfällt bei Vorauszahlung von 3 Monaten oder einem Jahr",
      "Tag 0: der vollständige ausführliche Bericht — 240 Antworten von ChatGPT, Claude, Gemini und Perplexity — inklusive",
      "Alle zwei Wochen: dieselbe Zählung im Vergleich zu Tag 0, ob die Assistenten Ihre Artikel finden und wer stattdessen zitiert wird",
      "Bis zu 12 recherchierte Artikel pro Monat auf Ihrer eigenen Domain, je 3–5 Quellen",
      "Die Websites, die die Assistenten statt Ihnen zitieren: Wir bereiten die Profile und die Briefe an die Redaktionen vor",
      "Blog-Hosting mit eingebauter maschinenlesbarer Ebene — ein DNS-Eintrag",
      "Sie sehen jeden Artikel 2 Tage vor der Veröffentlichung und können ihn bearbeiten oder stoppen",
      "Ein monatlicher Bericht in Ihrer Sprache, vorher von einem Menschen gelesen",
      "Ein Mensch, der Ihr Konto kennt",
    ],
  },

  fr: {
    work: {
      kicker: "Ce que nous faisons pour vous",
      h2: "Un article est la dernière étape, pas le produit",
      lead: "Cinq étapes. Nous faisons le travail, chaque semaine. Vous voyez chaque article 2 jours avant sa mise en ligne, et pouvez le modifier ou l’arrêter.",
      stages: [
        {
          step: "Mesurer",
          l: "réponses lues avant d’écrire un mot",
          d: "Vingt questions que posent vos clients, soumises aux quatre assistants trois fois chacune, car leurs réponses changent d’une requête à l’autre. Qui est mentionné, quelles pages sont citées et quel type de site est chaque source : un concurrent, un site d’avis, un annuaire et une source officielle appellent chacun une réponse différente. Certaines questions, aucun article sur votre propre site ne peut les gagner ; nous identifions lesquelles avant que votre budget n’y passe.",
        },
        {
          step: "Ouvrir les portes",
          l: "robots simulés pour tester votre site",
          d: "Avant le premier article, sur chacun de vos domaines : certificats, redirections, pare-feu de votre hébergeur, robots.txt, sitemaps. Tout ce qui bloque GPTBot, ClaudeBot, PerplexityBot et les autres, nous le trouvons et le corrigeons avec vous.",
        },
        {
          step: "Être indexé",
          l: "index de recherche, un par assistant",
          d: "ChatGPT cherche via Bing, Claude via Brave, Gemini via Google, Perplexity via son propre index. Une page indexée par Google peut rester invisible pour les trois autres. Sur les blogs que nous hébergeons, chaque nouvelle page est soumise à Bing en moins d’une demi-heure, et chaque article garde une seule adresse.",
        },
        {
          step: "Écrire",
          l: "sources lues et citées par article",
          d: "Des recherches en direct sur le web, et chaque source est lue avant d’être citée. Une relecture éditoriale vérifie chaque affirmation au regard des faits de votre produit et des sources, puis des contrôles automatiques passent sur le reste. Un sujet trop proche d’un sujet existant n’est pas écrit. Vous voyez chaque article 2 jours avant sa mise en ligne, et pouvez le modifier ou l’arrêter.",
        },
        {
          step: "Remesurer",
          l: "décomptes complets par an, comparés au jour 0",
          d: "Les mêmes questions comparées au jour 0, toutes les deux semaines. Un test distinct nous dit si chaque assistant parvient seulement à trouver vos articles publiés, pour qu’un trou d’indexation soit repéré et corrigé au lieu d’être pris pour une faiblesse rédactionnelle. Une fois par mois, un rapport dans votre langue, relu par une personne avant de vous parvenir.",
        },
      ],
      inside: "Ce qui se passe à chaque étape",
      closing: "Rien de tout cela ne se voit dans un article. Tout cela décide si un assistant en lira un jour.",
      seePlan: "Voir l’abonnement →",
    },
    why: {
      kicker: "Pourquoi c’est important",
      h2: "Vos clients demandent à l’IA qui choisir. Elle cite quelques entreprises. Si ce n’est pas vous, c’est votre concurrent.",
      lead: "Pas en page deux. Pas dans une annonce. Dans la réponse, la première chose qu’ils lisent.",
      users: { n: "1 milliard+", l: "de personnes utilisent ChatGPT chaque semaine.", src: "août 2026" },
      local: {
        l: (was) =>
          `des consommateurs américains utilisent ChatGPT et d’autres outils d’IA pour obtenir des recommandations d’entreprises locales. Un an plus tôt : ${was}.`,
        src: (n) => `2026 (${n} adultes aux États-Unis)`,
      },
      vendor: {
        l: "des acheteurs de logiciels B2B ont choisi un autre fournisseur que prévu parce qu’un chatbot le recommandait.",
        src: (n) => `mars 2026 (${n} acheteurs)`,
      },
      clicks: {
        vs: "contre",
        l: "Quand Google affiche sa réponse IA, les internautes cliquent environ deux fois moins souvent sur un résultat classique.",
        src: (n) => `navigation de mars 2025 (${n} adultes aux États-Unis)`,
      },
      compare: {
        h3: "Publicité payante ou être la réponse",
        colA: "Liens sponsorisés",
        colB: "Cité dans la réponse de l’IA",
        lead: {
          k: "Un lead coûte",
          a: (avg, law, home, dent) =>
            `<b>${avg}</b> en moyenne aux États-Unis. Avocats ${law} · rénovation de l’habitat ${home} · dentistes ${dent}.`,
          b: "Aucun prix par clic, par lead ou par client. Vous payez le travail.",
        },
        customer: {
          k: "Un client coûte",
          a: (legal, logistics, construction) => `Juridique ${legal} · logistique ${logistics} · construction ${construction} (B2B).`,
          none: "Aucun prix par client.",
        },
        stop: { k: "Si vous arrêtez de payer", a: "Les leads s’arrêtent le jour même.", b: "Ne dépend pas de votre budget publicitaire." },
        buy: {
          k: "L’argent peut-il acheter la place ?",
          a: "Oui. C’est le principe des enchères.",
          b: "Pas dans ChatGPT : « <en>Advertising does not influence the answers ChatGPT provides.</en> » [traduction : la publicité n’influence pas les réponses que fournit ChatGPT.]",
        },
      },
      costs: (cpc, perAd) =>
        `Les clics coûtent toujours plus cher : <g>le coût par clic de Google a augmenté de ${cpc} en 2025</g>, <m>le prix moyen par publicité de Meta de ${perAd}</m>.`,
      closing:
        "Personne ne peut garantir une mention, et quiconque en promet une ment. Nous ne promettons rien. Nous comptons : les questions de vos clients, quatre assistants, toutes les deux semaines.",
      cta: "Vérifier mon site →",
      footnote:
        "Coûts publicitaires : WordStream by LocaliQ 2026, campagnes sur le réseau de recherche Google et Microsoft aux États-Unis, avril 2025 – mars 2026 ; les moyennes de l’éditeur sont des médianes ; un lead est une demande, pas une vente. Coût par client : données B2B des propres clients de First Page Sage, janvier 2022 – août 2025 ; « payant » y désigne surtout les annonces sur les moteurs de recherche et les réseaux sociaux payants. Chaque chiffre d’enquête indique qui a été interrogé et quand.",
      newTab: "(s’ouvre dans un nouvel onglet)",
    },
    versus: {
      h2: "Pourquoi ce n’est pas un simple achat d’articles",
      colA: "Rédaction d’articles seule",
      colB: "Abonnement ItGrows",
      rows: [
        { a: "Une liste de mots-clés", b: "D’abord 240 réponses lues", k: "Avant d’écrire", d: "Qui ChatGPT, Claude, Gemini et Perplexity mentionnent aujourd’hui, et qui ils citent." },
        { a: "Robots non vérifiés", b: "Testé avec 11 robots", k: "Accès des assistants à votre site", d: "Les blocages sont trouvés et corrigés avec vous avant le premier article." },
        {
          a: "Publier et espérer",
          b: "Trouvabilité testée toutes les deux semaines",
          k: "Chaque page dans l’index de chaque assistant",
          d: "Les nouvelles pages sont soumises à Bing dès leur publication (blogs que nous hébergeons), et toutes les deux semaines nous testons si chaque assistant peut les trouver.",
        },
        { a: "Doublons non vérifiés", b: "Doublons trouvés et corrigés", k: "Adresses en double, sitemaps sans les nouvelles pages", d: "Nous les trouvons sur votre site et les corrigeons." },
        { a: "Sujets perdus d’avance rédigés quand même", b: "Repérés avant la dépense", k: "Questions qu’aucun article sur votre site ne peut gagner", d: "Repérées avant que votre budget n’y passe." },
        { a: "Faits laissés au rédacteur", b: "3 à 5 sources, toutes lues", k: "Faits et sources", d: "Chaque source est lue avant d’être citée ; relecture éditoriale et contrôles automatiques sur chaque article." },
        { a: "Preuve : articles, trafic", b: "Preuve : décompte vs jour 0", k: "Preuve", d: "Les mêmes questions comparées au jour 0, toutes les deux semaines, sur quatre assistants." },
        { a: "Vous payez des mots", b: "Vous payez pour être trouvable", k: "Ce pour quoi vous payez", d: "Être trouvable, lisible et citable, et un décompte honnête de vos mentions." },
      ],
      footnote: "Certaines agences font plus qu’écrire. Demandez-leur leur dernier décompte comparé au jour 0.",
    },
    included: [
      "Mise en place : votre site testé avec 11 robots, blocages corrigés, Bing et Google configurés — une seule fois, non facturée si vous payez 3 mois ou un an d’avance",
      "Jour 0 : le rapport détaillé complet — 240 réponses de ChatGPT, Claude, Gemini et Perplexity — inclus",
      "Toutes les deux semaines : le même décompte comparé au jour 0, la capacité des assistants à trouver vos articles, et qui est cité à votre place",
      "Jusqu’à 12 articles documentés par mois sur votre propre domaine, 3 à 5 sources chacun",
      "Les sites que citent les assistants à votre place : nous préparons les profils et les lettres aux rédactions",
      "Hébergement de blog avec la couche lisible par machine intégrée — un seul enregistrement DNS",
      "Vous voyez chaque article 2 jours avant sa mise en ligne, et pouvez le modifier ou l’arrêter",
      "Un rapport mensuel dans votre langue, relu d’abord par une personne",
      "Un interlocuteur humain qui connaît votre compte",
    ],
  },

  es: {
    work: {
      kicker: "Lo que hacemos por usted",
      h2: "Un artículo es el último paso, no el producto",
      lead: "Cinco etapas. Hacemos el trabajo, cada semana. Usted ve cada artículo 2 días antes de que se publique y puede editarlo o detenerlo.",
      stages: [
        {
          step: "Medir",
          l: "respuestas leídas antes de escribir una palabra",
          d: "Veinte preguntas que hacen sus clientes, planteadas a los cuatro asistentes tres veces cada una, porque sus respuestas cambian de una consulta a otra. A quién mencionan, qué páginas citan y qué tipo de sitio es cada fuente: un competidor, un sitio de reseñas, un directorio y una fuente oficial requieren cada uno una jugada distinta. Hay preguntas que ningún artículo en su propio sitio puede ganar; averiguamos cuáles antes de que su presupuesto se vaya en ellas.",
        },
        {
          step: "Abrir las puertas",
          l: "rastreadores con los que probamos su sitio",
          d: "Antes del primer artículo, en cada dominio que tenga: certificados, redirecciones, el firewall de su hosting, robots.txt, sitemaps. Lo que frene a GPTBot, ClaudeBot, PerplexityBot y los demás, lo encontramos y lo corregimos con usted.",
        },
        {
          step: "Indexarse",
          l: "índices de búsqueda, uno por asistente",
          d: "ChatGPT busca a través de Bing, Claude a través de Brave, Gemini a través de Google y Perplexity con su propio índice. Una página que Google ha indexado puede seguir siendo invisible para los otros tres. En los blogs que alojamos, cada página nueva se envía a Bing en menos de media hora, y cada artículo conserva una sola dirección.",
        },
        {
          step: "Escribir",
          l: "fuentes leídas y citadas por artículo",
          d: "Investigación con búsqueda en directo, y cada fuente se lee antes de citarla. Una revisión editorial contrasta cada afirmación con los datos de su producto y con las fuentes, y después controles automáticos repasan el resto. No se escribe un tema demasiado parecido a otro que ya tenga. Usted ve cada artículo 2 días antes de que se publique y puede editarlo o detenerlo.",
        },
        {
          step: "Volver a medir",
          l: "recuentos completos al año, frente al día 0",
          d: "Las mismas preguntas frente al día 0, cada dos semanas. Una prueba aparte nos dice si cada asistente puede siquiera encontrar sus artículos publicados, para que un fallo de indexación se detecte y se corrija en lugar de confundirse con textos flojos. Una vez al mes, un informe en su idioma, leído por una persona antes de llegarle.",
        },
      ],
      inside: "Qué ocurre en cada etapa",
      closing: "Nada de esto se ve en un artículo. Todo ello decide si un asistente llegará a leer alguno.",
      seePlan: "Ver el plan →",
    },
    why: {
      kicker: "Por qué importa",
      h2: "Sus clientes le preguntan a la IA a quién elegir. La IA nombra unas pocas empresas. Si no es usted, es su competidor.",
      lead: "No en la segunda página. No en un anuncio. En la respuesta, lo primero que leen.",
      users: { n: "+1000 millones", l: "de personas usan ChatGPT cada semana.", src: "agosto de 2026" },
      local: {
        l: (was) =>
          `de los consumidores de EE. UU. usan ChatGPT y otras herramientas de IA para obtener recomendaciones de negocios locales. Un año antes: ${was}.`,
        src: (n) => `2026 (${n} adultos de EE. UU.)`,
      },
      vendor: {
        l: "de los compradores de software B2B eligieron un proveedor distinto del previsto porque se lo recomendó un chatbot.",
        src: (n) => `marzo de 2026 (${n} compradores)`,
      },
      clicks: {
        vs: "vs.",
        l: "Cuando Google muestra su respuesta de IA, la gente hace clic en un resultado normal con aproximadamente la mitad de frecuencia.",
        src: (n) => `navegación de marzo de 2025 (${n} adultos de EE. UU.)`,
      },
      compare: {
        h3: "Anuncios de pago frente a ser la respuesta",
        colA: "Anuncios de búsqueda de pago",
        colB: "Mencionado en la respuesta de la IA",
        lead: {
          k: "Un lead cuesta",
          a: (avg, law, home, dent) =>
            `<b>${avg}</b> de media en EE. UU. Abogados ${law} · reformas del hogar ${home} · dentistas ${dent}.`,
          b: "Sin precio por clic, por lead ni por cliente. Usted paga por el trabajo.",
        },
        customer: {
          k: "Un cliente cuesta",
          a: (legal, logistics, construction) => `Servicios jurídicos ${legal} · logística ${logistics} · construcción ${construction} (B2B).`,
          none: "Sin precio por cliente.",
        },
        stop: { k: "Si deja de pagar", a: "Los leads se acaban ese mismo día.", b: "No depende de su presupuesto publicitario." },
        buy: {
          k: "¿Se puede comprar el puesto?",
          a: "Sí. En eso consiste la subasta.",
          b: "En ChatGPT, no: «<en>Advertising does not influence the answers ChatGPT provides.</en>» [traducción: la publicidad no influye en las respuestas que da ChatGPT.]",
        },
      },
      costs: (cpc, perAd) =>
        `Los clics son cada vez más caros: <g>el coste por clic de Google subió un ${cpc} en 2025</g> y <m>el precio medio por anuncio de Meta, un ${perAd}</m>.`,
      closing:
        "Nadie puede garantizar una mención, y quien se la prometa miente. Nosotros no prometemos. Contamos: las preguntas de sus clientes, cuatro asistentes, cada dos semanas.",
      cta: "Comprobar mi sitio →",
      footnote:
        "Costes publicitarios: WordStream by LocaliQ 2026, campañas de búsqueda de Google y Microsoft en EE. UU., abril de 2025 – marzo de 2026; las medias del editor son medianas; un lead es una consulta, no una venta. Coste por cliente: datos propios de First Page Sage sobre sus clientes B2B, enero de 2022 – agosto de 2025; «de pago» significa allí sobre todo anuncios de búsqueda y redes sociales de pago. Cada cifra de encuesta indica a quién se preguntó y cuándo.",
      newTab: "(se abre en una pestaña nueva)",
    },
    versus: {
      h2: "Por qué esto no es pagar por artículos",
      colA: "Servicio solo de artículos",
      colB: "Plan de ItGrows",
      rows: [
        { a: "Una lista de palabras clave", b: "Primero, 240 respuestas leídas", k: "Antes de escribir", d: "A quién mencionan hoy ChatGPT, Claude, Gemini y Perplexity, y a quién citan." },
        { a: "Rastreadores sin revisar", b: "Probado con 11 rastreadores", k: "Acceso de los asistentes a su sitio", d: "Los bloqueos se detectan y se corrigen con usted antes del primer artículo." },
        {
          a: "Publicar y esperar",
          b: "Se comprueba cada dos semanas si le encuentran",
          k: "Cada página en el índice de cada asistente",
          d: "Las páginas nuevas se envían a Bing al publicarse (en los blogs que alojamos), y cada dos semanas comprobamos si cada asistente puede encontrarlas.",
        },
        { a: "Duplicados sin revisar", b: "Duplicados detectados y corregidos", k: "Direcciones duplicadas, sitemaps sin las páginas nuevas", d: "Los encontramos en su sitio y los corregimos." },
        { a: "Temas imposibles, escritos igual", b: "Detectados antes de gastar", k: "Preguntas que ningún artículo propio puede ganar", d: "Se detectan antes de que su presupuesto se vaya en ellas." },
        { a: "Datos a criterio del redactor", b: "3–5 fuentes, todas leídas", k: "Datos y fuentes", d: "Cada fuente se lee antes de citarla; revisión editorial y controles automáticos en cada artículo." },
        { a: "Prueba: artículos, tráfico", b: "Prueba: recuento vs. día 0", k: "Pruebas", d: "Las mismas preguntas frente al día 0, cada dos semanas, en cuatro asistentes." },
        { a: "Paga por palabras", b: "Paga por que le encuentren", k: "Por lo que paga", d: "Poder ser encontrado, leído y citado, y un recuento honesto de si le mencionan." },
      ],
      footnote: "Algunas agencias hacen algo más que escribir. Pídales su último recuento frente al día 0.",
    },
    included: [
      "Configuración inicial: su sitio probado con 11 rastreadores, bloqueos corregidos, Bing y Google configurados — pago único, no se cobra si paga 3 meses o un año por adelantado",
      "Día 0: el informe detallado completo — 240 respuestas de ChatGPT, Claude, Gemini y Perplexity — incluido",
      "Cada dos semanas: el mismo recuento frente al día 0, si los asistentes pueden encontrar sus artículos y a quién citan en su lugar",
      "Hasta 12 artículos documentados al mes en su propio dominio, con 3–5 fuentes cada uno",
      "Los sitios que citan los asistentes en su lugar: preparamos los perfiles y las cartas a las redacciones",
      "Alojamiento del blog con la capa legible por máquinas integrada — un solo registro DNS",
      "Usted ve cada artículo 2 días antes de que se publique y puede editarlo o detenerlo",
      "Un informe mensual en su idioma, leído antes por una persona",
      "Una persona que conoce su cuenta",
    ],
  },

  ru: {
    work: {
      kicker: "Что мы делаем для вас",
      h2: "Статья — последний шаг, а не продукт",
      lead: "Пять этапов. Работу делаем мы, каждую неделю. Вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить.",
      stages: [
        {
          step: "Замер",
          l: "ответов прочитано, прежде чем мы напишем хоть слово",
          d: "Двадцать вопросов, которые задают ваши клиенты, — каждому из четырёх ассистентов по три раза, потому что их ответы меняются от запроса к запросу. Кого называют, какие страницы цитируют и что за сайт каждый источник: конкурент, сайт отзывов, каталог и официальный источник требуют разных шагов. Некоторые вопросы не выиграть ни одной статьёй на вашем собственном сайте; мы выясняем, какие именно, прежде чем на них уйдёт ваш бюджет.",
        },
        {
          step: "Открыть двери",
          l: "краулеров, которыми мы проверяем ваш сайт",
          d: "До первой статьи, на каждом вашем домене: сертификаты, редиректы, файрвол хостинга, robots.txt, sitemap. Всё, что мешает GPTBot, ClaudeBot, PerplexityBot и остальным, мы находим и исправляем вместе с вами.",
        },
        {
          step: "Индексация",
          l: "поисковых индекса, по одному на ассистента",
          d: "ChatGPT ищет через Bing, Claude — через Brave, Gemini — через Google, Perplexity — через собственный индекс. Страница, которую проиндексировал Google, может оставаться невидимой для остальных трёх. В блогах, которые хостим мы, каждая новая страница отправляется в Bing в течение получаса, а у каждой статьи остаётся один адрес.",
        },
        {
          step: "Тексты",
          l: "источников прочитано и процитировано на статью",
          d: "Исследование через живой поиск: каждый источник мы читаем, прежде чем процитировать. Редакторская вычитка сверяет каждое утверждение с фактами о вашем продукте и с источниками, затем всё остальное проходит автоматическую проверку. Тему, слишком близкую к уже существующей, не пишем. Вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить.",
        },
        {
          step: "Повторный замер",
          l: "полных пересчётов в год — в сравнении с днём 0",
          d: "Те же вопросы в сравнении с днём 0, раз в две недели. Отдельный тест показывает, может ли каждый ассистент вообще найти ваши опубликованные статьи, чтобы пробел в индексации поймали и исправили, а не приняли за слабые тексты. Раз в месяц — отчёт на вашем языке, который читает человек, прежде чем он попадёт к вам.",
        },
      ],
      inside: "Что происходит на каждом этапе",
      closing: "Ничего из этого не видно в статье. Но именно это решает, прочитает ли её ассистент хоть когда-нибудь.",
      seePlan: "Смотреть подписку →",
    },
    why: {
      kicker: "Почему это важно",
      h2: "Ваши клиенты спрашивают ИИ, кого выбрать. Он называет несколько компаний. Если не вас — значит, вашего конкурента.",
      lead: "Не на второй странице. Не в рекламе. В ответе — первое, что они читают.",
      users: { n: "1 млрд+", l: "человек пользуются ChatGPT каждую неделю.", src: "август 2026" },
      local: {
        l: (was) => `потребителей в США обращаются к ChatGPT и другим ИИ-инструментам за рекомендациями местных компаний. Годом раньше — ${was}.`,
        src: (n) => `2026 (${n} взрослых в США)`,
      },
      vendor: {
        l: "покупателей B2B-софта выбрали не того поставщика, которого планировали, потому что его посоветовал чат-бот.",
        src: (n) => `март 2026 (${n} покупателей)`,
      },
      clicks: {
        vs: "против",
        l: "Когда Google показывает свой ИИ-ответ, люди кликают по обычному результату примерно вдвое реже.",
        src: (n) => `данные о посещениях за март 2025 (${n} взрослых в США)`,
      },
      compare: {
        h3: "Платная реклама против места в ответе ИИ",
        colA: "Платная поисковая реклама",
        colB: "Вас называет ИИ",
        lead: {
          k: "Один лид стоит",
          a: (avg, law, home, dent) => `<b>${avg}</b> в среднем в США. Юристы ${law} · ремонт дома ${home} · стоматологи ${dent}.`,
          b: "Нет цены за клик, лид или клиента. Вы платите за работу.",
        },
        customer: {
          k: "Один клиент стоит",
          a: (legal, logistics, construction) => `Юридические услуги ${legal} · логистика ${logistics} · строительство ${construction} (B2B).`,
          none: "Нет цены за клиента.",
        },
        stop: { k: "Если перестать платить", a: "Лиды заканчиваются в тот же день.", b: "Не зависит от вашего рекламного бюджета." },
        buy: {
          k: "Можно ли купить место?",
          a: "Да. Это и есть аукцион.",
          b: "Не в ChatGPT: «<en>Advertising does not influence the answers ChatGPT provides.</en>» [перевод: реклама не влияет на ответы, которые даёт ChatGPT.]",
        },
      },
      costs: (cpc, perAd) =>
        `Клики всё дороже: <g>цена клика в Google выросла в 2025 году на ${cpc}</g>, <m>средняя цена за объявление у Meta — на ${perAd}</m>.`,
      closing:
        "Никто не может гарантировать упоминание, а тот, кто его обещает, лжёт. Мы не обещаем. Мы считаем: вопросы ваших клиентов, четыре ассистента, каждые две недели.",
      cta: "Проверить мой сайт →",
      footnote:
        "Стоимость рекламы: WordStream by LocaliQ 2026, поисковые кампании Google и Microsoft в США, апрель 2025 – март 2026; средние значения издателя — медианы; лид — это обращение, а не продажа. Стоимость клиента: собственные данные First Page Sage по B2B-клиентам, январь 2022 – август 2025; «платные» там — в основном поисковая реклама и платные соцсети. У каждой цифры из опроса указано, кого и когда спрашивали.",
      newTab: "(откроется в новой вкладке)",
    },
    versus: {
      h2: "Почему это не оплата статей",
      colA: "Сервис «только статьи»",
      colB: "Подписка ItGrows",
      rows: [
        { a: "Список ключевых слов", b: "Сначала 240 прочитанных ответов", k: "До написания", d: "Кого сегодня называют ChatGPT, Claude, Gemini и Perplexity и кого цитируют." },
        { a: "Краулеры не проверены", b: "Проверка от имени 11 краулеров", k: "Доступ ассистентов к сайту", d: "Блокировки находим и устраняем вместе с вами до первой статьи." },
        {
          a: "Опубликовать и надеяться",
          b: "Находимость — раз в две недели",
          k: "Каждая страница — в индексе каждого ассистента",
          d: "Новые страницы отправляются в Bing при публикации (в блогах, которые хостим мы), и раз в две недели мы проверяем, может ли каждый ассистент их найти.",
        },
        { a: "Дубли не проверены", b: "Дубли найдены и исправлены", k: "Дубли адресов, sitemap без новых страниц", d: "Находим их на вашем сайте и исправляем." },
        { a: "Пишут на безнадёжные темы", b: "Выявляем до трат", k: "Вопросы, которые не выиграть статьёй на своём сайте", d: "Находим их, прежде чем на них уйдёт ваш бюджет." },
        { a: "Факты — на совести автора", b: "3–5 источников, каждый прочитан", k: "Факты и источники", d: "Каждый источник прочитан до цитирования; редакторская вычитка и автоматические проверки для каждой статьи." },
        { a: "Доказательство: статьи, трафик", b: "Доказательство: сравнение с днём 0", k: "Доказательства", d: "Те же вопросы в сравнении с днём 0, раз в две недели, в четырёх ассистентах." },
        { a: "Вы платите за слова", b: "Вы платите за находимость", k: "За что вы платите", d: "За то, чтобы вас можно было найти, прочитать и процитировать, — и за честный подсчёт того, называют ли вас." },
      ],
      footnote: "Некоторые агентства делают больше, чем пишут. Попросите у них последний подсчёт в сравнении с днём 0.",
    },
    included: [
      "Настройка: ваш сайт проверен от имени 11 краулеров, блокировки устранены, Bing и Google настроены — разово, не взимается при оплате 3 месяцев или года",
      "День 0: полный подробный отчёт — 240 ответов ChatGPT, Claude, Gemini и Perplexity — включён",
      "Раз в две недели: тот же подсчёт в сравнении с днём 0, могут ли ассистенты найти ваши статьи и кого цитируют вместо вас",
      "До 12 статей с исследованием в месяц на вашем собственном домене, по 3–5 источников в каждой",
      "Сайты, которые ассистенты цитируют вместо вас: мы готовим профили и письма редакторам",
      "Хостинг блога со встроенным машиночитаемым слоем — одна DNS-запись",
      "Вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить",
      "Ежемесячный отчёт на вашем языке, который сначала читает человек",
      "Живой человек, который знает ваш аккаунт",
    ],
  },
})
