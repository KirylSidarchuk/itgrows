import { defineMessages } from "../messages"

// app/business/PricingPlans.tsx (client): the pricing block of "/". It names no plan price: under the
// price test (lib/geo-pricing.ts PRICE_TEST, since 28 Oct 2026) the price is shown only in the
// cabinet, so the block says "you see your price after your free report" (priceAfterReport). The
// yearly discount comes in as an argument. The detailed report is free once an account is created
// (since 27 Oct 2026).
// Since 30 Oct 2026 (owner's decision) the plan card carries the growth guarantee's line with its "*"
// (growthGuarantee.ts); its footnote, with the link to /terms#growth-guarantee, is the last line of the
// site footer. The old "no one can guarantee" disclaimer is gone.

const en = {
  h2: "See who's taking your customers. Then we get you in.",
  notSure: "Not sure yet? <link>See who ChatGPT names instead of you, in 30 seconds →</link>",
  // Instead of notSure once this browser has checked a site: <site/> is the domain, <link> goes to sign-up
  checked: "You've checked <site/>. <link>Open all 5 answers →</link>",

  reportTitle: "Detailed report",
  free: "Free",
  withAccount: "once you create an account",
  reportLine: "Exactly who the four assistants name instead of you, and our plan to get you in.",
  reportPoints: ["80 answers: 20 questions × 4 assistants", "Every business named in your place", "Our plan to get you named, step by step"],
  getReport: "Get my free report",
  freeNote: "The full report is free once you create an account. One site per account.",
  seeSample: "See a real report →",

  planTitle: "The plan: done for you",
  billingPeriod: "Billing period",
  month: "Month",
  yearOff: (off: string) => `Year −${off}`,
  priceAfterReport: "You see your price after your free report.",
  monthNote: "Month to month, plus a one-time setup · free with 3 months or a year",
  yearNote: (off: string) => `Billed once a year, ${off} off · setup free`,
  planPoints: [
    "Setup in the first two weeks, with a launch report",
    "Up to 12 researched articles a month on your domain",
    "Your profiles and letters to editors on the sites AI quotes",
    "Your customers' questions re-asked to all four assistants every two weeks, and the next push wherever you're missing",
    "Every article shown to you 2 days before it goes live",
  ],
  startMonthly: "Start monthly",
  startQuarter: "3 months upfront, no setup fee",
  startYearly: "Start yearly",
}

