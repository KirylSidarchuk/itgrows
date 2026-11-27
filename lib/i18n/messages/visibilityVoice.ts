import { defineMessages } from "../messages"
import { plural } from "../format"

// app/business/dashboard/visibility/parts.tsx ShareOfVoice: how the assistants' mentions split between the
// site and the businesses they name instead (geo_check/sov.py). Shown in the cabinet's report, the free
// detailed report and /business/sample-report. The cabinet has no LocaleProvider yet, so it reads English;
// the sample report reads its page's language. Counts only, never a percentage (the rule of parts.tsx).
// "Above" is the headline card: "N of 80 answers named you", where a link alone counts; here it does not.
// Every colon is in the strings, not in parts.tsx: French puts a non-breaking space before it.
// German: "sie" for the answers never starts a sentence, where it would read as "Sie" (you); nor "die Sie nennen"
// (answers that name you, or that you name): "in denen Sie genannt werden".

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
  youCount: (n: number) => `You: ${n}`,
  mostNamed: (name: string) => `Most named: ${name}`,
  howTitle: "How we count:",
  how: "a mention is a business named in the text of the answers to one question by one assistant. A link without the name is not a mention, for you or for anyone else. For each question and assistant we count up to the first 6 businesses named. Your name is counted even when it comes after those first 6, so your share may look higher than it really is.",
  linkOnly: (n: number) =>
    n === 1
      ? "1 answer that named you only links to your site: it counts above, not here."
      : `${n} answers that named you only link to your site: they count above, not here.`,
  // The tone part (parts.tsx VoiceTone, geo_check/tone.py). `tones` label a count of answers, so they read
  // as what the answers do. The quotes stay in the answers' language; `quote` only puts the marks around one.
  toneTitle: "How the answers describe you",
  toneIntro: (n: number) =>
    n === 1
      ? "We read the answer that names you and sorted it by how it presents you to the person who asked."
      : `We read the ${n} answers that name you and sorted them by how they present you to the person who asked.`,
  tones: {
    recommended: "Recommend you",
    neutral: "Name you, facts only",
    caveat: "With a caveat",
    negative: "Speak against you",
    unsure: "Know little about you",
  },
  quote: (s: string) => `“${s}”`,
  toneHow:
    "“Recommend you”: praise, a top pick or a recommendation. “With a caveat”: something that could put a customer off, such as the price, the reviews or a limit to what you offer. “Speak against you”: advice not to choose you, complaints, or a report that you have closed. “Know little about you”: the assistant found little about you or could not confirm it. An answer is one question to one assistant; when its asks differ, it takes the tone most of them show. A language model sorts each answer; the quotes are copied from the answers, in their original language.",
}

