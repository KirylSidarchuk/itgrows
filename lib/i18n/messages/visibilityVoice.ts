import { defineMessages } from "../messages"
import { plural } from "../format"

// app/business/dashboard/visibility/parts.tsx ShareOfVoice: how the assistants' mentions split between the
// site and the businesses they name instead (geo_check/sov.py). Shown in the cabinet's report, the free
// detailed report and /business/sample-report. The cabinet has no LocaleProvider yet, so it reads English;
// the sample report reads its page's language. Counts only, never a percentage (the rule of parts.tsx).
// "Above" is the headline card: "N of 80 answers named you", where a link alone counts; here it does not.

const en = {
  title: "Share of voice",
  intro:
    "How the assistants' mentions split between you and the other businesses they named for your questions. Each business counts once per question and assistant, as the answers that named you are counted above.",
  youOf: (n: number, of: number) => `You: ${n} of ${of} ${of === 1 ? "mention" : "mentions"}`,
  ahead: (n: number, brands: number) =>
    brands === 0
      ? "No other business was named."
      : n === 0
        ? `None of the ${brands} other businesses was named more often than you.`
        : `${n} of the ${brands} other businesses ${n === 1 ? "was" : "were"} named more often than you.`,
  notYet: (brands: number) => `You aren't named in the answers' text yet; ${brands} other ${brands === 1 ? "business is" : "businesses are"}.`,
  you: "You",
  top: (n: number) => `The ${n} most named`,
  rest: (n: number) => `All the others (${n} ${n === 1 ? "business" : "businesses"})`,
  byAssistant: "By assistant",
  mentions: (n: number) => `${n} ${n === 1 ? "mention" : "mentions"}`,
  mostNamed: "Most named",
  howTitle: "How we count:",
  how: "a mention is a business named in the text of the answers to one question by one assistant. A link without the name is not a mention, for you or for anyone else. For each question and assistant we count up to the first 6 businesses named.",
  linkOnly: (n: number) =>
    n === 1
      ? "1 answer that named you only links to your site: it counts above, not here."
      : `${n} answers that named you only link to your site: they count above, not here.`,
}

