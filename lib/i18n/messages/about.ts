import { defineMessages } from "../messages"
import { ENTITY_ABOUT, ENTITY_ONE_LINER } from "@/lib/entity"

// app/about/page.tsx: metadata, the page's text and its structured data. English reads the shared
// description of ItGrows from lib/entity.ts, so /about says what every other page and schema says;
// the other languages carry their own copy of it (orgDescription and lead match orgDescription in
// home.ts). The plan's prices and the yearly discount come in as arguments (lib/geo-pricing.ts
// geoPriceLabels: the one price, public again since the price test ended on 30 Oct 2026). The
// detailed report is free once an account is created (since 27 Oct 2026).
// Since 30 Oct 2026 (owner's decision) the client results are gone from /about, and the second paragraph
// is the growth guarantee's line and the link to its conditions (lib/entity.ts ENTITY_ABOUT[1]).
// Owner's decision, 26 Oct 2026: the title, the lead and the Organization describe ItGrows as AI
// visibility (GEO) only; the LinkedIn/X product keeps one short line of its own at the end (liLine).
// Tags are links: <link> the plan (or /personal in liLine), <sample> the sample report, <check> the
// quick check, <crawler> the crawler check, <guides> the guides.

type PlanVars = {
  /** The plan's prices, already formatted (lib/geo-pricing.ts geoPriceLabels). */
  month: string
  setup: string
  quarter: string
  year: string
  yearPerMonth: string
  /** The yearly discount, already formatted ("20%"). */
  yearOff: string
}

const en = {
  metaTitle: "About ItGrows: AI visibility for businesses",
  metaDescription:
    "ItGrows gets businesses named by ChatGPT, Claude, Gemini and Perplexity: AI visibility (GEO), done for you, with all four assistants re-asked every two weeks.",
  // Structured data (JSON-LD): the Organization's description
  orgDescription: ENTITY_ONE_LINER,

  h1: "About ItGrows: AI visibility for businesses",
  lead: ENTITY_ONE_LINER,
  paragraphs: ENTITY_ABOUT,

  offerTitle: "What we offer",
  plan: ({ month, setup, quarter, year, yearPerMonth, yearOff }: PlanVars) =>
    `<link>The plan</link>: we do the work that gets you named, on your own website and on the sites the assistants quote, and re-ask all four assistants every two weeks. ${month} a month plus a one-time ${setup} setup; the setup is free when you pay ${quarter} for 3 months or ${year} for a year (${yearPerMonth} a month, ${yearOff} off).`,
  report: "The detailed report, free for your site once you create an account: 20 buyer questions put to ChatGPT, Claude, Gemini and Perplexity, who is named instead of you, which sites they cite, and our plan to get you in. <sample>See a real report</sample>.",
  checks:
    "<check>The quick check</check>: free, about 30 seconds; two answers right away, all five once you create an account. The <crawler>AI crawler check</crawler> shows which AI crawlers can read your site.",
  guides: "<guides>Guides</guides>: how AI assistants choose which businesses to name, and what a business can do about it.",

  contactTitle: "Contact",
  liLine: (from: string) =>
    `Separately, for founders and experts: <link>LinkedIn and X post drafts</link> in their own voice, from ${from} a month.`,
}

