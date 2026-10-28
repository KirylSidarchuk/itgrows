import { defineMessages } from "../messages"

// app/business/ai-visibility-checker/page.tsx: the page around the quick check (the form itself is
// app/business/AuditForm.tsx, namespace auditForm). No price is written here: the check and the
// detailed report (once an account is created) are both free.
// <link>…</link> is the link inside a tip; <b>…</b> is bold.

const en = {
  metaTitle: "AI visibility checker: does ChatGPT name you? | ItGrows",
  metaDescription:
    "Five questions your buyers ask, put live to ChatGPT and Perplexity: are you named, who is named instead, which sites are cited. Free, about 30 seconds.",
  ogTitle: "Does ChatGPT recommend your business? AI visibility check",
  ogDescription: "Five buyer questions, asked live to ChatGPT and Perplexity. See who they name instead of you.",
  schemaName: "ItGrows AI visibility checker",
  schemaDescription:
    "A 30-second check of whether ChatGPT and Perplexity name a business when its buyers ask: five buyer questions generated from the site, answered live with web search, with the businesses named instead and the sites cited.",
  eyebrow: "AI visibility check · free",
  h1: "Does ChatGPT recommend your business?",
  lead: "Enter your site. We write five questions your buyers would ask and put them to ChatGPT and Perplexity, live, with web search on. You see whether they name you, who they name instead and which sites they cite. About 30 seconds.",
  whatTitle: "What the check does",
  steps: [
    "Reads your homepage and works out what you sell, to whom and where.",
    "Writes five questions a buyer would ask an assistant: who to choose, what it costs, how to decide.",
    "Asks ChatGPT and Perplexity each question with web search on, and reads the answers: are you named, is your site cited, who is named instead, which sites are the sources.",
  ],
  readTitle: "How to read the result",
  readBody:
    "<b>Named</b> means the answer mentions your business. <b>Cited</b> means it links your site as a source. The sites cited instead of you are where the assistants learn who exists in your field: directories, comparison pages, your competitors' own pages. One run is a first look, because answers vary between asks; the free report asks 20 questions to ChatGPT, Claude, Gemini and Perplexity, and on the plan we ask each of them three times every two weeks.",
  notNamedTitle: "If you are not named",
  tipGuide: "Start with the whole path: <link>how to get your business recommended by ChatGPT, Claude, Gemini and Perplexity</link>.",
  tipCrawler: "Check that crawlers can read you: <link>AI crawler check</link> — it tests your sitemap pages against your robots.txt for each crawler.",
  tipCauses: "See the usual causes: <link>why ChatGPT names your competitors and not you</link>.",
  faqAccount: {
    q: "Do I need an account for the check?",
    a: "Not to run it: the check takes about 30 seconds without an account. It asks ChatGPT and Perplexity five questions and shows two answers in full right away; to open all five, you create an account, which costs nothing. With the account we also build the detailed report for your site (20 questions × 4 assistants): the full report is free once you create an account.",
  },
  faq: [
    {
      q: "Where do the questions come from?",
      a: "We read your homepage and write the questions a buyer of your business would type into an assistant, in your site's language: who to choose, what it costs, how to decide. If your site blocks our reader, we learn what the business is from a web search instead.",
    },
    {
      q: "Why do the answers change if I run it again?",
      a: "Assistants do not answer the same question the same way twice. That is why one check is a first look. On the plan we ask every question three times, every two weeks, and compare checks only on the same questions.",
    },
    {
      q: "Can anyone guarantee that ChatGPT will recommend my business?",
      a: "No. No assistant sells organic placement or publishes how it chooses. What can be done is making your site readable and indexed, publishing pages that answer your buyers' questions, being present on the sites assistants cite, and measuring the result honestly.",
    },
  ],
}