export default defineMessages(en, {
  de: {
    title: "Ihr Anteil an den Nennungen",
    intro:
      "Wie sich die Nennungen der Assistenten zwischen Ihnen und den anderen Unternehmen aufteilen, die sie zu Ihren Fragen genannt haben. Jedes Unternehmen zählt einmal pro Frage und Assistent, so wie oben die Antworten gezählt werden, die Sie nennen.",
    youOf: (n, of) => `Sie: ${n} von ${of} ${plural("de", of, { one: "Nennung", other: "Nennungen" })}`,
    ahead: (n, brands) =>
      brands === 0
        ? "Kein anderes Unternehmen wurde genannt."
        : n === 0
          ? `Keines der ${brands} anderen Unternehmen wurde häufiger genannt als Sie.`
          : `${n} von ${brands} anderen Unternehmen ${n === 1 ? "wurde" : "wurden"} häufiger genannt als Sie.`,
    notYet: (brands) =>
      `Im Text der Antworten werden Sie noch nicht genannt; ${plural("de", brands, { one: "1 anderes Unternehmen", other: `${brands} andere Unternehmen` })} schon.`,
    you: "Sie",
    top: (n) => `Die ${n} meistgenannten`,
    rest: (n) => `Alle anderen (${n} Unternehmen)`,
    byAssistant: "Nach Assistent",
    mentions: (n) => `${n} ${plural("de", n, { one: "Nennung", other: "Nennungen" })}`,
    mostNamed: "Am häufigsten genannt",
    howTitle: "So zählen wir:",
    how: "Eine Nennung ist ein Unternehmen, dessen Name im Text der Antworten eines Assistenten auf eine Frage steht. Ein Link ohne den Namen ist keine Nennung, weder bei Ihnen noch bei anderen. Pro Frage und Assistent zählen wir bis zu den ersten 6 genannten Unternehmen.",
    linkOnly: (n) =>
      n === 1
        ? "1 Antwort, die Sie nennt, verlinkt nur Ihre Website: Sie zählt oben, hier nicht."
        : `${n} Antworten, die Sie nennen, verlinken nur Ihre Website: Sie zählen oben, hier nicht.`,
  },
  fr: {
    title: "Part de voix",
    intro:
      "Comment les mentions des assistants se répartissent entre vous et les autres entreprises qu’ils citent pour vos questions. Chaque entreprise compte une fois par question et par assistant, comme les réponses qui vous citent, plus haut.",
    youOf: (n, of) => `Vous : ${n} sur ${of} ${plural("fr", of, { one: "mention", other: "mentions" })}`,
    ahead: (n, brands) =>
      brands === 0
        ? "Aucune autre entreprise n’a été citée."
        : n === 0
          ? `Aucune des ${brands} autres entreprises n’a été citée plus souvent que vous.`
          : n === 1
            ? `1 des ${brands} autres entreprises a été citée plus souvent que vous.`
            : `${n} des ${brands} autres entreprises ont été citées plus souvent que vous.`,
    notYet: (brands) =>
      `Votre nom n’apparaît pas encore dans le texte des réponses ; ${plural("fr", brands, { one: `${brands} autre entreprise y figure`, other: `${brands} autres entreprises y figurent` })}.`,
    you: "Vous",
    top: (n) => `Les ${n} plus citées`,
    rest: (n) => `Toutes les autres (${n} ${plural("fr", n, { one: "entreprise", other: "entreprises" })})`,
    byAssistant: "Par assistant",
    mentions: (n) => `${n} ${plural("fr", n, { one: "mention", other: "mentions" })}`,
    mostNamed: "La plus citée",
    howTitle: "Notre méthode :",
    how: "une mention, c’est une entreprise nommée dans le texte des réponses d’un assistant à une question. Un lien sans le nom n’est pas une mention, ni pour vous ni pour les autres. Pour chaque question et chaque assistant, nous comptons jusqu’aux 6 premières entreprises citées.",
    linkOnly: (n) =>
      n === 1
        ? "1 réponse qui vous cite ne fait que renvoyer vers votre site : elle compte plus haut, pas ici."
        : `${n} réponses qui vous citent ne font que renvoyer vers votre site : elles comptent plus haut, pas ici.`,
  },
  es: {
    title: "Cuota de voz",
    intro:
      "Cómo se reparten las menciones de los asistentes entre usted y las demás empresas que nombran para sus preguntas. Cada empresa cuenta una vez por pregunta y asistente, igual que las respuestas que le nombran, más arriba.",
    youOf: (n, of) => `Usted: ${n} de ${of} ${plural("es", of, { one: "mención", other: "menciones" })}`,
    ahead: (n, brands) =>
      brands === 0
        ? "No se nombró ninguna otra empresa."
        : n === 0
          ? `Ninguna de las ${brands} otras empresas fue nombrada más veces que usted.`
          : n === 1
            ? `1 de las ${brands} otras empresas fue nombrada más veces que usted.`
            : `${n} de las ${brands} otras empresas fueron nombradas más veces que usted.`,
    notYet: (brands) =>
      `Su nombre aún no aparece en el texto de las respuestas; ${plural("es", brands, { one: "el de otra empresa, sí", other: `el de ${brands} otras empresas, sí` })}.`,
    you: "Usted",
    top: (n) => `Las ${n} más nombradas`,
    rest: (n) => `Todas las demás (${n} ${plural("es", n, { one: "empresa", other: "empresas" })})`,
    byAssistant: "Por asistente",
    mentions: (n) => `${n} ${plural("es", n, { one: "mención", other: "menciones" })}`,
    mostNamed: "La más nombrada",
    howTitle: "Cómo contamos:",
    how: "una mención es una empresa nombrada en el texto de las respuestas de un asistente a una pregunta. Un enlace sin el nombre no es una mención, ni para usted ni para nadie. Por cada pregunta y asistente contamos hasta las 6 primeras empresas nombradas.",
    linkOnly: (n) =>
      n === 1
        ? "1 respuesta que le nombra solo enlaza a su sitio: cuenta más arriba, no aquí."
        : `${n} respuestas que le nombran solo enlazan a su sitio: cuentan más arriba, no aquí.`,
  },
  ru: {
    title: "Доля голоса",
    intro:
      "Как упоминания в ответах ассистентов делятся между вами и другими компаниями, которые они назвали по вашим вопросам. Каждая компания считается один раз на вопрос и ассистента, так же как выше считаются ответы, где назвали вас.",
    youOf: (n, of) => `Вы: ${n} из ${of} ${plural("ru", of, { one: "упоминания", other: "упоминаний" })}`,
    ahead: (n, brands) =>
      brands === 0
        ? "Других компаний не назвали."
        : n === 0
          ? `Ни одну из ${brands} ${plural("ru", brands, { one: "другой компании", other: "других компаний" })} не называли чаще, чем вас.`
          : `${n} из ${brands} ${plural("ru", brands, { one: "другой компании", other: "других компаний" })} называли чаще, чем вас.`,
    notYet: (brands) => `В тексте ответов вас пока не называют, а других компаний назвали: ${brands}.`,
    you: "Вы",
    top: (n) => `${n} самых упоминаемых`,
    rest: (n) => `Все остальные (${n} ${plural("ru", n, { one: "компания", few: "компании", many: "компаний", other: "компании" })})`,
    byAssistant: "По ассистентам",
    mentions: (n) => `${n} ${plural("ru", n, { one: "упоминание", few: "упоминания", many: "упоминаний", other: "упоминания" })}`,
    mostNamed: "Чаще всех",
    howTitle: "Как мы считаем:",
    how: "упоминание — это компания, названная в тексте ответов одного ассистента на один вопрос. Ссылка без названия — не упоминание, ни у вас, ни у других. По каждому вопросу и ассистенту мы считаем до первых 6 названных компаний.",
    linkOnly: (n) =>
      plural("ru", n, {
        one: `${n} ответ, где назвали вас, только ссылается на ваш сайт: он считается выше, здесь — нет.`,
        few: `${n} ответа, где назвали вас, только ссылаются на ваш сайт: они считаются выше, здесь — нет.`,
        many: `${n} ответов, где назвали вас, только ссылаются на ваш сайт: они считаются выше, здесь — нет.`,
        other: `${n} ответа, где назвали вас, только ссылаются на ваш сайт: они считаются выше, здесь — нет.`,
      }),
  },
})
