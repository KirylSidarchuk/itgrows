import { defineMessages } from "../messages"

// app/_home/Cases.tsx: real results on "/" (Kiryl, 26 Nov 2026: "у нас же есть реальные кейсы и графики, можно
// показывать названия и давать ссылки, кроме ortho gronau — их просто назвать ортопедическая практика";
// "используй самые громкие цифры и проценты роста"). Every number comes from the GEO Results Update of
// 25 Nov 2026: Google Search Console and Bing Webmaster Tools to 23 Nov 2026, our own count of 80 answers.
// Numbers come in as arguments, already written the language's way (Cases.tsx); nothing here is a number
// except dates and "80".

const en = {
  h2: "Real results. Real sites.",
  lead: (after: string, before: string, pct: string) =>
    `On the 4 sites with a full comparison window, Google showed their pages in AI answers ${after} times in the last 28 days, up from ${before} in the 28 days before: ${pct}.`,
  client: "Client",
  own: "Our product",
  before: "before",
  now: "now",
  ortho: {
    name: "Orthopaedic practice, Bonn",
    caption: "Google AI-answer impressions, 28 days",
    l1: (a: string, b: string, pct: string) => `Clicks from Google: ${a} → ${b} (${pct})`,
    l2: "First article on 29 October",
  },
  firma: {
    name: "Company formation abroad",
    caption: "Answers that name the firm, of 80",
    l1: (n: string) => `${n} citations in Microsoft Copilot since 26 October`,
    l2: (pct: string, n: string) => `Google AI-answer impressions ${pct} (${n} in 28 days)`,
  },
  magiscan: {
    name: "MagiScan, 3D scanner app",
    caption: "Answers that name the app, of 80",
    l1: (pct: string, n: string) => `Google AI-answer impressions ${pct} (${n} in 28 days)`,
    l2: (n: string) => `${n} citations in Microsoft Copilot since 19 October`,
  },
  appslift: {
    name: "AppsLift, app store optimisation",
    caption: "Google AI-answer impressions in 28 days, against the 28 days before",
    l1: (n: string) => `${n} citations in Microsoft Copilot since 19 October`,
    l2: (n: string) => `${n} AI-answer impressions in 28 days`,
  },
  freight: {
    name: "FreightSizer, freight calculator",
    caption: "new B2B customers in one month, both from ChatGPT",
    l1: (a: string, b: string) => `Answers that name it: ${a} → ${b} of 80`,
    l2: (n: string) => `${n} citations in Microsoft Copilot since 19 October`,
  },
  note:
    "Google Search Console and Bing Webmaster Tools, data to 23 November 2026. “Answers that name” is our own count: 20 buyer questions to ChatGPT, Claude, Gemini and Perplexity, 80 answers, same questions every time. MagiScan, AppsLift and FreightSizer are our own products. The orthopaedic practice is shown without its name. Rising numbers follow the start of our work; search demand and Google’s own changes also move them.",
}

