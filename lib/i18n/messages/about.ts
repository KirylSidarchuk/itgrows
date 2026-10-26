import { defineMessages } from "../messages"
import { ENTITY_ABOUT, ENTITY_ONE_LINER } from "@/lib/entity"

// app/about/page.tsx: metadata, the page's text and its structured data. English reads the shared
// description of ItGrows from lib/entity.ts, so /about says what every other page and schema says;
// the other languages carry their own copy of it (orgDescription and the first paragraph match
// the translations in home.ts). Prices come in as arguments.

const en = {
  metaTitle: "About ItGrows: AI visibility and LinkedIn ghostwriting",
  metaDescription:
    "What ItGrows does: makes companies visible in AI answers, and drafts LinkedIn and X posts for founders and experts.",
  // Structured data (JSON-LD): the Organization's description
  orgDescription: ENTITY_ONE_LINER,

  h1: "About ItGrows",
  paragraphs: ENTITY_ABOUT,
  productsTitle: "Products",
  geoProduct: (month: string, setup: string, report: string) =>
    `<link>AI visibility for businesses</link> — answer pages, crawler fixes, a weekly check of four assistants. ${month} a month plus a one-time ${setup} setup (free with 3 months or a year); the detailed report ${report}; a free 30-second check: two answers right away, all five once you create an account.`,
  liProduct: (from: string) =>
    `<link>LinkedIn & X posts</link> — drafts in your own voice, published after your approval. From ${from} a month.`,
  contactTitle: "Contact",
}

