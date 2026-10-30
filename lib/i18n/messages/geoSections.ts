import { defineMessages } from "../messages"

// app/business/GeoSections.tsx: WorkSystem (work), WhyThisMatters (why), VersusArticles (versus) and
// what the plan includes (included). The big numbers of the five stages stay in the component; the
// findings' numbers carry words, so they are here. The plan's price is named by the pricing card and
// the FAQ (pricingPlans.ts, home.ts), not here.
// Since 30 Oct 2026 (owner's decision) the copy sells the outcome: no hedging lines, no guarantee word
// (the one guarantee is growthGuarantee.ts), and the why block's figures and sources stay as checked.

const en = {
  work: {
    kicker: "How we get you named",
    h2: "Five steps that put you in the answer. We do all five.",
    lead: "We do the work every week and keep pushing until the assistants name you. You see every article 2 days before it goes live, and can edit or stop it.",
    stages: [
      {
        step: "Find the gap",
        l: "answers read to find who's taking your spot",
        d: "Twenty questions your customers ask, put to all four assistants three times each. We see exactly who is named in your place, which pages get quoted, and what kind of site each source is: a competitor, a review site, a directory, an official source. Each one is beaten a different way. Questions no page on your own site can win are spotted before your budget goes into them.",
      },
      {
        step: "Open the doors",
        l: "AI crawlers we test your site as",
        d: "A site the assistants can't read can't be named. Before the first article we test every domain you own as GPTBot, ClaudeBot, PerplexityBot and the rest: certificates, redirects, your host's firewall, robots.txt, sitemaps. Every blocker we find, we fix with you.",
      },
      {
        step: "Get into every index",
        l: "indexes you must be in, one per assistant",
        d: "ChatGPT searches Bing. Claude searches Brave. Gemini searches Google. Perplexity searches its own index. Rank on Google alone and you can be invisible to the other three, so we work all four. On blogs we host, every new page goes to Bing within half an hour, and every article keeps one address.",
      },
      {
        step: "Write to be quoted",
        l: "sources read and cited per article",
        d: "Pages built to be the one an assistant quotes: researched on live search, every source read before it is cited, every claim checked against your product facts by an editor pass, then automated checks. No near-duplicates of topics you already have. You see every article 2 days before it goes live, and can edit or stop it.",
      },
      {
        step: "Re-ask and push",
        l: "full recounts a year, against day 0",
        d: "Every two weeks the same questions go back to all four assistants, against day 0. Wherever you're still missing is where the next work goes. A separate test checks that each assistant can find your new articles, so an indexing gap gets fixed instead of blamed on the writing. Once a month, a report in your language, read by a person before it reaches you.",
      },
    ],
    inside: "What we do inside each step",
    closing: "Anyone can publish an article. We do everything that decides whether an assistant reads it and names you.",
    seePlan: "Get me into the answers →",
  },
  // WhyThisMatters (why): third-party figures, each linked to its source in the component. The
  // numbers are formatted per language there (formatNumber), and the source names stay there too.
  why: {
    kicker: "What you're losing right now",
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
      "Every week you're not in the answer, those customers go to whoever is. See who's getting yours: free, in 30 seconds.",
    cta: "See who's taking my customers →",
    footnote:
      "Ad costs: WordStream by LocaliQ 2026, US Google and Microsoft search campaigns, April 2025 – March 2026; the publisher's averages are medians; a lead is an inquiry, not a sale. Cost per customer: First Page Sage's own B2B client data, January 2022 – August 2025; “paid” there means mainly search ads and paid social. Each survey figure shows who was asked and when.",
    newTab: "(opens in a new tab)",
  },
  // Owner-approved copy, 30 Oct 2026: two panels, what article-only services do (them) and what we
  // do (us). The last line on our side is the growth guarantee, rendered by the component from
  // growthGuarantee.ts (label and line, with its "*"); its footnote stays at the bottom of the page.
  // The heading is two strings for its two colours (titleA grey, titleB violet), shown with a space
  // between them; together they are the approved heading word for word.
  versus: {
    titleA: "Others sell articles.",
    titleB: "We get you named.",
    them: {
      title: "Article-only services",
      lines: [
        "Publish articles and hope someone quotes them",
        "Promise results, guarantee nothing",
        "Never check whether AI assistants can even reach your site",
        "Leave the blockers on your site as they are",
        "Never ask ChatGPT whether it names you",
      ],
    },
    us: {
      title: "ItGrows",
      lines: [
        "We read 240 AI answers before writing a word: who's named today, and who's quoted",
        "We test your site as 11 AI crawlers and fix what blocks them",
        "We publish the answers they quote, on your own domain",
        "We get you onto the sites the assistants cite",
        "We re-ask your customers' questions every two weeks and push wherever you're missing",
      ],
    },
  },
  included: [
    "Setup: your site tested as 11 crawlers, blockers fixed, Bing and Google set up — one-time, free with 3 months or a year",
    "Day 0: the full detailed report — 240 answers from ChatGPT, Claude, Gemini and Perplexity — included",
    "Every two weeks: your customers' questions re-asked to all four assistants against day 0, who is quoted instead of you, and the next push wherever you're missing",
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
      kicker: "So bringen wir Sie in die Antworten",
      h2: "Fünf Schritte, die Sie in die Antwort bringen. Wir erledigen alle fünf.",
      lead: "Wir erledigen die Arbeit jede Woche und legen nach, bis die Assistenten Sie nennen. Sie sehen jeden Artikel 2 Tage vor der Veröffentlichung und können ihn bearbeiten oder stoppen.",
      stages: [
        {
          step: "Lücke finden",
          l: "Antworten gelesen, um zu sehen, wer Ihren Platz einnimmt",
          d: "Zwanzig Fragen, die Ihre Kunden stellen, an alle vier Assistenten, jeweils dreimal. Wir sehen genau, wer an Ihrer Stelle genannt wird, welche Seiten zitiert werden und welche Art von Website jede Quelle ist: ein Wettbewerber, ein Bewertungsportal, ein Verzeichnis, eine offizielle Quelle. Jede schlägt man auf andere Weise. Fragen, die keine Seite auf Ihrer eigenen Website gewinnen kann, werden erkannt, bevor Ihr Budget hineinfließt.",
        },
        {
          step: "Türen öffnen",
          l: "KI-Crawler, als die wir Ihre Website testen",
          d: "Eine Website, die die Assistenten nicht lesen können, kann nicht genannt werden. Vor dem ersten Artikel testen wir jede Ihrer Domains als GPTBot, ClaudeBot, PerplexityBot und die anderen: Zertifikate, Weiterleitungen, die Firewall Ihres Hosters, robots.txt, Sitemaps. Jede Blockade, die wir finden, beheben wir mit Ihnen.",
        },
        {
          step: "In jeden Index kommen",
          l: "Indizes, in denen Sie sein müssen, einer pro Assistent",
          d: "ChatGPT sucht über Bing. Claude über Brave. Gemini über Google. Perplexity über einen eigenen Index. Wer nur bei Google rankt, kann für die anderen drei unsichtbar sein, deshalb bearbeiten wir alle vier. Bei Blogs, die wir hosten, geht jede neue Seite innerhalb einer halben Stunde an Bing, und jeder Artikel behält eine einzige Adresse.",
        },
        {
          step: "Schreiben, um zitiert zu werden",
          l: "Quellen pro Artikel gelesen und zitiert",
          d: "Seiten, die darauf gebaut sind, die eine zu sein, die ein Assistent zitiert: mit Live-Suche recherchiert, jede Quelle gelesen, bevor sie zitiert wird, jede Aussage von einem Lektorat anhand Ihrer Produktfakten geprüft, danach automatische Prüfungen. Keine Beinahe-Duplikate von Themen, die Sie schon haben. Sie sehen jeden Artikel 2 Tage vor der Veröffentlichung und können ihn bearbeiten oder stoppen.",
        },
        {
          step: "Neu fragen und nachlegen",
          l: "vollständige Nachzählungen pro Jahr, im Vergleich zu Tag 0",
          d: "Alle zwei Wochen gehen dieselben Fragen erneut an alle vier Assistenten, im Vergleich zu Tag 0. Wo Sie noch fehlen, dorthin geht die nächste Arbeit. Ein separater Test prüft, ob jeder Assistent Ihre neuen Artikel finden kann, damit eine Indexierungslücke behoben wird, statt den Texten angelastet zu werden. Einmal im Monat ein Bericht in Ihrer Sprache, von einem Menschen gelesen, bevor er Sie erreicht.",
        },
      ],
      inside: "Was wir in jedem Schritt tun",
      closing: "Einen Artikel veröffentlichen kann jeder. Wir erledigen alles, was entscheidet, ob ein Assistent ihn liest und Sie nennt.",
      seePlan: "Bringen Sie mich in die Antworten →",
    },
    why: {
      kicker: "Was Ihnen gerade entgeht",
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
        "Jede Woche, in der Sie nicht in der Antwort stehen, gehen diese Kunden zu dem, der dort steht. Sehen Sie, wer Ihre bekommt: kostenlos, in 30 Sekunden.",
      cta: "Wer nimmt mir die Kunden weg? →",
      footnote:
        "Werbekosten: WordStream by LocaliQ 2026, Suchkampagnen bei Google und Microsoft in den USA, April 2025 – März 2026; die Durchschnittswerte des Herausgebers sind Mediane; ein Lead ist eine Anfrage, kein Verkauf. Kosten pro Kunde: eigene B2B-Kundendaten von First Page Sage, Januar 2022 – August 2025; „bezahlt“ heißt dort vor allem Suchanzeigen und bezahlte Social-Media-Werbung. Bei jeder Umfragezahl steht, wer wann befragt wurde.",
      newTab: "(öffnet in neuem Tab)",
    },
    versus: {
      titleA: "Andere verkaufen Artikel.",
      titleB: "Wir sorgen dafür, dass Sie genannt werden.",
      them: {
        title: "Reine Artikeldienste",
        lines: [
          "Veröffentlichen Artikel und hoffen, dass jemand sie zitiert",
          "Versprechen Ergebnisse, garantieren nichts",
          "Prüfen nie, ob KI-Assistenten Ihre Website überhaupt erreichen",
          "Lassen die Blockaden auf Ihrer Website, wie sie sind",
          "Fragen ChatGPT nie, ob es Sie nennt",
        ],
      },
      us: {
        title: "ItGrows",
        lines: [
          "Wir lesen 240 KI-Antworten, bevor wir ein Wort schreiben: wer heute genannt und wer zitiert wird",
          "Wir testen Ihre Website mit den Kennungen von 11 KI-Crawlern und beheben alles, was diese blockiert",
          "Wir veröffentlichen die Antworten, die die Assistenten zitieren – auf Ihrer eigenen Domain",
          "Wir bringen Sie auf die Websites, die die Assistenten zitieren",
          "Wir stellen die Fragen Ihrer Kunden alle zwei Wochen neu und legen überall nach, wo Sie noch fehlen",
        ],
      },
    },
    included: [
      "Einrichtung: Ihre Website mit 11 Crawler-Kennungen getestet, Blockaden behoben, Bing und Google eingerichtet — einmalig, entfällt bei Vorauszahlung von 3 Monaten oder einem Jahr",
      "Tag 0: der vollständige ausführliche Bericht — 240 Antworten von ChatGPT, Claude, Gemini und Perplexity — inklusive",
      "Alle zwei Wochen: die Fragen Ihrer Kunden erneut an alle vier Assistenten im Vergleich zu Tag 0, wer statt Ihnen zitiert wird, und der nächste Schub überall, wo Sie fehlen",
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
      kicker: "Comment nous vous faisons mentionner",
      h2: "Cinq étapes qui vous placent dans la réponse. Nous faisons les cinq.",
      lead: "Nous faisons le travail chaque semaine et poussons jusqu’à ce que les assistants vous mentionnent. Vous voyez chaque article 2 jours avant sa mise en ligne, et pouvez le modifier ou l’arrêter.",
      stages: [
        {
          step: "Trouver la brèche",
          l: "réponses lues pour savoir qui prend votre place",
          d: "Vingt questions que posent vos clients, soumises aux quatre assistants trois fois chacune. Nous voyons exactement qui est mentionné à votre place, quelles pages sont citées et quel type de site est chaque source : un concurrent, un site d’avis, un annuaire, une source officielle. On ne passe pas devant chacune de la même façon. Les questions qu’aucune page de votre propre site ne peut gagner sont repérées avant que votre budget n’y passe.",
        },
        {
          step: "Ouvrir les portes",
          l: "robots d’IA simulés pour tester votre site",
          d: "Un site que les assistants ne peuvent pas lire ne peut pas être mentionné. Avant le premier article, nous testons chacun de vos domaines en nous présentant comme GPTBot, ClaudeBot, PerplexityBot et les autres : certificats, redirections, pare-feu de votre hébergeur, robots.txt, sitemaps. Chaque blocage trouvé, nous le corrigeons avec vous.",
        },
        {
          step: "Entrer dans chaque index",
          l: "index où vous devez figurer, un par assistant",
          d: "ChatGPT cherche via Bing. Claude via Brave. Gemini via Google. Perplexity via son propre index. Être bien classé sur Google seul peut vous laisser invisible pour les trois autres, alors nous travaillons les quatre. Sur les blogs que nous hébergeons, chaque nouvelle page part vers Bing en moins d’une demi-heure, et chaque article garde une seule adresse.",
        },
        {
          step: "Écrire pour être cité",
          l: "sources lues et citées par article",
          d: "Des pages conçues pour être celle que cite l’assistant : documentées par une recherche en direct, chaque source lue avant d’être citée, chaque affirmation vérifiée par une relecture éditoriale au regard des faits de votre produit, puis des contrôles automatiques. Pas de quasi-doublons de sujets que vous avez déjà. Vous voyez chaque article 2 jours avant sa mise en ligne, et pouvez le modifier ou l’arrêter.",
        },
        {
          step: "Redemander et pousser",
          l: "décomptes complets par an, comparés au jour 0",
          d: "Toutes les deux semaines, les mêmes questions repartent vers les quatre assistants, comparées au jour 0. Là où vous manquez encore, c’est là que va le travail suivant. Un test distinct vérifie que chaque assistant trouve vos nouveaux articles, pour qu’un trou d’indexation soit corrigé au lieu d’être mis sur le compte de la rédaction. Une fois par mois, un rapport dans votre langue, relu par une personne avant de vous parvenir.",
        },
      ],
      inside: "Ce que nous faisons à chaque étape",
      closing: "N’importe qui peut publier un article. Nous faisons tout ce qui décide si un assistant le lit et vous mentionne.",
      seePlan: "Faites-moi entrer dans les réponses →",
    },
    why: {
      kicker: "Ce que vous perdez en ce moment",
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
        "Chaque semaine où vous n’êtes pas dans la réponse, ces clients vont chez ceux qui y sont. Voyez qui récupère les vôtres : gratuitement, en 30 secondes.",
      cta: "Qui me prend mes clients ? →",
      footnote:
        "Coûts publicitaires : WordStream by LocaliQ 2026, campagnes sur le réseau de recherche Google et Microsoft aux États-Unis, avril 2025 – mars 2026 ; les moyennes de l’éditeur sont des médianes ; un lead est une demande, pas une vente. Coût par client : données B2B des propres clients de First Page Sage, janvier 2022 – août 2025 ; « payant » y désigne surtout les annonces sur les moteurs de recherche et les réseaux sociaux payants. Chaque chiffre d’enquête indique qui a été interrogé et quand.",
      newTab: "(s’ouvre dans un nouvel onglet)",
    },
    versus: {
      titleA: "Les autres vendent des articles.",
      titleB: "Nous vous faisons mentionner.",
      them: {
        title: "Services qui ne font que des articles",
        lines: [
          "Publient des articles et espèrent qu’on les cite",
          "Promettent des résultats, ne garantissent rien",
          "Ne vérifient même pas si les assistants IA peuvent accéder à votre site",
          "Laissent les blocages de votre site en l’état",
          "Ne demandent jamais à ChatGPT s’il vous mentionne",
        ],
      },
      us: {
        title: "ItGrows",
        lines: [
          "Nous lisons 240 réponses d’IA avant d’écrire un mot : qui est mentionné aujourd’hui et qui est cité",
          "Nous testons votre site avec 11 robots d’IA et corrigeons ce qui les bloque",
          "Nous publions les réponses que les assistants citent, sur votre propre domaine",
          "Nous vous faisons apparaître sur les sites que les assistants citent",
          "Toutes les deux semaines, nous reposons les questions de vos clients et redoublons d’efforts partout où vous êtes encore absent",
        ],
      },
    },
    included: [
      "Mise en place : votre site testé avec 11 robots, blocages corrigés, Bing et Google configurés — une seule fois, non facturée si vous payez 3 mois ou un an d’avance",
      "Jour 0 : le rapport détaillé complet — 240 réponses de ChatGPT, Claude, Gemini et Perplexity — inclus",
      "Toutes les deux semaines : les questions de vos clients reposées aux quatre assistants par rapport au jour 0, qui est cité à votre place, et la prochaine poussée partout où vous manquez",
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
      kicker: "Cómo conseguimos que le mencionen",
      h2: "Cinco pasos que le ponen en la respuesta. Hacemos los cinco.",
      lead: "Hacemos el trabajo cada semana y seguimos empujando hasta que los asistentes le mencionen. Usted ve cada artículo 2 días antes de que se publique y puede editarlo o detenerlo.",
      stages: [
        {
          step: "Encontrar el hueco",
          l: "respuestas leídas para ver quién ocupa su lugar",
          d: "Veinte preguntas que hacen sus clientes, planteadas a los cuatro asistentes tres veces cada una. Vemos exactamente a quién mencionan en su lugar, qué páginas citan y qué tipo de sitio es cada fuente: un competidor, un sitio de reseñas, un directorio, una fuente oficial. A cada uno se le gana de una forma distinta. Las preguntas que ninguna página de su propio sitio puede ganar se detectan antes de que su presupuesto se vaya en ellas.",
        },
        {
          step: "Abrir las puertas",
          l: "rastreadores de IA con los que probamos su sitio",
          d: "Un sitio que los asistentes no pueden leer no puede ser mencionado. Antes del primer artículo probamos cada dominio que tenga como GPTBot, ClaudeBot, PerplexityBot y los demás: certificados, redirecciones, el firewall de su hosting, robots.txt, sitemaps. Cada bloqueo que encontramos lo corregimos con usted.",
        },
        {
          step: "Entrar en cada índice",
          l: "índices en los que debe estar, uno por asistente",
          d: "ChatGPT busca a través de Bing. Claude, a través de Brave. Gemini, a través de Google. Perplexity, con su propio índice. Si solo posiciona en Google, puede ser invisible para los otros tres, así que trabajamos los cuatro. En los blogs que alojamos, cada página nueva llega a Bing en menos de media hora, y cada artículo conserva una sola dirección.",
        },
        {
          step: "Escribir para ser citado",
          l: "fuentes leídas y citadas por artículo",
          d: "Páginas hechas para ser la que cita el asistente: investigadas con búsqueda en directo, cada fuente leída antes de citarla, cada afirmación contrastada con los datos de su producto en una revisión editorial y después controles automáticos. Nada casi duplicado de temas que ya tiene. Usted ve cada artículo 2 días antes de que se publique y puede editarlo o detenerlo.",
        },
        {
          step: "Volver a preguntar y empujar",
          l: "recuentos completos al año, frente al día 0",
          d: "Cada dos semanas las mismas preguntas vuelven a los cuatro asistentes, frente al día 0. Allí donde aún no aparece es adonde va el siguiente trabajo. Una prueba aparte comprueba que cada asistente encuentra sus artículos nuevos, para que un fallo de indexación se corrija en lugar de achacarse a los textos. Una vez al mes, un informe en su idioma, leído por una persona antes de llegarle.",
        },
      ],
      inside: "Qué hacemos en cada paso",
      closing: "Cualquiera puede publicar un artículo. Nosotros hacemos todo lo que decide si un asistente lo lee y le menciona.",
      seePlan: "Quiero estar en las respuestas →",
    },
    why: {
      kicker: "Lo que está perdiendo ahora mismo",
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
        "Cada semana que no está en la respuesta, esos clientes se van con quien sí está. Vea quién se queda con los suyos: gratis, en 30 segundos.",
      cta: "¿Quién se lleva mis clientes? →",
      footnote:
        "Costes publicitarios: WordStream by LocaliQ 2026, campañas de búsqueda de Google y Microsoft en EE. UU., abril de 2025 – marzo de 2026; las medias del editor son medianas; un lead es una consulta, no una venta. Coste por cliente: datos propios de First Page Sage sobre sus clientes B2B, enero de 2022 – agosto de 2025; «de pago» significa allí sobre todo anuncios de búsqueda y redes sociales de pago. Cada cifra de encuesta indica a quién se preguntó y cuándo.",
      newTab: "(se abre en una pestaña nueva)",
    },
    versus: {
      titleA: "Otros venden artículos.",
      titleB: "Nosotros conseguimos que le mencionen.",
      them: {
        title: "Servicios solo de artículos",
        lines: [
          "Publican artículos y esperan que alguien los cite",
          "Prometen resultados, no garantizan nada",
          "Ni siquiera comprueban si los asistentes de IA pueden acceder a su sitio",
          "Dejan los bloqueos de su sitio tal como están",
          "Nunca preguntan a ChatGPT si le menciona a usted",
        ],
      },
      us: {
        title: "ItGrows",
        lines: [
          "Leemos 240 respuestas de IA antes de escribir una sola palabra: a quién mencionan hoy y a quién citan",
          "Probamos su sitio con 11 rastreadores de IA y corregimos lo que los bloquea",
          "Publicamos en su propio dominio las respuestas que los asistentes citan",
          "Conseguimos que aparezca en los sitios que los asistentes toman como fuente",
          "Cada dos semanas volvemos a hacer las preguntas de sus clientes y reforzamos el trabajo allí donde aún no aparece",
        ],
      },
    },
    included: [
      "Configuración inicial: su sitio probado con 11 rastreadores, bloqueos corregidos, Bing y Google configurados — pago único, no se cobra si paga 3 meses o un año por adelantado",
      "Día 0: el informe detallado completo — 240 respuestas de ChatGPT, Claude, Gemini y Perplexity — incluido",
      "Cada dos semanas: las preguntas de sus clientes planteadas de nuevo a los cuatro asistentes frente al día 0, a quién citan en su lugar y el siguiente empuje allí donde no aparece",
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
      kicker: "Как мы добиваемся, чтобы вас называли",
      h2: "Пять шагов, которые приводят вас в ответ. Все пять делаем мы.",
      lead: "Мы делаем работу каждую неделю и дожимаем, пока ассистенты не начнут называть вас. Вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить.",
      stages: [
        {
          step: "Найти пробел",
          l: "ответов прочитано, чтобы увидеть, кто занимает ваше место",
          d: "Двадцать вопросов, которые задают ваши клиенты, — каждому из четырёх ассистентов по три раза. Мы видим, кого именно называют вместо вас, какие страницы цитируют и что за сайт каждый источник: конкурент, сайт отзывов, каталог, официальный источник. Каждого обходят по-своему. Вопросы, которые не выиграть ни одной страницей на вашем собственном сайте, мы выявляем до того, как на них уйдёт ваш бюджет.",
        },
        {
          step: "Открыть двери",
          l: "ИИ-краулеров, от имени которых мы проверяем ваш сайт",
          d: "Сайт, который ассистенты не могут прочитать, они не могут и назвать. До первой статьи мы проверяем каждый ваш домен от имени GPTBot, ClaudeBot, PerplexityBot и остальных: сертификаты, редиректы, файрвол хостинга, robots.txt, sitemap. Каждую найденную блокировку устраняем вместе с вами.",
        },
        {
          step: "Попасть в каждый индекс",
          l: "индекса, в которых вам нужно быть, — по одному на ассистента",
          d: "ChatGPT ищет через Bing. Claude — через Brave. Gemini — через Google. Perplexity — через собственный индекс. Если вы есть только в Google, для остальных трёх вас может не существовать, поэтому мы работаем со всеми четырьмя. В блогах, которые хостим мы, каждая новая страница уходит в Bing в течение получаса, а у каждой статьи остаётся один адрес.",
        },
        {
          step: "Писать, чтобы цитировали",
          l: "источников прочитано и процитировано на статью",
          d: "Страницы, сделанные так, чтобы ассистент цитировал именно их: исследование через живой поиск, каждый источник прочитан до цитирования, каждое утверждение сверено редактором с фактами о вашем продукте, затем автоматические проверки. Никаких почти-дублей тем, которые у вас уже есть. Вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить.",
        },
        {
          step: "Переспросить и дожать",
          l: "полных пересчётов в год — в сравнении с днём 0",
          d: "Раз в две недели те же вопросы снова уходят ко всем четырём ассистентам — в сравнении с днём 0. Где вас ещё нет, туда и идёт следующая работа. Отдельный тест проверяет, находит ли каждый ассистент ваши новые статьи, чтобы пробел в индексации исправили, а не списали на тексты. Раз в месяц — отчёт на вашем языке, который читает человек, прежде чем он попадёт к вам.",
        },
      ],
      inside: "Что мы делаем на каждом шаге",
      closing: "Опубликовать статью может кто угодно. Мы делаем всё, от чего зависит, прочитает ли её ассистент и назовёт ли вас.",
      seePlan: "Хочу в ответы ИИ →",
    },
    why: {
      kicker: "Что вы теряете прямо сейчас",
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
        "Каждую неделю, пока вас нет в ответе, эти клиенты уходят к тем, кто там есть. Посмотрите, кто забирает ваших: бесплатно, за 30 секунд.",
      cta: "Кто забирает моих клиентов? →",
      footnote:
        "Стоимость рекламы: WordStream by LocaliQ 2026, поисковые кампании Google и Microsoft в США, апрель 2025 – март 2026; средние значения издателя — медианы; лид — это обращение, а не продажа. Стоимость клиента: собственные данные First Page Sage по B2B-клиентам, январь 2022 – август 2025; «платные» там — в основном поисковая реклама и платные соцсети. У каждой цифры из опроса указано, кого и когда спрашивали.",
      newTab: "(откроется в новой вкладке)",
    },
    versus: {
      titleA: "Другие продают статьи.",
      titleB: "Мы добиваемся, чтобы вас называли.",
      them: {
        title: "Сервисы «только статьи»",
        lines: [
          "Публикуют статьи и надеются, что их кто-нибудь процитирует",
          "Обещают результат, но ничего не гарантируют",
          "Даже не проверяют, могут ли ИИ-ассистенты вообще попасть на ваш сайт",
          "Оставляют блокировки на вашем сайте как есть",
          "Никогда не спрашивают ChatGPT, называет ли он вас",
        ],
      },
      us: {
        title: "ItGrows",
        lines: [
          "Читаем 240 ответов ИИ, прежде чем написать хоть слово: кого называют сегодня и кого цитируют",
          "Проверяем ваш сайт от имени 11 ИИ-краулеров и устраняем всё, что их блокирует",
          "Публикуем на вашем собственном домене ответы, которые ассистенты цитируют",
          "Размещаем вас на сайтах, на которые ссылаются ассистенты",
          "Раз в две недели заново задаём вопросы ваших клиентов и усиливаем работу везде, где вас пока нет",
        ],
      },
    },
    included: [
      "Настройка: ваш сайт проверен от имени 11 краулеров, блокировки устранены, Bing и Google настроены — разово, не взимается при оплате 3 месяцев или года",
      "День 0: полный подробный отчёт — 240 ответов ChatGPT, Claude, Gemini и Perplexity — включён",
      "Раз в две недели: вопросы ваших клиентов заново ко всем четырём ассистентам в сравнении с днём 0, кого цитируют вместо вас, и следующий рывок везде, где вас нет",
      "До 12 статей с исследованием в месяц на вашем собственном домене, по 3–5 источников в каждой",
      "Сайты, которые ассистенты цитируют вместо вас: мы готовим профили и письма редакторам",
      "Хостинг блога со встроенным машиночитаемым слоем — одна DNS-запись",
      "Вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить",
      "Ежемесячный отчёт на вашем языке, который сначала читает человек",
      "Живой человек, который знает ваш аккаунт",
    ],
  },
})
