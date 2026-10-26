import { defineMessages } from "../messages"
import { plural } from "../format"

// app/business/PricingPlans.tsx (client): the pricing block of "/". Prices, days and the yearly
// discount come in as arguments from lib/geo-pricing.ts; nothing here is a price.

// "в течение 30 дней", "в течение 21 дня".
const ruDays = (n: number) => plural("ru", n, { one: `${n} дня`, other: `${n} дней` })

const en = {
  h2: "See where you stand. Have us fix it.",
  notSure: "Not sure yet? <link>Run the 30-second check first →</link>",
  // Instead of notSure once this browser has checked a site: <site/> is the domain, <link> goes to sign-up
  checked: "You've checked <site/>. <link>Open all 5 answers →</link>",

  reportTitle: "Detailed report",
  onePayment: "one payment",
  reportLine: "Where you stand in all four assistants, and what we would do about it.",
  reportPoints: ["240 answers: 20 questions × 4 assistants × 3", "Who is named and quoted instead of you", "Your plan, step by step"],
  getReport: (price: string) => `Get the report — ${price}`,
  credit: (days: number) => `Comes off your first plan payment within ${days} days.`,
  seeSample: "See a real report →",

  planTitle: "The plan",
  billingPeriod: "Billing period",
  month: "Month",
  yearOff: (off: string) => `Year −${off}`,
  perMonth: "/ month",
  monthNote: (setup: string) => `+ ${setup} one-time setup · free with 3 months or a year`,
  yearNote: (year: string) => `Billed ${year} a year · setup free`,
  planPoints: [
    "Site setup, with a launch report",
    "Up to 12 researched articles a month on your domain",
    "Profiles and editor letters on the sites AI quotes",
    "All four assistants measured every two weeks",
    "Every article shown to you 2 days before it goes live",
  ],
  startMonthly: "Start monthly",
  startQuarter: (quarter: string) => `3 months upfront — ${quarter}, no setup fee`,
  startYearly: (year: string) => `Start yearly — ${year}`,

  disclaimer: "No one can guarantee that an assistant will name a business. We measure and show you every two weeks.",
}