export default defineMessages(en, {
  de: {
    metaTitle: "Über ItGrows: KI-Sichtbarkeit für Unternehmen",
    metaDescription:
      "ItGrows sorgt dafür, dass ChatGPT, Claude, Gemini und Perplexity Ihr Unternehmen nennen: KI-Sichtbarkeit (GEO), für Sie erledigt, alle vier Assistenten alle zwei Wochen erneut gefragt.",
    orgDescription:
      "ItGrows ist ein Dienst für KI-Sichtbarkeit (Generative Engine Optimization, GEO), der dafür sorgt, dass Unternehmen genannt werden, wenn ihre Kunden ChatGPT, Claude, Gemini und Perplexity fragen: Er veröffentlicht Antwortseiten auf der eigenen Website des Unternehmens, macht die Website für KI-Crawler und Suchindizes lesbar und stellt die Fragen der Kunden alle zwei Wochen erneut allen vier Assistenten.",

    h1: "Über ItGrows: KI-Sichtbarkeit für Unternehmen",
    lead:
      "ItGrows ist ein Dienst für KI-Sichtbarkeit (Generative Engine Optimization, GEO), der dafür sorgt, dass Unternehmen genannt werden, wenn ihre Kunden ChatGPT, Claude, Gemini und Perplexity fragen: Er veröffentlicht Antwortseiten auf der eigenen Website des Unternehmens, macht die Website für KI-Crawler und Suchindizes lesbar und stellt die Fragen der Kunden alle zwei Wochen erneut allen vier Assistenten.",
    paragraphs: [
      "ItGrows sorgt dafür, dass ein Unternehmen genannt wird, wenn seine Kunden einen KI-Assistenten fragen. Wir stellen ChatGPT, Claude, Gemini und Perplexity die Fragen, die diese Kunden stellen, jeweils mehrmals, und sehen, wer an seiner Stelle genannt wird und welche Websites zitiert werden. Dann erledigen wir die Arbeit: Wir öffnen die Website für KI-Crawler und Suchindizes, veröffentlichen auf der eigenen Domain des Unternehmens Seiten, die diese Fragen beantworten, und bereiten seine Profile auf den Websites vor, die die Assistenten zitieren. Alle zwei Wochen fragen wir erneut und legen überall nach, wo das Unternehmen noch fehlt.",
      "Jeder bezahlte Plan hat eine Wachstumsgarantie: In 90 Tagen nennen KI-Assistenten Sie öfter als am Starttag – oder wir arbeiten kostenlos (Bedingungen, auf Englisch: itgrows.ai/terms#growth-guarantee).",
    ],

    offerTitle: "Was wir anbieten",
    plan: ({ month, setup, quarter, year, yearPerMonth, yearOff }) =>
      `<link>Der Plan</link>: Wir erledigen die Arbeit, die Sie in die Antworten bringt, auf Ihrer eigenen Website und auf den Websites, die die Assistenten zitieren, und fragen alle zwei Wochen alle vier Assistenten erneut. ${month} pro Monat plus einmalig ${setup} für die Einrichtung; die Einrichtung entfällt, wenn Sie ${quarter} für 3 Monate oder ${year} für ein Jahr zahlen (${yearPerMonth} pro Monat, ${yearOff} Rabatt).`,
    report: "Der ausführliche Bericht, kostenlos für Ihre Website, sobald Sie ein Konto anlegen: 20 Kundenfragen an ChatGPT, Claude, Gemini und Perplexity, wer statt Ihnen genannt wird, welche Websites zitiert werden, und unser Maßnahmenplan, mit dem wir Sie in die Antworten bringen. <sample>Einen echten Bericht ansehen</sample>.",
    checks:
      "<check>Der Schnellcheck</check>: kostenlos, etwa 30 Sekunden; zwei Antworten sofort, alle fünf, sobald Sie ein Konto anlegen. Der <crawler>KI-Crawler-Check</crawler> zeigt, welche KI-Crawler Ihre Website lesen können.",
    guides: "<guides>Ratgeber</guides>: wie KI-Assistenten entscheiden, welche Unternehmen sie nennen, und was ein Unternehmen dafür tun kann.",

    contactTitle: "Kontakt",
    liLine: (from) =>
      `Separat, für Gründer und Experten: <link>Entwürfe für LinkedIn- und X-Posts</link> in ihrer eigenen Stimme, ab ${from} pro Monat.`,
  },

  fr: {
    metaTitle: "À propos d’ItGrows : la visibilité IA des entreprises",
    metaDescription:
      "ItGrows fait mentionner les entreprises par ChatGPT, Claude, Gemini et Perplexity : la visibilité dans l’IA (GEO) clés en main, les quatre assistants réinterrogés toutes les deux semaines.",
    orgDescription:
      "ItGrows est un service de visibilité dans l’IA (generative engine optimization, GEO) qui fait mentionner les entreprises quand leurs clients interrogent ChatGPT, Claude, Gemini et Perplexity : il publie des pages de réponse sur le propre site de l’entreprise, rend le site lisible pour les robots d’IA et les index de recherche, et repose les questions des clients aux quatre assistants toutes les deux semaines.",

    h1: "À propos d’ItGrows : la visibilité dans l’IA pour les entreprises",
    lead:
      "ItGrows est un service de visibilité dans l’IA (generative engine optimization, GEO) qui fait mentionner les entreprises quand leurs clients interrogent ChatGPT, Claude, Gemini et Perplexity : il publie des pages de réponse sur le propre site de l’entreprise, rend le site lisible pour les robots d’IA et les index de recherche, et repose les questions des clients aux quatre assistants toutes les deux semaines.",
    paragraphs: [
      "ItGrows fait mentionner une entreprise quand ses clients interrogent un assistant IA. Nous posons à ChatGPT, Claude, Gemini et Perplexity les questions que posent ces clients, plusieurs fois chacune, et voyons qui est mentionné à sa place et quels sites sont cités. Puis nous faisons le travail : nous ouvrons le site aux robots d’IA et aux index de recherche, publions sur le propre domaine de l’entreprise des pages qui répondent à ces questions, et préparons ses profils sur les sites que citent les assistants. Toutes les deux semaines, nous reposons les questions et poussons partout où l’entreprise manque encore.",
      "Chaque abonnement payant est assorti d’une garantie de croissance : dans 90 jours, les assistants IA vous mentionneront plus souvent qu’au lancement, ou nous travaillons gratuitement (conditions, en anglais : itgrows.ai/terms#growth-guarantee).",
    ],

    offerTitle: "Ce que nous proposons",
    plan: ({ month, setup, quarter, year, yearPerMonth, yearOff }) =>
      `<link>L’abonnement</link> : nous faisons le travail qui vous fait mentionner, sur votre propre site et sur les sites que citent les assistants, et réinterrogeons les quatre assistants toutes les deux semaines. ${month} par mois plus une mise en place de ${setup}, une seule fois ; la mise en place n’est pas facturée si vous payez ${quarter} pour 3 mois ou ${year} pour un an (${yearPerMonth} par mois, ${yearOff} de remise).`,
    report: "Le rapport détaillé, gratuit pour votre site dès que vous créez un compte : 20 questions de clients posées à ChatGPT, Claude, Gemini et Perplexity, qui est mentionné à votre place, quels sites sont cités, et notre plan d’action pour vous faire entrer dans les réponses. <sample>Voir un vrai rapport</sample>.",
    checks:
      "<check>La vérification rapide</check> : gratuite, environ 30 secondes ; deux réponses tout de suite, les cinq dès que vous créez un compte. Le <crawler>test des robots d’IA</crawler> montre quels robots d’IA peuvent lire votre site.",
    guides: "<guides>Guides</guides> : comment les assistants IA choisissent les entreprises qu’ils mentionnent, et ce qu’une entreprise peut faire.",

    contactTitle: "Contact",
    liLine: (from) =>
      `Par ailleurs, pour les fondateurs et les experts : <link>des brouillons de posts LinkedIn et X</link> dans leur propre style, à partir de ${from} par mois.`,
  },

  es: {
    metaTitle: "Sobre ItGrows: visibilidad en IA para empresas",
    metaDescription:
      "ItGrows consigue que ChatGPT, Claude, Gemini y Perplexity mencionen a su empresa: visibilidad en IA (GEO) hecha por nosotros, con los cuatro asistentes consultados de nuevo cada dos semanas.",
    orgDescription:
      "ItGrows es un servicio de visibilidad en IA (generative engine optimization, GEO) que consigue que mencionen a las empresas cuando sus clientes preguntan a ChatGPT, Claude, Gemini y Perplexity: publica páginas de respuesta en el propio sitio web de la empresa, hace que el sitio sea legible para los rastreadores de IA y los índices de búsqueda, y vuelve a plantear las preguntas de los clientes a los cuatro asistentes cada dos semanas.",

    h1: "Sobre ItGrows: visibilidad en IA para empresas",
    lead:
      "ItGrows es un servicio de visibilidad en IA (generative engine optimization, GEO) que consigue que mencionen a las empresas cuando sus clientes preguntan a ChatGPT, Claude, Gemini y Perplexity: publica páginas de respuesta en el propio sitio web de la empresa, hace que el sitio sea legible para los rastreadores de IA y los índices de búsqueda, y vuelve a plantear las preguntas de los clientes a los cuatro asistentes cada dos semanas.",
    paragraphs: [
      "ItGrows consigue que mencionen a una empresa cuando sus clientes preguntan a un asistente de IA. Planteamos a ChatGPT, Claude, Gemini y Perplexity las preguntas que hacen esos clientes, varias veces cada una, y vemos a quién mencionan en su lugar y qué sitios citan. Después hacemos el trabajo: abrimos el sitio a los rastreadores de IA y a los índices de búsqueda, publicamos en el propio dominio de la empresa páginas que responden a esas preguntas y preparamos sus perfiles en los sitios que citan los asistentes. Cada dos semanas volvemos a preguntar y empujamos allí donde la empresa aún no aparece.",
      "Cada plan de pago incluye una garantía de crecimiento: en 90 días, los asistentes de IA le mencionarán más veces que el día del lanzamiento, o trabajamos gratis (condiciones, en inglés: itgrows.ai/terms#growth-guarantee).",
    ],

    offerTitle: "Qué ofrecemos",
    plan: ({ month, setup, quarter, year, yearPerMonth, yearOff }) =>
      `<link>El plan</link>: hacemos el trabajo que consigue que le mencionen, en su propio sitio web y en los sitios que citan los asistentes, y volvemos a preguntar a los cuatro asistentes cada dos semanas. ${month} al mes más una configuración inicial de ${setup}, pago único; la configuración no se cobra si paga ${quarter} por 3 meses o ${year} por un año (${yearPerMonth} al mes, ${yearOff} de descuento).`,
    report: "El informe detallado, gratuito para su sitio en cuanto cree una cuenta: 20 preguntas de clientes planteadas a ChatGPT, Claude, Gemini y Perplexity, a quién mencionan en su lugar, qué sitios citan y nuestro plan de acción para que le mencionen. <sample>Ver un informe real</sample>.",
    checks:
      "<check>La comprobación rápida</check>: gratis, unos 30 segundos; dos respuestas al momento y las cinco en cuanto cree una cuenta. El <crawler>comprobador de rastreadores de IA</crawler> muestra qué rastreadores de IA pueden leer su sitio.",
    guides: "<guides>Guías</guides>: cómo eligen los asistentes de IA a qué empresas mencionar y qué puede hacer una empresa al respecto.",

    contactTitle: "Contacto",
    liLine: (from) =>
      `Aparte, para fundadores y expertos: <link>borradores de publicaciones de LinkedIn y X</link> con su propia voz, desde ${from} al mes.`,
  },

  ru: {
    metaTitle: "О компании ItGrows: видимость в ИИ для бизнеса",
    metaDescription:
      "ItGrows добивается, чтобы ChatGPT, Claude, Gemini и Perplexity называли ваш бизнес: видимость в ИИ (GEO) под ключ, все четыре ассистента опрашиваются заново раз в две недели.",
    orgDescription:
      "ItGrows — сервис видимости в ИИ (generative engine optimization, GEO), который добивается, чтобы бизнес называли, когда его клиенты спрашивают ChatGPT, Claude, Gemini и Perplexity: публикует страницы-ответы на собственном сайте компании, делает сайт доступным для ИИ-краулеров и поисковых индексов и раз в две недели заново задаёт вопросы клиентов всем четырём ассистентам.",

    h1: "О компании ItGrows: видимость в ИИ для бизнеса",
    lead:
      "ItGrows — сервис видимости в ИИ (generative engine optimization, GEO), который добивается, чтобы бизнес называли, когда его клиенты спрашивают ChatGPT, Claude, Gemini и Perplexity: публикует страницы-ответы на собственном сайте компании, делает сайт доступным для ИИ-краулеров и поисковых индексов и раз в две недели заново задаёт вопросы клиентов всем четырём ассистентам.",
    paragraphs: [
      "ItGrows добивается, чтобы компанию называли, когда её клиенты спрашивают ИИ-ассистента. Мы задаём ChatGPT, Claude, Gemini и Perplexity вопросы, которые задают эти клиенты, по нескольку раз каждый, и видим, кого называют вместо неё и какие сайты цитируют. Затем делаем работу: открываем сайт для ИИ-краулеров и поисковых индексов, публикуем на собственном домене компании страницы, отвечающие на эти вопросы, и готовим её профили на сайтах, которые цитируют ассистенты. Раз в две недели спрашиваем снова и дожимаем везде, где компании ещё нет.",
      "Каждая платная подписка идёт с гарантией роста: через 90 дней ИИ-ассистенты будут называть вас чаще, чем в день запуска, — или мы работаем бесплатно (условия, на английском: itgrows.ai/terms#growth-guarantee).",
    ],

    offerTitle: "Что мы предлагаем",
    plan: ({ month, setup, quarter, year, yearPerMonth, yearOff }) =>
      `<link>Подписка</link>: мы делаем работу, благодаря которой вас называют, — на вашем собственном сайте и на сайтах, которые цитируют ассистенты, — и раз в две недели заново опрашиваем все четыре ассистента. ${month} в месяц плюс разовая настройка за ${setup}; настройка не взимается, если вы платите ${quarter} за 3 месяца или ${year} за год (${yearPerMonth} в месяц, скидка ${yearOff}).`,
    report: "Подробный отчёт — бесплатно для вашего сайта, достаточно создать аккаунт: 20 вопросов клиентов к ChatGPT, Claude, Gemini и Perplexity, кого называют вместо вас, какие сайты цитируют, и наш план действий, чтобы называли вас. <sample>Посмотреть настоящий отчёт</sample>.",
    checks:
      "<check>Быстрая проверка</check>: бесплатно, около 30 секунд; два ответа сразу, все пять — после создания аккаунта. <crawler>Проверка ИИ-краулеров</crawler> показывает, какие ИИ-краулеры могут читать ваш сайт.",
    guides: "<guides>Руководства</guides>: как ИИ-ассистенты выбирают, какие компании назвать, и что компания может для этого сделать.",

    contactTitle: "Контакты",
    liLine: (from) =>
      `Отдельно, для основателей и экспертов: <link>черновики постов для LinkedIn и X</link> их собственным голосом, от ${from} в месяц.`,
  },
})
