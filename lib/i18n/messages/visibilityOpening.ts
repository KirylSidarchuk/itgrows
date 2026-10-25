import { defineMessages } from "../messages"

// app/business/dashboard/visibility (OpeningSite in parts.tsx): the cabinet's first screen while the
// site the visitor checked on the homepage is being followed, and the retry when that fails. The
// cabinet has no LocaleProvider yet, so it reads English until it is translated.

const en = {
  opening: (domain: string) => `Opening your answers for ${domain}…`,
  failedTitle: (domain: string) => `We couldn't open your answers for ${domain}`,
  // Why, by the error /api/geo/follow returned
  reasonSite: "We couldn't open the site just now. If it is up, try again in a minute.",
  reasonText: "We couldn't read enough text on the site to work out what its buyers ask.",
  reasonOther: "Something failed on our side. Try again in a minute.",
  retry: "Try again",
  other: "Check a different site",
}

export default defineMessages(en, {
  de: {
    opening: (domain) => `Ihre Antworten für ${domain} werden geöffnet…`,
    failedTitle: (domain) => `Wir konnten Ihre Antworten für ${domain} nicht öffnen`,
    reasonSite: "Wir konnten die Website gerade nicht aufrufen. Wenn sie erreichbar ist, versuchen Sie es in einer Minute noch einmal.",
    reasonText: "Wir konnten auf der Website nicht genug Text lesen, um zu erkennen, was ihre Kunden fragen.",
    reasonOther: "Bei uns ist etwas schiefgelaufen. Versuchen Sie es in einer Minute noch einmal.",
    retry: "Erneut versuchen",
    other: "Andere Website prüfen",
  },
  fr: {
    opening: (domain) => `Ouverture de vos réponses pour ${domain}…`,
    failedTitle: (domain) => `Nous n’avons pas pu ouvrir vos réponses pour ${domain}`,
    reasonSite: "Nous n’avons pas pu accéder au site pour le moment. S’il est en ligne, réessayez dans une minute.",
    reasonText: "Nous n’avons pas trouvé assez de texte sur le site pour savoir ce que demandent ses clients.",
    reasonOther: "Un problème est survenu de notre côté. Réessayez dans une minute.",
    retry: "Réessayer",
    other: "Vérifier un autre site",
  },
  es: {
    opening: (domain) => `Abriendo sus respuestas para ${domain}…`,
    failedTitle: (domain) => `No pudimos abrir sus respuestas para ${domain}`,
    reasonSite: "No pudimos acceder al sitio en este momento. Si está en línea, vuelva a intentarlo en un minuto.",
    reasonText: "No encontramos suficiente texto en el sitio para saber qué preguntan sus clientes.",
    reasonOther: "Algo falló por nuestra parte. Vuelva a intentarlo en un minuto.",
    retry: "Volver a intentar",
    other: "Comprobar otro sitio",
  },
  ru: {
    opening: (domain) => `Открываем ваши ответы по ${domain}…`,
    failedTitle: (domain) => `Не удалось открыть ваши ответы по ${domain}`,
    reasonSite: "Сейчас не получилось открыть сайт. Если он работает, попробуйте ещё раз через минуту.",
    reasonText: "Не удалось найти на сайте достаточно текста, чтобы понять, о чём спрашивают его клиенты.",
    reasonOther: "У нас что-то пошло не так. Попробуйте ещё раз через минуту.",
    retry: "Попробовать ещё раз",
    other: "Проверить другой сайт",
  },
})
