// List questions: the day-0 questions the plan never answers with an article of the client's own.
//
// A list question asks the assistant to pick or rank products or providers: "Best app for ...", "Which
// agency ...", "Who offers ...", "Wo finde ich eine gute Praxis ...". The assistants answer those from
// independent reviews, directories and app stores, so the plan wins them through the places they quote
// (its Profile, Listing, Media and PR steps), never with an article on the client's own blog: a list
// question is never an Article step of "Your plan" (app/business/dashboard/visibility/parts.tsx
// planSteps, and the first articles on app/business/dashboard/plan/page.tsx, taken from it), the
// publisher's guard never waits for one (lib/publish-post.ts) and seed-geo never queues one.
// /root/blog_engine/client_writer.py holds the same rule with the same words (list_questions,
// is_list_question); change the two together.
//
// A question of a day-0 run is a list question when either of these says so (listQuestions):
//   the answer key  geo_check/core.py writes questions 1-8 of a profile as the ones whose answers name
//                   providers ("Which ... in {city}", "Best ... for ...", "Good ... near ..."). On a run
//                   that asked the generated profile's questions exactly as written, those eight are list
//                   questions whatever their words. Not for a profile written by hand ("manual": true,
//                   which geo_check/service.py never rebuilds), nor once the questions differ.
//   the words       isListQuestion below, for every question: all an edited or agreed question has.
//
// The words. Never a question opening with "how", "why", "wie", "warum", "comment", "pourquoi", "cómo",
// "por qué", "как", "почему", "jak", "dlaczego"...: it asks how something works or what it costs, even
// with "a good agency" in it. Otherwise it is a list question when one of these holds:
//   rank   a rank word ("best", "top", "good", "beste", "meilleur", "лучший") and, within the next four
//          words and before any stop word ("to", "for", "is", "my"...), a provider word ("app", "agency",
//          "Praxis", "logiciel", "приложение"): "Best app to ...", not "best way to ..."
//   which  it opens with a which word ("which", "what", "welche", "quel", "qué", "какой") and a provider
//          word follows within three words, before any stop word: "Which 3D scanning app ...", not
//          "Which file format ..." or "What risks come with ... app"
//   who    it opens with a who word and the first word after it that is not a stop word is a who verb
//          ("offers", "helps", "bietet"...); after "can", "kann", "peut", "может"... that word, or the
//          question's last one (German puts the verb last), has to be a who verb: "Who offers ...", "Who
//          can help ...", "Wer kann mir eine Website erstellen?", not "Who can see my keywords?". Or a
//          rank word is anywhere in it: "Who is the best ..."
//   where  it opens with a where word and within the next four words stands "book", "order", "hire",
//          "bestellen"..., or "find", "get", "finde", "bekomme", "найти"... with something to find: a
//          provider word, a rank word or an appointment ("Termin", "appointment", "запись") before what
//          follows the verb ends at a stop word. "Wo bekomme ich in Bonn schnell einen Termin ...", not
//          "Where can I find the NMFC class for my product?" or "Wo bekomme ich eine Überweisung zum Arzt?"
//   names  "alternatives", "vs", "compared"... stands next to a name written with a capital (never the
//          first word, never all capitals like "ASO"), or one link word ("to", "à") away from one, with
//          only spaces or hyphens between: "alternatives to Polycam", "Polycam vs Scaniverse"; not
//          "compared to dedicated scanners", not "Stoßwelle oder Spritze: Alternativen zur Operation".
//          German gets no link words: it writes every noun with a capital.
// A provider word right before a word like "store", "changes", "size" or "permissions" only says what
// kind: "the App Store", "What website changes ...", "What company size ..." pick no provider.
// A word list entry "x-" is any word starting with x (Russian, Ukrainian and Polish endings change),
// "-x" any word ending in x (German compounds: Arztpraxis, Werbeagentur, Steuerberater), "!x" never x.

