import { defineMessages } from "../messages"

// app/login/page.tsx (/login, /de/login …): the page heading, the email + code form and its errors,
// and the page's metadata (app/login/layout.tsx). The Google and LinkedIn buttons are
// components/auth/OAuthButtons.tsx. emailInvalid and waitResend are the send-pin errors, whose
// English is the server's own text, for the page to show in the visitor's language instead of the
// raw English.

const en = {
  // Metadata (app/login/layout.tsx): the description the page had from the root layout; the title
  // stays the brand, "ItGrows.ai", in every language
  metaDescription: "AI visibility for companies, and LinkedIn and X posts for founders.",

  welcomeBack: "Welcome back",
  signInToAccount: "Sign in to your account",
  authError:
    "Something went wrong on our side while signing you in — sorry about that. Please sign in again below; your work is saved.",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  sendingCode: "Sending code...",
  continueWithEmail: "Continue with email",
  noAccount: "Don't have an account?",
  signUp: "Sign up",

  // The code step
  codeSentTo: "Code sent to",
  enterCode: "Enter 6-digit code",
  verifying: "Verifying...",
  signIn: "Sign in",
  didntGetCode: "Didn't get the code?",
  tryAgain: "Try again",

  // Errors
  failedToSend: "Failed to send PIN",
  somethingWrong: "Something went wrong",
  invalidPin: "Invalid or expired PIN. Please try again.",
  emailInvalid: "Valid email required",
  waitResend: "Please wait before requesting another PIN",
}

export default defineMessages(en, {
  de: {
    metaDescription: "KI-Sichtbarkeit für Unternehmen sowie LinkedIn- und X-Posts für Gründer.",

    welcomeBack: "Willkommen zurück",
    signInToAccount: "Melden Sie sich bei Ihrem Konto an",
    authError:
      "Bei der Anmeldung ist auf unserer Seite etwas schiefgelaufen — das tut uns leid. Bitte melden Sie sich unten erneut an; Ihre Arbeit ist gespeichert.",
    emailLabel: "E-Mail",
    emailPlaceholder: "name@beispiel.de",
    sendingCode: "Code wird gesendet…",
    continueWithEmail: "Weiter mit E-Mail",
    noAccount: "Noch kein Konto?",
    signUp: "Registrieren",

    codeSentTo: "Code gesendet an",
    enterCode: "6-stelligen Code eingeben",
    verifying: "Wird geprüft…",
    signIn: "Anmelden",
    didntGetCode: "Keinen Code erhalten?",
    tryAgain: "Erneut versuchen",

    failedToSend: "Der Code konnte nicht gesendet werden",
    somethingWrong: "Etwas ist schiefgelaufen",
    invalidPin: "Der Code ist ungültig oder abgelaufen. Bitte versuchen Sie es erneut.",
    emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    waitResend: "Bitte warten Sie kurz, bevor Sie einen neuen Code anfordern.",
  },

  fr: {
    metaDescription: "La visibilité dans l’IA pour les entreprises, et des posts LinkedIn et X pour les fondateurs.",

    welcomeBack: "Bon retour parmi nous",
    signInToAccount: "Connectez-vous à votre compte",
    authError:
      "Un problème est survenu de notre côté pendant votre connexion — nous en sommes désolés. Veuillez vous reconnecter ci-dessous ; votre travail est enregistré.",
    emailLabel: "E-mail",
    emailPlaceholder: "vous@exemple.fr",
    sendingCode: "Envoi du code…",
    continueWithEmail: "Continuer par e-mail",
    noAccount: "Vous n’avez pas de compte ?",
    signUp: "Créer un compte",

    codeSentTo: "Code envoyé à",
    enterCode: "Saisissez le code à 6 chiffres",
    verifying: "Vérification…",
    signIn: "Se connecter",
    didntGetCode: "Vous n’avez pas reçu le code ?",
    tryAgain: "Réessayer",

    failedToSend: "Impossible d’envoyer le code",
    somethingWrong: "Un problème est survenu",
    invalidPin: "Code invalide ou expiré. Veuillez réessayer.",
    emailInvalid: "Saisissez une adresse e-mail valide.",
    waitResend: "Patientez un instant avant de demander un nouveau code.",
  },

  es: {
    metaDescription: "Visibilidad en IA para empresas y publicaciones de LinkedIn y X para fundadores.",

    welcomeBack: "Hola de nuevo",
    signInToAccount: "Inicie sesión en su cuenta",
    authError:
      "Algo ha fallado por nuestra parte al iniciar su sesión — lo sentimos. Vuelva a iniciar sesión aquí abajo; su trabajo está guardado.",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "nombre@ejemplo.com",
    sendingCode: "Enviando código…",
    continueWithEmail: "Continuar con correo electrónico",
    noAccount: "¿No tiene una cuenta?",
    signUp: "Crear una cuenta",

    codeSentTo: "Código enviado a",
    enterCode: "Introduzca el código de 6 dígitos",
    verifying: "Verificando…",
    signIn: "Iniciar sesión",
    didntGetCode: "¿No ha recibido el código?",
    tryAgain: "Volver a intentarlo",

    failedToSend: "No se pudo enviar el código",
    somethingWrong: "Algo ha salido mal",
    invalidPin: "Código no válido o caducado. Inténtelo de nuevo.",
    emailInvalid: "Introduzca un correo electrónico válido.",
    waitResend: "Espere un momento antes de pedir un nuevo código.",
  },

  ru: {
    metaDescription: "Видимость в ИИ для компаний, а также посты в LinkedIn и X для основателей.",

    welcomeBack: "С возвращением",
    signInToAccount: "Войдите в свой аккаунт",
    authError:
      "При входе что-то пошло не так на нашей стороне — извините. Пожалуйста, войдите ещё раз ниже; ваша работа сохранена.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    sendingCode: "Отправляем код…",
    continueWithEmail: "Продолжить с email",
    noAccount: "Нет аккаунта?",
    signUp: "Зарегистрироваться",

    codeSentTo: "Код отправлен на",
    enterCode: "Введите 6-значный код",
    verifying: "Проверяем…",
    signIn: "Войти",
    didntGetCode: "Не пришёл код?",
    tryAgain: "Попробовать снова",

    failedToSend: "Не удалось отправить код",
    somethingWrong: "Что-то пошло не так",
    invalidPin: "Неверный или просроченный код. Попробуйте ещё раз.",
    emailInvalid: "Введите корректный адрес email.",
    waitResend: "Подождите немного, прежде чем запрашивать новый код.",
  },
})
