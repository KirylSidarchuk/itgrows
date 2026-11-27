import { defineMessages } from "../messages"

// app/business/dashboard/visibility/parts.tsx NamedInstead: the businesses the assistants named for the site's
// questions, counted like the site (answers out of summary.of), in the cabinet's report, the free detailed report
// and /business/sample-report. The title is the one the quick check uses (aiAnswers namedInsteadTitle). The cabinet
// has no LocaleProvider yet, so it reads English; the sample report reads its page's language. French puts a
// non-breaking space before ":".

const en = {
  title: (firstLook: boolean): string => (firstLook ? "Named instead of you (first look)" : "Named instead of you"),
  intro: (of: number) => `Businesses the assistants named for your questions, counted like you: answers out of ${of}.`,
  none: "No businesses named. The assistants gave general advice.",
  you: "You",
}

export default defineMessages(en, {
  de: {
    title: (firstLook) => (firstLook ? "Statt Ihnen genannt (erster Blick)" : "Statt Ihnen genannt"),
    intro: (of) => `Unternehmen, die die Assistenten zu Ihren Fragen genannt haben, gezählt wie Sie: Antworten von ${of}.`,
    none: "Kein Unternehmen genannt. Die Assistenten gaben allgemeine Ratschläge.",
    you: "Sie",
  },
  fr: {
    title: (firstLook) => (firstLook ? "Mentionnés à votre place (premier aperçu)" : "Mentionnés à votre place"),
    intro: (of) => `Les entreprises que les assistants ont citées pour vos questions, comptées comme vous : réponses sur ${of}.`,
    none: "Aucune entreprise citée. Les assistants ont donné des conseils généraux.",
    you: "Vous",
  },
  es: {
    title: (firstLook) => (firstLook ? "Mencionados en su lugar (primer vistazo)" : "Mencionados en su lugar"),
    intro: (of) => `Empresas que los asistentes nombraron para sus preguntas, contadas como usted: respuestas de ${of}.`,
    none: "No se nombró ninguna empresa. Los asistentes dieron consejos generales.",
    you: "Usted",
  },
  ru: {
    title: (firstLook) => (firstLook ? "Названы вместо вас (первый взгляд)" : "Названы вместо вас"),
    intro: (of) => `Компании, которые ассистенты назвали по вашим вопросам, посчитаны так же, как вы: ответов из ${of}.`,
    none: "Компаний не назвали. Ассистенты дали общие советы.",
    you: "Вы",
  },
})
