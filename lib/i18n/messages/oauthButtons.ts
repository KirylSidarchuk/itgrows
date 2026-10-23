import { defineMessages } from "../messages"

// components/auth/OAuthButtons.tsx: the Google and LinkedIn buttons of /login and /signup (and of
// /de/login, /fr/signup …). Brand names stay as they are; the wording follows each provider's own
// button in that language.

const en = {
  google: "Continue with Google",
  linkedin: "Continue with LinkedIn",
  redirecting: "Redirecting…",
  // Between the buttons and the email form
  or: "or",
}

export default defineMessages(en, {
  de: {
    google: "Weiter mit Google",
    linkedin: "Weiter mit LinkedIn",
    redirecting: "Weiterleitung…",
    or: "oder",
  },
  fr: {
    google: "Continuer avec Google",
    linkedin: "Continuer avec LinkedIn",
    redirecting: "Redirection…",
    or: "ou",
  },
  es: {
    google: "Continuar con Google",
    linkedin: "Continuar con LinkedIn",
    redirecting: "Redirigiendo…",
    or: "o",
  },
  ru: {
    google: "Продолжить с Google",
    linkedin: "Продолжить с LinkedIn",
    redirecting: "Перенаправление…",
    or: "или",
  },
})
