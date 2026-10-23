import { defineMessages } from "../messages"
import { plural } from "../format"

// app/signup/page.tsx (/signup, /de/signup …): every variant of the page — the AI report (from the
// quick check), the AI visibility plan ("Start the plan"), and the LinkedIn/X trial (with or without
// posts handed over from the landing) — plus the code step, the loading shell and the page's
// metadata (app/signup/layout.tsx). The Google and LinkedIn buttons are
// components/auth/OAuthButtons.tsx. Prices and days come in as arguments (lib/geo-pricing.ts);
// emailInvalid and waitResend are the send-pin errors, whose English is the server's own text, for
// the page to show in the visitor's language instead of the raw English.

// "в течение 30 дней", "в течение 21 дня".
const ruDays = (n: number) => plural("ru", n, { one: `${n} дня`, other: `${n} дней` })

const en = {
  // Metadata: the description the page had from the root layout; the title stays the brand,
  // "ItGrows.ai", in every language
  metaDescription: "AI visibility for companies, and LinkedIn and X posts for founders.",

  // Heading, by variant
  planTitle: "Start the AI visibility plan",
  planLead: (month: string, setup: string, quarter: string, year: string) =>
    `First your account, then your site: the plan is built from its report. Then you choose how to pay: ${month} a month plus a one-time ${setup} setup, or ${quarter} for 3 months upfront or ${year} for a year with the setup free.`,
  reportTitle: (site: string) => (site ? `Your detailed AI report for ${site}` : "Your detailed AI report"),
  reportLead: (report: string, days: number) =>
    `No card to create the account. We put 20 buyer questions to ChatGPT, Claude, Gemini and Perplexity, 3 times each; you see the totals and the 5 questions of the quick check. The whole report is ${report}, one payment, and comes off your first plan payment if you start the plan within ${days} days.`,
  // LinkedIn/X trial: <b> is bold. The other languages do not call anything "free" (owner's rule for
  // the translated site: only the quick check's "no signup" is); they name the trial and "no card".
  handoffTitle: "One step left — claim your posts",
  handoffLead: (n: number) =>
    `Your ${n} post${n > 1 ? "s are" : " is"} saved. Creating an account is <b>free</b> — and so is your 14-day trial. No credit card required.`,
  defaultTitle: "Create your free account",
  defaultLead: "✓ Free account · No credit card required — not even for the 14-day trial.",

  // The box above the form
  quickCheck: "Quick check:",
  quickNamed: (named: number, of: number) => `named in ${named} of ${of} answers`,
  postAlt: "Your generated post",
  postsSaved: (n: number) => `${n} post${n > 1 ? "s" : ""} saved${n > 1 ? ` · +${n - 1} more waiting` : ""}`,

  // The form
  nameLabel: "Name",
  namePlaceholder: "Your name",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  sendingCode: "Sending code...",
  emailMeCode: "Email me a code",
  continueWithEmail: "Continue with email",
  haveAccount: "Already have an account?",
  signIn: "Sign in",
  // <link> Terms, <link2> Privacy (both pages are in English)
  agree: "By signing up you agree to our <link>Terms of Service</link> and <link2>Privacy Policy</link2>",

  // The code step
  stepAccount: "Account",
  stepVerify: "Verify email",
  stepComplete: "Complete",
  checkEmail: "Check your email",
  codeSentTo: "We've sent a 6-digit code to",
  enterCode: "Enter 6-digit code",
  verifying: "Verifying...",
  continue: "Continue →",
  codeExpires: (time: string) => `Code expires in ${time}`,
  resending: "Sending...",
  resendCode: "Resend code",
  cantFind: "Can't find the email?",
  checkSpam: "Check your spam or promotions folder.",

  // Server-rendered shell, shared by every variant
  shellTitle: "Create your account",
  shellLead: "No credit card required.",
  shellLoading: "Loading sign-up options…",

  // Errors
  failedToSend: "Failed to send PIN",
  somethingWrong: "Something went wrong",
  invalidCode: "Invalid or expired code. Please try again.",
  emailInvalid: "Valid email required",
  waitResend: "Please wait before requesting another PIN",
}

