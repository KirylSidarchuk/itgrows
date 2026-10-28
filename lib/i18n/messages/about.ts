import { defineMessages } from "../messages"
import { ENTITY_ABOUT, ENTITY_ONE_LINER } from "@/lib/entity"

// app/about/page.tsx: metadata, the page's text and its structured data. English reads the shared
// description of ItGrows from lib/entity.ts, so /about says what every other page and schema says;
// the other languages carry their own copy of it (orgDescription and lead match orgDescription in
// home.ts). No plan price is named: under the price test (lib/geo-pricing.ts PRICE_TEST, since
// 28 Oct 2026) the price is shown only in the cabinet; the yearly discount comes in as an argument. The
// detailed report is free once an account is created (since 27 Oct 2026).
// Owner's decision, 26 Oct 2026: the title, the lead and the Organization describe ItGrows as AI
// visibility (GEO) only; the LinkedIn/X product keeps one short line of its own at the end (liLine).
// Tags are links: <link> the plan (or /personal in liLine), <sample> the sample report, <check> the
// quick check, <crawler> the crawler check, <guides> the guides.

type PlanVars = {
  /** The yearly discount, already formatted ("20%"). */
  yearOff: string
}

const en = {
  metaTitle: "About ItGrows: AI visibility for businesses",
  metaDescription:
    "ItGrows is an AI visibility (GEO) service for businesses: answer pages on your own website and a check of ChatGPT, Claude, Gemini and Perplexity every two weeks.",
  // Structured data (JSON-LD): the Organization's description
  orgDescription: ENTITY_ONE_LINER,

  h1: "About ItGrows: AI visibility for businesses",
  lead: ENTITY_ONE_LINER,
  paragraphs: ENTITY_ABOUT,

  offerTitle: "What we offer",
  plan: ({ yearOff }: PlanVars) =>
    `<link>The plan</link>: we do the work on your own website and measure four assistants every two weeks. By the month, plus a one-time setup that is free when you pay for 3 months or a year upfront (a year is ${yearOff} off). You see your price after your free report.`,
  report: "The detailed report, free for your site once you create an account: 20 buyer questions put to ChatGPT, Claude, Gemini and Perplexity, 3 times each, who is named instead of you, which sites they cite, and our plan for your site. <sample>See a real report</sample>.",
  checks:
    "<check>The quick check</check>: free, about 30 seconds; two answers right away, all five once you create an account. The <crawler>AI crawler check</crawler> shows which AI crawlers can read your site.",
  guides: "<guides>Guides</guides>: how AI assistants choose which businesses to name, and what a business can do about it.",

  resultsTitle: "Results",
  results:
    "As reported by our clients (October 2026): FreightSizer, a B2B SaaS, got 2 new B2B customers in one month, both from ChatGPT. MagiScan, an iOS app, gets hundreds of installs a month from ChatGPT, Claude and Gemini.",

  contactTitle: "Contact",
  liLine: (from: string) =>
    `Separately, for founders and experts: <link>LinkedIn and X post drafts</link> in their own voice, from ${from} a month.`,
}

