import { defineMessages } from "../messages"

// app/business/ai-crawler-checker/page.tsx: the page around the crawler check (the form and the
// result are app/business/ai-crawler-checker/CrawlerChecker.tsx, namespace crawlerChecker).
// <code>…</code> is a robots.txt path, <link>…</link> the link inside a tip.

const en = {
  metaTitle: "AI crawler checker: is your site blocking GPTBot? | ItGrows",
  metaDescription:
    "Check your robots.txt and server for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot and Bingbot, including rules that quietly close sitemap pages.",
  ogTitle: "Is your site blocking AI crawlers? Check it in seconds",
  ogDescription: "We test the pages in your sitemap against your robots.txt for each AI crawler, and ask your server as each one.",
  schemaName: "ItGrows AI crawler checker",
  schemaDescription:
    "A check of robots.txt and server responses for AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot) and search crawlers (Googlebot, Bingbot), testing the site's own sitemap pages against its rules.",
  eyebrow: "AI crawler check · no signup",
  h1: "Is your site blocking AI crawlers?",
  lead: "Enter your site. We read your robots.txt the way crawlers do, test the pages in your sitemap against it for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot and Bingbot, and ask your server as each AI crawler.",
  whyTitle: "Why we built this",
  whyBody:
    "On itgrows.ai a robots.txt rule meant to hide one redirect page, <code>/b</code>, was written as a prefix. From 11 August to 21 October 2026 it also closed <code>/blog</code>, <code>/business</code> and every one of our guides to all crawlers. The pages loaded fine in a browser, the rule looked harmless, and Bing listed our business page as “discovered but not crawled” the whole time. Reading the rules did not reveal it; testing real URLs against them does.",
  whatTitle: "What to do with the result",
  tipRules:
    "Rules closing pages you want read: rewrite them so they match only what you meant, for example with a trailing <code>$</code>. See <link>is your website blocking AI crawlers</link>.",
  tipServer: "A crawler refused by your server: it is your firewall or CDN, not robots.txt. See <link>GPTBot blocked by Cloudflare</link>.",
  tipOpen: "Everything open: the next question is whether the assistants name you. Run the <link>AI visibility check</link>.",
  faq: [
    {
      q: "How does the check decide whether a page is blocked?",
      a: "It reads your robots.txt the way crawlers do: the group for each crawler (or the * group), the longest matching rule wins, allow wins a tie, * and $ work as wildcards. Then it tests the pages listed in your sitemap against those rules, one crawler at a time.",
    },
    {
      q: "Why would robots.txt block pages I never meant to block?",
      a: "Rules are prefixes. A rule written for one page, such as Disallow: /b, also matches /blog and /business. We made exactly this mistake on itgrows.ai and it closed our guides to every crawler for ten weeks before we noticed.",
    },
    {
      q: "My robots.txt allows everything. Can crawlers still be blocked?",
      a: "Yes. A firewall, CDN or bot-protection setting can refuse a crawler even when robots.txt invites it. The check also asks your server as GPTBot, ClaudeBot and PerplexityBot and shows what it answered.",
    },
    {
      q: "Which crawlers matter for being named in AI answers?",
      a: "The ones that feed search and live answers: OAI-SearchBot and ChatGPT-User for ChatGPT, Bingbot because ChatGPT search and Copilot draw on Bing, Googlebot for Gemini and AI Overviews, PerplexityBot, and Anthropic's crawlers for Claude. GPTBot is OpenAI's training crawler.",
    },
  ],
}