/** The rule's words by kind and language, exactly as LIST_WORDS in client_writer.py. */
export const LIST_WORDS: Record<string, Record<string, string>> = {
  provider: {
    en: `app apps tool tools software service services company companies agency agencies provider
         providers vendor vendors supplier suppliers platform platforms brand brands scanner scanners
         checker checkers tracker trackers site sites website websites firm firms studio studios
         consultant consultants consultancy clinic clinics doctor doctors surgeon surgeons dentist
         dentists lawyer lawyers attorney attorneys accountant accountants advisor advisors adviser
         advisers specialist specialists exterminator exterminators chatbot chatbots assistant
         assistants editor editors cartoon cartoons series`,
    de: `firma firmen unternehmen marke marken webseite -agentur -agenturen -praxis -praxen -arzt
         -ärzte -ärztin -orthopäde -orthopäden -chirurg -chirurgen -kanzlei -kanzleien -anwalt
         -anwälte -berater -beraterin -anbieter -dienstleister -klinik -kliniken -software -scanner
         -plattform -plattformen -tool -tools -spezialist -spezialisten`,
    fr: `application applications appli applis outil outils logiciel logiciels service services
         société sociétés entreprise entreprises agence agences prestataire prestataires fournisseur
         fournisseurs plateforme plateformes marque marques cabinet cabinets clinique cliniques
         médecin médecins chirurgien chirurgiens avocat avocats spécialiste spécialistes`,
    es: `aplicación aplicaciones herramienta herramientas programa programas servicio servicios
         empresa empresas compañía compañías agencia agencias proveedor proveedores plataforma
         plataformas marca marcas escáner escáneres sitio sitios despacho despachos clínica
         clínicas médico médicos cirujano cirujanos abogado abogados consultor consultores
         especialista especialistas`,
    ru: `приложени- программа программы программу сервис- инструмент- софт- платформ- компани-
         агентств- фирм- поставщик- провайдер- подрядчик- бренд- сканер- сайт- клиник- врач-
         юрист- адвокат- специалист- консультант- студи-`,
    uk: `застосун- додаток додатки додатку програма програми програму сервіс- інструмент-
         платформ- компані- агенці- агентств- фірм- постачальник- провайдер- підрядник- бренд-
         сканер- сайт- клінік- лікар- юрист- адвокат- спеціаліст- консультант- студі-`,
    pl: `aplikacj- oprogramowani- narzędz- serwis- usług- platform- firma firmy firmę firmie
         agencj- dostawc- wykonawc- skaner- klinik- gabinet- lekarz- prawnik- kancelari- doradc-
         konsultant- specjalist- nauczyciel- trener- strateg stratega`,
  },
  rank: {
    en: "best top leading popular good reliable recommended recommend",
    de: `beste besten bester bestes bestem top führende führenden führender beliebteste
         beliebtesten gute guten guter gutes empfehlenswert empfehlenswerte empfehlenswerten
         empfehlenswerter zuverlässige zuverlässigen`,
    fr: `meilleur meilleure meilleurs meilleures top bon bonne bons bonnes populaire populaires
         fiable fiables recommandé recommandée recommandés recommandées recommandez recommander`,
    es: `top buen bueno buena buenos buenas popular populares fiable fiables recomendado
         recomendada recomendados recomendadas recomiendas recomiendan recomendar`,
    ru: "лучш- !лучше хорош- надёжн- надежн- популярн- топ посоветуйте порекомендуйте посоветуете",
    uk: "найкращ- хорош- надійн- популярн- топ порадьте порекомендуйте",
    pl: "najlep- dobr- polecan- popularn- top polećcie",
  },
  which: {
    en: "which what",
    de: "welche welcher welches welchen welchem",
    fr: "quel quelle quels quelles",
    es: "qué que cuál cuáles cual cuales",
    ru: "какой какая какое какие каким какую каких",
    uk: "який яка яке які якого яку",
    pl: "jaki jaka jakie jakiego jakiej który która które którego której",
  },
  who: { en: "who", de: "wer", fr: "qui", es: "quién quien", ru: "кто кого кому", uk: "хто кого кому", pl: "kto kogo komu" },
  who_verb: {
    en: `offers offer provides provide sells sell makes make builds build helps help handles writes write
         creates create develops develop designs design manages manage runs run fixes fix optimizes
         optimize optimise hire`,
    de: `bietet bieten anbieten macht machen hilft helfen schreibt schreiben erstellt erstellen übernimmt
         übernehmen verkauft verkaufen liefert liefern baut bauen entwickelt entwickeln führt durchführen
         behandelt behandeln operiert operieren betreut betreuen optimiert optimieren`,
    fr: `propose proposent proposer offre offrent offrir fait font faire vend vendre aide aider réalise
         réaliser crée créer développe développer écrit écrire gère gérer`,
    es: `ofrece ofrecen ofrecer hace hacen hacer vende vender ayuda ayudar ayudarme ayudarnos brinda
         brindar presta prestar desarrolla desarrollar crea crear escribe escribir gestiona gestionar`,
    ru: `предлагает делает продает продаёт помогает занимается оказывает пишет разрабатывает помочь
         сделать продать предложить написать разработать создать оказать настроить`,
    uk: `пропонує робить продає допомагає займається надає пише розробляє довірити допомогти зробити
         продати запропонувати написати розробити створити надати налаштувати`,
    pl: `oferuje robi sprzedaje pomoże pomaga zajmuje świadczy polecacie poleca wybrać napisze pomóc
         zrobić sprzedać zaoferować napisać stworzyć opracować zaprojektować`,
  },
  // "Who can ..." asks for a provider only with a who verb after it: "Who can help", not "Who can see".
  modal: {
    en: "can could",
    de: "kann können könnte",
    fr: "peut peuvent pourrait",
    es: "puede pueden podría",
    ru: "может могут",
    uk: "може можуть",
    pl: "może mogą",
  },
  where: { en: "where", de: "wo", fr: "où", es: "dónde donde", ru: "где", uk: "де", pl: "gdzie" },
  where_verb: {
    en: "buy order book hire rent",
    de: "kaufe kaufen buche buchen bestelle bestellen",
    fr: "acheter commander réserver louer",
    es: "comprar contratar reservar alquilar",
    ru: "купить заказать записаться арендовать",
    uk: "купити замовити записатися орендувати",
    pl: "kupić zamówić wynająć zarezerwować",
  },
  // These find a provider only with one, a rank word or an appointment after them (where_object).
  where_find: {
    en: "find get",
    de: "finde finden findet bekomme bekommt bekommen gibt",
    fr: "trouver trouve",
    es: "encontrar encuentro conseguir consigo",
    ru: "найти найду",
    uk: "знайти знайду",
    pl: "znaleźć znajdę",
  },
  appointment: {
    en: "appointment appointments",
    de: "-termin -termine -terminen",
    fr: "rendez rdv",
    es: "cita citas turno turnos",
    ru: "запис- приём приёма прием приема",
    uk: "запис- прийом прийому",
    pl: "wizyt- termin-",
  },
  // After a provider word, these make it a modifier: "the App Store", "website changes", "company size".
  attribute: {
    en: `store stores change changes permission permissions size sizes setting settings feature features
         format formats type types category categories requirement requirements metric metrics data`,
    de: `store änderung änderungen größe einstellung einstellungen funktion funktionen format formate typ
         typen kategorie kategorien anforderung anforderungen daten`,
  },
  // A question opening with one of these asks how or why, never which: "How do I choose a good agency?"
  how: {
    en: "how why",
    de: "wie warum wieso weshalb",
    fr: "comment pourquoi",
    es: "cómo",
    ru: "как почему зачем",
    uk: "як чому навіщо",
    pl: "jak dlaczego czemu",
  },
  compare: {
    en: "alternative alternatives vs versus compare compared comparison",
    de: "alternative alternativen vergleich vs",
    fr: "alternative alternatives comparé comparée comparaison",
    es: "alternativa alternativas comparado comparada comparación",
    ru: "альтернатив- сравн-",
    uk: "альтернатив- порівн-",
    pl: "alternatyw- porówn-",
  },
  link: { en: "to with", fr: "à au aux avec", es: "a al con", ru: "к с со", uk: "з із до", pl: "do z ze od" },
  // A gap never crosses one of these: the provider word after it is not what the question picks.
  stop: {
    en: `to for of in on at by with from about into than or and but if is are was were be been do
         does did can could should would will must may might have has had i you we they he she it
         my your our their me us that this which who what how why when where there not as so
         between`,
    de: `zu zur zum für fuer von vom mit bei beim im am auf aus nach über unter gegen ohne um durch
         vor und oder aber wenn ist sind war hat haben kann können soll sollte muss wird ich du wir
         sie er es man mein meine meinen meiner meinem unser unsere dein deine ihr ihre dass als wie
         was wer wo warum`,
    fr: `à au aux de du des pour avec dans en sur par sans ou et mais est sont peut peuvent doit je
         tu nous vous il elle ils on mon ma mes notre votre qui que qu quoi comment pourquoi d l j n
         m t c`,
    es: "al del para por con sobre sin o y pero es son puede pueden debe yo mi mis su sus cómo",
    ru: `в во на с со для о об от по к ко из при без до за и или но это ли я мы вы мой моя мое моё
         мои наш наша наши что как где кто почему чем`,
    uk: "в у на з із зі для про від по до за без і й та або чи але я ми мій моя моє мої наш що як де хто",
    pl: `w we na z ze dla o od po do przy bez za i oraz lub czy albo ale jest są ja my mój moja nasz
         co jak gdzie kto`,
  },
}
/** Spanish "mejor" is "best" after an article ("la mejor app") or first ("Mejor app para ..."), and
 *  "better" anywhere else ("¿Es mejor usar ...?"), so it is a rank word only there. A Map, so a word
 *  like "constructor" finds nothing here. */
