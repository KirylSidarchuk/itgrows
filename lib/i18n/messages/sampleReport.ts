import { defineMessages } from "../messages"
import { plural } from "../format"

// app/business/sample-report/SampleReport.tsx (drawn on the server, then live in the browser): the
// frame around the sample report — its header, the price line, the "not available" state and the
// closing block. The report's own cards (ReportSections, YourPlan) come from app/business/dashboard
// and are translated with the cabinet.
// The domain and the date come in as arguments. The report is free once an account is created
// (since 27 Oct 2026), so the price line names no price.

const en = {
  // <PriceLine>, in the closing block (once: it used to repeat under the header)
  priceLine: "The quick check is free and takes about 30 seconds: two answers show in full right away, all five once you create an account. With the account we also build this report for your site, all of it: the full report is free once you create an account.",

  badge: "Sample report",
  h1: (domain: string) => `A real report: ${domain}`,
  intro: "An app-store-optimisation agency (our own company). This is what the detailed report shows for your site.",
  checked: (date: string, questions: number, assistants: number, asks: number) =>
    `Checked ${date} · ${questions} questions × ${assistants} assistants, ${asks} asks each`,
  checkMySite: "Check my site",

  unavailable: "The sample report isn't available right now.",
  unavailableHint: "Try again in a few minutes, or run the quick check on your own site.",

  sameTitle: "The same report for your site",
  honesty:
    "No one can promise that assistants will name you. The report shows where you stand, honestly, and what we would do about it.",
}

export default defineMessages(en, {
  de: {
    priceLine: "Der Schnellcheck ist kostenlos und dauert etwa 30 Sekunden: Zwei Antworten sehen Sie sofort vollständig, alle fünf, sobald Sie ein Konto anlegen. Mit dem Konto erstellen wir außerdem diesen Bericht für Ihre Website, vollständig: Der vollständige Bericht ist kostenlos, sobald Sie ein Konto anlegen.",

    badge: "Beispielbericht",
    h1: (domain) => `Ein echter Bericht: ${domain}`,
    intro: "Eine Agentur für App-Store-Optimierung (unser eigenes Unternehmen). So sieht der ausführliche Bericht für Ihre Website aus.",
    checked: (date, questions, assistants, asks) =>
      `Geprüft am ${date} · ${questions} ${plural("de", questions, { one: "Frage", other: "Fragen" })} × ${assistants} ${plural("de", assistants, { one: "Assistent", other: "Assistenten" })}, je ${asks} ${plural("de", asks, { one: "Durchlauf", other: "Durchläufe" })}`,
    checkMySite: "Website prüfen",

    unavailable: "Der Beispielbericht ist gerade nicht verfügbar.",
    unavailableHint: "Versuchen Sie es in ein paar Minuten erneut, oder machen Sie den Schnellcheck für Ihre eigene Website.",

    sameTitle: "Derselbe Bericht für Ihre Website",
    honesty:
      "Niemand kann versprechen, dass Assistenten Sie nennen werden. Der Bericht zeigt ehrlich, wo Sie stehen und was wir daran ändern würden.",
  },

  fr: {
    priceLine: "La vérification rapide est gratuite et prend environ 30 secondes : deux réponses s’affichent en entier tout de suite, les cinq dès que vous créez un compte. Avec ce compte, nous établissons aussi ce rapport pour votre site, en entier : le rapport complet est gratuit dès que vous créez un compte.",

    badge: "Exemple de rapport",
    h1: (domain) => `Un vrai rapport : ${domain}`,
    intro: "Une agence d’optimisation pour les stores d’applications (notre propre entreprise). Voici ce que le rapport détaillé montre pour votre site.",
    checked: (date, questions, assistants, asks) =>
      `Vérifié le ${date} · ${questions} ${plural("fr", questions, { one: "question", other: "questions" })} × ${assistants} ${plural("fr", assistants, { one: "assistant", other: "assistants" })}, ${asks} ${plural("fr", asks, { one: "requête", other: "requêtes" })} par question`,
    checkMySite: "Vérifier mon site",

    unavailable: "L’exemple de rapport n’est pas disponible pour le moment.",
    unavailableHint: "Réessayez dans quelques minutes, ou lancez la vérification rapide sur votre propre site.",

    sameTitle: "Le même rapport pour votre site",
    honesty:
      "Personne ne peut promettre que les assistants vous mentionneront. Le rapport montre honnêtement où vous en êtes, et ce que nous ferions pour y remédier.",
  },

  es: {
    priceLine: "La comprobación rápida es gratuita y tarda unos 30 segundos: dos respuestas se ven completas al momento y las cinco, en cuanto cree una cuenta. Con esa cuenta elaboramos también este informe para su sitio, completo: el informe completo es gratuito en cuanto cree una cuenta.",

    badge: "Informe de ejemplo",
    h1: (domain) => `Un informe real: ${domain}`,
    intro: "Una agencia de optimización para tiendas de aplicaciones (nuestra propia empresa). Esto es lo que muestra el informe detallado de su sitio.",
    checked: (date, questions, assistants, asks) =>
      `Comprobado el ${date} · ${questions} ${plural("es", questions, { one: "pregunta", other: "preguntas" })} × ${assistants} ${plural("es", assistants, { one: "asistente", other: "asistentes" })}, ${asks} ${plural("es", asks, { one: "consulta", other: "consultas" })} por pregunta`,
    checkMySite: "Comprobar mi sitio",

    unavailable: "El informe de ejemplo no está disponible en este momento.",
    unavailableHint: "Vuelva a intentarlo en unos minutos o haga la comprobación rápida de su propio sitio.",

    sameTitle: "El mismo informe para su sitio",
    honesty:
      "Nadie puede prometer que los asistentes le mencionen. El informe muestra con honestidad dónde está y qué haríamos al respecto.",
  },

  ru: {
    priceLine: "Быстрая проверка бесплатна и занимает около 30 секунд: два ответа видны целиком сразу, все пять — после создания аккаунта. С аккаунтом мы также составим такой отчёт по вашему сайту целиком: полный отчёт бесплатный — достаточно создать аккаунт.",

    badge: "Пример отчёта",
    h1: (domain) => `Настоящий отчёт: ${domain}`,
    intro: "Агентство по оптимизации приложений в магазинах (наша собственная компания). Вот что подробный отчёт показывает для вашего сайта.",
    checked: (date, questions, assistants, asks) =>
      `Проверено ${date} · ${plural("ru", questions, { one: `${questions} вопрос`, few: `${questions} вопроса`, many: `${questions} вопросов`, other: `${questions} вопроса` })} × ${plural("ru", assistants, { one: `${assistants} ассистент`, few: `${assistants} ассистента`, many: `${assistants} ассистентов`, other: `${assistants} ассистента` })}, ${plural("ru", asks, { one: `по ${asks} запросу`, few: `по ${asks} запроса`, many: `по ${asks} запросов`, other: `по ${asks} запроса` })} на каждый`,
    checkMySite: "Проверить мой сайт",

    unavailable: "Пример отчёта сейчас недоступен.",
    unavailableHint: "Попробуйте через несколько минут или запустите быструю проверку своего сайта.",

    sameTitle: "Такой же отчёт для вашего сайта",
    honesty:
      "Никто не может обещать, что ассистенты вас назовут. Отчёт честно показывает, где вы сейчас и что мы бы с этим сделали.",
  },
})