export default defineMessages(en, {
  de: {
    metaDescription: "KI-Sichtbarkeit für Unternehmen sowie LinkedIn- und X-Posts für Gründer.",

    planTitle: "Den KI-Sichtbarkeitsplan starten",
    planLead: (month, setup, quarter, year) =>
      `Zuerst Ihr Konto, dann Ihre Website: Der Plan baut auf dem Bericht zu Ihrer Website auf. Danach wählen Sie, wie Sie zahlen: ${month} pro Monat plus einmalig ${setup} für die Einrichtung, oder ${quarter} für 3 Monate im Voraus bzw. ${year} für ein Jahr, jeweils ohne Einrichtungsgebühr.`,
    reportTitle: (site) => (site ? `Ihr ausführlicher KI-Bericht für ${site}` : "Ihr ausführlicher KI-Bericht"),
    reportLead: (report, days) =>
      `Für das Konto brauchen Sie keine Karte. Wir stellen ChatGPT, Claude, Gemini und Perplexity 20 Fragen, wie Ihre Kunden sie stellen, jeweils dreimal; Sie sehen die Gesamtwerte und die 5 Fragen des Schnellchecks. Der vollständige Bericht kostet ${report}, einmalig, und wird auf Ihre erste Plan-Zahlung angerechnet, wenn Sie den Plan innerhalb von ${days} Tagen starten.`,
    handoffTitle: "Nur noch ein Schritt — sichern Sie sich Ihre Posts",
    handoffLead: (n) =>
      `${n > 1 ? `Ihre ${n} Posts sind` : "Ihr Post ist"} gespeichert. Legen Sie ein Konto an und starten Sie Ihre <b>14-tägige Testphase</b> — keine Kreditkarte erforderlich.`,
    defaultTitle: "Erstellen Sie Ihr Konto",
    defaultLead: "✓ Keine Kreditkarte erforderlich — auch nicht für die 14-tägige Testphase.",

    quickCheck: "Schnellcheck:",
    quickNamed: (named, of) => `in ${named} von ${of} Antworten genannt`,
    postAlt: "Ihr erstellter Post",
    postsSaved: (n) => (n > 1 ? `${n} Posts gespeichert · +${n - 1} weitere warten` : `${n} Post gespeichert`),

    nameLabel: "Name",
    namePlaceholder: "Ihr Name",
    emailLabel: "E-Mail",
    emailPlaceholder: "name@beispiel.de",
    sendingCode: "Code wird gesendet…",
    emailMeCode: "Code per E-Mail erhalten",
    continueWithEmail: "Weiter mit E-Mail",
    haveAccount: "Sie haben bereits ein Konto?",
    signIn: "Anmelden",
    agree: "Mit der Registrierung stimmen Sie unseren <link>Nutzungsbedingungen</link> und der <link2>Datenschutzerklärung</link2> zu",

    stepAccount: "Konto",
    stepVerify: "E-Mail bestätigen",
    stepComplete: "Fertig",
    checkEmail: "Prüfen Sie Ihr Postfach",
    codeSentTo: "Wir haben einen 6-stelligen Code gesendet an",
    enterCode: "6-stelligen Code eingeben",
    verifying: "Wird geprüft…",
    continue: "Weiter →",
    codeExpires: (time) => `Code noch ${time} gültig`,
    resending: "Wird gesendet…",
    resendCode: "Code erneut senden",
    cantFind: "Keine E-Mail gefunden?",
    checkSpam: "Sehen Sie im Spam- oder Werbeordner nach.",

    shellTitle: "Erstellen Sie Ihr Konto",
    shellLead: "Keine Kreditkarte erforderlich.",
    shellLoading: "Anmeldeoptionen werden geladen…",

    failedToSend: "Der Code konnte nicht gesendet werden",
    somethingWrong: "Etwas ist schiefgelaufen",
    invalidCode: "Der Code ist ungültig oder abgelaufen. Bitte versuchen Sie es erneut.",
    emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    waitResend: "Bitte warten Sie kurz, bevor Sie einen neuen Code anfordern.",
  },

  fr: {
    metaDescription: "La visibilité dans l’IA pour les entreprises, et des posts LinkedIn et X pour les fondateurs.",

    planTitle: "Démarrer l’abonnement visibilité IA",
    planLead: (month, setup, quarter, year) =>
      `D’abord votre compte, puis votre site : l’abonnement est établi à partir de son rapport. Vous choisissez ensuite comment payer : ${month} par mois plus une mise en place de ${setup} facturée une seule fois, ou bien ${quarter} pour 3 mois d’avance ou ${year} pour un an, sans frais de mise en place.`,
    reportTitle: (site) => (site ? `Votre rapport IA détaillé pour ${site}` : "Votre rapport IA détaillé"),
    reportLead: (report, days) =>
      `Aucune carte pour créer le compte. Nous posons 20 questions de clients à ChatGPT, Claude, Gemini et Perplexity, 3 fois chacune ; vous voyez les totaux et les 5 questions de la vérification rapide. Le rapport complet coûte ${report}, en un seul paiement, et il est déduit de votre premier paiement d’abonnement si vous démarrez l’abonnement dans les ${days} jours.`,
    handoffTitle: "Plus qu’une étape — récupérez vos posts",
    handoffLead: (n) =>
      `${n > 1 ? `Vos ${n} posts sont enregistrés` : "Votre post est enregistré"}. Créez un compte et commencez votre <b>essai de 14 jours</b> — aucune carte bancaire requise.`,
    defaultTitle: "Créez votre compte",
    defaultLead: "✓ Aucune carte bancaire requise — pas même pour l’essai de 14 jours.",

    quickCheck: "Vérification rapide :",
    quickNamed: (named, of) => `mentionné dans ${named} ${named > 1 ? "réponses" : "réponse"} sur ${of}`,
    postAlt: "Votre post généré",
    postsSaved: (n) => (n > 1 ? `${n} posts enregistrés · +${n - 1} en attente` : `${n} post enregistré`),

    nameLabel: "Nom",
    namePlaceholder: "Votre nom",
    emailLabel: "E-mail",
    emailPlaceholder: "vous@exemple.fr",
    sendingCode: "Envoi du code…",
    emailMeCode: "Recevoir un code par e-mail",
    continueWithEmail: "Continuer par e-mail",
    haveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
    agree: "En vous inscrivant, vous acceptez nos <link>conditions d’utilisation</link> et notre <link2>politique de confidentialité</link2>",

    stepAccount: "Compte",
    stepVerify: "Vérifier l’e-mail",
    stepComplete: "Terminé",
    checkEmail: "Consultez vos e-mails",
    codeSentTo: "Nous avons envoyé un code à 6 chiffres à",
    enterCode: "Saisissez le code à 6 chiffres",
    verifying: "Vérification…",
    continue: "Continuer →",
    codeExpires: (time) => `Le code expire dans ${time}`,
    resending: "Envoi…",
    resendCode: "Renvoyer le code",
    cantFind: "Vous ne trouvez pas l’e-mail ?",
    checkSpam: "Vérifiez vos dossiers spam ou promotions.",

    shellTitle: "Créez votre compte",
    shellLead: "Aucune carte bancaire requise.",
    shellLoading: "Chargement des options d’inscription…",

    failedToSend: "Impossible d’envoyer le code",
    somethingWrong: "Un problème est survenu",
    invalidCode: "Code invalide ou expiré. Veuillez réessayer.",
    emailInvalid: "Saisissez une adresse e-mail valide.",
    waitResend: "Patientez un instant avant de demander un nouveau code.",
  },

  es: {
    metaDescription: "Visibilidad en IA para empresas y publicaciones de LinkedIn y X para fundadores.",

    planTitle: "Empezar el plan de visibilidad en IA",
    planLead: (month, setup, quarter, year) =>
      `Primero su cuenta, después su sitio: el plan se elabora a partir de su informe. Luego elige cómo pagar: ${month} al mes más una configuración inicial de ${setup} (pago único), o bien ${quarter} por 3 meses por adelantado o ${year} por un año, sin cargo por la configuración inicial.`,
    reportTitle: (site) => (site ? `Su informe detallado de IA para ${site}` : "Su informe detallado de IA"),
    reportLead: (report, days) =>
      `No necesita tarjeta para crear la cuenta. Planteamos 20 preguntas de clientes a ChatGPT, Claude, Gemini y Perplexity, 3 veces cada una; verá los totales y las 5 preguntas de la comprobación rápida. El informe completo cuesta ${report}, en un solo pago, y se descuenta de su primer pago del plan si lo inicia en un plazo de ${days} días.`,
    handoffTitle: "Solo falta un paso: recupere sus publicaciones",
    handoffLead: (n) =>
      `${n > 1 ? `Sus ${n} publicaciones están guardadas` : "Su publicación está guardada"}. Cree una cuenta y empiece su <b>prueba de 14 días</b>; no necesita tarjeta de crédito.`,
    defaultTitle: "Cree su cuenta",
    defaultLead: "✓ Sin tarjeta de crédito, ni siquiera para la prueba de 14 días.",

    quickCheck: "Comprobación rápida:",
    quickNamed: (named, of) => `mencionado en ${named} de ${of} respuestas`,
    postAlt: "Su publicación generada",
    postsSaved: (n) => (n > 1 ? `${n} publicaciones guardadas · +${n - 1} más en espera` : `${n} publicación guardada`),

    nameLabel: "Nombre",
    namePlaceholder: "Su nombre",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "nombre@ejemplo.com",
    sendingCode: "Enviando código…",
    emailMeCode: "Enviarme un código",
    continueWithEmail: "Continuar con correo electrónico",
    haveAccount: "¿Ya tiene una cuenta?",
    signIn: "Iniciar sesión",
    agree: "Al registrarse, acepta nuestros <link>Términos del servicio</link> y nuestra <link2>Política de privacidad</link2>",

    stepAccount: "Cuenta",
    stepVerify: "Verificar correo",
    stepComplete: "Listo",
    checkEmail: "Revise su correo",
    codeSentTo: "Hemos enviado un código de 6 dígitos a",
    enterCode: "Introduzca el código de 6 dígitos",
    verifying: "Verificando…",
    continue: "Continuar →",
    codeExpires: (time) => `El código caduca en ${time}`,
    resending: "Enviando…",
    resendCode: "Reenviar código",
    cantFind: "¿No encuentra el correo?",
    checkSpam: "Revise la carpeta de spam o de promociones.",

    shellTitle: "Cree su cuenta",
    shellLead: "No necesita tarjeta de crédito.",
    shellLoading: "Cargando opciones de registro…",

    failedToSend: "No se pudo enviar el código",
    somethingWrong: "Algo ha salido mal",
    invalidCode: "Código no válido o caducado. Inténtelo de nuevo.",
    emailInvalid: "Introduzca un correo electrónico válido.",
    waitResend: "Espere un momento antes de pedir un nuevo código.",
  },

  ru: {
    metaDescription: "Видимость в ИИ для компаний, а также посты в LinkedIn и X для основателей.",

    planTitle: "Оформить подписку на видимость в ИИ",
    planLead: (month, setup, quarter, year) =>
      `Сначала аккаунт, затем ваш сайт: подписка строится на основе его отчёта. Потом вы выбираете, как платить: ${month} в месяц плюс разовая настройка за ${setup}, или ${quarter} за 3 месяца вперёд, или ${year} за год — в последних двух случаях без платы за настройку.`,
    reportTitle: (site) => (site ? `Ваш подробный отчёт о видимости в ИИ для ${site}` : "Ваш подробный отчёт о видимости в ИИ"),
    reportLead: (report, days) =>
      `Для создания аккаунта карта не нужна. Мы задаём ChatGPT, Claude, Gemini и Perplexity 20 вопросов ваших клиентов, по 3 раза каждый; вы видите итоги и 5 вопросов быстрой проверки. Полный отчёт стоит ${report}, один платёж, и засчитывается в первый платёж за подписку, если оформить её в течение ${ruDays(days)}.`,
    handoffTitle: "Остался один шаг — заберите свои посты",
    handoffLead: (n) =>
      `${n > 1 ? `Ваши посты сохранены: ${n}` : "Ваш пост сохранён"}. Создайте аккаунт и начните <b>14-дневный пробный период</b> — банковская карта не нужна.`,
    defaultTitle: "Создайте аккаунт",
    defaultLead: "✓ Карта не нужна — даже для 14-дневного пробного периода.",

    quickCheck: "Быстрая проверка:",
    quickNamed: (named, of) => `вас назвали в ${named} из ${of} ${plural("ru", of, { one: "ответа", other: "ответов" })}`,
    postAlt: "Ваш сгенерированный пост",
    postsSaved: (n) => (n > 1 ? `Сохранено постов: ${n} · +${n - 1} в очереди` : `${n} пост сохранён`),

    nameLabel: "Имя",
    namePlaceholder: "Ваше имя",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    sendingCode: "Отправляем код…",
    emailMeCode: "Прислать код на почту",
    continueWithEmail: "Продолжить с email",
    haveAccount: "Уже есть аккаунт?",
    signIn: "Войти",
    agree: "Регистрируясь, вы принимаете наши <link>Условия использования</link> и <link2>Политику конфиденциальности</link2>",

    stepAccount: "Аккаунт",
    stepVerify: "Подтверждение",
    stepComplete: "Готово",
    checkEmail: "Проверьте почту",
    codeSentTo: "Мы отправили 6-значный код на",
    enterCode: "Введите 6-значный код",
    verifying: "Проверяем…",
    continue: "Продолжить →",
    codeExpires: (time) => `Код действует ещё ${time}`,
    resending: "Отправляем…",
    resendCode: "Отправить код ещё раз",
    cantFind: "Не можете найти письмо?",
    checkSpam: "Проверьте папки «Спам» и «Промоакции».",

    shellTitle: "Создайте аккаунт",
    shellLead: "Банковская карта не нужна.",
    shellLoading: "Загружаем варианты регистрации…",

    failedToSend: "Не удалось отправить код",
    somethingWrong: "Что-то пошло не так",
    invalidCode: "Неверный или просроченный код. Попробуйте ещё раз.",
    emailInvalid: "Введите корректный адрес email.",
    waitResend: "Подождите немного, прежде чем запрашивать новый код.",
  },
})