export const LIST_RANK_AFTER_ARTICLE = new Map<string, string[]>([
  ["mejor", ["el", "la", "lo"]],
  ["mejores", ["los", "las"]],
])
/** Two-word openings that ask why, as the "how" words do: Spanish "¿Por qué ...?". */
export const LIST_HOW_PAIRS = new Map<string, string[]>([["por", ["qué", "que"]]])
/** What may stand between two words that belong together (a name and "vs", a provider and "store"):
 *  spaces and hyphens, never a colon, comma or full stop. */
export const LIST_JOINERS = " \u00a0-\u2010\u2011"

/** The answer key's slots: geo_check/core.py writes questions 1-8 of a profile as provider questions. */
export const LIST_SLOTS = 8

type Kind = { exact: Set<string>; ends: string[]; stems: string[]; never: Set<string> }

function listKind(byLanguage: Record<string, string>): Kind {
  const k: Kind = { exact: new Set(), ends: [], stems: [], never: new Set() }
  for (const words of Object.values(byLanguage))
    for (const w of words.split(/\s+/).filter(Boolean)) {
      if (w.startsWith("!")) k.never.add(w.slice(1))
      else if (w.startsWith("-")) k.ends.push(w.slice(1))
      else if (w.endsWith("-")) k.stems.push(w.slice(0, -1))
      else k.exact.add(w)
    }
  return k
}