export default defineMessages(en, {
  de: {
    h2: "Echte Ergebnisse. Echte Websites.",
    lead: (after, before, pct) =>
      `Auf den 4 Websites mit vollem Vergleichszeitraum zeigte Google ihre Seiten in den letzten 28 Tagen ${after}-mal in KI-Antworten, nach ${before} in den 28 Tagen davor: ${pct}.`,
    client: "Kunde",
    own: "Eigenes Produkt",
    before: "vorher",
    now: "jetzt",
    ortho: {
      name: "Orthopädische Praxis, Bonn",
      caption: "Einblendungen in Googles KI-Antworten, 28 Tage",
      l1: (a, b, pct) => `Klicks aus Google: ${a} → ${b} (${pct})`,
      l2: "Erster Artikel am 29. Oktober",
    },
    firma: {
      name: "Firmengründung im Ausland",
      caption: "Antworten, die die Firma nennen, von 80",
      l1: (n) => `${n} Zitate in Microsoft Copilot seit dem 26. Oktober`,
      l2: (pct, n) => `Einblendungen in Googles KI-Antworten ${pct} (${n} in 28 Tagen)`,
    },
    magiscan: {
      name: "MagiScan, 3D-Scanner-App",
      caption: "Antworten, die die App nennen, von 80",
      l1: (pct, n) => `Einblendungen in Googles KI-Antworten ${pct} (${n} in 28 Tagen)`,
      l2: (n) => `${n} Zitate in Microsoft Copilot seit dem 19. Oktober`,
    },
    appslift: {
      name: "AppsLift, App-Store-Optimierung",
      caption: "Einblendungen in Googles KI-Antworten in 28 Tagen, gegenüber den 28 Tagen davor",
      l1: (n) => `${n} Zitate in Microsoft Copilot seit dem 19. Oktober`,
      l2: (n) => `${n} Einblendungen in KI-Antworten in 28 Tagen`,
    },
    freight: {
      name: "FreightSizer, Frachtrechner",
      caption: "neue B2B-Kunden in einem Monat, beide über ChatGPT",
      l1: (a, b) => `Antworten, die es nennen: ${a} → ${b} von 80`,
      l2: (n) => `${n} Zitate in Microsoft Copilot seit dem 19. Oktober`,
    },
    note:
      "Google Search Console und Bing Webmaster Tools, Daten bis 23. November 2026. „Antworten, die nennen“ ist unsere eigene Zählung: 20 Kundenfragen an ChatGPT, Claude, Gemini und Perplexity, 80 Antworten, jedes Mal dieselben Fragen. MagiScan, AppsLift und FreightSizer sind unsere eigenen Produkte. Die orthopädische Praxis zeigen wir ohne Namen. Steigende Zahlen folgen dem Beginn unserer Arbeit; auch Suchnachfrage und Änderungen bei Google bewegen sie.",
  },
  fr: {
    h2: "De vrais résultats. De vrais sites.",
    lead: (after, before, pct) =>
      `Sur les 4 sites qui ont une période de comparaison complète, Google a montré leurs pages dans des réponses IA ${after} fois en 28 jours, contre ${before} sur les 28 jours précédents : ${pct}.`,
    client: "Client",
    own: "Notre produit",
    before: "avant",
    now: "maintenant",
    ortho: {
      name: "Cabinet d'orthopédie, Bonn",
      caption: "Affichages dans les réponses IA de Google, 28 jours",
      l1: (a, b, pct) => `Clics depuis Google : ${a} → ${b} (${pct})`,
      l2: "Premier article le 29 octobre",
    },
    firma: {
      name: "Création d'entreprise à l'étranger",
      caption: "Réponses qui citent le cabinet, sur 80",
      l1: (n) => `${n} citations dans Microsoft Copilot depuis le 26 octobre`,
      l2: (pct, n) => `Affichages dans les réponses IA de Google ${pct} (${n} en 28 jours)`,
    },
    magiscan: {
      name: "MagiScan, application de scan 3D",
      caption: "Réponses qui citent l'application, sur 80",
      l1: (pct, n) => `Affichages dans les réponses IA de Google ${pct} (${n} en 28 jours)`,
      l2: (n) => `${n} citations dans Microsoft Copilot depuis le 19 octobre`,
    },
    appslift: {
      name: "AppsLift, optimisation pour les app stores",
      caption: "Affichages dans les réponses IA de Google en 28 jours, par rapport aux 28 jours précédents",
      l1: (n) => `${n} citations dans Microsoft Copilot depuis le 19 octobre`,
      l2: (n) => `${n} affichages dans des réponses IA en 28 jours`,
    },
    freight: {
      name: "FreightSizer, calculateur de fret",
      caption: "nouveaux clients B2B en un mois, tous deux venus de ChatGPT",
      l1: (a, b) => `Réponses qui le citent : ${a} → ${b} sur 80`,
      l2: (n) => `${n} citations dans Microsoft Copilot depuis le 19 octobre`,
    },
    note:
      "Google Search Console et Bing Webmaster Tools, données au 23 novembre 2026. « Réponses qui citent » est notre propre décompte : 20 questions de clients posées à ChatGPT, Claude, Gemini et Perplexity, 80 réponses, les mêmes questions à chaque fois. MagiScan, AppsLift et FreightSizer sont nos propres produits. Le cabinet d'orthopédie est présenté sans son nom. Les hausses suivent le début de notre travail ; la demande de recherche et les changements de Google les font aussi bouger.",
  },
  es: {
    h2: "Resultados reales. Sitios reales.",
    lead: (after, before, pct) =>
      `En los 4 sitios con un periodo de comparación completo, Google mostró sus páginas en respuestas de IA ${after} veces en los últimos 28 días, frente a ${before} en los 28 días anteriores: ${pct}.`,
    client: "Cliente",
    own: "Producto propio",
    before: "antes",
    now: "ahora",
    ortho: {
      name: "Consulta de ortopedia, Bonn",
      caption: "Impresiones en respuestas de IA de Google, 28 días",
      l1: (a, b, pct) => `Clics desde Google: ${a} → ${b} (${pct})`,
      l2: "Primer artículo el 29 de octubre",
    },
    firma: {
      name: "Constitución de empresas en el extranjero",
      caption: "Respuestas que nombran a la firma, de 80",
      l1: (n) => `${n} citas en Microsoft Copilot desde el 26 de octubre`,
      l2: (pct, n) => `Impresiones en respuestas de IA de Google ${pct} (${n} en 28 días)`,
    },
    magiscan: {
      name: "MagiScan, app de escaneo 3D",
      caption: "Respuestas que nombran la app, de 80",
      l1: (pct, n) => `Impresiones en respuestas de IA de Google ${pct} (${n} en 28 días)`,
      l2: (n) => `${n} citas en Microsoft Copilot desde el 19 de octubre`,
    },
    appslift: {
      name: "AppsLift, optimización para tiendas de apps",
      caption: "Impresiones en respuestas de IA de Google en 28 días, frente a los 28 días anteriores",
      l1: (n) => `${n} citas en Microsoft Copilot desde el 19 de octubre`,
      l2: (n) => `${n} impresiones en respuestas de IA en 28 días`,
    },
    freight: {
      name: "FreightSizer, calculadora de fletes",
      caption: "nuevos clientes B2B en un mes, ambos desde ChatGPT",
      l1: (a, b) => `Respuestas que lo nombran: ${a} → ${b} de 80`,
      l2: (n) => `${n} citas en Microsoft Copilot desde el 19 de octubre`,
    },
    note:
      "Google Search Console y Bing Webmaster Tools, datos hasta el 23 de noviembre de 2026. «Respuestas que nombran» es nuestro propio recuento: 20 preguntas de clientes a ChatGPT, Claude, Gemini y Perplexity, 80 respuestas, siempre las mismas preguntas. MagiScan, AppsLift y FreightSizer son productos propios. La consulta de ortopedia se muestra sin su nombre. Las subidas siguen al inicio de nuestro trabajo; la demanda de búsqueda y los cambios de Google también las mueven.",
  },
  ru: {
    h2: "Реальные результаты. Реальные сайты.",
    lead: (after, before, pct) =>
      `На 4 сайтах с полным периодом сравнения Google показал их страницы в ответах ИИ ${after} раз за последние 28 дней против ${before} за 28 дней до этого: ${pct}.`,
    client: "Клиент",
    own: "Наш продукт",
    before: "было",
    now: "стало",
    ortho: {
      name: "Ортопедическая практика, Бонн",
      caption: "Показы в ИИ-ответах Google за 28 дней",
      l1: (a, b, pct) => `Переходы из Google: ${a} → ${b} (${pct})`,
      l2: "Первая статья 29 октября",
    },
    firma: {
      name: "Регистрация компаний за рубежом",
      caption: "Ответы, где названа фирма, из 80",
      l1: (n) => `${n} цитирований в Microsoft Copilot с 26 октября`,
      l2: (pct, n) => `Показы в ИИ-ответах Google ${pct} (${n} за 28 дней)`,
    },
    magiscan: {
      name: "MagiScan, приложение для 3D-сканирования",
      caption: "Ответы, где названо приложение, из 80",
      l1: (pct, n) => `Показы в ИИ-ответах Google ${pct} (${n} за 28 дней)`,
      l2: (n) => `${n} цитирований в Microsoft Copilot с 19 октября`,
    },
    appslift: {
      name: "AppsLift, оптимизация в магазинах приложений",
      caption: "Показы в ИИ-ответах Google за 28 дней против 28 дней до этого",
      l1: (n) => `${n} цитирований в Microsoft Copilot с 19 октября`,
      l2: (n) => `${n} показов в ИИ-ответах за 28 дней`,
    },
    freight: {
      name: "FreightSizer, калькулятор грузов",
      caption: "новых B2B-клиента за месяц, оба из ChatGPT",
      l1: (a, b) => `Ответы, где он назван: ${a} → ${b} из 80`,
      l2: (n) => `${n} цитирований в Microsoft Copilot с 19 октября`,
    },
    note:
      "Google Search Console и Bing Webmaster Tools, данные по 23 ноября 2026. «Ответы, где назван» — наш собственный подсчёт: 20 вопросов покупателей к ChatGPT, Claude, Gemini и Perplexity, 80 ответов, каждый раз одни и те же вопросы. MagiScan, AppsLift и FreightSizer — наши собственные продукты. Ортопедическую практику показываем без названия. Рост следует за началом нашей работы; на эти цифры влияют и спрос в поиске, и изменения у самого Google.",
  },
})
