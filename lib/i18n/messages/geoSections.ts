import { defineMessages } from "../messages"

// app/business/GeoSections.tsx: WorkSystem (work), FoundOnSites (found), VersusArticles (versus) and
// what the plan includes (included). The big numbers of the five stages stay in the component; the
// findings' numbers carry words, so they are here. Prices come in as arguments.

const en = {
  work: {
    kicker: (month: string) => `What we run for you · ${month} a month`,
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
        d: "The same questions against day 0, every week. A separate test tells us whether each assistant can find your published articles at all, so a gap in indexing is caught and fixed instead of being mistaken for weak writing. Once a month, a report in your language, read by a person before it reaches you.",
      },
    ],
    inside: "What runs inside each stage",
    closing: "None of this shows in an article. All of it decides whether an assistant ever reads one.",
    seePlan: "See the plan →",
  },
  found: {
    h2: "Publishing is not the same as being found",
    lead: "Our own weekly checks, October 2026: client sites and itgrows.ai itself.",
    items: [
      { n: "1 of 18", h: "articles ChatGPT found by their exact title", d: "Yet Google had indexed nearly every article on one site." },
      { n: "128 MB", h: "one blog index page, images embedded", d: "Google reads the first 15 MB. Links sat below." },
      { n: "0", h: "new articles in Google after three weeks", d: "Crawlers were led only to old pages." },
      { n: "2", h: "addresses per article, each posing as original", d: "It competes with itself." },
      { n: "1 line", h: "in robots.txt, meant to hide one page", d: "It hid every address starting with that letter." },
    ],
    closing: "Every one of these sites was publishing. On the plan, the same weekly checks run on yours.",
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
        b: "Findability tested weekly",
        k: "Is each page in the index each assistant searches?",
        d: "New pages are submitted to Bing on publication (blogs we host), and every week we test whether each assistant can find them.",
      },
      { a: "Duplicates not checked", b: "Duplicates found, fixed", k: "Duplicate addresses, sitemaps that miss new pages", d: "We find them on your site and fix them." },
      { a: "Unwinnable topics written", b: "Spotted before you spend", k: "Questions no own-site article can win", d: "Found before your budget goes into them." },
      { a: "Facts up to the writer", b: "3–5 sources, each read", k: "Facts and sources", d: "Every source read before it is cited; an editor pass and automated checks on every article." },
      { a: "Proof: articles, traffic", b: "Proof: count vs day 0", k: "Proof", d: "The same questions against day 0, every week, across four assistants." },
      { a: "You pay for words", b: "You pay to be findable", k: "What you pay for", d: "Being findable, readable and quotable, and an honest count of whether you are named." },
    ],
    footnote: "Some agencies do more than write. Ask them for last week's count against day 0.",
  },
  included: (setup: string) => [
    `Setup: your site tested as 11 crawlers, blockers fixed, Bing and Google set up — one-time ${setup}, free with 3 months or a year`,
    "Day 0: the full detailed report — 240 answers from ChatGPT, Claude, Gemini and Perplexity — included",
    "Every week: the same count against day 0, whether the assistants can find your articles, and who is quoted instead",
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
      kicker: (month) => `Was wir für Sie leisten · ${month} pro Monat`,
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
          d: "Dieselben Fragen im Vergleich zu Tag 0, jede Woche. Ein separater Test zeigt uns, ob jeder Assistent Ihre veröffentlichten Artikel überhaupt finden kann, damit eine Indexierungslücke erkannt und behoben wird, statt für schwache Texte gehalten zu werden. Einmal im Monat ein Bericht in Ihrer Sprache, von einem Menschen gelesen, bevor er Sie erreicht.",
        },
      ],
      inside: "Was in jeder Stufe passiert",
      closing: "Nichts davon sieht man einem Artikel an. All das entscheidet, ob ein Assistent ihn je liest.",
      seePlan: "Zum Plan →",
    },
    found: {
      h2: "Veröffentlichen heißt nicht gefunden werden",
      lead: "Unsere eigenen wöchentlichen Checks, Oktober 2026: Kundenwebsites und itgrows.ai selbst.",
      items: [
        { n: "1 von 18", h: "Artikeln fand ChatGPT über ihren exakten Titel", d: "Dabei hatte Google auf einer der Websites fast jeden Artikel indexiert." },
        { n: "128 MB", h: "eine Blog-Übersichtsseite, Bilder eingebettet", d: "Google liest die ersten 15 MB. Die Links standen weiter unten." },
        { n: "0", h: "neue Artikel in Google nach drei Wochen", d: "Crawler wurden nur zu alten Seiten geführt." },
        { n: "2", h: "Adressen pro Artikel, jede gibt sich als Original aus", d: "Der Artikel konkurriert mit sich selbst." },
        { n: "1 Zeile", h: "in robots.txt, die eine Seite verbergen sollte", d: "Sie verbarg jede Adresse, die mit diesem Buchstaben beginnt." },
      ],
      closing: "Auf jeder dieser Websites wurde veröffentlicht. Mit dem Plan laufen dieselben wöchentlichen Checks auch für Ihre Website.",
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
          b: "Auffindbarkeit wöchentlich getestet",
          k: "Jede Seite im Index jedes Assistenten",
          d: "Neue Seiten werden bei Veröffentlichung bei Bing eingereicht (bei Blogs, die wir hosten), und jede Woche testen wir, ob jeder Assistent sie finden kann.",
        },
        { a: "Duplikate nicht geprüft", b: "Duplikate gefunden, behoben", k: "Doppelte Adressen, Sitemaps ohne neue Seiten", d: "Wir finden sie auf Ihrer Website und beheben sie." },
        { a: "Aussichtslose Themen geschrieben", b: "Erkannt, bevor Sie zahlen", k: "Fragen, die kein Artikel auf der eigenen Website gewinnen kann", d: "Erkannt, bevor Ihr Budget hineinfließt." },
        { a: "Fakten nach Gutdünken des Autors", b: "3–5 Quellen, jede gelesen", k: "Fakten und Quellen", d: "Jede Quelle wird gelesen, bevor sie zitiert wird; Lektorat und automatische Prüfungen bei jedem Artikel." },
        { a: "Beleg: Artikel, Traffic", b: "Beleg: Zählung vs. Tag 0", k: "Belege", d: "Dieselben Fragen im Vergleich zu Tag 0, jede Woche, über vier Assistenten." },
        { a: "Sie zahlen für Wörter", b: "Sie zahlen für Auffindbarkeit", k: "Wofür Sie zahlen", d: "Auffindbar, lesbar und zitierfähig zu sein, und eine ehrliche Zählung, ob Sie genannt werden." },
      ],
      footnote: "Manche Agenturen tun mehr als schreiben. Fragen Sie sie nach der Zählung der letzten Woche im Vergleich zu Tag 0.",
    },
    included: (setup) => [
      `Einrichtung: Ihre Website mit 11 Crawler-Kennungen getestet, Blockaden behoben, Bing und Google eingerichtet — einmalig ${setup}, entfällt bei Vorauszahlung von 3 Monaten oder einem Jahr`,
      "Tag 0: der vollständige ausführliche Bericht — 240 Antworten von ChatGPT, Claude, Gemini und Perplexity — inklusive",
      "Jede Woche: dieselbe Zählung im Vergleich zu Tag 0, ob die Assistenten Ihre Artikel finden und wer stattdessen zitiert wird",
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
      kicker: (month) => `Ce que nous faisons pour vous · ${month} par mois`,
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
          d: "Les mêmes questions comparées au jour 0, chaque semaine. Un test distinct nous dit si chaque assistant parvient seulement à trouver vos articles publiés, pour qu’un trou d’indexation soit repéré et corrigé au lieu d’être pris pour une faiblesse rédactionnelle. Une fois par mois, un rapport dans votre langue, relu par une personne avant de vous parvenir.",
        },
      ],
      inside: "Ce qui se passe à chaque étape",
      closing: "Rien de tout cela ne se voit dans un article. Tout cela décide si un assistant en lira un jour.",
      seePlan: "Voir l’abonnement →",
    },
    found: {
      h2: "Publier ne veut pas dire être trouvé",
      lead: "Nos propres vérifications hebdomadaires, octobre 2026 : des sites clients et itgrows.ai lui-même.",
      items: [
        { n: "1 sur 18", h: "articles trouvés par ChatGPT à partir de leur titre exact", d: "Pourtant, Google avait indexé presque tous les articles de l’un des sites." },
        { n: "128 Mo", h: "une page d’index de blog, images intégrées", d: "Google lit les 15 premiers Mo. Les liens se trouvaient plus bas." },
        { n: "0", h: "nouvel article dans Google après trois semaines", d: "Les robots n’étaient dirigés que vers d’anciennes pages." },
        { n: "2", h: "adresses par article, chacune se faisant passer pour l’original", d: "L’article se fait concurrence à lui-même." },
        { n: "1 ligne", h: "dans robots.txt, censée masquer une page", d: "Elle masquait toutes les adresses commençant par cette lettre." },
      ],
      closing: "Chacun de ces sites publiait. Avec l’abonnement, les mêmes vérifications hebdomadaires tournent sur le vôtre.",
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
          b: "Trouvabilité testée chaque semaine",
          k: "Chaque page dans l’index de chaque assistant",
          d: "Les nouvelles pages sont soumises à Bing dès leur publication (blogs que nous hébergeons), et chaque semaine nous testons si chaque assistant peut les trouver.",
        },
        { a: "Doublons non vérifiés", b: "Doublons trouvés et corrigés", k: "Adresses en double, sitemaps sans les nouvelles pages", d: "Nous les trouvons sur votre site et les corrigeons." },
        { a: "Sujets perdus d’avance rédigés quand même", b: "Repérés avant la dépense", k: "Questions qu’aucun article sur votre site ne peut gagner", d: "Repérées avant que votre budget n’y passe." },
        { a: "Faits laissés au rédacteur", b: "3 à 5 sources, toutes lues", k: "Faits et sources", d: "Chaque source est lue avant d’être citée ; relecture éditoriale et contrôles automatiques sur chaque article." },
        { a: "Preuve : articles, trafic", b: "Preuve : décompte vs jour 0", k: "Preuve", d: "Les mêmes questions comparées au jour 0, chaque semaine, sur quatre assistants." },
        { a: "Vous payez des mots", b: "Vous payez pour être trouvable", k: "Ce pour quoi vous payez", d: "Être trouvable, lisible et citable, et un décompte honnête de vos mentions." },
      ],
      footnote: "Certaines agences font plus qu’écrire. Demandez-leur le décompte de la semaine dernière comparé au jour 0.",
    },
    included: (setup) => [
      `Mise en place : votre site testé avec 11 robots, blocages corrigés, Bing et Google configurés — ${setup} une seule fois, non facturée si vous payez 3 mois ou un an d’avance`,
      "Jour 0 : le rapport détaillé complet — 240 réponses de ChatGPT, Claude, Gemini et Perplexity — inclus",
      "Chaque semaine : le même décompte comparé au jour 0, la capacité des assistants à trouver vos articles, et qui est cité à votre place",
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
      kicker: (month) => `Lo que hacemos por usted · ${month} al mes`,
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
          d: "Las mismas preguntas frente al día 0, cada semana. Una prueba aparte nos dice si cada asistente puede siquiera encontrar sus artículos publicados, para que un fallo de indexación se detecte y se corrija en lugar de confundirse con textos flojos. Una vez al mes, un informe en su idioma, leído por una persona antes de llegarle.",
        },
      ],
      inside: "Qué ocurre en cada etapa",
      closing: "Nada de esto se ve en un artículo. Todo ello decide si un asistente llegará a leer alguno.",
      seePlan: "Ver el plan →",
    },
    found: {
      h2: "Publicar no es lo mismo que ser encontrado",
      lead: "Nuestras propias comprobaciones semanales, octubre de 2026: sitios de clientes y el propio itgrows.ai.",
      items: [
        { n: "1 de 18", h: "artículos que ChatGPT encontró por su título exacto", d: "Y eso que Google había indexado casi todos los artículos de uno de los sitios." },
        { n: "128 MB", h: "una página índice de blog, con imágenes incrustadas", d: "Google lee los primeros 15 MB. Los enlaces estaban más abajo." },
        { n: "0", h: "artículos nuevos en Google tras tres semanas", d: "Los rastreadores solo se dirigían a páginas antiguas." },
        { n: "2", h: "direcciones por artículo, cada una haciéndose pasar por la original", d: "El artículo compite consigo mismo." },
        { n: "1 línea", h: "en robots.txt, pensada para ocultar una página", d: "Ocultaba todas las direcciones que empezaban por esa letra." },
      ],
      closing: "Todos estos sitios estaban publicando. Con el plan, las mismas comprobaciones semanales se hacen en el suyo.",
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
          b: "Se comprueba cada semana si le encuentran",
          k: "Cada página en el índice de cada asistente",
          d: "Las páginas nuevas se envían a Bing al publicarse (en los blogs que alojamos), y cada semana comprobamos si cada asistente puede encontrarlas.",
        },
        { a: "Duplicados sin revisar", b: "Duplicados detectados y corregidos", k: "Direcciones duplicadas, sitemaps sin las páginas nuevas", d: "Los encontramos en su sitio y los corregimos." },
        { a: "Temas imposibles, escritos igual", b: "Detectados antes de gastar", k: "Preguntas que ningún artículo propio puede ganar", d: "Se detectan antes de que su presupuesto se vaya en ellas." },
        { a: "Datos a criterio del redactor", b: "3–5 fuentes, todas leídas", k: "Datos y fuentes", d: "Cada fuente se lee antes de citarla; revisión editorial y controles automáticos en cada artículo." },
        { a: "Prueba: artículos, tráfico", b: "Prueba: recuento vs. día 0", k: "Pruebas", d: "Las mismas preguntas frente al día 0, cada semana, en cuatro asistentes." },
        { a: "Paga por palabras", b: "Paga por que le encuentren", k: "Por lo que paga", d: "Poder ser encontrado, leído y citado, y un recuento honesto de si le mencionan." },
      ],
      footnote: "Algunas agencias hacen algo más que escribir. Pídales el recuento de la semana pasada frente al día 0.",
    },
    included: (setup) => [
      `Configuración inicial: su sitio probado con 11 rastreadores, bloqueos corregidos, Bing y Google configurados — ${setup} una sola vez, no se cobra si paga 3 meses o un año por adelantado`,
      "Día 0: el informe detallado completo — 240 respuestas de ChatGPT, Claude, Gemini y Perplexity — incluido",
      "Cada semana: el mismo recuento frente al día 0, si los asistentes pueden encontrar sus artículos y a quién citan en su lugar",
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
      kicker: (month) => `Что мы делаем для вас · ${month} в месяц`,
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
          l: "полных пересчёта в год — в сравнении с днём 0",
          d: "Те же вопросы в сравнении с днём 0, каждую неделю. Отдельный тест показывает, может ли каждый ассистент вообще найти ваши опубликованные статьи, чтобы пробел в индексации поймали и исправили, а не приняли за слабые тексты. Раз в месяц — отчёт на вашем языке, который читает человек, прежде чем он попадёт к вам.",
        },
      ],
      inside: "Что происходит на каждом этапе",
      closing: "Ничего из этого не видно в статье. Но именно это решает, прочитает ли её ассистент хоть когда-нибудь.",
      seePlan: "Смотреть подписку →",
    },
    found: {
      h2: "Публиковать — не то же самое, что быть найденным",
      lead: "Наши собственные еженедельные проверки, октябрь 2026: сайты клиентов и сам itgrows.ai.",
      items: [
        { n: "1 из 18", h: "статей ChatGPT нашёл по точному заголовку", d: "При этом Google проиндексировал почти все статьи одного из сайтов." },
        { n: "128 МБ", h: "одна страница-индекс блога со встроенными картинками", d: "Google читает первые 15 МБ. Ссылки были ниже." },
        { n: "0", h: "новых статей в Google через три недели", d: "Краулеров вели только на старые страницы." },
        { n: "2", h: "адреса на статью, и каждый выдаёт себя за оригинал", d: "Статья конкурирует сама с собой." },
        { n: "1 строка", h: "в robots.txt, которая должна была скрыть одну страницу", d: "Она скрыла все адреса, начинающиеся с этой буквы." },
      ],
      closing: "На каждом из этих сайтов выходили публикации. С подпиской те же еженедельные проверки идут и на вашем сайте.",
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
          b: "Находимость — каждую неделю",
          k: "Каждая страница — в индексе каждого ассистента",
          d: "Новые страницы отправляются в Bing при публикации (в блогах, которые хостим мы), и каждую неделю мы проверяем, может ли каждый ассистент их найти.",
        },
        { a: "Дубли не проверены", b: "Дубли найдены и исправлены", k: "Дубли адресов, sitemap без новых страниц", d: "Находим их на вашем сайте и исправляем." },
        { a: "Пишут на безнадёжные темы", b: "Выявляем до трат", k: "Вопросы, которые не выиграть статьёй на своём сайте", d: "Находим их, прежде чем на них уйдёт ваш бюджет." },
        { a: "Факты — на совести автора", b: "3–5 источников, каждый прочитан", k: "Факты и источники", d: "Каждый источник прочитан до цитирования; редакторская вычитка и автоматические проверки для каждой статьи." },
        { a: "Доказательство: статьи, трафик", b: "Доказательство: сравнение с днём 0", k: "Доказательства", d: "Те же вопросы в сравнении с днём 0, каждую неделю, в четырёх ассистентах." },
        { a: "Вы платите за слова", b: "Вы платите за находимость", k: "За что вы платите", d: "За то, чтобы вас можно было найти, прочитать и процитировать, — и за честный подсчёт того, называют ли вас." },
      ],
      footnote: "Некоторые агентства делают больше, чем пишут. Попросите у них подсчёт за прошлую неделю в сравнении с днём 0.",
    },
    included: (setup) => [
      `Настройка: ваш сайт проверен от имени 11 краулеров, блокировки устранены, Bing и Google настроены — разово ${setup}, не взимается при оплате 3 месяцев или года`,
      "День 0: полный подробный отчёт — 240 ответов ChatGPT, Claude, Gemini и Perplexity — включён",
      "Каждую неделю: тот же подсчёт в сравнении с днём 0, могут ли ассистенты найти ваши статьи и кого цитируют вместо вас",
      "До 12 статей с исследованием в месяц на вашем собственном домене, по 3–5 источников в каждой",
      "Сайты, которые ассистенты цитируют вместо вас: мы готовим профили и письма редакторам",
      "Хостинг блога со встроенным машиночитаемым слоем — одна DNS-запись",
      "Вы видите каждую статью за 2 дня до публикации и можете её отредактировать или остановить",
      "Ежемесячный отчёт на вашем языке, который сначала читает человек",
      "Живой человек, который знает ваш аккаунт",
    ],
  },
})