export default defineMessages(en, {
  de: {
    metaTitle: "KI-Sichtbarkeitscheck: Nennt ChatGPT Ihre Firma? | ItGrows",
    metaDescription:
      "Fünf Kundenfragen, live an ChatGPT und Perplexity gestellt: Werden Sie genannt, wer stattdessen, welche Websites werden zitiert? Kostenlos, etwa 30 Sekunden.",
    ogTitle: "Empfiehlt ChatGPT Ihr Unternehmen? Der KI-Sichtbarkeitscheck",
    ogDescription: "Fünf Kundenfragen, live an ChatGPT und Perplexity gestellt. Sehen Sie, wen die Assistenten statt Ihnen nennen.",
    schemaName: "ItGrows KI-Sichtbarkeitscheck",
    schemaDescription:
      "Ein 30-Sekunden-Check, ob ChatGPT und Perplexity ein Unternehmen nennen, wenn seine Kunden fragen: fünf aus der Website abgeleitete Kundenfragen, live mit Websuche beantwortet, mit den stattdessen genannten Unternehmen und den zitierten Websites.",
    eyebrow: "KI-Sichtbarkeitscheck · kostenlos",
    h1: "Empfiehlt ChatGPT Ihr Unternehmen?",
    lead: "Geben Sie Ihre Website ein. Wir formulieren fünf Fragen, die Ihre Kunden stellen würden, und stellen sie ChatGPT und Perplexity – live, mit eingeschalteter Websuche. Sie sehen, ob Sie genannt werden, wer stattdessen genannt wird und welche Websites zitiert werden. Dauert etwa 30 Sekunden.",
    whatTitle: "Was der Check macht",
    steps: [
      "Er liest Ihre Startseite und ermittelt, was Sie verkaufen, an wen und wo.",
      "Er formuliert fünf Fragen, die ein Kunde einem Assistenten stellen würde: wen man wählt, was es kostet, wie man sich entscheidet.",
      "Er stellt ChatGPT und Perplexity jede Frage mit eingeschalteter Websuche und wertet die Antworten aus: Werden Sie genannt, wird Ihre Website zitiert, wer wird stattdessen genannt, welche Websites dienen als Quellen?",
    ],
    readTitle: "So lesen Sie das Ergebnis",
    readBody:
      "<b>Genannt</b> heißt: Die Antwort erwähnt Ihr Unternehmen. <b>Zitiert</b> heißt: Sie verlinkt Ihre Website als Quelle. Die Websites, die statt Ihrer zitiert werden, sind die Orte, an denen die Assistenten lernen, wer in Ihrer Branche existiert: Verzeichnisse, Vergleichsseiten, die eigenen Seiten Ihrer Wettbewerber. Ein Durchlauf ist ein erster Eindruck, denn die Antworten schwanken von Anfrage zu Anfrage; der kostenlose Bericht stellt ChatGPT, Claude, Gemini und Perplexity 20 Fragen, und im Plan stellen wir jede davon alle zwei Wochen dreimal.",
    notNamedTitle: "Wenn Sie nicht genannt werden",
    tipGuide: "Beginnen Sie mit dem ganzen Weg: <link>wie Ihr Unternehmen von ChatGPT, Claude, Gemini und Perplexity empfohlen wird</link> (Leitfaden auf Englisch).",
    tipCrawler: "Prüfen Sie, ob Crawler Sie lesen können: <link>KI-Crawler-Check</link> – er testet Ihre Sitemap-Seiten für jeden Crawler gegen Ihre robots.txt.",
    tipCauses: "Die üblichen Ursachen: <link>warum ChatGPT Ihre Wettbewerber nennt und Sie nicht</link> (auf Englisch).",
    faqAccount: {
      q: "Brauche ich für den Check ein Konto?",
      a: "Zum Starten nicht: Der Check läuft ohne Konto und dauert etwa 30 Sekunden. Er stellt ChatGPT und Perplexity fünf Fragen und zeigt zwei Antworten sofort vollständig; um alle fünf zu öffnen, legen Sie ein Konto an – das kostet nichts. Mit dem Konto erstellen wir außerdem den ausführlichen Bericht für Ihre Website (20 Fragen × 4 Assistenten): Der vollständige Bericht ist kostenlos, sobald Sie ein Konto anlegen.",
    },
    faq: [
      {
        q: "Woher kommen die Fragen?",
        a: "Wir lesen Ihre Startseite und formulieren die Fragen, die ein Kunde Ihres Unternehmens einem Assistenten stellen würde, in der Sprache Ihrer Website: wen man wählt, was es kostet, wie man sich entscheidet. Blockiert Ihre Website unseren Abruf, ermitteln wir stattdessen über eine Websuche, was Ihr Unternehmen macht.",
      },
      {
        q: "Warum ändern sich die Antworten, wenn ich den Check wiederhole?",
        a: "Assistenten beantworten dieselbe Frage nie zweimal gleich. Deshalb ist ein einzelner Check ein erster Eindruck. Im Plan stellen wir jede Frage alle zwei Wochen dreimal und vergleichen Messungen nur anhand derselben Fragen.",
      },
      {
        q: "Kann jemand garantieren, dass ChatGPT mein Unternehmen empfiehlt?",
        a: "Nein. Kein Assistent verkauft organische Platzierungen oder legt offen, wie er auswählt. Möglich ist Folgendes: Ihre Website lesbar und indexierbar machen, Seiten veröffentlichen, die die Fragen Ihrer Kunden beantworten, auf den Websites präsent sein, die die Assistenten zitieren, und das Ergebnis ehrlich messen.",
      },
    ],
  },
  fr: {
    metaTitle: "Visibilité IA : ChatGPT vous mentionne-t-il ? | ItGrows",
    metaDescription:
      "Cinq questions de clients posées en direct à ChatGPT et Perplexity : êtes-vous mentionné, qui l’est à votre place, quels sites sont cités ? Gratuit, 30 s.",
    ogTitle: "ChatGPT recommande-t-il votre entreprise ? Test de visibilité IA",
    ogDescription: "Cinq questions de clients, posées en direct à ChatGPT et Perplexity. Découvrez qui ils mentionnent à votre place.",
    schemaName: "Test de visibilité IA ItGrows",
    schemaDescription:
      "Un test de 30 secondes pour savoir si ChatGPT et Perplexity mentionnent une entreprise quand ses clients posent la question : cinq questions de clients rédigées à partir du site, posées en direct avec recherche web, avec les entreprises mentionnées à sa place et les sites cités.",
    eyebrow: "Test de visibilité IA · gratuit",
    h1: "ChatGPT recommande-t-il votre entreprise ?",
    lead: "Saisissez votre site. Nous rédigeons cinq questions que vos clients poseraient et les soumettons à ChatGPT et Perplexity, en direct, recherche web activée. Vous voyez s’ils vous mentionnent, qui ils mentionnent à votre place et quels sites ils citent. Environ 30 secondes.",
    whatTitle: "Ce que fait le test",
    steps: [
      "Il lit votre page d’accueil et détermine ce que vous vendez, à qui et où.",
      "Il rédige cinq questions qu’un client poserait à un assistant : qui choisir, combien ça coûte, comment décider.",
      "Il pose chaque question à ChatGPT et Perplexity, recherche web activée, et analyse les réponses : êtes-vous mentionné, votre site est-il cité, qui est mentionné à votre place, quels sites servent de sources.",
    ],
    readTitle: "Comment lire le résultat",
    readBody:
      "<b>Mentionné</b> signifie que la réponse parle de votre entreprise. <b>Cité</b> signifie qu’elle donne votre site en lien, comme source. Les sites cités à votre place sont ceux où les assistants apprennent qui existe dans votre secteur : annuaires, comparatifs, pages de vos concurrents. Un seul passage n’est qu’un premier aperçu, car les réponses varient d’une fois à l’autre ; le rapport gratuit pose 20 questions à ChatGPT, Claude, Gemini et Perplexity, et avec l’abonnement nous posons chacune trois fois toutes les deux semaines.",
    notNamedTitle: "Si vous n’êtes pas mentionné",
    tipGuide: "Commencez par la démarche complète : <link>comment faire recommander votre entreprise par ChatGPT, Claude, Gemini et Perplexity</link> (guide en anglais).",
    tipCrawler: "Vérifiez que les robots peuvent vous lire : <link>test des robots d’IA</link> — il confronte les pages de votre sitemap à votre robots.txt, robot par robot.",
    tipCauses: "Les causes habituelles : <link>pourquoi ChatGPT mentionne vos concurrents et pas vous</link> (en anglais).",
    faqAccount: {
      q: "Faut-il un compte pour le test ?",
      a: "Pas pour le lancer : le test se fait sans compte, en 30 secondes environ. Il pose cinq questions à ChatGPT et Perplexity et affiche tout de suite deux réponses en entier ; pour ouvrir les cinq, vous créez un compte, ce qui ne coûte rien. Avec ce compte, nous établissons aussi le rapport détaillé de votre site (20 questions × 4 assistants) : le rapport complet est gratuit dès que vous créez un compte.",
    },
    faq: [
      {
        q: "D’où viennent les questions ?",
        a: "Nous lisons votre page d’accueil et rédigeons les questions qu’un client de votre entreprise poserait à un assistant, dans la langue de votre site : qui choisir, combien ça coûte, comment décider. Si votre site bloque notre lecteur, nous découvrons votre activité par une recherche web.",
      },
      {
        q: "Pourquoi les réponses changent-elles si je relance le test ?",
        a: "Les assistants ne répondent jamais deux fois de la même façon à la même question. C’est pourquoi un test n’est qu’un premier aperçu. Avec l’abonnement, nous posons chaque question trois fois toutes les deux semaines et ne comparons les mesures que sur les mêmes questions.",
      },
      {
        q: "Quelqu’un peut-il garantir que ChatGPT recommandera mon entreprise ?",
        a: "Non. Aucun assistant ne vend de placement organique ni ne publie sa façon de choisir. Ce qu’on peut faire : rendre votre site lisible et indexé, publier des pages qui répondent aux questions de vos clients, être présent sur les sites que citent les assistants, et mesurer le résultat honnêtement.",
      },
    ],
  },
  es: {
    metaTitle: "Visibilidad en IA: ¿ChatGPT menciona su empresa? | ItGrows",
    metaDescription:
      "Cinco preguntas de sus clientes, en directo a ChatGPT y Perplexity: si le mencionan, a quién mencionan en su lugar y qué sitios citan. Gratis, unos 30 segundos.",
    ogTitle: "¿ChatGPT recomienda su empresa? Comprobación de visibilidad en IA",
    ogDescription: "Cinco preguntas de clientes, hechas en directo a ChatGPT y Perplexity. Vea a quién mencionan en lugar de usted.",
    schemaName: "Comprobador de visibilidad en IA de ItGrows",
    schemaDescription:
      "Una comprobación de 30 segundos de si ChatGPT y Perplexity mencionan una empresa cuando sus clientes preguntan: cinco preguntas de clientes generadas a partir del sitio, respondidas en directo con búsqueda web, con las empresas mencionadas en su lugar y los sitios citados.",
    eyebrow: "Comprobación de visibilidad en IA · gratis",
    h1: "¿ChatGPT recomienda su empresa?",
    lead: "Introduzca su sitio. Redactamos cinco preguntas que harían sus clientes y se las planteamos a ChatGPT y Perplexity, en directo y con la búsqueda web activada. Verá si mencionan su empresa, a quién mencionan en su lugar y qué sitios citan. Unos 30 segundos.",
    whatTitle: "Qué hace la comprobación",
    steps: [
      "Lee su página de inicio y deduce qué vende, a quién y dónde.",
      "Redacta cinco preguntas que un cliente haría a un asistente: a quién elegir, cuánto cuesta, cómo decidir.",
      "Plantea cada pregunta a ChatGPT y Perplexity con la búsqueda web activada y analiza las respuestas: si le mencionan, si citan su sitio, a quién mencionan en su lugar y qué sitios usan como fuente.",
    ],
    readTitle: "Cómo leer el resultado",
    readBody:
      "<b>Mencionado</b> significa que la respuesta nombra su empresa. <b>Citado</b> significa que enlaza su sitio como fuente. Los sitios citados en lugar del suyo son donde los asistentes aprenden quién existe en su sector: directorios, páginas comparativas, las propias páginas de sus competidores. Una sola ejecución es una primera impresión, porque las respuestas varían de una vez a otra; el informe gratuito hace 20 preguntas a ChatGPT, Claude, Gemini y Perplexity, y con el plan hacemos cada una tres veces cada dos semanas.",
    notNamedTitle: "Si no le mencionan",
    tipGuide: "Empiece por el camino completo: <link>cómo conseguir que ChatGPT, Claude, Gemini y Perplexity recomienden su empresa</link> (guía en inglés).",
    tipCrawler: "Compruebe que los rastreadores pueden leer su sitio: <link>comprobación de rastreadores de IA</link>; prueba las páginas de su sitemap contra su robots.txt para cada rastreador.",
    tipCauses: "Vea las causas habituales: <link>por qué ChatGPT menciona a sus competidores y no a usted</link> (en inglés).",
    faqAccount: {
      q: "¿Necesito una cuenta para la comprobación?",
      a: "Para hacerla, no: la comprobación funciona sin cuenta, en unos 30 segundos. Hace cinco preguntas a ChatGPT y Perplexity y muestra al momento dos respuestas completas; para abrir las cinco, cree una cuenta, que no cuesta nada. Con esa cuenta elaboramos también el informe detallado de su sitio (20 preguntas × 4 asistentes): el informe completo es gratuito en cuanto cree una cuenta.",
    },
    faq: [
      {
        q: "¿De dónde salen las preguntas?",
        a: "Leemos su página de inicio y redactamos las preguntas que un cliente de su negocio le haría a un asistente, en el idioma de su sitio: a quién elegir, cuánto cuesta, cómo decidir. Si su sitio bloquea nuestro lector, averiguamos a qué se dedica su negocio mediante una búsqueda web.",
      },
      {
        q: "¿Por qué cambian las respuestas si repito la comprobación?",
        a: "Los asistentes no responden dos veces igual a la misma pregunta. Por eso una comprobación es una primera impresión. Con el plan hacemos cada pregunta tres veces cada dos semanas y solo comparamos mediciones con las mismas preguntas.",
      },
      {
        q: "¿Puede alguien garantizar que ChatGPT recomiende mi empresa?",
        a: "No. Ningún asistente vende posiciones orgánicas ni publica cómo elige. Lo que sí se puede hacer es conseguir que su sitio sea legible y esté indexado, publicar páginas que respondan a las preguntas de sus clientes, estar presente en los sitios que citan los asistentes y medir el resultado con honestidad.",
      },
    ],
  },
  ru: {
    metaTitle: "Проверка видимости в ИИ: называет ли вас ChatGPT? | ItGrows",
    metaDescription:
      "Пять вопросов ваших клиентов — вживую в ChatGPT и Perplexity: называют ли вас, кого называют вместо вас, какие сайты цитируют. Бесплатно, около 30 секунд.",
    ogTitle: "Рекомендует ли ChatGPT ваш бизнес? Проверка видимости в ИИ",
    ogDescription: "Пять вопросов ваших клиентов, заданных ChatGPT и Perplexity в реальном времени. Посмотрите, кого они называют вместо вас.",
    schemaName: "Проверка видимости в ИИ от ItGrows",
    schemaDescription:
      "30-секундная проверка того, называют ли ChatGPT и Perplexity компанию, когда её клиенты задают вопросы: пять клиентских вопросов, составленных по сайту, ответы в реальном времени с веб-поиском, компании, названные вместо неё, и цитируемые сайты.",
    eyebrow: "Проверка видимости в ИИ · бесплатно",
    h1: "Рекомендует ли ChatGPT ваш бизнес?",
    lead: "Укажите свой сайт. Мы составим пять вопросов, которые задали бы ваши клиенты, и зададим их ChatGPT и Perplexity в реальном времени, с включённым веб-поиском. Вы увидите, называют ли они вас, кого называют вместо вас и на какие сайты ссылаются. Около 30 секунд.",
    whatTitle: "Что делает проверка",
    steps: [
      "Читает вашу главную страницу и определяет, что вы продаёте, кому и где.",
      "Составляет пять вопросов, которые клиент задал бы ассистенту: кого выбрать, сколько это стоит, как принять решение.",
      "Задаёт каждый вопрос ChatGPT и Perplexity с включённым веб-поиском и разбирает ответы: названы ли вы, цитируется ли ваш сайт, кого называют вместо вас, какие сайты служат источниками.",
    ],
    readTitle: "Как читать результат",
    readBody:
      "<b>Назван</b> — ответ упоминает вашу компанию. <b>Процитирован</b> — ответ ссылается на ваш сайт как на источник. Сайты, которые цитируют вместо вашего, — это места, где ассистенты узнают, кто есть в вашей сфере: каталоги, страницы сравнений, собственные страницы ваших конкурентов. Один прогон — лишь первый взгляд, потому что ответы меняются от запроса к запросу; бесплатный отчёт задаёт ChatGPT, Claude, Gemini и Perplexity 20 вопросов, а по подписке мы каждые две недели задаём каждый из них три раза.",
    notNamedTitle: "Если вас не называют",
    tipGuide: "Начните с полного пути: <link>как добиться, чтобы ChatGPT, Claude, Gemini и Perplexity рекомендовали ваш бизнес</link> (руководство на английском).",
    tipCrawler: "Проверьте, могут ли краулеры вас прочитать: <link>проверка ИИ-краулеров</link> — она сверяет страницы из вашего sitemap с вашим robots.txt для каждого краулера.",
    tipCauses: "Типичные причины: <link>почему ChatGPT называет ваших конкурентов, а не вас</link> (на английском).",
    faqAccount: {
      q: "Нужен ли аккаунт для проверки?",
      a: "Чтобы запустить проверку, аккаунт не нужен: она идёт примерно 30 секунд, задаёт ChatGPT и Perplexity пять вопросов и сразу показывает два ответа полностью. Чтобы открыть все пять, вы создаёте аккаунт — это бесплатно. С аккаунтом мы также составим подробный отчёт по вашему сайту (20 вопросов × 4 ассистента): полный отчёт бесплатный — достаточно создать аккаунт.",
    },
    faq: [
      {
        q: "Откуда берутся вопросы?",
        a: "Мы читаем вашу главную страницу и составляем вопросы, которые клиент вашего бизнеса задал бы ассистенту, на языке вашего сайта: кого выбрать, сколько это стоит, как принять решение. Если ваш сайт блокирует наш сканер, мы узнаём, чем занимается бизнес, через веб-поиск.",
      },
      {
        q: "Почему ответы меняются, если запустить проверку ещё раз?",
        a: "Ассистенты не отвечают на один и тот же вопрос дважды одинаково. Поэтому одна проверка — это первый взгляд. По подписке мы каждые две недели задаём каждый вопрос три раза и сравниваем замеры только по одним и тем же вопросам.",
      },
      {
        q: "Может ли кто-то гарантировать, что ChatGPT будет рекомендовать мой бизнес?",
        a: "Нет. Ни один ассистент не продаёт органические места и не раскрывает, как делает выбор. Можно другое: сделать сайт читаемым и проиндексированным, публиковать страницы с ответами на вопросы ваших клиентов, присутствовать на сайтах, которые цитируют ассистенты, и честно измерять результат.",
      },
    ],
  },
})
