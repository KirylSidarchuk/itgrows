import { defineMessages } from "../messages"
import { plural } from "../format"

// app/business/sample-report/SampleReport.tsx (drawn on the server, then live in the browser): the
// frame around the sample report — its header, the price line, the "not available" state and the
// closing block. The report's own cards (ReportSections, YourPlan) come from app/business/dashboard
// and are translated with the cabinet.
// The domain and the date come in as arguments. The report is free once an account is created
// (since 27 Oct 2026), so the price line names no price.
// `honesty` keeps its key name; since 30 Oct 2026 (owner's decision) it sells the report and the work
// instead of the old "no one can promise" line.

const en = {
  // <PriceLine>, in the closing block (once: it used to repeat under the header)
  priceLine: "The quick check is free and takes about 30 seconds: two answers show in full right away, all five once you create an account. With the account we also build this report for your site, all of it: the full report is free once you create an account.",

  badge: "Sample report",
  h1: (domain: string) => `A real report: ${domain}`,
  intro: "An app-store-optimisation agency (our own company). This is what the detailed report shows for your site. Here every question was asked 3 times, as on the plan every two weeks; your free report asks each question once.",
  checked: (date: string, questions: number, assistants: number, asks: number) =>
    `Checked ${date} · ${questions} questions × ${assistants} assistants, ${asks === 1 ? "each asked once" : `${asks} asks each`}`,
  checkMySite: "Check my site",

  unavailable: "The sample report isn't available right now.",
  unavailableHint: "Try again in a few minutes, or run the quick check on your own site.",

  sameTitle: "Get this report for your site, free",
  honesty:
    "Every business named in your place, the sites the assistants quote, and our plan to get you in. Then we do the work.",
}