const KINDS: Record<string, Kind> = Object.fromEntries(Object.entries(LIST_WORDS).map(([kind, w]) => [kind, listKind(w)]))

/** Whether the lower-case word w is one of the list rule's words of that kind. */
function listWord(kind: string, w: string): boolean {
  const k = KINDS[kind]
  return !k.never.has(w) && (k.exact.has(w) || k.ends.some((e) => w.endsWith(e)) || k.stems.some((s) => w.startsWith(s)))
}

// Words are runs of Unicode letters and digits, as unicodedata categories L and N in the Python copy.
const LETTER = /[\p{L}\p{N}]/u

/** Whether a question asks the assistant to pick or rank products or providers, by its words alone
 *  (the rule above; listQuestions adds the answer key). */
export function isListQuestion(q: unknown): boolean {
  // The words, and what stands before each of them (seps[k] before words[k]).
  const words: string[] = []
  const seps: string[] = []
  let word = ""
  let sep = ""
  for (const ch of String(q ?? "").normalize("NFC")) {
    if (LETTER.test(ch)) {
      if (!word) {
        seps.push(sep)
        sep = ""
      }
      word += ch
    } else {
      if (word) words.push(word)
      word = ""
      sep += ch
    }
  }
  if (word) words.push(word)
  const low = words.map((w) => w.toLowerCase())
  if (!low.length) return false
  const first = low[0]
  if (listWord("how", first) || (low.length > 1 && (LIST_HOW_PAIRS.get(first) ?? []).includes(low[1]))) return false

  // Word k follows word k - 1 with only spaces or hyphens between.
  const joined = (k: number) => k >= 1 && k < low.length && Array.from(seps[k]).every((c) => LIST_JOINERS.includes(c))
  const provider = (j: number) => {
    if (joined(j + 1) && listWord("attribute", low[j + 1])) return false // "App Store", "website changes"
    return listWord("provider", low[j])
  }
  // A provider word within `gap` words after word i, with no stop word before it.
  const providerAfter = (i: number, gap: number) => {
    for (let j = i + 1; j < Math.min(low.length, i + gap + 2); j++) {
      if (provider(j)) return true
      if (listWord("stop", low[j])) return false
    }
    return false
  }
  const rank = (i: number) => {
    const after = LIST_RANK_AFTER_ARTICLE.get(low[i])
    if (after) return i === 0 || after.includes(low[i - 1])
    return listWord("rank", low[i])
  }
  // "Who offers", "Who can help", "Wer kann mir ... erstellen": the first word after "who" that is not
  // a stop word is a who verb, or, after a modal, that word or the last one is.
  const whoAsks = () => {
    let modal = false
    for (let j = 1; j < low.length; j++) {
      if (listWord("who_verb", low[j])) return true
      if (listWord("modal", low[j])) modal = true
      else if (!listWord("stop", low[j])) return modal && listWord("who_verb", low[low.length - 1])
    }
    return false
  }
  // What "find" or "get" at word v finds: a provider, a rank word or an appointment, before the words
  // after it (stop words before them aside: "ich", "in") end at a stop word.
  const whereObject = (v: number) => {
    let started = false
    for (let j = v + 1; j < low.length; j++) {
      if (rank(j) || provider(j) || listWord("appointment", low[j])) return true
      if (!listWord("stop", low[j])) started = true
      else if (started) return false
    }
    return false
  }
  // A word written with a capital, not the question's first word and not all capitals.
  const name = (j: number) => {
    if (j < 1 || j >= words.length) return false
    const [head, ...rest] = Array.from(words[j])
    const tail = rest.join("")
    return head !== head.toLowerCase() && tail !== tail.toUpperCase()
  }
  const compare = (i: number) =>
    listWord("compare", low[i]) &&
    ((joined(i) && name(i - 1)) ||
      (joined(i + 1) && name(i + 1)) ||
      (joined(i + 1) && joined(i + 2) && listWord("link", low[i + 1]) && name(i + 2)))

  const at = low.map((_, i) => i)
  return (
    at.some((i) => rank(i) && providerAfter(i, 4)) ||
    (listWord("which", first) && providerAfter(0, 3)) ||
    (listWord("who", first) && (whoAsks() || at.some(rank))) ||
    (listWord("where", first) &&
      at.slice(1, 5).some((v) => listWord("where_verb", low[v]) || (listWord("where_find", low[v]) && whereObject(v)))) ||
    at.some(compare)
  )
}