export default defineMessages(en, {
  de: {
    title: "Ihr Anteil an den Nennungen",
    intro:
      "Wie sich die Nennungen der Assistenten zwischen Ihnen und den anderen Unternehmen aufteilen, die sie zu Ihren Fragen genannt haben. Jedes Unternehmen zählt einmal pro Frage und Assistent, genauso wie oben die Antworten, in denen Sie genannt werden.",
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
    youCount: (n) => `Sie: ${n}`,
    mostNamed: (name) => `Am häufigsten genannt: ${name}`,
    howTitle: "So zählen wir:",
    how: "Eine Nennung ist ein Unternehmen, dessen Name im Text der Antworten eines Assistenten auf eine Frage steht. Ein Link ohne den Namen ist keine Nennung, weder bei Ihnen noch bei anderen. Pro Frage und Assistent zählen wir bis zu den ersten 6 genannten Unternehmen. Ihr Name wird auch dann gezählt, wenn er nach diesen ersten 6 steht, daher kann Ihr Anteil höher wirken, als er tatsächlich ist.",
    linkOnly: (n) =>
      n === 1
        ? "1 Antwort verlinkt nur Ihre Website, ohne Ihren Namen zu nennen: Oben zählt sie mit, hier nicht."
        : `${n} Antworten verlinken nur Ihre Website, ohne Ihren Namen zu nennen: Oben zählen sie mit, hier nicht.`,
    toneTitle: "Wie die Antworten Sie darstellen",
    toneIntro: (n) =>
      n === 1
        ? "Wir haben die Antwort, in der Sie genannt werden, danach eingeordnet, wie Sie darin der fragenden Person präsentiert werden."
        : `Wir haben die ${n} Antworten, in denen Sie genannt werden, danach eingeordnet, wie Sie darin der fragenden Person präsentiert werden.`,
    tones: {
      recommended: "Mit Empfehlung",
      neutral: "Nur sachlich",
      caveat: "Mit Vorbehalt",
      negative: "Gegen Sie",
      unsure: "Kaum Angaben zu Ihnen",
    },
    quote: (s) => `„${s}“`,
    toneHow:
      "„Mit Empfehlung“: Lob, eine Nennung als erste Wahl oder der ausdrückliche Rat, sich an Sie zu wenden. „Mit Vorbehalt“: etwas, das Kunden abschrecken könnte, etwa der Preis, die Bewertungen oder eine Einschränkung Ihres Angebots. „Gegen Sie“: der Rat, sich nicht an Sie zu wenden, Beschwerden oder die Angabe, Sie hätten geschlossen. „Kaum Angaben zu Ihnen“: Der Assistent hat wenig über Sie gefunden oder konnte es nicht bestätigen. Eine Antwort ist eine Frage an einen Assistenten; weichen ihre Abfragen voneinander ab, zählt die Einordnung, die die meisten zeigen. Ein Sprachmodell ordnet jede Antwort ein; die Zitate stammen wörtlich aus den Antworten, in der Originalsprache.",
  },
  fr: {
    title: "Part de voix",
    intro:
      "Comment les mentions des assistants se répartissent entre vous et les autres entreprises qu’ils citent pour vos questions. Chaque entreprise compte une fois par question et par assistant, comme les réponses qui vous citent, plus haut.",
    youOf: (n, of) => `Vous\u00a0: ${n} sur ${of} ${plural("fr", of, { one: "mention", other: "mentions" })}`,
    ahead: (n, brands) =>
      brands === 0
        ? "Aucune autre entreprise n’a été citée."
        : n === 0
          ? `Aucune des ${brands} autres entreprises n’a été citée plus souvent que vous.`
          : n === 1
            ? `1 des ${brands} autres entreprises a été citée plus souvent que vous.`
            : `${n} des ${brands} autres entreprises ont été citées plus souvent que vous.`,
    notYet: (brands) =>
      `Votre nom n’apparaît pas encore dans le texte des réponses\u00a0; ${plural("fr", brands, { one: `${brands} autre entreprise y figure`, other: `${brands} autres entreprises y figurent` })}.`,
    you: "Vous",
    top: (n) => `Les ${n} plus citées`,
    rest: (n) => `Toutes les autres (${n} ${plural("fr", n, { one: "entreprise", other: "entreprises" })})`,
    byAssistant: "Par assistant",
    mentions: (n) => `${n} ${plural("fr", n, { one: "mention", other: "mentions" })}`,
    youCount: (n) => `Vous\u00a0: ${n}`,
    mostNamed: (name) => `La plus citée\u00a0: ${name}`,
    howTitle: "Notre méthode\u00a0:",
    how: "une mention, c’est une entreprise nommée dans le texte des réponses d’un assistant à une question. Un lien sans le nom n’est pas une mention, ni pour vous ni pour les autres. Pour chaque question et chaque assistant, nous comptons jusqu’aux 6 premières entreprises citées. Votre nom, lui, est compté même s’il vient après ces 6 premières\u00a0: votre part peut donc paraître plus élevée qu’elle ne l’est vraiment.",
    linkOnly: (n) =>
      n === 1
        ? "1 réponse qui vous cite ne fait que renvoyer vers votre site\u00a0: elle compte plus haut, pas ici."
        : `${n} réponses qui vous citent ne font que renvoyer vers votre site\u00a0: elles comptent plus haut, pas ici.`,
    toneTitle: "Comment les réponses vous présentent",
    toneIntro: (n) =>
      n === 1
        ? "Nous avons classé la réponse qui vous cite selon la façon dont elle vous présente à la personne qui a posé la question."
        : `Nous avons classé les ${n} réponses qui vous citent selon la façon dont elles vous présentent à la personne qui a posé la question.`,
    tones: {
      recommended: "Vous recommandent",
      neutral: "Vous citent, sans jugement",
      caveat: "Avec une réserve",
      negative: "Vous déconseillent",
      unsure: "En savent peu sur vous",
    },
    quote: (s) => `« ${s} »`,
    toneHow:
      "« Vous recommandent » : un éloge, un premier choix ou une recommandation. « Avec une réserve » : un point qui pourrait freiner un client, comme le prix, les avis ou une limite de votre offre. « Vous déconseillent » : un avis défavorable, des plaintes ou l’indication que vous avez fermé. « En savent peu sur vous » : l’assistant a trouvé peu d’informations sur vous ou n’a pas pu les vérifier. Une réponse correspond à une question posée à un assistant ; si ses requêtes diffèrent, elle prend le ton que montrent la plupart d’entre elles. Un modèle de langage classe chaque réponse ; les citations sont reprises telles quelles des réponses, dans leur langue d’origine.",
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
    youCount: (n) => `Usted: ${n}`,
    mostNamed: (name) => `La más nombrada: ${name}`,
    howTitle: "Cómo contamos:",
    how: "una mención es una empresa nombrada en el texto de las respuestas de un asistente a una pregunta. Un enlace sin el nombre no es una mención, ni para usted ni para nadie. Por cada pregunta y asistente contamos hasta las 6 primeras empresas nombradas. Su nombre, en cambio, se cuenta aunque aparezca después de esas 6 primeras, así que su cuota puede parecer más alta de lo que realmente es.",
    linkOnly: (n) =>
      n === 1
        ? "1 respuesta que le nombra solo enlaza a su sitio: esa respuesta cuenta más arriba, no aquí."
        : `${n} respuestas que le nombran solo enlazan a su sitio: esas respuestas cuentan más arriba, no aquí.`,
    toneTitle: "Cómo le presentan las respuestas",
    toneIntro: (n) =>
      n === 1
        ? "Clasificamos la respuesta que le nombra según cómo le presenta a quien hizo la pregunta."
        : `Clasificamos las ${n} respuestas que le nombran según cómo le presentan a quien hizo la pregunta.`,
    tones: {
      recommended: "Le recomiendan",
      neutral: "Le nombran, sin opinión",
      caveat: "Con reparos",
      negative: "Le desaconsejan",
      unsure: "Saben poco de usted",
    },
    quote: (s) => `«${s}»`,
    toneHow:
      "«Le recomiendan»: un elogio, una primera opción o una recomendación. «Con reparos»: algo que podría frenar a un cliente, como el precio, las reseñas o una limitación de su oferta. «Le desaconsejan»: un consejo de no elegirle, quejas o la afirmación de que usted ha cerrado. «Saben poco de usted»: el asistente encontró poco sobre usted o no pudo confirmarlo. Una respuesta es una pregunta a un asistente; si sus consultas difieren, toma el tono que muestra la mayoría. Un modelo de lenguaje clasifica cada respuesta; las citas se copian tal cual de las respuestas, en el idioma original.",
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
    youCount: (n) => `Вы: ${n}`,
    mostNamed: (name) => `Чаще всех: ${name}`,
    howTitle: "Как мы считаем:",
    how: "упоминание — это компания, названная в тексте ответов одного ассистента на один вопрос. Ссылка без названия — не упоминание, ни у вас, ни у других. По каждому вопросу и ассистенту мы считаем до первых 6 названных компаний. Вас мы считаем, даже если вас назвали после этих первых 6, поэтому ваша доля может выглядеть выше настоящей.",
    linkOnly: (n) =>
      plural("ru", n, {
        one: `${n} ответ, где назвали вас, только ссылается на ваш сайт: он считается выше, здесь — нет.`,
        few: `${n} ответа, где назвали вас, только ссылаются на ваш сайт: они считаются выше, здесь — нет.`,
        many: `${n} ответов, где назвали вас, только ссылаются на ваш сайт: они считаются выше, здесь — нет.`,
        other: `${n} ответа, где назвали вас, только ссылаются на ваш сайт: они считаются выше, здесь — нет.`,
      }),
    toneTitle: "Как ответы описывают вас",
    toneIntro: (n) =>
      plural("ru", n, {
        one:
          n === 1
            ? "Мы разобрали 1 ответ, где вас назвали, по тому, как он представляет вас спросившему."
            : `Мы разобрали ${n} ответ, где вас назвали, по тому, как они представляют вас спросившему.`,
        few: `Мы разобрали ${n} ответа, где вас назвали, по тому, как они представляют вас спросившему.`,
        many: `Мы разобрали ${n} ответов, где вас назвали, по тому, как они представляют вас спросившему.`,
        other: `Мы разобрали ${n} ответа, где вас назвали, по тому, как они представляют вас спросившему.`,
      }),
    tones: {
      recommended: "Рекомендуют вас",
      neutral: "Называют, без оценки",
      caveat: "С оговоркой",
      negative: "Не в вашу пользу",
      unsure: "Мало сведений о вас",
    },
    quote: (s) => `«${s}»`,
    toneHow:
      "«Рекомендуют вас» — похвала, первый выбор или совет обратиться к вам. «С оговоркой» — то, что может оттолкнуть клиента: цена, отзывы или ограничение вашего предложения. «Не в вашу пользу» — совет не обращаться к вам, жалобы или сведения, что вы закрылись. «Мало сведений о вас» — ассистент почти ничего не нашёл о вас или не смог это подтвердить. Ответ — это один вопрос одному ассистенту; если его запросы расходятся, берётся оценка, которую показывает большинство. Каждый ответ разбирает языковая модель; цитаты взяты из ответов дословно, на языке оригинала.",
  },
})
