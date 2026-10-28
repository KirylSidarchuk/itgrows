import { defineMessages } from "../messages"

// app/business/PricingPlans.tsx (client): the pricing block of "/". It names no plan price: under the
// price test (lib/geo-pricing.ts PRICE_TEST, since 28 Oct 2026) the price is shown only in the
// cabinet, so the block says "you see your price after your free report" (priceAfterReport). The
// yearly discount comes in as an argument. The detailed report is free once an account is created
// (since 27 Oct 2026).

const en = {
  h2: "See where you stand. Have us fix it.",
  notSure: "Not sure yet? <link>Run the 30-second check first →</link>",
  // Instead of notSure once this browser has checked a site: <site/> is the domain, <link> goes to sign-up
  checked: "You've checked <site/>. <link>Open all 5 answers →</link>",

  reportTitle: "Detailed report",
  free: "Free",
  withAccount: "once you create an account",
  reportLine: "Where you stand in all four assistants, and what we would do about it.",
  reportPoints: ["80 answers: 20 questions × 4 assistants", "Who is named and quoted instead of you", "Your plan, step by step"],
  getReport: "Get the free report",
  freeNote: "The full report is free once you create an account. One site per account.",
  seeSample: "See a real report →",

  planTitle: "The plan",
  billingPeriod: "Billing period",
  month: "Month",
  yearOff: (off: string) => `Year −${off}`,
  priceAfterReport: "You see your price after your free report.",
  monthNote: "Month to month, plus a one-time setup · free with 3 months or a year",
  yearNote: (off: string) => `Billed once a year, ${off} off · setup free`,
  planPoints: [
    "Site setup, with a launch report",
    "Up to 12 researched articles a month on your domain",
    "Profiles and editor letters on the sites AI quotes",
    "All four assistants measured every two weeks, 3 asks per question",
    "Every article shown to you 2 days before it goes live",
  ],
  startMonthly: "Start monthly",
  startQuarter: "3 months upfront, no setup fee",
  startYearly: "Start yearly",

  disclaimer: "No one can guarantee that an assistant will name a business. We measure and show you every two weeks.",
}