/** The profile's questions as the generator wrote them, the answer key's list: null for a profile
 *  written by hand ("manual" set to anything but false), whose questions keep to no slots. */
export function generatedQuestions(profile: unknown): unknown[] | null {
  const p = profile && typeof profile === "object" && !Array.isArray(profile) ? (profile as Record<string, unknown>) : {}
  if (p.manual !== undefined && p.manual !== null && p.manual !== false) return null
  return Array.isArray(p.questions) ? p.questions : null
}

/** For each question of a day-0 run, in the run's order, whether it is a list question: the answer key
 *  when the run asked exactly the generated profile's questions (`generated`, from generatedQuestions;
 *  slots 1-8), and the words for every question either way. */
export function listQuestions(questions: readonly unknown[], generated: unknown): boolean[] {
  const text = (q: unknown) => String(q ?? "")
  const qs = questions.map(text)
  const key = Array.isArray(generated) && generated.length === qs.length && generated.every((g, i) => text(g) === qs[i])
  // The answer key is off (25.10.2026): it was checked against the current profile, which the VM may
  // rebuild, so the plan, the guard and seed-geo could stop agreeing after a rebuild. Words only, the
  // same in client_writer.py, until the run itself records that its questions came from the generator.
  void key
  return qs.map((q) => isListQuestion(q))
}