export default defineMessages(en, {
  de: {
    h2: "Sehen Sie, wo Sie stehen. Lassen Sie es uns beheben.",
    notSure: "Noch unsicher? <link>Machen Sie zuerst den 30-Sekunden-Check →</link>",
    checked: "Sie haben <site/> geprüft. <link>Alle 5 Antworten öffnen →</link>",

    reportTitle: "Ausführlicher Bericht",
    onePayment: "einmalige Zahlung",
    reportLine: "Wo Sie in allen vier Assistenten stehen und was wir dagegen tun würden.",
    reportPoints: ["240 Antworten: 20 Fragen × 4 Assistenten × 3", "Wer statt Ihnen genannt und zitiert wird", "Ihr Maßnahmenplan, Schritt für Schritt"],
    getReport: (price) => `Bericht kaufen — ${price}`,
    credit: (days) => `Wird auf Ihre erste Plan-Zahlung angerechnet, wenn Sie den Plan innerhalb von ${days} Tagen starten.`,
    seeSample: "Einen echten Bericht ansehen (auf Englisch) →",

    planTitle: "Der Plan",
    billingPeriod: "Abrechnungszeitraum",
    month: "Monat",
    yearOff: (off) => `Jahr −${off}`,
    perMonth: "/ Monat",
    monthNote: (setup) => `+ ${setup} einmalige Einrichtung · entfällt bei Vorauszahlung von 3 Monaten oder einem Jahr`,
    yearNote: (year) => `${year} jährlich abgerechnet · ohne Einrichtungsgebühr`,
    planPoints: [
      "Einrichtung der Website, mit Startbericht",
      "Bis zu 12 recherchierte Artikel pro Monat auf Ihrer Domain",
      "Profile und Briefe an Redaktionen der Websites, die KI zitiert",
      "Alle vier Assistenten, alle zwei Wochen gemessen",
      "Jeden Artikel sehen Sie 2 Tage vor der Veröffentlichung",
    ],
    startMonthly: "Monatlich starten",
    startQuarter: (quarter) => `3 Monate im Voraus — ${quarter}, ohne Einrichtungsgebühr`,
    startYearly: (year) => `Jährlich starten — ${year}`,

    disclaimer: "Niemand kann garantieren, dass ein Assistent ein Unternehmen nennt. Wir messen und zeigen es Ihnen alle zwei Wochen.",
  },
  fr: {
    h2: "Voyez où vous en êtes. Laissez-nous y remédier.",
    notSure: "Pas encore décidé ? <link>Faites d’abord la vérification en 30 secondes →</link>",
    checked: "Vous avez vérifié <site/>. <link>Ouvrir les 5 réponses →</link>",

    reportTitle: "Rapport détaillé",
    onePayment: "paiement unique",
    reportLine: "Où vous en êtes dans les quatre assistants, et ce que nous ferions pour y remédier.",
    reportPoints: ["240 réponses : 20 questions × 4 assistants × 3", "Qui est mentionné et cité à votre place", "Votre plan d’action, étape par étape"],
    getReport: (price) => `Obtenir le rapport — ${price}`,
    credit: (days) => `Déduit de votre premier paiement d’abonnement si vous démarrez dans les ${days} jours.`,
    seeSample: "Voir un vrai rapport (en anglais) →",

    planTitle: "L’abonnement",
    billingPeriod: "Période de facturation",
    month: "Mois",
    yearOff: (off) => `Année −${off}`,
    perMonth: "/ mois",
    monthNote: (setup) => `+ ${setup} de mise en place (une seule fois) · non facturée si vous payez 3 mois ou un an d’avance`,
    yearNote: (year) => `Facturé ${year} par an · sans frais de mise en place`,
    planPoints: [
      "Mise en place du site, avec un rapport de lancement",
      "Jusqu’à 12 articles documentés par mois sur votre domaine",
      "Profils et lettres aux rédactions des sites que l’IA cite",
      "Les quatre assistants mesurés toutes les deux semaines",
      "Chaque article vous est montré 2 jours avant sa mise en ligne",
    ],
    startMonthly: "Commencer au mois",
    startQuarter: (quarter) => `3 mois d’avance — ${quarter}, sans frais de mise en place`,
    startYearly: (year) => `Commencer à l’année — ${year}`,

    disclaimer: "Personne ne peut garantir qu’un assistant mentionnera une entreprise. Nous mesurons et vous montrons les résultats toutes les deux semaines.",
  },
  es: {
    h2: "Vea dónde está. Déjenos arreglarlo.",
    notSure: "¿Aún no lo tiene claro? <link>Haga primero la comprobación de 30 segundos →</link>",
    checked: "Ya ha comprobado <site/>. <link>Abrir las 5 respuestas →</link>",

    reportTitle: "Informe detallado",
    onePayment: "pago único",
    reportLine: "Dónde está usted en los cuatro asistentes y qué haríamos al respecto.",
    reportPoints: ["240 respuestas: 20 preguntas × 4 asistentes × 3", "A quién mencionan y citan en su lugar", "Su plan de acción, paso a paso"],
    getReport: (price) => `Obtener el informe — ${price}`,
    credit: (days) => `Se descuenta de su primer pago del plan si lo inicia en un plazo de ${days} días.`,
    seeSample: "Ver un informe real (en inglés) →",

    planTitle: "El plan",
    billingPeriod: "Periodo de facturación",
    month: "Mes",
    yearOff: (off) => `Año −${off}`,
    perMonth: "/ mes",
    monthNote: (setup) => `+ ${setup} de configuración inicial (pago único) · no se cobra si paga 3 meses o un año por adelantado`,
    yearNote: (year) => `Facturado ${year} al año · sin cuota de configuración`,
    planPoints: [
      "Configuración del sitio, con un informe de lanzamiento",
      "Hasta 12 artículos documentados al mes en su dominio",
      "Perfiles y cartas a las redacciones de los sitios que cita la IA",
      "Los cuatro asistentes medidos cada dos semanas",
      "Cada artículo se le muestra 2 días antes de publicarse",
    ],
    startMonthly: "Empezar mensual",
    startQuarter: (quarter) => `3 meses por adelantado — ${quarter}, sin cuota de configuración`,
    startYearly: (year) => `Empezar anual — ${year}`,

    disclaimer: "Nadie puede garantizar que un asistente mencione a una empresa. Medimos y se lo mostramos cada dos semanas.",
  },
  ru: {
    h2: "Узнайте, где вы сейчас. А исправим — мы.",
    notSure: "Ещё не уверены? <link>Сначала пройдите 30-секундную проверку →</link>",
    checked: "Вы проверили <site/>. <link>Открыть все 5 ответов →</link>",

    reportTitle: "Подробный отчёт",
    onePayment: "один платёж",
    reportLine: "Где вы находитесь во всех четырёх ассистентах и что мы с этим сделали бы.",
    reportPoints: ["240 ответов: 20 вопросов × 4 ассистента × 3", "Кого называют и цитируют вместо вас", "Ваш план действий, шаг за шагом"],
    getReport: (price) => `Получить отчёт — ${price}`,
    credit: (days) => `Засчитывается в первый платёж за подписку, если оформить её в течение ${ruDays(days)}.`,
    seeSample: "Посмотреть настоящий отчёт (на английском) →",

    planTitle: "Подписка",
    billingPeriod: "Период оплаты",
    month: "Месяц",
    yearOff: (off) => `Год −${off}`,
    perMonth: "/ мес.",
    monthNote: (setup) => `+ ${setup} разовая настройка · не взимается при оплате 3 месяцев или года`,
    yearNote: (year) => `Оплата ${year} за год · без платы за настройку`,
    planPoints: [
      "Настройка сайта с отчётом о запуске",
      "До 12 статей с исследованием в месяц на вашем домене",
      "Профили и письма редакторам сайтов, которые цитирует ИИ",
      "Все четыре ассистента — замер раз в две недели",
      "Каждую статью вы видите за 2 дня до публикации",
    ],
    startMonthly: "Начать помесячно",
    startQuarter: (quarter) => `3 месяца вперёд — ${quarter}, без платы за настройку`,
    startYearly: (year) => `Начать на год — ${year}`,

    disclaimer: "Никто не может гарантировать, что ассистент назовёт компанию. Мы измеряем и показываем вам результат раз в две недели.",
  },
})