export default defineMessages(en, {
  de: {
    metaTitle: "KI-Crawler-Check: Blockiert Ihre Website GPTBot? | ItGrows",
    metaDescription:
      "Prüfen Sie robots.txt und Server für GPTBot, ClaudeBot, PerplexityBot, Googlebot und Bingbot – auch Regeln, die Seiten Ihrer Sitemap unbemerkt sperren.",
    ogTitle: "Blockiert Ihre Website KI-Crawler? In Sekunden geprüft",
    ogDescription: "Wir testen die Seiten Ihrer Sitemap für jeden KI-Crawler gegen Ihre robots.txt und senden Ihrem Server Anfragen mit der Kennung jedes dieser Crawler.",
    schemaName: "ItGrows KI-Crawler-Check",
    schemaDescription:
      "Eine Prüfung von robots.txt und Serverantworten für KI-Crawler (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot) und Suchmaschinen-Crawler (Googlebot, Bingbot), die die Sitemap-Seiten der Website gegen ihre eigenen Regeln testet.",
    eyebrow: "KI-Crawler-Check · ohne Anmeldung",
    h1: "Blockiert Ihre Website KI-Crawler?",
    lead: "Geben Sie Ihre Website ein. Wir lesen Ihre robots.txt so, wie Crawler es tun, testen die Seiten Ihrer Sitemap dagegen für GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot und Bingbot und senden Ihrem Server Anfragen mit der Kennung jedes KI-Crawlers.",
    whyTitle: "Warum wir das gebaut haben",
    whyBody:
      "Auf itgrows.ai war eine robots.txt-Regel, die eine einzige Weiterleitungsseite verbergen sollte, <code>/b</code>, als Präfix geschrieben. Vom 11. August bis zum 21. Oktober 2026 sperrte sie außerdem <code>/blog</code>, <code>/business</code> und jeden unserer Leitfäden für alle Crawler. Im Browser luden die Seiten problemlos, die Regel sah harmlos aus, und Bing führte unsere Business-Seite die ganze Zeit als „entdeckt, aber nicht gecrawlt“. Das Lesen der Regeln hat es nicht verraten; das Testen echter URLs gegen sie schon.",
    whatTitle: "Was Sie mit dem Ergebnis tun können",
    tipRules:
      "Regeln, die Seiten sperren, die gelesen werden sollen: Schreiben Sie sie so um, dass sie nur das treffen, was gemeint war, zum Beispiel mit einem abschließenden <code>$</code>. Siehe <link>Blockiert Ihre Website KI-Crawler?</link> (auf Englisch).",
    tipServer: "Ein Crawler, den Ihr Server abweist: Das liegt an Ihrer Firewall oder Ihrem CDN, nicht an der robots.txt. Siehe <link>GPTBot von Cloudflare blockiert</link> (auf Englisch).",
    tipOpen: "Alles offen: Die nächste Frage ist, ob die Assistenten Sie nennen. Starten Sie den <link>KI-Sichtbarkeitscheck</link>.",
    faq: [
      {
        q: "Wie entscheidet der Check, ob eine Seite gesperrt ist?",
        a: "Er liest Ihre robots.txt so, wie Crawler es tun: die Gruppe für den jeweiligen Crawler (oder die *-Gruppe), die längste passende Regel gewinnt, bei Gleichstand gewinnt Allow, * und $ wirken als Platzhalter. Dann testet er die Seiten Ihrer Sitemap gegen diese Regeln, Crawler für Crawler.",
      },
      {
        q: "Warum sollte robots.txt Seiten sperren, die ich nie sperren wollte?",
        a: "Regeln sind Präfixe. Eine Regel für eine einzelne Seite, etwa Disallow: /b, trifft auch /blog und /business. Genau diesen Fehler haben wir auf itgrows.ai gemacht, und er hat unsere Leitfäden zehn Wochen lang für alle Crawler gesperrt, bevor wir ihn bemerkten.",
      },
      {
        q: "Meine robots.txt erlaubt alles. Können Crawler trotzdem blockiert sein?",
        a: "Ja. Eine Firewall, ein CDN oder ein Bot-Schutz kann einen Crawler abweisen, selbst wenn die robots.txt ihn einlädt. Der Check sendet Ihrem Server deshalb auch Anfragen als GPTBot, ClaudeBot und PerplexityBot und zeigt, was er geantwortet hat.",
      },
      {
        q: "Welche Crawler zählen, um in KI-Antworten genannt zu werden?",
        a: "Diejenigen, die Suche und Live-Antworten speisen: OAI-SearchBot und ChatGPT-User für ChatGPT, Bingbot, weil die ChatGPT-Suche und Copilot auf Bing zurückgreifen, Googlebot für Gemini und AI Overviews, PerplexityBot sowie die Crawler von Anthropic für Claude. GPTBot ist der Trainings-Crawler von OpenAI.",
      },
    ],
  },
  fr: {
    metaTitle: "Robots d’IA : votre site bloque-t-il GPTBot ? | ItGrows",
    metaDescription:
      "Vérifiez robots.txt et serveur pour GPTBot, ClaudeBot, PerplexityBot, Googlebot et Bingbot, y compris les règles qui ferment en silence des pages du sitemap.",
    ogTitle: "Votre site bloque-t-il les robots d’IA ? Vérifiez-le en quelques secondes",
    ogDescription: "Nous confrontons les pages de votre sitemap à votre robots.txt pour chaque robot d’IA, et interrogeons votre serveur en nous présentant comme chacun d’eux.",
    schemaName: "Test des robots d’IA ItGrows",
    schemaDescription:
      "Une vérification du robots.txt et des réponses du serveur pour les robots d’IA (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot) et les robots des moteurs de recherche (Googlebot, Bingbot), qui confronte les pages du sitemap du site à ses propres règles.",
    eyebrow: "Test des robots d’IA · sans inscription",
    h1: "Votre site bloque-t-il les robots d’IA ?",
    lead: "Saisissez votre site. Nous lisons votre robots.txt comme le font les robots, testons les pages de votre sitemap au regard de ses règles pour GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot et Bingbot, et interrogeons votre serveur en nous présentant comme chaque robot d’IA.",
    whyTitle: "Pourquoi nous l’avons conçu",
    whyBody:
      "Sur itgrows.ai, une règle robots.txt censée masquer une seule page de redirection, <code>/b</code>, était écrite comme un préfixe. Du 11 août au 21 octobre 2026, elle a aussi fermé <code>/blog</code>, <code>/business</code> et chacun de nos guides à tous les robots. Les pages s’affichaient normalement dans un navigateur, la règle semblait inoffensive, et Bing a classé notre page business comme « découverte mais non explorée » pendant tout ce temps. Lire les règles ne l’a pas révélé ; les confronter à de vraies URL, si.",
    whatTitle: "Que faire du résultat",
    tipRules:
      "Des règles ferment des pages que vous voulez faire lire : réécrivez-les pour qu’elles ne visent que ce que vous vouliez, par exemple avec un <code>$</code> final. Voir <link>votre site bloque-t-il les robots d’IA</link> (en anglais).",
    tipServer: "Un robot refusé par votre serveur : c’est votre pare-feu ou votre CDN, pas le robots.txt. Voir <link>GPTBot bloqué par Cloudflare</link> (en anglais).",
    tipOpen: "Tout est ouvert : reste à savoir si les assistants vous mentionnent. Lancez le <link>test de visibilité IA</link>.",
    faq: [
      {
        q: "Comment le test décide-t-il qu’une page est bloquée ?",
        a: "Il lit votre robots.txt comme les robots : le groupe de chaque robot (ou le groupe *), la règle correspondante la plus longue l’emporte, Allow l’emporte en cas d’égalité, * et $ servent de jokers. Puis il confronte les pages listées dans votre sitemap à ces règles, robot par robot.",
      },
      {
        q: "Pourquoi robots.txt bloquerait-il des pages que je n’ai jamais voulu bloquer ?",
        a: "Les règles sont des préfixes. Une règle écrite pour une page, comme Disallow: /b, vise aussi /blog et /business. Nous avons fait exactement cette erreur sur itgrows.ai : elle a fermé nos guides à tous les robots pendant dix semaines avant que nous nous en apercevions.",
      },
      {
        q: "Mon robots.txt autorise tout. Les robots peuvent-ils quand même être bloqués ?",
        a: "Oui. Un pare-feu, un CDN ou une protection anti-bots peut refuser un robot même quand le robots.txt l’invite. Le test interroge donc aussi votre serveur en se présentant comme GPTBot, ClaudeBot et PerplexityBot et montre ce qu’il a répondu.",
      },
      {
        q: "Quels robots comptent pour être mentionné dans les réponses des IA ?",
        a: "Ceux qui alimentent la recherche et les réponses en direct : OAI-SearchBot et ChatGPT-User pour ChatGPT, Bingbot parce que la recherche de ChatGPT et Copilot s’appuient sur Bing, Googlebot pour Gemini et les AI Overviews, PerplexityBot, et les robots d’Anthropic pour Claude. GPTBot est le robot d’entraînement d’OpenAI.",
      },
    ],
  },
  es: {
    metaTitle: "Rastreadores de IA: ¿su sitio bloquea a GPTBot? | ItGrows",
    metaDescription:
      "Compruebe robots.txt y servidor para GPTBot, ClaudeBot, PerplexityBot, Googlebot y Bingbot, incluidas las reglas que cierran sin avisar páginas de su sitemap.",
    ogTitle: "¿Su sitio bloquea a los rastreadores de IA? Compruébelo en segundos",
    ogDescription: "Probamos las páginas de su sitemap contra su robots.txt para cada rastreador de IA y consultamos a su servidor identificándonos como cada uno de ellos.",
    schemaName: "Comprobador de rastreadores de IA de ItGrows",
    schemaDescription:
      "Una comprobación del robots.txt y de las respuestas del servidor para rastreadores de IA (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot) y de buscadores (Googlebot, Bingbot), que prueba las páginas del sitemap del propio sitio contra sus reglas.",
    eyebrow: "Comprobación de rastreadores de IA · sin registro",
    h1: "¿Su sitio bloquea a los rastreadores de IA?",
    lead: "Introduzca su sitio. Leemos su robots.txt como lo hacen los rastreadores, probamos contra él las páginas de su sitemap para GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot y Bingbot, y consultamos a su servidor identificándonos como cada rastreador de IA.",
    whyTitle: "Por qué lo creamos",
    whyBody:
      "En itgrows.ai, una regla de robots.txt pensada para ocultar una sola página de redirección, <code>/b</code>, se escribió como prefijo. Del 11 de agosto al 21 de octubre de 2026 cerró también <code>/blog</code>, <code>/business</code> y todas nuestras guías a todos los rastreadores. Las páginas cargaban bien en el navegador, la regla parecía inofensiva y Bing mostró nuestra página de empresas como «descubierta pero no rastreada» todo ese tiempo. Leer las reglas no lo reveló; probar URL reales contra ellas, sí.",
    whatTitle: "Qué hacer con el resultado",
    tipRules:
      "Reglas que cierran páginas que usted quiere que se lean: reescríbalas para que solo coincidan con lo que pretendía, por ejemplo con un <code>$</code> al final. Vea <link>¿su sitio bloquea a los rastreadores de IA?</link> (en inglés).",
    tipServer: "Un rastreador rechazado por su servidor: es su firewall o su CDN, no el robots.txt. Vea <link>GPTBot bloqueado por Cloudflare</link> (en inglés).",
    tipOpen: "Todo abierto: la siguiente pregunta es si los asistentes le mencionan. Haga la <link>comprobación de visibilidad en IA</link>.",
    faq: [
      {
        q: "¿Cómo decide la comprobación si una página está bloqueada?",
        a: "Lee su robots.txt como lo hacen los rastreadores: el grupo de cada rastreador (o el grupo *), gana la regla coincidente más larga, Allow gana en caso de empate, * y $ funcionan como comodines. Después prueba las páginas de su sitemap contra esas reglas, un rastreador cada vez.",
      },
      {
        q: "¿Por qué bloquearía robots.txt páginas que nunca quise bloquear?",
        a: "Las reglas son prefijos. Una regla escrita para una página, como Disallow: /b, también coincide con /blog y /business. Cometimos exactamente este error en itgrows.ai y cerró nuestras guías a todos los rastreadores durante diez semanas antes de que nos diéramos cuenta.",
      },
      {
        q: "Mi robots.txt lo permite todo. ¿Pueden estar bloqueados los rastreadores igualmente?",
        a: "Sí. Un firewall, una CDN o una protección contra bots pueden rechazar a un rastreador aunque el robots.txt lo invite. Por eso la comprobación también consulta a su servidor identificándose como GPTBot, ClaudeBot y PerplexityBot y muestra qué respondió.",
      },
      {
        q: "¿Qué rastreadores importan para que le mencionen en las respuestas de IA?",
        a: "Los que alimentan la búsqueda y las respuestas en directo: OAI-SearchBot y ChatGPT-User para ChatGPT, Bingbot porque la búsqueda de ChatGPT y Copilot se apoyan en Bing, Googlebot para Gemini y AI Overviews, PerplexityBot y los rastreadores de Anthropic para Claude. GPTBot es el rastreador de entrenamiento de OpenAI.",
      },
    ],
  },
  ru: {
    metaTitle: "Проверка ИИ-краулеров: блокирует ли сайт GPTBot? | ItGrows",
    metaDescription:
      "Проверьте robots.txt и сервер для GPTBot, ClaudeBot, PerplexityBot, Googlebot и Bingbot, включая правила, которые незаметно закрывают страницы из sitemap.",
    ogTitle: "Не закрыт ли ваш сайт для ИИ-краулеров? Проверка за секунды",
    ogDescription: "Мы сверяем страницы из вашего sitemap с robots.txt для каждого ИИ-краулера и обращаемся к вашему серверу от имени каждого из них.",
    schemaName: "Проверка ИИ-краулеров от ItGrows",
    schemaDescription:
      "Проверка robots.txt и ответов сервера для ИИ-краулеров (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot) и поисковых краулеров (Googlebot, Bingbot) со сверкой страниц из sitemap сайта с его же правилами.",
    eyebrow: "Проверка ИИ-краулеров · без регистрации",
    h1: "Не закрыт ли ваш сайт для ИИ-краулеров?",
    lead: "Укажите свой сайт. Мы читаем ваш robots.txt так же, как краулеры, сверяем с ним страницы из вашего sitemap для GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Googlebot и Bingbot и обращаемся к вашему серверу от имени каждого ИИ-краулера.",
    whyTitle: "Зачем мы это сделали",
    whyBody:
      "На itgrows.ai правило robots.txt, которое должно было скрыть одну страницу-редирект, <code>/b</code>, было записано как префикс. С 11 августа по 21 октября 2026 года оно закрывало для всех краулеров ещё и <code>/blog</code>, <code>/business</code> и все наши руководства. В браузере страницы открывались нормально, правило выглядело безобидно, а Bing всё это время показывал нашу бизнес-страницу как «обнаружена, но не просканирована». Чтение правил этого не выявило; проверка реальных URL по ним — выявляет.",
    whatTitle: "Что делать с результатом",
    tipRules:
      "Если правила закрывают страницы, которые должны быть доступны, перепишите их так, чтобы они совпадали только с тем, что вы имели в виду, например с <code>$</code> на конце. Подробнее: <link>не блокирует ли ваш сайт ИИ-краулеров</link> (на английском).",
    tipServer: "Сервер отказывает краулеру: дело в вашем файрволе или CDN, а не в robots.txt. Подробнее: <link>GPTBot заблокирован Cloudflare</link> (на английском).",
    tipOpen: "Всё открыто: следующий вопрос — называют ли вас ассистенты. Запустите <link>проверку видимости в ИИ</link>.",
    faq: [
      {
        q: "Как проверка решает, закрыта ли страница?",
        a: "Она читает ваш robots.txt так же, как краулеры: группа для каждого краулера (или группа *), побеждает самое длинное совпавшее правило, при равенстве побеждает Allow, * и $ работают как подстановочные знаки. Затем она сверяет страницы из вашего sitemap с этими правилами, по одному краулеру за раз.",
      },
      {
        q: "Почему robots.txt может закрывать страницы, которые я не собирался закрывать?",
        a: "Правила — это префиксы. Правило, написанное для одной страницы, например Disallow: /b, совпадает и с /blog, и с /business. Мы допустили ровно эту ошибку на itgrows.ai, и она десять недель закрывала наши руководства для всех краулеров, прежде чем мы её заметили.",
      },
      {
        q: "Мой robots.txt всё разрешает. Могут ли краулеры всё равно быть заблокированы?",
        a: "Да. Файрвол, CDN или защита от ботов могут отказать краулеру, даже если robots.txt его приглашает. Поэтому проверка также обращается к вашему серверу от имени GPTBot, ClaudeBot и PerplexityBot и показывает, что он ответил.",
      },
      {
        q: "Какие краулеры важны, чтобы вас называли в ответах ИИ?",
        a: "Те, что питают поиск и ответы в реальном времени: OAI-SearchBot и ChatGPT-User для ChatGPT, Bingbot — потому что поиск ChatGPT и Copilot опираются на Bing, Googlebot для Gemini и AI Overviews, PerplexityBot и краулеры Anthropic для Claude. GPTBot — краулер OpenAI для обучения моделей.",
      },
    ],
  },
})