export default defineMessages(en, {
  de: {
    metaTitle: "Über ItGrows: KI-Sichtbarkeit für Unternehmen",
    metaDescription:
      "ItGrows ist ein Dienst für KI-Sichtbarkeit (GEO): Antwortseiten auf Ihrer Website und alle zwei Wochen ein Check von ChatGPT, Claude, Gemini und Perplexity.",
    orgDescription:
      "ItGrows ist ein Dienst für KI-Sichtbarkeit (Generative Engine Optimization, GEO) für Unternehmen: Er veröffentlicht Antwortseiten auf der eigenen Website des Unternehmens, macht die Website für KI-Crawler und Suchindizes lesbar und prüft alle zwei Wochen, ob ChatGPT, Claude, Gemini und Perplexity das Unternehmen nennen.",

    h1: "Über ItGrows: KI-Sichtbarkeit für Unternehmen",
    lead:
      "ItGrows ist ein Dienst für KI-Sichtbarkeit (Generative Engine Optimization, GEO) für Unternehmen: Er veröffentlicht Antwortseiten auf der eigenen Website des Unternehmens, macht die Website für KI-Crawler und Suchindizes lesbar und prüft alle zwei Wochen, ob ChatGPT, Claude, Gemini und Perplexity das Unternehmen nennen.",
    paragraphs: [
      "ItGrows hilft einem Unternehmen, genannt zu werden, wenn seine Kunden einen KI-Assistenten fragen. Wir stellen ChatGPT, Claude, Gemini und Perplexity die Fragen, die diese Kunden stellen, jeweils mehrmals, und halten fest, wer genannt wird und welche Websites zitiert werden. Dann veröffentlichen wir auf der eigenen Domain des Unternehmens Seiten, die diese Fragen beantworten, beheben, was KI-Crawler und Suchindizes am Lesen der Website hindert, und messen alle zwei Wochen erneut.",
      "Niemand kann garantieren, dass ein Assistent ein bestimmtes Unternehmen nennt. Wir versprechen die Arbeit und eine ehrliche Zählung alle zwei Wochen.",
    ],

    offerTitle: "Was wir anbieten",
    plan: ({ yearOff }) =>
      `<link>Der Plan</link>: Wir erledigen die Arbeit auf Ihrer eigenen Website und messen alle zwei Wochen vier Assistenten. Monatlich, plus eine einmalige Einrichtung, die entfällt, wenn Sie 3 Monate oder ein Jahr im Voraus zahlen (ein Jahr mit ${yearOff} Rabatt). Ihren Preis sehen Sie nach Ihrem kostenlosen Bericht.`,
    report: "Der ausführliche Bericht, kostenlos für Ihre Website, sobald Sie ein Konto anlegen: 20 Kundenfragen an ChatGPT, Claude, Gemini und Perplexity, jede dreimal gestellt, wer statt Ihnen genannt wird, welche Websites zitiert werden, und unser Maßnahmenplan für Ihre Website. <sample>Einen echten Bericht ansehen</sample>.",
    checks:
      "<check>Der Schnellcheck</check>: kostenlos, etwa 30 Sekunden; zwei Antworten sofort, alle fünf, sobald Sie ein Konto anlegen. Der <crawler>KI-Crawler-Check</crawler> zeigt, welche KI-Crawler Ihre Website lesen können.",
    guides: "<guides>Ratgeber</guides>: wie KI-Assistenten entscheiden, welche Unternehmen sie nennen, und was ein Unternehmen dafür tun kann.",

    resultsTitle: "Ergebnisse",
    results:
      "Nach Angaben unserer Kunden (Oktober 2026): FreightSizer, ein B2B-SaaS, gewann in einem Monat 2 neue B2B-Kunden, beide über ChatGPT. MagiScan, eine iOS-App, erhält jeden Monat Hunderte Installationen über ChatGPT, Claude und Gemini.",

    contactTitle: "Kontakt",
    liLine: (from) =>
      `Separat, für Gründer und Experten: <link>Entwürfe für LinkedIn- und X-Posts</link> in ihrer eigenen Stimme, ab ${from} pro Monat.`,
  },

  fr: {
    metaTitle: "À propos d’ItGrows : la visibilité IA des entreprises",
    metaDescription:
      "ItGrows, service de visibilité dans l’IA (GEO) : des pages de réponse sur votre site et un contrôle de ChatGPT, Claude, Gemini et Perplexity toutes les deux semaines.",
    orgDescription:
      "ItGrows est un service de visibilité dans l’IA (generative engine optimization, GEO) pour les entreprises : il publie des pages de réponse sur le propre site de l’entreprise, rend le site lisible pour les robots d’IA et les index de recherche, et vérifie toutes les deux semaines si ChatGPT, Claude, Gemini et Perplexity mentionnent l’entreprise.",

    h1: "À propos d’ItGrows : la visibilité dans l’IA pour les entreprises",
    lead:
      "ItGrows est un service de visibilité dans l’IA (generative engine optimization, GEO) pour les entreprises : il publie des pages de réponse sur le propre site de l’entreprise, rend le site lisible pour les robots d’IA et les index de recherche, et vérifie toutes les deux semaines si ChatGPT, Claude, Gemini et Perplexity mentionnent l’entreprise.",
    paragraphs: [
      "ItGrows aide une entreprise à être mentionnée quand ses clients interrogent un assistant IA. Nous posons à ChatGPT, Claude, Gemini et Perplexity les questions que posent ces clients, plusieurs fois chacune, et nous relevons qui est mentionné et quels sites sont cités. Nous publions ensuite, sur le propre domaine de l’entreprise, des pages qui répondent à ces questions, nous corrigeons ce qui empêche les robots d’IA et les index de recherche de lire le site, et nous mesurons de nouveau toutes les deux semaines.",
      "Personne ne peut garantir qu’un assistant mentionnera une entreprise. Nous promettons le travail et un décompte honnête toutes les deux semaines.",
    ],

    offerTitle: "Ce que nous proposons",
    plan: ({ yearOff }) =>
      `<link>L’abonnement</link> : nous faisons le travail sur votre propre site et mesurons quatre assistants toutes les deux semaines. Au mois, plus une mise en place facturée une seule fois, offerte si vous payez 3 mois ou un an d’avance (l’année avec ${yearOff} de remise). Vous voyez votre prix après votre rapport gratuit.`,
    report: "Le rapport détaillé, gratuit pour votre site dès que vous créez un compte : 20 questions de clients posées à ChatGPT, Claude, Gemini et Perplexity, 3 fois chacune, qui est mentionné à votre place, quels sites sont cités, et notre plan d’action pour votre site. <sample>Voir un vrai rapport</sample>.",
    checks:
      "<check>La vérification rapide</check> : gratuite, environ 30 secondes ; deux réponses tout de suite, les cinq dès que vous créez un compte. Le <crawler>test des robots d’IA</crawler> montre quels robots d’IA peuvent lire votre site.",
    guides: "<guides>Guides</guides> : comment les assistants IA choisissent les entreprises qu’ils mentionnent, et ce qu’une entreprise peut faire.",

    resultsTitle: "Résultats",
    results:
      "Selon nos clients (octobre 2026) : FreightSizer, un SaaS B2B, a gagné 2 nouveaux clients B2B en un mois, tous deux venus de ChatGPT. MagiScan, une app iOS, reçoit chaque mois des centaines d’installations venues de ChatGPT, Claude et Gemini.",

    contactTitle: "Contact",
    liLine: (from) =>
      `Par ailleurs, pour les fondateurs et les experts : <link>des brouillons de posts LinkedIn et X</link> dans leur propre style, à partir de ${from} par mois.`,
  },

  es: {
    metaTitle: "Sobre ItGrows: visibilidad en IA para empresas",
    metaDescription:
      "ItGrows es un servicio de visibilidad en IA (GEO): páginas de respuesta en su sitio web y una comprobación de ChatGPT, Claude, Gemini y Perplexity cada dos semanas.",
    orgDescription:
      "ItGrows es un servicio de visibilidad en IA (generative engine optimization, GEO) para empresas: publica páginas de respuesta en el propio sitio web de la empresa, hace que el sitio sea legible para los rastreadores de IA y los índices de búsqueda, y comprueba cada dos semanas si ChatGPT, Claude, Gemini y Perplexity mencionan a la empresa.",

    h1: "Sobre ItGrows: visibilidad en IA para empresas",
    lead:
      "ItGrows es un servicio de visibilidad en IA (generative engine optimization, GEO) para empresas: publica páginas de respuesta en el propio sitio web de la empresa, hace que el sitio sea legible para los rastreadores de IA y los índices de búsqueda, y comprueba cada dos semanas si ChatGPT, Claude, Gemini y Perplexity mencionan a la empresa.",
    paragraphs: [
      "ItGrows ayuda a una empresa a que la mencionen cuando sus clientes preguntan a un asistente de IA. Planteamos a ChatGPT, Claude, Gemini y Perplexity las preguntas que hacen esos clientes, varias veces cada una, y registramos a quién mencionan y qué sitios citan. Después publicamos en el propio dominio de la empresa páginas que responden a esas preguntas, corregimos lo que impide a los rastreadores de IA y a los índices de búsqueda leer el sitio, y volvemos a medir cada dos semanas.",
      "Nadie puede garantizar que un asistente mencione a una empresa. Prometemos el trabajo y un recuento honesto cada dos semanas.",
    ],

    offerTitle: "Qué ofrecemos",
    plan: ({ yearOff }) =>
      `<link>El plan</link>: hacemos el trabajo en su propio sitio web y medimos cuatro asistentes cada dos semanas. Mensual, más una configuración inicial de pago único que no se cobra si paga 3 meses o un año por adelantado (el año con un ${yearOff} de descuento). Verá su precio después de su informe gratuito.`,
    report: "El informe detallado, gratuito para su sitio en cuanto cree una cuenta: 20 preguntas de clientes planteadas a ChatGPT, Claude, Gemini y Perplexity, 3 veces cada una, a quién mencionan en su lugar, qué sitios citan y nuestro plan de acción para su sitio. <sample>Ver un informe real</sample>.",
    checks:
      "<check>La comprobación rápida</check>: gratis, unos 30 segundos; dos respuestas al momento y las cinco en cuanto cree una cuenta. El <crawler>comprobador de rastreadores de IA</crawler> muestra qué rastreadores de IA pueden leer su sitio.",
    guides: "<guides>Guías</guides>: cómo eligen los asistentes de IA a qué empresas mencionar y qué puede hacer una empresa al respecto.",

    resultsTitle: "Resultados",
    results:
      "Según nuestros clientes (octubre de 2026): FreightSizer, un SaaS B2B, consiguió 2 clientes B2B nuevos en un mes, los dos desde ChatGPT. MagiScan, una app de iOS, recibe cada mes cientos de instalaciones desde ChatGPT, Claude y Gemini.",

    contactTitle: "Contacto",
    liLine: (from) =>
      `Aparte, para fundadores y expertos: <link>borradores de publicaciones de LinkedIn y X</link> con su propia voz, desde ${from} al mes.`,
  },

  ru: {
    metaTitle: "О компании ItGrows: видимость в ИИ для бизнеса",
    metaDescription:
      "ItGrows — сервис видимости в ИИ (GEO): страницы-ответы на вашем собственном сайте и проверка ChatGPT, Claude, Gemini и Perplexity раз в две недели.",
    orgDescription:
      "ItGrows — сервис видимости в ИИ (generative engine optimization, GEO) для бизнеса: публикует страницы-ответы на собственном сайте компании, делает сайт доступным для ИИ-краулеров и поисковых индексов и раз в две недели проверяет, называют ли компанию ChatGPT, Claude, Gemini и Perplexity.",

    h1: "О компании ItGrows: видимость в ИИ для бизнеса",
    lead:
      "ItGrows — сервис видимости в ИИ (generative engine optimization, GEO) для бизнеса: публикует страницы-ответы на собственном сайте компании, делает сайт доступным для ИИ-краулеров и поисковых индексов и раз в две недели проверяет, называют ли компанию ChatGPT, Claude, Gemini и Perplexity.",
    paragraphs: [
      "ItGrows помогает компании добиться того, чтобы её называли, когда её клиенты спрашивают ИИ-ассистента. Мы задаём ChatGPT, Claude, Gemini и Perplexity вопросы, которые задают эти клиенты, по нескольку раз каждый, и фиксируем, кого называют и какие сайты цитируют. Затем публикуем на собственном домене компании страницы, отвечающие на эти вопросы, устраняем то, что мешает ИИ-краулерам и поисковым индексам читать сайт, и раз в две недели измеряем снова.",
      "Никто не может гарантировать, что ассистент назовёт компанию. Мы обещаем работу и честный подсчёт раз в две недели.",
    ],

    offerTitle: "Что мы предлагаем",
    plan: ({ yearOff }) =>
      `<link>Подписка</link>: мы делаем работу на вашем собственном сайте и раз в две недели измеряем четыре ассистента. Помесячно, плюс разовая настройка, которая не взимается при оплате 3 месяцев или года вперёд (год — со скидкой ${yearOff}). Свою цену вы увидите после бесплатного отчёта.`,
    report: "Подробный отчёт — бесплатно для вашего сайта, достаточно создать аккаунт: 20 вопросов клиентов к ChatGPT, Claude, Gemini и Perplexity, по 3 раза каждый, кого называют вместо вас, какие сайты цитируют, и наш план действий для вашего сайта. <sample>Посмотреть настоящий отчёт</sample>.",
    checks:
      "<check>Быстрая проверка</check>: бесплатно, около 30 секунд; два ответа сразу, все пять — после создания аккаунта. <crawler>Проверка ИИ-краулеров</crawler> показывает, какие ИИ-краулеры могут читать ваш сайт.",
    guides: "<guides>Руководства</guides>: как ИИ-ассистенты выбирают, какие компании назвать, и что компания может для этого сделать.",

    resultsTitle: "Результаты",
    results:
      "По данным наших клиентов (октябрь 2026): FreightSizer, B2B SaaS, получил 2 новых B2B-клиента за один месяц, оба — из ChatGPT. MagiScan, iOS-приложение, получает сотни установок в месяц из ChatGPT, Claude и Gemini.",

    contactTitle: "Контакты",
    liLine: (from) =>
      `Отдельно, для основателей и экспертов: <link>черновики постов для LinkedIn и X</link> их собственным голосом, от ${from} в месяц.`,
  },
})