export default defineMessages(en, {
  de: {
    priceLine: "Der Schnellcheck ist kostenlos und dauert etwa 30 Sekunden: Zwei Antworten sehen Sie sofort vollständig, alle fünf, sobald Sie ein Konto anlegen. Mit dem Konto erstellen wir außerdem diesen Bericht für Ihre Website, vollständig: Der vollständige Bericht ist kostenlos, sobald Sie ein Konto anlegen.",

    badge: "Beispielbericht",
    h1: (domain) => `Ein echter Bericht: ${domain}`,
    intro: "Eine Agentur für App-Store-Optimierung (unser eigenes Unternehmen). So sieht der ausführliche Bericht für Ihre Website aus. Hier wurde jede Frage dreimal gestellt, wie im Plan alle zwei Wochen; Ihr kostenloser Bericht stellt jede Frage einmal.",
    checked: (date, questions, assistants, asks) =>
      `Geprüft am ${date} · ${questions} ${plural("de", questions, { one: "Frage", other: "Fragen" })} × ${assistants} ${plural("de", assistants, { one: "Assistent", other: "Assistenten" })}, je ${asks} ${plural("de", asks, { one: "Durchlauf", other: "Durchläufe" })}`,
    checkMySite: "Website prüfen",

    unavailable: "Der Beispielbericht ist gerade nicht verfügbar.",
    unavailableHint: "Versuchen Sie es in ein paar Minuten erneut, oder machen Sie den Schnellcheck für Ihre eigene Website.",

    sameTitle: "Holen Sie sich diesen Bericht für Ihre Website, kostenlos",
    honesty:
      "Jedes Unternehmen, das an Ihrer Stelle genannt wird, die Websites, die die Assistenten zitieren, und unser Maßnahmenplan, mit dem wir Sie in die Antworten bringen. Dann erledigen wir die Arbeit.",
  },

  fr: {
    priceLine: "La vérification rapide est gratuite et prend environ 30 secondes : deux réponses s’affichent en entier tout de suite, les cinq dès que vous créez un compte. Avec ce compte, nous établissons aussi ce rapport pour votre site, en entier : le rapport complet est gratuit dès que vous créez un compte.",

    badge: "Exemple de rapport",
    h1: (domain) => `Un vrai rapport : ${domain}`,
    intro: "Une agence d’optimisation pour les stores d’applications (notre propre entreprise). Voici ce que le rapport détaillé montre pour votre site. Ici, chaque question a été posée 3 fois, comme avec l’abonnement toutes les deux semaines ; votre rapport gratuit pose chaque question une fois.",
    checked: (date, questions, assistants, asks) =>
      `Vérifié le ${date} · ${questions} ${plural("fr", questions, { one: "question", other: "questions" })} × ${assistants} ${plural("fr", assistants, { one: "assistant", other: "assistants" })}, ${asks} ${plural("fr", asks, { one: "requête", other: "requêtes" })} par question`,
    checkMySite: "Vérifier mon site",

    unavailable: "L’exemple de rapport n’est pas disponible pour le moment.",
    unavailableHint: "Réessayez dans quelques minutes, ou lancez la vérification rapide sur votre propre site.",

    sameTitle: "Obtenez ce rapport pour votre site, gratuitement",
    honesty:
      "Chaque entreprise mentionnée à votre place, les sites que citent les assistants et notre plan d’action pour vous faire entrer dans les réponses. Ensuite, nous faisons le travail.",
  },

  es: {
    priceLine: "La comprobación rápida es gratuita y tarda unos 30 segundos: dos respuestas se ven completas al momento y las cinco, en cuanto cree una cuenta. Con esa cuenta elaboramos también este informe para su sitio, completo: el informe completo es gratuito en cuanto cree una cuenta.",

    badge: "Informe de ejemplo",
    h1: (domain) => `Un informe real: ${domain}`,
    intro: "Una agencia de optimización para tiendas de aplicaciones (nuestra propia empresa). Esto es lo que muestra el informe detallado de su sitio. Aquí cada pregunta se hizo 3 veces, como con el plan cada dos semanas; su informe gratuito hace cada pregunta una vez.",
    checked: (date, questions, assistants, asks) =>
      `Comprobado el ${date} · ${questions} ${plural("es", questions, { one: "pregunta", other: "preguntas" })} × ${assistants} ${plural("es", assistants, { one: "asistente", other: "asistentes" })}, ${asks} ${plural("es", asks, { one: "consulta", other: "consultas" })} por pregunta`,
    checkMySite: "Comprobar mi sitio",

    unavailable: "El informe de ejemplo no está disponible en este momento.",
    unavailableHint: "Vuelva a intentarlo en unos minutos o haga la comprobación rápida de su propio sitio.",

    sameTitle: "Consiga este informe para su sitio, gratis",
    honesty:
      "Cada empresa mencionada en su lugar, los sitios que citan los asistentes y nuestro plan de acción para que le mencionen. Después hacemos el trabajo.",
  },

  ru: {
    priceLine: "Быстрая проверка бесплатна и занимает около 30 секунд: два ответа видны целиком сразу, все пять — после создания аккаунта. С аккаунтом мы также составим такой отчёт по вашему сайту целиком: полный отчёт бесплатный — достаточно создать аккаунт.",

    badge: "Пример отчёта",
    h1: (domain) => `Настоящий отчёт: ${domain}`,
    intro: "Агентство по оптимизации приложений в магазинах (наша собственная компания). Вот что подробный отчёт показывает для вашего сайта. Здесь каждый вопрос задан 3 раза, как по подписке раз в две недели; ваш бесплатный отчёт задаёт каждый вопрос один раз.",
    checked: (date, questions, assistants, asks) =>
      `Проверено ${date} · ${plural("ru", questions, { one: `${questions} вопрос`, few: `${questions} вопроса`, many: `${questions} вопросов`, other: `${questions} вопроса` })} × ${plural("ru", assistants, { one: `${assistants} ассистент`, few: `${assistants} ассистента`, many: `${assistants} ассистентов`, other: `${assistants} ассистента` })}, ${plural("ru", asks, { one: `по ${asks} запросу`, few: `по ${asks} запроса`, many: `по ${asks} запросов`, other: `по ${asks} запроса` })} на каждый`,
    checkMySite: "Проверить мой сайт",

    unavailable: "Пример отчёта сейчас недоступен.",
    unavailableHint: "Попробуйте через несколько минут или запустите быструю проверку своего сайта.",

    sameTitle: "Получите такой отчёт по своему сайту бесплатно",
    honesty:
      "Каждая компания, которую называют вместо вас, сайты, которые цитируют ассистенты, и наш план действий, чтобы называли вас. А дальше работу делаем мы.",
  },
})