export default defineMessages(en, {
  de: {
    h2: "Sehen Sie, wer Ihnen die Kunden wegnimmt. Dann bringen wir Sie in die Antworten.",
    notSure: "Noch unsicher? <link>Sehen Sie in 30 Sekunden, wen ChatGPT statt Ihnen nennt →</link>",
    checked: "Sie haben <site/> geprüft. <link>Alle 5 Antworten öffnen →</link>",

    reportTitle: "Ausführlicher Bericht",
    free: "Kostenlos",
    withAccount: "sobald Sie ein Konto anlegen",
    reportLine: "Genau, wen die vier Assistenten statt Ihnen nennen, und unser Maßnahmenplan, mit dem wir Sie in die Antworten bringen.",
    reportPoints: ["80 Antworten: 20 Fragen × 4 Assistenten", "Jedes Unternehmen, das an Ihrer Stelle genannt wird", "Unser Maßnahmenplan, damit Sie genannt werden, Schritt für Schritt"],
    getReport: "Meinen kostenlosen Bericht erhalten",
    freeNote: "Der vollständige Bericht ist kostenlos, sobald Sie ein Konto anlegen. Eine Website pro Konto.",
    seeSample: "Einen echten Bericht ansehen (auf Englisch) →",

    planTitle: "Der Plan: Wir erledigen alles",
    billingPeriod: "Abrechnungszeitraum",
    month: "Monat",
    yearOff: (off) => `Jahr −${off}`,
    priceAfterReport: "Ihren Preis sehen Sie nach Ihrem kostenlosen Bericht.",
    monthNote: "Monatlich kündbar, plus einmalige Einrichtung · entfällt bei Vorauszahlung von 3 Monaten oder einem Jahr",
    yearNote: (off) => `Einmal jährlich abgerechnet, ${off} Rabatt · ohne Einrichtungsgebühr`,
    planPoints: [
      "Einrichtung in den ersten zwei Wochen, mit Startbericht",
      "Bis zu 12 recherchierte Artikel pro Monat auf Ihrer Domain",
      "Ihre Profile und Briefe an Redaktionen der Websites, die KI zitiert",
      "Die Fragen Ihrer Kunden alle zwei Wochen erneut an alle vier Assistenten, und der nächste Schub überall, wo Sie fehlen",
      "Jeden Artikel sehen Sie 2 Tage vor der Veröffentlichung",
    ],
    startMonthly: "Monatlich starten",
    startQuarter: "3 Monate im Voraus, ohne Einrichtungsgebühr",
    startYearly: "Jährlich starten",
  },
  fr: {
    h2: "Voyez qui vous prend vos clients. Ensuite, nous vous faisons entrer dans les réponses.",
    notSure: "Pas encore décidé ? <link>Voyez en 30 secondes qui ChatGPT mentionne à votre place →</link>",
    checked: "Vous avez vérifié <site/>. <link>Ouvrir les 5 réponses →</link>",

    reportTitle: "Rapport détaillé",
    free: "Gratuit",
    withAccount: "dès que vous créez un compte",
    reportLine: "Exactement qui les quatre assistants mentionnent à votre place, et notre plan d’action pour vous faire entrer dans les réponses.",
    reportPoints: ["80 réponses : 20 questions × 4 assistants", "Chaque entreprise mentionnée à votre place", "Notre plan d’action pour vous faire mentionner, étape par étape"],
    getReport: "Obtenir mon rapport gratuit",
    freeNote: "Le rapport complet est gratuit dès que vous créez un compte. Un site par compte.",
    seeSample: "Voir un vrai rapport (en anglais) →",

    planTitle: "L’abonnement : nous faisons tout",
    billingPeriod: "Période de facturation",
    month: "Mois",
    yearOff: (off) => `Année −${off}`,
    priceAfterReport: "Vous voyez votre prix après votre rapport gratuit.",
    monthNote: "Sans engagement, plus une mise en place (une seule fois) · non facturée si vous payez 3 mois ou un an d’avance",
    yearNote: (off) => `Facturé une fois par an, −${off} · sans frais de mise en place`,
    planPoints: [
      "Mise en place dans les deux premières semaines, avec un rapport de lancement",
      "Jusqu’à 12 articles documentés par mois sur votre domaine",
      "Vos profils et lettres aux rédactions des sites que l’IA cite",
      "Les questions de vos clients reposées aux quatre assistants toutes les deux semaines, et la prochaine poussée partout où vous manquez",
      "Chaque article vous est montré 2 jours avant sa mise en ligne",
    ],
    startMonthly: "Commencer au mois",
    startQuarter: "3 mois d’avance, sans frais de mise en place",
    startYearly: "Commencer à l’année",
  },
  es: {
    h2: "Vea quién se lleva a sus clientes. Después le metemos en las respuestas.",
    notSure: "¿Aún no lo tiene claro? <link>Vea en 30 segundos a quién menciona ChatGPT en su lugar →</link>",
    checked: "Ya ha comprobado <site/>. <link>Abrir las 5 respuestas →</link>",

    reportTitle: "Informe detallado",
    free: "Gratis",
    withAccount: "en cuanto cree una cuenta",
    reportLine: "Exactamente a quién mencionan los cuatro asistentes en su lugar, y nuestro plan de acción para que le mencionen.",
    reportPoints: ["80 respuestas: 20 preguntas × 4 asistentes", "Cada empresa mencionada en su lugar", "Nuestro plan de acción para que le mencionen, paso a paso"],
    getReport: "Obtener mi informe gratuito",
    freeNote: "El informe completo es gratuito en cuanto cree una cuenta. Un sitio por cuenta.",
    seeSample: "Ver un informe real (en inglés) →",

    planTitle: "El plan: lo hacemos todo por usted",
    billingPeriod: "Periodo de facturación",
    month: "Mes",
    yearOff: (off) => `Año −${off}`,
    priceAfterReport: "Verá su precio después de su informe gratuito.",
    monthNote: "Mes a mes, más una configuración inicial (pago único) · no se cobra si paga 3 meses o un año por adelantado",
    yearNote: (off) => `Facturado una vez al año, ${off} de descuento · sin cuota de configuración`,
    planPoints: [
      "Configuración en las dos primeras semanas, con un informe de lanzamiento",
      "Hasta 12 artículos documentados al mes en su dominio",
      "Sus perfiles y cartas a las redacciones de los sitios que cita la IA",
      "Las preguntas de sus clientes planteadas de nuevo a los cuatro asistentes cada dos semanas, y el siguiente empuje allí donde no aparece",
      "Cada artículo se le muestra 2 días antes de publicarse",
    ],
    startMonthly: "Empezar mensual",
    startQuarter: "3 meses por adelantado, sin cuota de configuración",
    startYearly: "Empezar anual",
  },
  ru: {
    h2: "Узнайте, кто забирает ваших клиентов. А дальше мы выведем вас в ответы.",
    notSure: "Ещё не уверены? <link>За 30 секунд узнайте, кого ChatGPT называет вместо вас →</link>",
    checked: "Вы проверили <site/>. <link>Открыть все 5 ответов →</link>",

    reportTitle: "Подробный отчёт",
    free: "Бесплатно",
    withAccount: "после создания аккаунта",
    reportLine: "Кого именно четыре ассистента называют вместо вас — и наш план действий, чтобы называли вас.",
    reportPoints: ["80 ответов: 20 вопросов × 4 ассистента", "Каждая компания, которую называют вместо вас", "Наш план действий, чтобы называли вас, шаг за шагом"],
    getReport: "Получить мой бесплатный отчёт",
    freeNote: "Полный отчёт бесплатный — достаточно создать аккаунт. Один сайт на аккаунт.",
    seeSample: "Посмотреть настоящий отчёт (на английском) →",

    planTitle: "Подписка: всё делаем мы",
    billingPeriod: "Период оплаты",
    month: "Месяц",
    yearOff: (off) => `Год −${off}`,
    priceAfterReport: "Свою цену вы увидите после бесплатного отчёта.",
    monthNote: "Помесячно, плюс разовая настройка · не взимается при оплате 3 месяцев или года",
    yearNote: (off) => `Оплата раз в год, скидка ${off} · без платы за настройку`,
    planPoints: [
      "Настройка в первые две недели, с отчётом о запуске",
      "До 12 статей с исследованием в месяц на вашем домене",
      "Ваши профили и письма редакторам сайтов, которые цитирует ИИ",
      "Вопросы ваших клиентов — заново всем четырём ассистентам раз в две недели, и следующий рывок везде, где вас нет",
      "Каждую статью вы видите за 2 дня до публикации",
    ],
    startMonthly: "Начать помесячно",
    startQuarter: "3 месяца вперёд, без платы за настройку",
    startYearly: "Начать на год",
  },
})