export default defineMessages(en, {
  de: {
    h2: "Sehen Sie, wo Sie stehen. Lassen Sie es uns beheben.",
    notSure: "Noch unsicher? <link>Machen Sie zuerst den 30-Sekunden-Check →</link>",
    checked: "Sie haben <site/> geprüft. <link>Alle 5 Antworten öffnen →</link>",

    reportTitle: "Ausführlicher Bericht",
    free: "Kostenlos",
    withAccount: "sobald Sie ein Konto anlegen",
    reportLine: "Wo Sie in allen vier Assistenten stehen und was wir dagegen tun würden.",
    reportPoints: ["80 Antworten: 20 Fragen × 4 Assistenten", "Wer statt Ihnen genannt und zitiert wird", "Ihr Maßnahmenplan, Schritt für Schritt"],
    getReport: "Kostenlosen Bericht erhalten",
    freeNote: "Der vollständige Bericht ist kostenlos, sobald Sie ein Konto anlegen. Eine Website pro Konto.",
    seeSample: "Einen echten Bericht ansehen (auf Englisch) →",

    planTitle: "Der Plan",
    billingPeriod: "Abrechnungszeitraum",
    month: "Monat",
    yearOff: (off) => `Jahr −${off}`,
    priceAfterReport: "Ihren Preis sehen Sie nach Ihrem kostenlosen Bericht.",
    monthNote: "Monatlich kündbar, plus einmalige Einrichtung · entfällt bei Vorauszahlung von 3 Monaten oder einem Jahr",
    yearNote: (off) => `Einmal jährlich abgerechnet, ${off} Rabatt · ohne Einrichtungsgebühr`,
    planPoints: [
      "Einrichtung der Website, mit Startbericht",
      "Bis zu 12 recherchierte Artikel pro Monat auf Ihrer Domain",
      "Profile und Briefe an Redaktionen der Websites, die KI zitiert",
      "Alle vier Assistenten, alle zwei Wochen gemessen, jede Frage dreimal",
      "Jeden Artikel sehen Sie 2 Tage vor der Veröffentlichung",
    ],
    startMonthly: "Monatlich starten",
    startQuarter: "3 Monate im Voraus, ohne Einrichtungsgebühr",
    startYearly: "Jährlich starten",

    disclaimer: "Niemand kann garantieren, dass ein Assistent ein Unternehmen nennt. Wir messen und zeigen es Ihnen alle zwei Wochen.",
  },
  fr: {
    h2: "Voyez où vous en êtes. Laissez-nous y remédier.",
    notSure: "Pas encore décidé ? <link>Faites d’abord la vérification en 30 secondes →</link>",
    checked: "Vous avez vérifié <site/>. <link>Ouvrir les 5 réponses →</link>",

    reportTitle: "Rapport détaillé",
    free: "Gratuit",
    withAccount: "dès que vous créez un compte",
    reportLine: "Où vous en êtes dans les quatre assistants, et ce que nous ferions pour y remédier.",
    reportPoints: ["80 réponses : 20 questions × 4 assistants", "Qui est mentionné et cité à votre place", "Votre plan d’action, étape par étape"],
    getReport: "Obtenir le rapport gratuit",
    freeNote: "Le rapport complet est gratuit dès que vous créez un compte. Un site par compte.",
    seeSample: "Voir un vrai rapport (en anglais) →",

    planTitle: "L’abonnement",
    billingPeriod: "Période de facturation",
    month: "Mois",
    yearOff: (off) => `Année −${off}`,
    priceAfterReport: "Vous voyez votre prix après votre rapport gratuit.",
    monthNote: "Sans engagement, plus une mise en place (une seule fois) · non facturée si vous payez 3 mois ou un an d’avance",
    yearNote: (off) => `Facturé une fois par an, −${off} · sans frais de mise en place`,
    planPoints: [
      "Mise en place du site, avec un rapport de lancement",
      "Jusqu’à 12 articles documentés par mois sur votre domaine",
      "Profils et lettres aux rédactions des sites que l’IA cite",
      "Les quatre assistants mesurés toutes les deux semaines, 3 requêtes par question",
      "Chaque article vous est montré 2 jours avant sa mise en ligne",
    ],
    startMonthly: "Commencer au mois",
    startQuarter: "3 mois d’avance, sans frais de mise en place",
    startYearly: "Commencer à l’année",

    disclaimer: "Personne ne peut garantir qu’un assistant mentionnera une entreprise. Nous mesurons et vous montrons les résultats toutes les deux semaines.",
  },
  es: {
    h2: "Vea dónde está. Déjenos arreglarlo.",
    notSure: "¿Aún no lo tiene claro? <link>Haga primero la comprobación de 30 segundos →</link>",
    checked: "Ya ha comprobado <site/>. <link>Abrir las 5 respuestas →</link>",

    reportTitle: "Informe detallado",
    free: "Gratis",
    withAccount: "en cuanto cree una cuenta",
    reportLine: "Dónde está usted en los cuatro asistentes y qué haríamos al respecto.",
    reportPoints: ["80 respuestas: 20 preguntas × 4 asistentes", "A quién mencionan y citan en su lugar", "Su plan de acción, paso a paso"],
    getReport: "Obtener el informe gratuito",
    freeNote: "El informe completo es gratuito en cuanto cree una cuenta. Un sitio por cuenta.",
    seeSample: "Ver un informe real (en inglés) →",

    planTitle: "El plan",
    billingPeriod: "Periodo de facturación",
    month: "Mes",
    yearOff: (off) => `Año −${off}`,
    priceAfterReport: "Verá su precio después de su informe gratuito.",
    monthNote: "Mes a mes, más una configuración inicial (pago único) · no se cobra si paga 3 meses o un año por adelantado",
    yearNote: (off) => `Facturado una vez al año, ${off} de descuento · sin cuota de configuración`,
    planPoints: [
      "Configuración del sitio, con un informe de lanzamiento",
      "Hasta 12 artículos documentados al mes en su dominio",
      "Perfiles y cartas a las redacciones de los sitios que cita la IA",
      "Los cuatro asistentes medidos cada dos semanas, 3 consultas por pregunta",
      "Cada artículo se le muestra 2 días antes de publicarse",
    ],
    startMonthly: "Empezar mensual",
    startQuarter: "3 meses por adelantado, sin cuota de configuración",
    startYearly: "Empezar anual",

    disclaimer: "Nadie puede garantizar que un asistente mencione a una empresa. Medimos y se lo mostramos cada dos semanas.",
  },
  ru: {
    h2: "Узнайте, где вы сейчас. А исправим — мы.",
    notSure: "Ещё не уверены? <link>Сначала пройдите 30-секундную проверку →</link>",
    checked: "Вы проверили <site/>. <link>Открыть все 5 ответов →</link>",

    reportTitle: "Подробный отчёт",
    free: "Бесплатно",
    withAccount: "после создания аккаунта",
    reportLine: "Где вы находитесь во всех четырёх ассистентах и что мы с этим сделали бы.",
    reportPoints: ["80 ответов: 20 вопросов × 4 ассистента", "Кого называют и цитируют вместо вас", "Ваш план действий, шаг за шагом"],
    getReport: "Получить бесплатный отчёт",
    freeNote: "Полный отчёт бесплатный — достаточно создать аккаунт. Один сайт на аккаунт.",
    seeSample: "Посмотреть настоящий отчёт (на английском) →",

    planTitle: "Подписка",
    billingPeriod: "Период оплаты",
    month: "Месяц",
    yearOff: (off) => `Год −${off}`,
    priceAfterReport: "Свою цену вы увидите после бесплатного отчёта.",
    monthNote: "Помесячно, плюс разовая настройка · не взимается при оплате 3 месяцев или года",
    yearNote: (off) => `Оплата раз в год, скидка ${off} · без платы за настройку`,
    planPoints: [
      "Настройка сайта с отчётом о запуске",
      "До 12 статей с исследованием в месяц на вашем домене",
      "Профили и письма редакторам сайтов, которые цитирует ИИ",
      "Все четыре ассистента — замер раз в две недели, по 3 запроса на вопрос",
      "Каждую статью вы видите за 2 дня до публикации",
    ],
    startMonthly: "Начать помесячно",
    startQuarter: "3 месяца вперёд, без платы за настройку",
    startYearly: "Начать на год",

    disclaimer: "Никто не может гарантировать, что ассистент назовёт компанию. Мы измеряем и показываем вам результат раз в две недели.",
  },
})