export default defineMessages(en, {
  de: {
    metaTitle: "Über ItGrows: KI-Sichtbarkeit und LinkedIn-Ghostwriting",
    metaDescription:
      "Was ItGrows macht: Unternehmen in KI-Antworten sichtbar machen und LinkedIn- und X-Posts für Gründer und Experten entwerfen.",
    orgDescription:
      "ItGrows macht Unternehmen in KI-Antworten sichtbar: Antwortseiten auf der eigenen Domain, Korrekturen für KI-Crawler und Suchindizes und ein wöchentlicher Check von ChatGPT, Claude, Gemini und Perplexity. Außerdem entwirft ItGrows LinkedIn- und X-Posts für Gründer und Experten.",

    h1: "Über ItGrows",
    paragraphs: [
      "ItGrows hilft einem Unternehmen, genannt zu werden, wenn seine Kunden einen KI-Assistenten fragen. Wir stellen ChatGPT, Claude, Gemini und Perplexity die Fragen, die diese Kunden stellen, jeweils mehrmals, und halten fest, wer genannt wird und welche Websites zitiert werden. Dann veröffentlichen wir auf der eigenen Domain des Unternehmens Seiten, die diese Fragen beantworten, beheben, was KI-Crawler und Suchindizes am Lesen der Website hindert, und messen jede Woche erneut.",
      "Unser zweites Produkt entwirft LinkedIn- und X-Posts in der eigenen Stimme von Gründern und Experten und veröffentlicht sie nach deren Freigabe.",
      "Niemand kann garantieren, dass ein Assistent ein bestimmtes Unternehmen nennt. Wir versprechen die Arbeit und eine ehrliche wöchentliche Zählung.",
    ],
    productsTitle: "Produkte",
    geoProduct: (month, setup, report) =>
      `<link>KI-Sichtbarkeit für Unternehmen</link> — Antwortseiten, Korrekturen für Crawler, ein wöchentlicher Check von vier Assistenten. ${month} pro Monat plus einmalig ${setup} für die Einrichtung (entfällt bei Vorauszahlung von 3 Monaten oder einem Jahr); der ausführliche Bericht ${report}; ein kostenloser 30-Sekunden-Check: zwei Antworten sofort, alle fünf, sobald Sie ein Konto anlegen.`,
    liProduct: (from) =>
      `<link>LinkedIn- & X-Posts</link> — Entwürfe in Ihrer eigenen Stimme, veröffentlicht nach Ihrer Freigabe. Ab ${from} pro Monat.`,
    contactTitle: "Kontakt",
  },

  fr: {
    metaTitle: "À propos d’ItGrows : visibilité dans l’IA et ghostwriting LinkedIn",
    metaDescription:
      "Ce que fait ItGrows : rendre les entreprises visibles dans les réponses de l’IA, et rédiger des posts LinkedIn et X pour les fondateurs et les experts.",
    orgDescription:
      "ItGrows rend les entreprises visibles dans les réponses de l’IA : des pages de réponse sur leur propre domaine, des corrections pour les robots d’IA et les index de recherche, et une vérification hebdomadaire de ChatGPT, Claude, Gemini et Perplexity. ItGrows rédige aussi des posts LinkedIn et X pour les fondateurs et les experts.",

    h1: "À propos d’ItGrows",
    paragraphs: [
      "ItGrows aide une entreprise à être mentionnée quand ses clients interrogent un assistant IA. Nous posons à ChatGPT, Claude, Gemini et Perplexity les questions que posent ces clients, plusieurs fois chacune, et nous relevons qui est mentionné et quels sites sont cités. Nous publions ensuite, sur le propre domaine de l’entreprise, des pages qui répondent à ces questions, nous corrigeons ce qui empêche les robots d’IA et les index de recherche de lire le site, et nous mesurons de nouveau chaque semaine.",
      "Notre second produit rédige des posts LinkedIn et X dans le style propre d’un fondateur ou d’un expert, et les publie après validation.",
      "Personne ne peut garantir qu’un assistant mentionnera une entreprise. Nous promettons le travail et un décompte hebdomadaire honnête.",
    ],
    productsTitle: "Produits",
    geoProduct: (month, setup, report) =>
      `<link>Visibilité dans l’IA pour les entreprises</link> — pages de réponse, corrections pour les robots, vérification hebdomadaire de quatre assistants. ${month} par mois plus une mise en place de ${setup}, une seule fois (non facturée si vous payez 3 mois ou un an d’avance) ; le rapport détaillé ${report} ; une vérification gratuite de 30 secondes : deux réponses tout de suite, les cinq dès que vous créez un compte.`,
    liProduct: (from) =>
      `<link>Posts LinkedIn et X</link> — des brouillons rédigés dans votre style, publiés après votre validation. À partir de ${from} par mois.`,
    contactTitle: "Contact",
  },

  es: {
    metaTitle: "Sobre ItGrows: visibilidad en IA y ghostwriting para LinkedIn",
    metaDescription:
      "Qué hace ItGrows: hace visibles a las empresas en las respuestas de la IA y redacta publicaciones de LinkedIn y X para fundadores y expertos.",
    orgDescription:
      "ItGrows hace visibles a las empresas en las respuestas de la IA: páginas de respuesta en su propio dominio, correcciones para rastreadores de IA e índices de búsqueda, y una comprobación semanal de ChatGPT, Claude, Gemini y Perplexity. También redacta publicaciones de LinkedIn y X para fundadores y expertos.",

    h1: "Sobre ItGrows",
    paragraphs: [
      "ItGrows ayuda a una empresa a que la mencionen cuando sus clientes preguntan a un asistente de IA. Planteamos a ChatGPT, Claude, Gemini y Perplexity las preguntas que hacen esos clientes, varias veces cada una, y registramos a quién mencionan y qué sitios citan. Después publicamos en el propio dominio de la empresa páginas que responden a esas preguntas, corregimos lo que impide a los rastreadores de IA y a los índices de búsqueda leer el sitio, y volvemos a medir cada semana.",
      "Nuestro segundo producto redacta publicaciones de LinkedIn y X con la propia voz de un fundador o experto y las publica tras su aprobación.",
      "Nadie puede garantizar que un asistente mencione a una empresa. Prometemos el trabajo y un recuento semanal honesto.",
    ],
    productsTitle: "Productos",
    geoProduct: (month, setup, report) =>
      `<link>Visibilidad en IA para empresas</link> — páginas de respuesta, correcciones para rastreadores y una comprobación semanal de cuatro asistentes. ${month} al mes más una configuración inicial de ${setup} (pago único; no se cobra si paga 3 meses o un año por adelantado); el informe detallado, ${report}; una comprobación gratuita de 30 segundos: dos respuestas al momento y las cinco, en cuanto cree una cuenta.`,
    liProduct: (from) =>
      `<link>Publicaciones de LinkedIn y X</link> — borradores con su propia voz, publicados tras su aprobación. Desde ${from} al mes.`,
    contactTitle: "Contacto",
  },

  ru: {
    metaTitle: "О компании ItGrows: видимость в ИИ и гострайтинг для LinkedIn",
    metaDescription:
      "Чем занимается ItGrows: делает компании видимыми в ответах ИИ и пишет черновики постов в LinkedIn и X для основателей и экспертов.",
    orgDescription:
      "ItGrows делает компании видимыми в ответах ИИ: страницы-ответы на их собственном домене, исправления для ИИ-краулеров и поисковых индексов и еженедельная проверка ChatGPT, Claude, Gemini и Perplexity. Также ItGrows пишет черновики постов в LinkedIn и X для основателей и экспертов.",

    h1: "О компании ItGrows",
    paragraphs: [
      "ItGrows помогает компании добиться того, чтобы её называли, когда её клиенты спрашивают ИИ-ассистента. Мы задаём ChatGPT, Claude, Gemini и Perplexity вопросы, которые задают эти клиенты, по нескольку раз каждый, и фиксируем, кого называют и какие сайты цитируют. Затем публикуем на собственном домене компании страницы, отвечающие на эти вопросы, устраняем то, что мешает ИИ-краулерам и поисковым индексам читать сайт, и каждую неделю измеряем снова.",
      "Второй наш продукт пишет черновики постов в LinkedIn и X голосом самого основателя или эксперта и публикует их после одобрения.",
      "Никто не может гарантировать, что ассистент назовёт компанию. Мы обещаем работу и честный еженедельный подсчёт.",
    ],
    productsTitle: "Продукты",
    geoProduct: (month, setup, report) =>
      `<link>Видимость в ИИ для бизнеса</link> — страницы-ответы, исправления для краулеров, еженедельная проверка четырёх ассистентов. ${month} в месяц плюс разовая настройка за ${setup} (не взимается при оплате 3 месяцев или года); подробный отчёт — ${report}; бесплатная 30-секундная проверка: два ответа сразу, все пять — после создания аккаунта.`,
    liProduct: (from) =>
      `<link>Посты в LinkedIn и X</link> — черновики вашим голосом, публикуются после вашего одобрения. От ${from} в месяц.`,
    contactTitle: "Контакты",
  },
})
